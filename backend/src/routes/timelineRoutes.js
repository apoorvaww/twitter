import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { getTimeline } from "../controllers/timelineController.js";

export const timelineRouter = Router();

timelineRouter.get("/", requireAuth, getTimeline);