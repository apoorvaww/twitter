import { and, eq, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { follows, users } from "../db/schema.js";

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
