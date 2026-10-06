import { sql } from "./index.js";

export async function initDb() {
  try {
    await sql`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "bio" varchar(160);
    `;
    await sql`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatar_url" varchar(255);
    `;
    await sql`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "private" boolean DEFAULT false NOT NULL;
    `;
    await sql`
      ALTER TABLE "tweets" ADD COLUMN IF NOT EXISTS "like_count" integer DEFAULT 0 NOT NULL;
    `;
    await sql`
      ALTER TABLE "tweets" ADD COLUMN IF NOT EXISTS "comment_count" integer DEFAULT 0 NOT NULL;
    `;
    await sql`
      ALTER TABLE "tweets" ADD COLUMN IF NOT EXISTS "retweet_count" integer DEFAULT 0 NOT NULL;
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS "likes" (
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "tweet_id" uuid NOT NULL REFERENCES "tweets"("id") ON DELETE CASCADE,
        "created_at" timestamp DEFAULT now() NOT NULL,
        PRIMARY KEY ("user_id", "tweet_id")
      );
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS "retweets" (
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "tweet_id" uuid NOT NULL REFERENCES "tweets"("id") ON DELETE CASCADE,
        "created_at" timestamp DEFAULT now() NOT NULL,
        PRIMARY KEY ("user_id", "tweet_id")
      );
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS "comments" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tweet_id" uuid NOT NULL REFERENCES "tweets"("id") ON DELETE CASCADE,
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "content" varchar(280) NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS "likes_tweet_idx" ON "likes" ("tweet_id");
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS "likes_user_idx" ON "likes" ("user_id");
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS "retweets_tweet_idx" ON "retweets" ("tweet_id");
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS "retweets_user_idx" ON "retweets" ("user_id");
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS "comments_tweet_created_idx" ON "comments" ("tweet_id", "created_at");
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS "comments_user_created_idx" ON "comments" ("user_id", "created_at");
    `;
    console.log("Database initialized successfully.");
  } catch (err) {
    console.error("Database initialization error:", err.message);
    throw err;
  }
}
