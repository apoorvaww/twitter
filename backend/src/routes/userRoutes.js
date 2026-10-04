import { Router } from "express";
import { optionalAuth } from "../middleware/authMiddleware.js";
import {
  getUserProfile,
  searchUsers,
  getUserTweetsTab,
  getUserRetweetsTab,
  getUserRepliesTab,
  getUserLikesTab,
} from "../controllers/userController.js";

export const userRouter = Router();

userRouter.get("/profile/:username", optionalAuth, getUserProfile);
userRouter.get("/search", optionalAuth, searchUsers);
userRouter.get("/:userId/tweets", optionalAuth, getUserTweetsTab);
userRouter.get("/:userId/retweets", optionalAuth, getUserRetweetsTab);
userRouter.get("/:userId/replies", optionalAuth, getUserRepliesTab);
userRouter.get("/:userId/likes", optionalAuth, getUserLikesTab);
