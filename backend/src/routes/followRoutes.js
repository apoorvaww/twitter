import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { followUser, unfollowUser } from "../controllers/followController.js";

export const followRouter = Router();

followRouter.post("/:userId", requireAuth, followUser);
followRouter.delete("/:userId", requireAuth, unfollowUser);