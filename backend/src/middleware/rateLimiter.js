import { RateLimiterRedis } from "rate-limiter-flexible";
import { redis } from "../redis/index.js";

// 5 tweets per 60 seconds, per user. Backed by Redis so the limit is
// enforced correctly across multiple API instances — an in-memory counter
// would reset per-process and stop being a real limit the moment you run
// more than one instance behind a load balancer.
const tweetLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: "ratelimit:tweet",
  points: 5,
  duration: 60,
});

export async function tweetRateLimiter(req, res, next) {
  try {
    await tweetLimiter.consume(req.userId);
    next();
  } catch (rateLimiterRes) {
    const retryAfterSeconds =
      Math.ceil(rateLimiterRes.msBeforeNext / 1000) || 1;
    res.set("Retry-After", String(retryAfterSeconds));
    res.status(429).json({
      error: "rate limit exceeded, try again later",
      retryAfterSeconds,
    });
  }
}
