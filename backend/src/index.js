import "dotenv/config";
import express from "express";
import cors from "cors";
import { eq } from "drizzle-orm";
import { db } from "./db/index.js";
import { users } from "./db/schema.js";
import { authRouter } from "./routes/authRoutes.js";
import { requireAuth } from "./middleware/authMiddleware.js";
import { tweetRouter } from "./routes/tweetRoutes.js";
import { followRouter } from "./routes/followRoutes.js";
import { timelineRouter } from "./routes/timelineRoutes.js";
import { profileRouter } from "./routes/profileRoutes.js";
import { userRouter } from "./routes/userRoutes.js";
import { bookmarkRouter } from "./routes/bookmarkRoutes.js";
import { initDb } from "./db/init.js";

const app = express();
await initDb();
app.use(
  cors({
    origin: process.env.VITE_FRONTEND_URL || "http://localhost:5173",
  }),
);
app.use(express.json());

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/auth", authRouter);
app.use("/tweets", tweetRouter);
app.use("/follows", followRouter);
app.use("/timeline", timelineRouter);
app.use("/bookmarks", bookmarkRouter);
app.use("/users", userRouter);
app.use("/profile", profileRouter);


// Protected sanity-check route: proves the token round-trips correctly
// and req.userId resolves to a real user.
app.get("/me", requireAuth, async (req, res) => {
  const [user] = await db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
    })
    .from(users)
    .where(eq(users.id, req.userId))
    .limit(1);

  if (!user) {
    return res.status(404).json({ error: "user not found" });
  }
  res.json({ user });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
