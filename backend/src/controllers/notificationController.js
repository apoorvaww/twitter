import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { notifications, users, tweets } from "../db/schema.js";

// GET /notifications - get notifications for current user
export async function getNotifications(req, res) {
  const limit = Math.min(parseInt(req.query.limit, 10) || 30, 50);

  const notifRows = await db
    .select({
      id: notifications.id,
      type: notifications.type,
      read: notifications.read,
      createdAt: notifications.createdAt,
      tweetId: notifications.tweetId,
      actor: {
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
      },
    })
    .from(notifications)
    .innerJoin(users, eq(notifications.actorId, users.id))
    .where(eq(notifications.userId, req.userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);

  // Optionally fetch snippet of the tweet if tweetId is present
  const tweetIds = notifRows.filter((n) => n.tweetId).map((n) => n.tweetId);
  let tweetMap = new Map();

  if (tweetIds.length > 0) {
    const tweetRows = await db
      .select({ id: tweets.id, content: tweets.content })
      .from(tweets)
      .where(sql`${tweets.id} IN ${tweetIds}`);
    tweetMap = new Map(tweetRows.map((t) => [t.id, t.content]));
  }

  const result = notifRows.map((n) => ({
    ...n,
    tweetContent: n.tweetId ? tweetMap.get(n.tweetId) || null : null,
  }));

  // Count unread
  const [unreadRes] = await db
    .select({ count: sql`count(*)` })
    .from(notifications)
    .where(and(eq(notifications.userId, req.userId), eq(notifications.read, false)));

  res.json({
    notifications: result,
    unreadCount: Number(unreadRes?.count || 0),
  });
}

// POST /notifications/read-all - mark all notifications as read
export async function markAllNotificationsRead(req, res) {
  await db
    .update(notifications)
    .set({ read: true })
    .where(eq(notifications.userId, req.userId));

  res.json({ success: true });
}

// PATCH /notifications/:id/read - mark single notification as read
export async function markNotificationRead(req, res) {
  const { id } = req.params;

  await db
    .update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.id, id), eq(notifications.userId, req.userId)));

  res.json({ success: true });
}
