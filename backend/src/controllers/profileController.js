import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";

// Get current authenticated user's profile
export async function getMyProfile(req, res) {
  const [user] = await db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      bio: users.bio,
      avatarUrl: users.avatarUrl,
      private: users.private,
    })
    .from(users)
    .where(eq(users.id, req.userId))
    .limit(1);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  return res.json({ user });
}

// Update profile fields (displayName, bio, avatarUrl, private)
export async function updateMyProfile(req, res) {
  const { displayName, bio, avatarUrl, private: isPrivate } = req.body;

  const updateFields = {};
  if (displayName !== undefined) updateFields.displayName = displayName;
  if (bio !== undefined) updateFields.bio = bio;
  if (avatarUrl !== undefined) updateFields.avatarUrl = avatarUrl;
  if (isPrivate !== undefined) updateFields.private = isPrivate;

  try {
    const [updated] = await db
      .update(users)
      .set(updateFields)
      .where(eq(users.id, req.userId))
      .returning({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        bio: users.bio,
        avatarUrl: users.avatarUrl,
        private: users.private,
      });
    return res.json({ user: updated });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to update profile" });
  }
}
