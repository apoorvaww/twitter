import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  displayName: varchar("display_name", { length: 100 }).notNull(),
  passwordHash: text("password_hash").notNull(),
  // Denormalized counter, kept in sync by followController on follow/unfollow.
  // Avoids a hot COUNT(*) on `follows` every time we need to check whether
  // an author is a "celebrity" (fan-out worker + timeline read both need this).
  followerCount: integer("follower_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tweets = pgTable(
  "tweets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    content: varchar("content", { length: 280 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    // Speeds up "get this user's tweets, newest first" (profile pages).
    userCreatedIdx: index("tweets_user_created_idx").on(
      table.userId,
      table.createdAt,
    ),
  }),
);

export const follows = pgTable(
  "follows",
  {
    followerId: uuid("follower_id")
      .notNull()
      .references(() => users.id),
    followeeId: uuid("followee_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    // Composite PK: a user can't follow the same person twice.
    pk: primaryKey({ columns: [table.followerId, table.followeeId] }),
    // Speeds up "who follows me" reverse lookups.
    followeeIdx: index("follows_followee_idx").on(table.followeeId),
  }),
);

// NOTE: there is no `timeline_entries` table. Fan-out storage now lives in
// Redis as a per-user Sorted Set (`timeline:{userId}`, member = tweetId,
// score = createdAt). Postgres (`tweets` + `follows`) remains the durable
// source of truth used to rebuild a timeline if it's ever missing from
// Redis, and to serve the pull-model fallback for entries older than the
// capped Redis timeline. See src/redis/index.js.
