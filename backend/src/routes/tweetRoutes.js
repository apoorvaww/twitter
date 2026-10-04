import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { tweetRateLimiter } from "../middleware/rateLimiter.js";
import { createTweet, getUserTweets } from "../controllers/tweetController.js";
import { toggleLike } from "../controllers/likeController.js";
import { toggleRetweet } from "../controllers/retweetController.js";
import { getComments, createComment } from "../controllers/commentController.js";

export const tweetRouter = Router();

tweetRouter.post("/", requireAuth, tweetRateLimiter, createTweet);
tweetRouter.get("/user/:userId", getUserTweets);

// Like & Retweet
tweetRouter.post("/:tweetId/like", requireAuth, toggleLike);
tweetRouter.delete("/:tweetId/like", requireAuth, toggleLike);
tweetRouter.post("/:tweetId/retweet", requireAuth, toggleRetweet);
tweetRouter.delete("/:tweetId/retweet", requireAuth, toggleRetweet);

// Comments / Replies
tweetRouter.get("/:tweetId/comments", getComments);
tweetRouter.post("/:tweetId/comments", requireAuth, createComment);