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
import { notificationRouter } from "./routes/notificationRoutes.js";
import {
  metricsRegistry,
  httpRequestCounter,
  httpRequestDuration,
  queueDepthGauge,
} from "./config/metrics.js";
import { fanoutQueue } from "./queue/fanoutQueue.js";
import { notificationQueue } from "./queue/notificationQueue.js";

const app = express();
app.use(
  cors({
    origin: process.env.VITE_FRONTEND_URL || "http://localhost:5173",
  }),
);
app.use(express.json());

// Prometheus Metrics Middleware
app.use((req, res, next) => {
  if (req.path === "/metrics") return next();

  const start = process.hrtime();
  res.on("finish", () => {
    const diff = process.hrtime(start);
    const durationSeconds = diff[0] + diff[1] / 1e9;
    const route = req.baseUrl || req.path || "unknown";

    httpRequestCounter.inc({
      method: req.method,
      route,
      status_code: res.statusCode,
    });

    httpRequestDuration.observe(
      {
        method: req.method,
        route,
        status_code: res.statusCode,
      },
      durationSeconds,
    );
  });
  next();
});

// Health check endpoint
app.get("/health", (req, res) => res.json({ ok: true, timestamp: new Date().toISOString() }));

// Prometheus Metrics endpoint
app.get("/metrics", async (req, res) => {
  try {
    // Dynamically poll BullMQ queue depths
    const [fanoutCount, notifCount] = await Promise.all([
      fanoutQueue.getWaitingCount().catch(() => 0),
      notificationQueue.getWaitingCount().catch(() => 0),
    ]);
    queueDepthGauge.set({ queue_name: "fanout" }, fanoutCount);
    queueDepthGauge.set({ queue_name: "notifications" }, notifCount);

    res.set("Content-Type", metricsRegistry.contentType);
    res.end(await metricsRegistry.metrics());
  } catch (err) {
    res.status(500).end(err.message);
  }
});

app.use("/auth", authRouter);
app.use("/tweets", tweetRouter);
app.use("/follows", followRouter);
app.use("/timeline", timelineRouter);
app.use("/bookmarks", bookmarkRouter);
app.use("/users", userRouter);
app.use("/profile", profileRouter);
app.use("/notifications", notificationRouter);

// Protected sanity-check route
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
