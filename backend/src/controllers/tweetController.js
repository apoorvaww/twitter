import { eq, desc } from "drizzle-orm";
import { db } from "../db/index.js";
import { tweets } from "../db/schema.js";
import { enqueueFanout } from "../queue/fanoutQueue.js";

const MAX_TWEET_LENGTH = 280;

export async function createTweet(req, res) {
  const { content } = req.body ?? {};

  if (!content || typeof content !== "string" || !content.trim()) {
    return res.status(400).json({ error: "content is required" });
  }
  if (content.length > MAX_TWEET_LENGTH) {
    return res.status(400).json({ error: `content must be ${MAX_TWEET_LENGTH} characters or less` });
  }

  const [tweet] = await db
    .insert(tweets)
    .values({ userId: req.userId, content })
    .returning();

  // Fan-out happens asynchronously in the worker — this request returns
  // immediately rather than blocking on writing to every follower's
  // Redis timeline. See src/worker.js.
  console.log("tweet: ", tweet);
  await enqueueFanout({
    tweetId: tweet.id,
    authorId: req.userId,
    createdAtMs: tweet.createdAt.getTime(),
  });

  res.status(201).json({ tweet });
}

export async function getUserTweets(req, res) {
  const { userId } = req.params;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);

  const userTweets = await db
    .select()
    .from(tweets)
    .where(eq(tweets.userId, userId))
    .orderBy(desc(tweets.createdAt))
    .limit(limit);

  res.json({ tweets: userTweets });
}