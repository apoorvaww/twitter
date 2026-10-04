import { eq, ilike, or, and, desc, sql, inArray } from "drizzle-orm";
import { db } from "../db/index.js";
import { users, tweets, follows, likes, retweets, comments } from "../db/schema.js";

// Helper to decorate tweets with liked/retweeted flags for the requesting user
async function decorateTweets(tweetList, currentUserId) {
  if (!tweetList || tweetList.length === 0) return [];
  if (!currentUserId) {
    return tweetList.map((t) => ({ ...t, liked: false, retweeted: false }));
  }

  const tweetIds = tweetList.map((t) => t.id);

  const [userLikes, userRetweets] = await Promise.all([
    db
      .select({ tweetId: likes.tweetId })
      .from(likes)
      .where(and(eq(likes.userId, currentUserId), inArray(likes.tweetId, tweetIds))),
    db
      .select({ tweetId: retweets.tweetId })
      .from(retweets)
      .where(and(eq(retweets.userId, currentUserId), inArray(retweets.tweetId, tweetIds))),
  ]);

  const likedSet = new Set(userLikes.map((l) => l.tweetId));
  const retweetedSet = new Set(userRetweets.map((r) => r.tweetId));

  return tweetList.map((t) => ({
    ...t,
    liked: likedSet.has(t.id),
    retweeted: retweetedSet.has(t.id),
  }));
}

// 1. Get user profile by username
export async function getUserProfile(req, res) {
  const { username } = req.params;

  const [user] = await db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      followerCount: users.followerCount,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (!user) {
    return res.status(404).json({ error: "user not found" });
  }

  // Count following
  const [followingRes] = await db
    .select({ count: sql`count(*)` })
    .from(follows)
    .where(eq(follows.followerId, user.id));

  // Count tweets authored
  const [tweetsRes] = await db
    .select({ count: sql`count(*)` })
    .from(tweets)
    .where(eq(tweets.userId, user.id));

  // Check if current user is following this profile
  let isFollowing = false;
  if (req.userId && req.userId !== user.id) {
    const [followRow] = await db
      .select()
      .from(follows)
      .where(and(eq(follows.followerId, req.userId), eq(follows.followeeId, user.id)))
      .limit(1);
    isFollowing = !!followRow;
  }

  res.json({
    user: {
      ...user,
      followingCount: Number(followingRes?.count || 0),
      tweetCount: Number(tweetsRes?.count || 0),
      isFollowing,
      isSelf: req.userId === user.id,
    },
  });
}

// 2. Search users by name (or get suggestions if query is empty)
export async function searchUsers(req, res) {
  const q = (req.query.q || "").trim();
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 30);

  let userList = [];

  if (q) {
    userList = await db
      .select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        followerCount: users.followerCount,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(
        or(
          ilike(users.username, `%${q}%`),
          ilike(users.displayName, `%${q}%`)
        )
      )
      .limit(limit);
  } else {
    // Suggestions
    userList = await db
      .select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        followerCount: users.followerCount,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.followerCount), desc(users.createdAt))
      .limit(limit);
  }

  // Check which users the current user is following
  let followingSet = new Set();
  if (req.userId && userList.length > 0) {
    const userIds = userList.map((u) => u.id);
    const followRows = await db
      .select({ followeeId: follows.followeeId })
      .from(follows)
      .where(and(eq(follows.followerId, req.userId), inArray(follows.followeeId, userIds)));
    followingSet = new Set(followRows.map((f) => f.followeeId));
  }

  const results = userList.map((u) => ({
    ...u,
    isFollowing: followingSet.has(u.id),
    isSelf: req.userId === u.id,
  }));

  res.json({ users: results });
}

// 3. Get user tweets (subsection Tweets)
export async function getUserTweetsTab(req, res) {
  const { userId } = req.params;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);

  const rawTweets = await db
    .select({
      id: tweets.id,
      content: tweets.content,
      createdAt: tweets.createdAt,
      userId: tweets.userId,
      likeCount: tweets.likeCount,
      commentCount: tweets.commentCount,
      retweetCount: tweets.retweetCount,
      username: users.username,
      displayName: users.displayName,
    })
    .from(tweets)
    .innerJoin(users, eq(tweets.userId, users.id))
    .where(eq(tweets.userId, userId))
    .orderBy(desc(tweets.createdAt))
    .limit(limit);

  const decorated = await decorateTweets(rawTweets, req.userId);
  res.json({ tweets: decorated });
}

// 4. Get user retweets (subsection Retweets)
export async function getUserRetweetsTab(req, res) {
  const { userId } = req.params;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);

  const userRetweets = await db
    .select({
      retweetedAt: retweets.createdAt,
      id: tweets.id,
      content: tweets.content,
      createdAt: tweets.createdAt,
      userId: tweets.userId,
      likeCount: tweets.likeCount,
      commentCount: tweets.commentCount,
      retweetCount: tweets.retweetCount,
      username: users.username,
      displayName: users.displayName,
    })
    .from(retweets)
    .innerJoin(tweets, eq(retweets.tweetId, tweets.id))
    .innerJoin(users, eq(tweets.userId, users.id))
    .where(eq(retweets.userId, userId))
    .orderBy(desc(retweets.createdAt))
    .limit(limit);

  const decorated = await decorateTweets(userRetweets, req.userId);

  // Fetch the retweeter's username to show "Retweeted by X"
  const [retweeter] = await db
    .select({ username: users.username, displayName: users.displayName })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const withBanner = decorated.map((t) => ({
    ...t,
    retweetedBy: retweeter?.displayName || retweeter?.username || "Someone",
    isRetweetItem: true,
  }));

  res.json({ tweets: withBanner });
}

// 5. Get user replies / comments (subsection Comments / Replies)
export async function getUserRepliesTab(req, res) {
  const { userId } = req.params;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);

  const userComments = await db
    .select({
      commentId: comments.id,
      commentContent: comments.content,
      commentCreatedAt: comments.createdAt,
      commentAuthorId: comments.userId,
      tweetId: tweets.id,
      tweetContent: tweets.content,
      tweetCreatedAt: tweets.createdAt,
      tweetAuthorId: tweets.userId,
      tweetLikeCount: tweets.likeCount,
      tweetCommentCount: tweets.commentCount,
      tweetRetweetCount: tweets.retweetCount,
      tweetUsername: users.username,
      tweetDisplayName: users.displayName,
    })
    .from(comments)
    .innerJoin(tweets, eq(comments.tweetId, tweets.id))
    .innerJoin(users, eq(tweets.userId, users.id))
    .where(eq(comments.userId, userId))
    .orderBy(desc(comments.createdAt))
    .limit(limit);

  // Author of comments
  const [commenter] = await db
    .select({ username: users.username, displayName: users.displayName })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const results = userComments.map((c) => ({
    id: c.commentId,
    content: c.commentContent,
    createdAt: c.commentCreatedAt,
    author: {
      id: c.commentAuthorId,
      username: commenter?.username,
      displayName: commenter?.displayName,
    },
    parentTweet: {
      id: c.tweetId,
      content: c.tweetContent,
      createdAt: c.tweetCreatedAt,
      userId: c.tweetAuthorId,
      username: c.tweetUsername,
      displayName: c.tweetDisplayName,
      likeCount: c.tweetLikeCount,
      commentCount: c.tweetCommentCount,
      retweetCount: c.tweetRetweetCount,
    },
  }));

  res.json({ replies: results });
}

// 6. Get user likes (subsection Likes)
export async function getUserLikesTab(req, res) {
  const { userId } = req.params;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);

  const userLikes = await db
    .select({
      likedAt: likes.createdAt,
      id: tweets.id,
      content: tweets.content,
      createdAt: tweets.createdAt,
      userId: tweets.userId,
      likeCount: tweets.likeCount,
      commentCount: tweets.commentCount,
      retweetCount: tweets.retweetCount,
      username: users.username,
      displayName: users.displayName,
    })
    .from(likes)
    .innerJoin(tweets, eq(likes.tweetId, tweets.id))
    .innerJoin(users, eq(tweets.userId, users.id))
    .where(eq(likes.userId, userId))
    .orderBy(desc(likes.createdAt))
    .limit(limit);

  const decorated = await decorateTweets(userLikes, req.userId);
  res.json({ tweets: decorated });
}
