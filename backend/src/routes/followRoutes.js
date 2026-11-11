import { Router } from "express";
import { requireAuth, optionalAuth } from "../middleware/authMiddleware.js";
import {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
} from "../controllers/followController.js";

export const followRouter = Router();

followRouter.post("/:userId", requireAuth, followUser);
followRouter.delete("/:userId", requireAuth, unfollowUser);
followRouter.get("/:userId/followers", optionalAuth, getFollowers);
followRouter.get("/:userId/following", optionalAuth, getFollowing);
