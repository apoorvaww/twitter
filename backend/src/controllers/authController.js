import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import {
  hashPassword,
  verifyPassword,
  signToken,
} from "../services/authService.js";

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

export async function signup(req, res) {
  const { username, displayName, password } = req.body ?? {};

  if (!username || !displayName || !password) {
    return res
      .status(400)
      .json({ error: "username, displayName, and password are required" });
  }
  if (!USERNAME_RE.test(username)) {
    return res
      .status(400)
      .json({
        error: "username must be 3-20 chars, letters/numbers/underscore only",
      });
  }
  if (password.length < 8) {
    return res
      .status(400)
      .json({ error: "password must be at least 8 characters" });
  }

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (existing.length > 0) {
    return res.status(409).json({ error: "username is already taken" });
  }

  const passwordHash = await hashPassword(password);

  const [user] = await db
    .insert(users)
    .values({ username, displayName, passwordHash })
    .returning({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
    });

  const token = signToken(user.id);

  res.status(201).json({ token, user });
}

export async function login(req, res) {
  const { username, password } = req.body ?? {};

  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "username and password are required" });
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  // Deliberately vague error on both "no such user" and "wrong password" —
  // don't leak which one it was, that's a username enumeration vector.
  if (!user) {
    return res.status(401).json({ error: "invalid username or password" });
  }

  const passwordOk = await verifyPassword(password, user.passwordHash);
  if (!passwordOk) {
    return res.status(401).json({ error: "invalid username or password" });
  }

  const token = signToken(user.id);

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
    },
  });
}
