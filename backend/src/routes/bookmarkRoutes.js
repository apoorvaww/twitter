import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { addBookmark, removeBookmark, getBookmarks } from "../controllers/bookmarkController.js";

export const bookmarkRouter = Router();

// Get current user's bookmarks
bookmarkRouter.get("/", requireAuth, getBookmarks);
// Add bookmark to a tweet
bookmarkRouter.post("/:tweetId", requireAuth, addBookmark);
// Remove bookmark
bookmarkRouter.delete("/:tweetId", requireAuth, removeBookmark);
