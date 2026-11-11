import { and, eq, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { follows, users } from "../db/schema.js";
import { enqueueNotification } from "../queue/notificationQueue.js";

export async function followUser(req, res) {
  const { userId: followeeId } = req.params;

  if (followeeId === req.userId) {
    return res.status(400).json({ error: "cannot follow yourself" });
  }

  const [followee] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, followeeId))
    .limit(1);

  if (!followee) {
    return res.status(404).json({ error: "user not found" });
  }

  try {
    await db.insert(follows).values({ followerId: req.userId, followeeId });
  } catch (err) {
    // Composite primary key (followerId, followeeId) rejects duplicates —
    // treat that as "already following" rather than a hard error.
    return res.status(409).json({ error: "already following this user" });
  }

  // Keep the denormalized counter in sync.
  await db
    .update(users)
    .set({ followerCount: sql`${users.followerCount} + 1` })
    .where(eq(users.id, followeeId));

  // Asynchronously generate notification via BullMQ
  try {
    await enqueueNotification({
      userId: followeeId,
      actorId: req.userId,
      type: "follow",
    });
  } catch (err) {
    console.error("[notification enqueue error]", err);
  }

  res.status(201).json({ following: followeeId });
}

export async function unfollowUser(req, res) {
  const { userId: followeeId } = req.params;

  const deleted = await db
    .delete(follows)
    .where(
      and(
        eq(follows.followerId, req.userId),
        eq(follows.followeeId, followeeId),
      ),
    )
    .returning({ followeeId: follows.followeeId });

  // Only decrement if a row was actually deleted — avoids the counter
  // drifting negative on repeated/duplicate unfollow calls.
  if (deleted.length > 0) {
    await db
      .update(users)
      .set({ followerCount: sql`greatest(${users.followerCount} - 1, 0)` })
      .where(eq(users.id, followeeId));
  }

  res.status(204).send();
}

export async function getFollowers(req, res) {
  const { userId } = req.params;

  const followerRows = await db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      followerCount: users.followerCount,
      avatarUrl: users.avatarUrl,
      bio: users.bio,
    })
    .from(follows)
    .innerJoin(users, eq(follows.followerId, users.id))
    .where(eq(follows.followeeId, userId));

  // Check if current user is following any of them
  let followingSet = new Set();
  if (req.userId && followerRows.length > 0) {
    const ids = followerRows.map((u) => u.id);
    const myFollows = await db
      .select({ followeeId: follows.followeeId })
      .from(follows)
      .where(and(eq(follows.followerId, req.userId), sql`${follows.followeeId} IN ${ids}`));
    followingSet = new Set(myFollows.map((f) => f.followeeId));
  }

  const results = followerRows.map((u) => ({
    ...u,
    isFollowing: followingSet.has(u.id),
    isSelf: req.userId === u.id,
  }));

  res.json({ users: results });
}

export async function getFollowing(req, res) {
  const { userId } = req.params;

  const followingRows = await db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      followerCount: users.followerCount,
      avatarUrl: users.avatarUrl,
      bio: users.bio,
    })
    .from(follows)
    .innerJoin(users, eq(follows.followeeId, users.id))
    .where(eq(follows.followerId, userId));

  let followingSet = new Set();
  if (req.userId && followingRows.length > 0) {
    const ids = followingRows.map((u) => u.id);
    const myFollows = await db
      .select({ followeeId: follows.followeeId })
      .from(follows)
      .where(and(eq(follows.followerId, req.userId), sql`${follows.followeeId} IN ${ids}`));
    followingSet = new Set(myFollows.map((f) => f.followeeId));
  }

  const results = followingRows.map((u) => ({
    ...u,
    isFollowing: followingSet.has(u.id),
    isSelf: req.userId === u.id,
  }));

  res.json({ users: results });
}
