import { eq, inArray, lt, and, desc } from "drizzle-orm";
import { db } from "../db/index.js";
import { tweets, follows, users, likes, retweets } from "../db/schema.js";
import { getTimelinePage } from "../redis/index.js";

async function attachUserInteractions(items, userId) {
  if (!items || items.length === 0 || !userId) {
    return items.map((t) => ({ ...t, liked: false, retweeted: false }));
  }

  const ids = items.map((t) => t.id);

  const [likedRows, retweetedRows] = await Promise.all([
    db
      .select({ tweetId: likes.tweetId })
      .from(likes)
      .where(and(eq(likes.userId, userId), inArray(likes.tweetId, ids))),
    db
      .select({ tweetId: retweets.tweetId })
      .from(retweets)
      .where(and(eq(retweets.userId, userId), inArray(retweets.tweetId, ids))),
  ]);

  const likedSet = new Set(likedRows.map((r) => r.tweetId));
  const retweetedSet = new Set(retweetedRows.map((r) => r.tweetId));

  return items.map((t) => ({
    ...t,
    liked: likedSet.has(t.id),
    retweeted: retweetedSet.has(t.id),
  }));
}

export async function getTimeline(req, res) {
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);

  const cursor = req.query.cursor ? new Date(Number(req.query.cursor)) : null;

  // ==================================================
  // 1. TRY REDIS
  // ==================================================

  const tweetIds = await getTimelinePage(req.userId, {
    beforeMs: cursor ? cursor.getTime() : undefined,
    limit,
  });

  console.log("[timeline]", {
    userId: req.userId,
    cursor: cursor?.getTime(),
    redisIds: tweetIds,
  });

  // ==================================================
  // 2. REDIS HAS DATA → USE REDIS
  // ==================================================

  if (tweetIds.length > 0) {
    const hasMore = tweetIds.length > limit;

    const pageIds = hasMore ? tweetIds.slice(0, limit) : tweetIds;

    const rows = await db
      .select({
        id: tweets.id,
        content: tweets.content,
        createdAt: tweets.createdAt,
        userId: tweets.userId,
        likeCount: tweets.likeCount,
        commentCount: tweets.commentCount,
        retweetCount: tweets.retweetCount,
        username: users.username,
        displayName: users.displayName,
      })
      .from(tweets)
      .innerJoin(users, eq(tweets.userId, users.id))
      .where(inArray(tweets.id, pageIds));

    // Restore Redis ordering.
    const byId = new Map(rows.map((tweet) => [tweet.id, tweet]));

    const items = pageIds.map((id) => byId.get(id)).filter(Boolean);

    const decoratedItems = await attachUserInteractions(items, req.userId);

    const nextCursor =
      hasMore && decoratedItems.length > 0
        ? decoratedItems[decoratedItems.length - 1].createdAt.getTime()
        : null;

    return res.json({
      tweets: decoratedItems,
      nextCursor,
      source: "redis",
    });
  }

  // ==================================================
  // 3. REDIS HAS NOTHING FOR THIS CURSOR
  //    → NOW FALL BACK TO POSTGRES
  // ==================================================

  console.log("[timeline] Redis exhausted → using PostgreSQL");

  const followeeRows = await db
    .select({
      followeeId: follows.followeeId,
    })
    .from(follows)
    .where(eq(follows.followerId, req.userId));

  const authorIds = [...followeeRows.map((r) => r.followeeId), req.userId];

  const whereClause = cursor
    ? and(inArray(tweets.userId, authorIds), lt(tweets.createdAt, cursor))
    : inArray(tweets.userId, authorIds);

  const page = await db
    .select({
      id: tweets.id,
      content: tweets.content,
      createdAt: tweets.createdAt,
      userId: tweets.userId,
      likeCount: tweets.likeCount,
      commentCount: tweets.commentCount,
      retweetCount: tweets.retweetCount,
      username: users.username,
      displayName: users.displayName,
    })
    .from(tweets)
    .innerJoin(users, eq(tweets.userId, users.id))
    .where(whereClause)
    .orderBy(desc(tweets.createdAt))
    .limit(limit + 1);

  const hasMore = page.length > limit;

  const items = hasMore ? page.slice(0, limit) : page;

  const decoratedItems = await attachUserInteractions(items, req.userId);

  const nextCursor =
    hasMore && decoratedItems.length > 0
      ? decoratedItems[decoratedItems.length - 1].createdAt.getTime()
      : null;

  return res.json({
    tweets: decoratedItems,
    nextCursor,
    source: "pull",
  });
}

