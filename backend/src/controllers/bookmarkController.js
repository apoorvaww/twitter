import { db } from "../db/index.js";
import { bookmarks, tweets, users } from "../db/schema.js";
import { and, eq } from "drizzle-orm";

export async function addBookmark(req, res) {
  const { tweetId } = req.params;
  // Verify tweet exists
  const [tweet] = await db
    .select({ id: tweets.id })
    .from(tweets)
    .where(eq(tweets.id, tweetId))
    .limit(1);
  if (!tweet) {
    return res.status(404).json({ error: "tweet not found" });
  }
  try {
    await db.insert(bookmarks).values({ userId: req.userId, tweetId });
  } catch (err) {
    // Duplicate handled as already bookmarked
    return res.status(409).json({ error: "already bookmarked" });
  }
  return res.status(201).json({ bookmarked: true });
}

export async function removeBookmark(req, res) {
  const { tweetId } = req.params;
  const deleted = await db
    .delete(bookmarks)
    .where(
      and(eq(bookmarks.userId, req.userId), eq(bookmarks.tweetId, tweetId)),
    )
    .returning({ tweetId: bookmarks.tweetId });
  if (deleted.length === 0) {
    return res.status(404).json({ error: "bookmark not found" });
  }
  return res.status(204).send();
}

export async function getBookmarks(req, res) {
  const userBookmarks = await db
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
    .from(bookmarks)
    .innerJoin(tweets, eq(bookmarks.tweetId, tweets.id))
    .innerJoin(users, eq(tweets.userId, users.id))
    .where(eq(bookmarks.userId, req.userId))
    .orderBy(tweets.createdAt);
  return res.json({ tweets: userBookmarks });
}
