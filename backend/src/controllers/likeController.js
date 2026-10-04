import { and, eq, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { likes, tweets } from "../db/schema.js";

export async function toggleLike(req, res) {
  const { tweetId } = req.params;

  // Verify tweet exists
  const [tweet] = await db
    .select({ id: tweets.id, likeCount: tweets.likeCount })
    .from(tweets)
    .where(eq(tweets.id, tweetId))
    .limit(1);

  if (!tweet) {
    return res.status(404).json({ error: "tweet not found" });
  }

  // Check if like exists
  const [existing] = await db
    .select()
    .from(likes)
    .where(and(eq(likes.userId, req.userId), eq(likes.tweetId, tweetId)))
    .limit(1);

  if (existing) {
    await db
      .delete(likes)
      .where(and(eq(likes.userId, req.userId), eq(likes.tweetId, tweetId)));

    const [updated] = await db
      .update(tweets)
      .set({ likeCount: sql`greatest(${tweets.likeCount} - 1, 0)` })
      .where(eq(tweets.id, tweetId))
      .returning({ likeCount: tweets.likeCount });

    return res.json({ liked: false, likeCount: updated.likeCount });
  } else {
    try {
      await db.insert(likes).values({ userId: req.userId, tweetId });
    } catch (err) {
      // Handled duplicate
    }

    const [updated] = await db
      .update(tweets)
      .set({ likeCount: sql`${tweets.likeCount} + 1` })
      .where(eq(tweets.id, tweetId))
      .returning({ likeCount: tweets.likeCount });

    return res.json({ liked: true, likeCount: updated.likeCount });
  }
}
