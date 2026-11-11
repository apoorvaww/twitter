import "dotenv/config";
import { Queue } from "bullmq";
import IORedis from "ioredis";

export const NOTIFICATION_QUEUE_NAME = "notifications";

const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

export const notificationQueue = new Queue(NOTIFICATION_QUEUE_NAME, { connection });

export async function enqueueNotification({ userId, actorId, type, tweetId = null }) {
  // Avoid self-notifications
  if (userId === actorId) return;

  await notificationQueue.add(
    "create-notification",
    { userId, actorId, type, tweetId },
    {
      attempts: 3,
      backoff: { type: "exponential", delay: 2000 },
    }
  );
}
