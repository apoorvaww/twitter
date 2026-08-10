import "dotenv/config";
import { Queue } from "bullmq";
import IORedis from "ioredis";

export const FANOUT_QUEUE_NAME = "fanout";

// BullMQ requires maxRetriesPerRequest: null on its own Redis connection
// (separate from the ioredis client in src/redis/index.js, which is used
// for the actual timeline Sorted Sets).
const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

export const fanoutQueue = new Queue(FANOUT_QUEUE_NAME, { connection });

/**
 * Enqueue a fan-out job for a newly created tweet. Called from
 * tweetController right after the tweet is written to Postgres — the API
 * request returns immediately without waiting for fan-out to complete.
 */
export async function enqueueFanout({ tweetId, authorId, createdAtMs }) {
  await fanoutQueue.add(
    "fanout-tweet",
    { tweetId, authorId, createdAtMs },
    {
      attempts: 3,
      backoff: { type: "exponential", delay: 2000 },
    }
  );
}