import "dotenv/config";
import Redis from "ioredis";

export const redis = new Redis(process.env.REDIS_URL);

export const TIMELINE_MAX_LENGTH = 800;

function timelineKey(userId) {
  return `timeline:${userId}`;
}

export async function addToTimeline(ownerId, tweetId, createdAtMs) {
  if (!ownerId) {
    throw new Error("[redis] missing ownerId");
  }

  if (!tweetId) {
    throw new Error("[redis] missing tweetId");
  }

  if (!createdAtMs) {
    throw new Error("[redis] missing createdAtMs");
  }

  const key = timelineKey(ownerId);

  await redis.zadd(key, createdAtMs, tweetId);

  await redis.zremrangebyrank(
    key,
    0,
    -(TIMELINE_MAX_LENGTH + 1)
  );
}

export async function getTimelinePage(
  userId,
  { beforeMs, limit = 20 } = {}
) {
  const key = timelineKey(userId);

  const max = beforeMs
    ? `(${beforeMs}`
    : "+inf";

  const tweetIds = await redis.zrevrangebyscore(
    key,
    max,
    "-inf",
    "LIMIT",
    0,
    limit + 1
  );

  return tweetIds.filter(
    (id) => typeof id === "string" && id.trim() !== ""
  );
}