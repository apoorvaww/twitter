import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { getMyProfile, updateMyProfile } from "../controllers/profileController.js";

export const profileRouter = Router();

// Get current user's profile
profileRouter.get("/me", requireAuth, getMyProfile);
// Update current user's profile
profileRouter.put("/me", requireAuth, updateMyProfile);
