import { eq, asc, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { comments, tweets, users } from "../db/schema.js";

const MAX_COMMENT_LENGTH = 280;

export async function getComments(req, res) {
  const { tweetId } = req.params;

  const tweetComments = await db
    .select({
      id: comments.id,
      tweetId: comments.tweetId,
      userId: comments.userId,
      content: comments.content,
      createdAt: comments.createdAt,
      username: users.username,
      displayName: users.displayName,
    })
    .from(comments)
    .innerJoin(users, eq(comments.userId, users.id))
    .where(eq(comments.tweetId, tweetId))
    .orderBy(asc(comments.createdAt));

  res.json({ comments: tweetComments });
}

export async function createComment(req, res) {
  const { tweetId } = req.params;
  const { content } = req.body ?? {};

  if (!content || typeof content !== "string" || !content.trim()) {
    return res.status(400).json({ error: "content is required" });
  }

  if (content.length > MAX_COMMENT_LENGTH) {
    return res
      .status(400)
      .json({ error: `content must be ${MAX_COMMENT_LENGTH} characters or less` });
  }

  // Verify tweet exists
  const [tweet] = await db
    .select({ id: tweets.id })
    .from(tweets)
    .where(eq(tweets.id, tweetId))
    .limit(1);

  if (!tweet) {
    return res.status(404).json({ error: "tweet not found" });
  }

  const [newComment] = await db
    .insert(comments)
    .values({
      tweetId,
      userId: req.userId,
      content: content.trim(),
    })
    .returning();

  // Increment comment count on tweet
  await db
    .update(tweets)
    .set({ commentCount: sql`${tweets.commentCount} + 1` })
    .where(eq(tweets.id, tweetId));

  const [author] = await db
    .select({
      username: users.username,
      displayName: users.displayName,
    })
    .from(users)
    .where(eq(users.id, req.userId))
    .limit(1);

  res.status(201).json({
    comment: {
      ...newComment,
      username: author?.username || "",
      displayName: author?.displayName || "",
    },
  });
}
