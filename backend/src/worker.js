import "dotenv/config";
import { Worker } from "bullmq";
import IORedis from "ioredis";
import { eq } from "drizzle-orm";
import { db } from "./db/index.js";
import { follows, users } from "./db/schema.js";
import { addToTimeline } from "./redis/index.js";
import { FANOUT_QUEUE_NAME } from "./queue/fanoutQueue.js";
import { CELEBRITY_FOLLOWER_THRESHOLD } from "./config/constants.js";

const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

const worker = new Worker(
  FANOUT_QUEUE_NAME,
  async (job) => {
    const { tweetId, authorId, createdAtMs } = job.data;

    // Cheap lookup — no COUNT(*) on `follows`, just the denormalized counter.
    const [author] = await db
      .select({ followerCount: users.followerCount })
      .from(users)
      .where(eq(users.id, authorId))
      .limit(1);

    // Author's own timeline always gets their own tweet, push or no push.
    await addToTimeline(authorId, tweetId, createdAtMs);

    if (author && author.followerCount > CELEBRITY_FOLLOWER_THRESHOLD) {
      // Celebrity: skip per-follower push entirely. Their followers will
      // see this tweet via the pull-fallback merge in getTimeline instead.
      console.log(
        `[fanout] skipped push for celebrity author=${authorId} followers=${author.followerCount} tweet=${tweetId}`
      );
      return;
    }

    const followerRows = await db
      .select({ followerId: follows.followerId })
      .from(follows)
      .where(eq(follows.followeeId, authorId));

    await Promise.all(
      followerRows.map(({ followerId }) => addToTimeline(followerId, tweetId, createdAtMs))
    );

    console.log(`[fanout] pushed tweet=${tweetId} to ${followerRows.length} follower timelines`);
  },
  { connection }
);

worker.on("failed", (job, err) => {
  console.error(`[fanout] job ${job?.id} failed:`, err.message);
});

worker.on("ready", () => {
  console.log("Fan-out worker started, waiting for jobs...");
});