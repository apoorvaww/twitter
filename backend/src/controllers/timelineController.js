import { eq, inArray, lt, and, desc } from "drizzle-orm";
import { db } from "../db/index.js";
import { tweets, follows, users } from "../db/schema.js";
import { getTimelinePage } from "../redis/index.js";

export async function getTimeline(req, res) {
  const limit = Math.min(
    parseInt(req.query.limit, 10) || 20,
    50
  );

  const cursor = req.query.cursor
    ? new Date(Number(req.query.cursor))
    : null;

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

    const pageIds = hasMore
      ? tweetIds.slice(0, limit)
      : tweetIds;

    const rows = await db
      .select({
        id: tweets.id,
        content: tweets.content,
        createdAt: tweets.createdAt,
        userId: tweets.userId,
        username: users.username,
        displayName: users.displayName,
      })
      .from(tweets)
      .innerJoin(users, eq(tweets.userId, users.id))
      .where(inArray(tweets.id, pageIds));

    // Restore Redis ordering.
    const byId = new Map(
      rows.map((tweet) => [tweet.id, tweet])
    );

    const items = pageIds
      .map((id) => byId.get(id))
      .filter(Boolean);

    const nextCursor =
      hasMore && items.length > 0
        ? items[items.length - 1].createdAt.getTime()
        : null;

    return res.json({
      tweets: items,
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

  const authorIds = [
    ...followeeRows.map((r) => r.followeeId),
    req.userId,
  ];

  const whereClause = cursor
    ? and(
        inArray(tweets.userId, authorIds),
        lt(tweets.createdAt, cursor)
      )
    : inArray(tweets.userId, authorIds);

  const page = await db
    .select({
      id: tweets.id,
      content: tweets.content,
      createdAt: tweets.createdAt,
      userId: tweets.userId,
      username: users.username,
      displayName: users.displayName,
    })
    .from(tweets)
    .innerJoin(users, eq(tweets.userId, users.id))
    .where(whereClause)
    .orderBy(desc(tweets.createdAt))
    .limit(limit + 1);

  const hasMore = page.length > limit;

  const items = hasMore
    ? page.slice(0, limit)
    : page;

  const nextCursor =
    hasMore && items.length > 0
      ? items[items.length - 1].createdAt.getTime()
      : null;

  return res.json({
    tweets: items,
    nextCursor,
    source: "pull",
  });
}