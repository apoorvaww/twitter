import { and, eq, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { retweets, tweets } from "../db/schema.js";

export async function toggleRetweet(req, res) {
  const { tweetId } = req.params;

  // Verify tweet exists
  const [tweet] = await db
    .select({ id: tweets.id, retweetCount: tweets.retweetCount })
    .from(tweets)
    .where(eq(tweets.id, tweetId))
    .limit(1);

  if (!tweet) {
    return res.status(404).json({ error: "tweet not found" });
  }

  // Check if already retweeted
  const [existing] = await db
    .select()
    .from(retweets)
    .where(and(eq(retweets.userId, req.userId), eq(retweets.tweetId, tweetId)))
    .limit(1);

  if (existing) {
    await db
      .delete(retweets)
      .where(and(eq(retweets.userId, req.userId), eq(retweets.tweetId, tweetId)));

    const [updated] = await db
      .update(tweets)
      .set({ retweetCount: sql`greatest(${tweets.retweetCount} - 1, 0)` })
      .where(eq(tweets.id, tweetId))
      .returning({ retweetCount: tweets.retweetCount });

    return res.json({ retweeted: false, retweetCount: updated.retweetCount });
  } else {
    try {
      await db.insert(retweets).values({ userId: req.userId, tweetId });
    } catch (err) {
      // Duplicate handled
    }

    const [updated] = await db
      .update(tweets)
      .set({ retweetCount: sql`${tweets.retweetCount} + 1` })
      .where(eq(tweets.id, tweetId))
      .returning({ retweetCount: tweets.retweetCount });

    return res.json({ retweeted: true, retweetCount: updated.retweetCount });
  }
}
