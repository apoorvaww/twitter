import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../controllers/notificationController.js";

export const notificationRouter = Router();

notificationRouter.get("/", requireAuth, getNotifications);
notificationRouter.post("/read-all", requireAuth, markAllNotificationsRead);
notificationRouter.patch("/:id/read", requireAuth, markNotificationRead);
