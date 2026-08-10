import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { tweetRateLimiter } from "../middleware/rateLimiter.js";
import { createTweet, getUserTweets } from "../controllers/tweetController.js";

export const tweetRouter = Router();

tweetRouter.post("/", requireAuth, tweetRateLimiter, createTweet);
tweetRouter.get("/user/:userId", getUserTweets);