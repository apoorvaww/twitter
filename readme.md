# Twitter-Like Timeline System

A Twitter/X-inspired social media application built to explore **scalable timeline generation** using PostgreSQL, Redis, and background workers.

The project implements a **fan-out-on-write timeline architecture** where tweets are asynchronously distributed into followers' Redis timelines. Redis serves recent timeline reads, while PostgreSQL remains the durable source of truth and provides a fallback for older tweets when the Redis timeline is exhausted.

---

## 🚀 Overview

A simple timeline implementation could work like this:

```text
User requests timeline
        ↓
Find everyone they follow
        ↓
Query all their tweets
        ↓
Merge + sort tweets
        ↓
Return timeline
```

This is the **fan-out-on-read (pull model)**.

While simple, it becomes increasingly expensive as the number of users and follows grows.

This project explores an alternative:

```text
User creates tweet
        ↓
PostgreSQL
        ↓
BullMQ job
        ↓
Fan-out worker
        ↓
Redis
        ↓
Followers' timelines
```

When a user requests their timeline:

```text
GET /timeline
        ↓
Redis
        ↓
Recent timeline entries
        ↓
PostgreSQL hydration
        ↓
Frontend
```

If the requested timeline position is older than what Redis contains:

```text
Redis exhausted
        ↓
PostgreSQL fallback
        ↓
Older tweets
```

This creates a simplified version of the architecture used by large-scale social platforms.

---

# ✨ Features

- User registration and login
- JWT-based authentication
- Password hashing
- Create tweets
- Follow and unfollow users
- Personalized timelines
- Redis-based timeline storage
- Fan-out-on-write architecture
- BullMQ background processing
- Cursor-based pagination
- PostgreSQL fallback for older timeline entries
- Redis timeline size limiting
- Denormalized follower counters
- Celebrity-user optimization
- React frontend
- PostgreSQL as the durable source of truth

---

# 🏗️ Architecture

## High-Level Architecture

```text
                         ┌─────────────────┐
                         │     React       │
                         │    Frontend     │
                         └────────┬────────┘
                                  │
                                  │ HTTP / JSON
                                  ▼
                         ┌─────────────────┐
                         │     Express     │
                         │      API        │
                         └───────┬─────────┘
                                 │
                 ┌───────────────┼────────────────┐
                 │               │                │
                 ▼               ▼                ▼
          ┌───────────┐   ┌────────────┐   ┌─────────────┐
          │ PostgreSQL│   │   Redis    │   │    Auth     │
          │  Neon DB  │   │ Timelines  │   │    JWT      │
          └───────────┘   └─────┬──────┘   └─────────────┘
                                │
                                │
                         ┌──────▼──────┐
                         │   BullMQ    │
                         │    Queue    │
                         └──────┬──────┘
                                │
                                ▼
                         ┌─────────────┐
                         │ Fan-out     │
                         │   Worker    │
                         └─────────────┘
```

---

# 🧠 Timeline Architecture

The main purpose of this project is to explore two approaches to timeline generation.

## 1. Fan-out-on-read / Pull Model

The basic approach is:

```text
User
 ↓
Find followed users
 ↓
Query their tweets
 ↓
Merge tweets
 ↓
Sort by createdAt
 ↓
Return timeline
```

For example, if a user follows 1,000 accounts, every timeline request potentially requires querying and merging tweets from those accounts.

This becomes increasingly expensive as the follow graph grows.

---

## 2. Fan-out-on-write / Push Model

This project primarily uses a push-based approach.

When a user posts:

```text
Tweet created
      ↓
PostgreSQL
      ↓
BullMQ job
      ↓
Fan-out worker
      ↓
Find followers
      ↓
Add tweet ID to each follower's Redis timeline
```

Each follower receives a Redis timeline entry ahead of time.

Therefore, reading a timeline becomes much cheaper.

---

# 🔴 Redis Timeline

Each user's timeline is stored as a Redis Sorted Set.

The key format is:

```text
timeline:{userId}
```

Example:

```text
timeline:53365234-4e81-4469-a639-bbd91a1046b2
```

The Sorted Set contains:

```text
tweetId                         score
------------------------------------------------
tweet-a                        1786336494194
tweet-b                        1786334429395
tweet-c                        1786332012321
```

The score is the tweet's creation timestamp in milliseconds.

This allows Redis to efficiently retrieve tweets in reverse chronological order.

---

# 📦 Why Redis Stores Tweet IDs

Redis does not store the complete tweet object.

It stores:

```text
tweetId → timestamp
```

For example:

```text
tweet-123 → 1786336494194
```

When the API receives the IDs, PostgreSQL is used to hydrate the tweets:

```text
Redis
 ↓
[tweet-123, tweet-456]
 ↓
PostgreSQL
 ↓
{
  id,
  content,
  username,
  displayName,
  createdAt
}
```

This keeps Redis lightweight while PostgreSQL remains the source of truth for tweet data.

---

# 📏 Redis Timeline Limit

Each Redis timeline is capped at:

```text
800 entries
```

This is controlled by:

```js
TIMELINE_MAX_LENGTH = 800
```

Older entries are removed from Redis when the limit is exceeded.

This keeps Redis memory usage bounded.

---

# 🔄 Redis → PostgreSQL Fallback

Redis is treated as a fast timeline materialization/cache, not the permanent source of truth.

The timeline request works like this:

```text
GET /timeline
       │
       ▼
     Redis
       │
       ├── Has tweets for cursor?
       │       │
       │       └── YES
       │            ↓
       │         Return Redis page
       │
       └── NO
            ↓
       PostgreSQL
            ↓
       Pull older tweets
```

The application does **not** query PostgreSQL simply because Redis has fewer tweets than the requested page size.

PostgreSQL is used when the Redis timeline has been exhausted for the requested cursor.

This allows recent timeline pages to be served quickly from Redis while still allowing access to older tweets.

---

# 📄 Cursor-Based Pagination

The timeline uses cursor-based pagination instead of traditional offset pagination.

Example:

```text
GET /timeline
```

Response:

```json
{
  "tweets": [],
  "nextCursor": 1786334429395,
  "source": "redis"
}
```

The frontend can then request:

```text
GET /timeline?cursor=1786334429395
```

Redis uses an exclusive score so the tweet represented by the cursor is not returned again.

This prevents duplicate tweets between pages.

---

# ⚙️ Fan-out Worker

BullMQ is used to process timeline fan-out asynchronously.

When a tweet is created, the API does not synchronously update every follower's timeline.

Instead:

```text
Tweet API
   ↓
BullMQ
   ↓
Fan-out Worker
```

The worker:

1. Finds the tweet author.
2. Checks their follower count.
3. Adds the tweet to the author's own Redis timeline.
4. Finds their followers.
5. Adds the tweet to each follower's Redis timeline.

This prevents tweet creation requests from becoming increasingly slow as the author's follower count increases.

---

# 🌟 Celebrity Optimization

Fan-out-on-write creates another problem.

Imagine a user with millions of followers.

Pushing a tweet into millions of Redis timelines would be extremely expensive.

To address this, the project defines a celebrity threshold:

```text
CELEBRITY_FOLLOWER_THRESHOLD
```

If an author exceeds the threshold:

```text
Tweet
  ↓
PostgreSQL
  ↓
Fan-out worker
  ↓
Author's own Redis timeline
  ↓
Skip pushing to every follower
```

Followers can retrieve celebrity tweets through the PostgreSQL pull fallback.

This creates a hybrid strategy:

```text
Normal users
    → Fan-out-on-write

Celebrity users
    → Fan-out-on-read
```

---

# 🗄️ Database Schema

The PostgreSQL database contains three primary tables.

## Users

```text
users
├── id
├── username
├── display_name
├── password_hash
├── follower_count
└── created_at
```

`follower_count` is a denormalized counter used to avoid repeatedly calculating follower counts.

---

## Tweets

```text
tweets
├── id
├── user_id
├── content
└── created_at
```

Each tweet belongs to a user.

---

## Follows

```text
follows
├── follower_id
├── followee_id
└── created_at
```

The pair:

```text
(follower_id, followee_id)
```

forms the primary key, preventing duplicate follows.

---

# 🔐 Authentication

Authentication uses JWT tokens.

### Signup

```http
POST /auth/signup
```

Creates a user and returns a JWT.

### Login

```http
POST /auth/login
```

Validates credentials and returns a JWT.

Protected requests send:

```http
Authorization: Bearer <token>
```

The authentication middleware extracts the user ID and attaches it to:

```js
req.userId
```

---

# 📡 API Endpoints

## Authentication

### Signup

```http
POST /auth/signup
```

Request:

```json
{
  "username": "john",
  "displayName": "John",
  "password": "password123"
}
```

### Login

```http
POST /auth/login
```

Request:

```json
{
  "username": "john",
  "password": "password123"
}
```

---

## User

### Get Current User

```http
GET /me
```

Requires authentication.

---

## Tweets

### Create Tweet

```http
POST /tweets
```

Request:

```json
{
  "content": "Hello world!"
}
```

### Get User's Tweets

```http
GET /tweets/user/:userId
```

---

## Follows

### Follow User

```http
POST /follows/:userId
```

### Unfollow User

```http
DELETE /follows/:userId
```

---

## Timeline

### Get Timeline

```http
GET /timeline
```

Optional cursor:

```http
GET /timeline?cursor=<timestamp>
```

Response:

```json
{
  "tweets": [],
  "nextCursor": null,
  "source": "redis"
}
```

Possible values for `source`:

```text
redis
pull
```

---

# 🖥️ Frontend

The frontend is built with React.

Major components include:

```text
TimelinePage
├── ComposeBox
├── FollowBox
└── TweetCard
```

The timeline page:

- Fetches timeline pages
- Displays tweets
- Handles cursor pagination
- Provides a Load More button
- Displays the source used to serve the timeline
- Updates immediately after creating a tweet

---

# 📂 Project Structure

```text
twitter/
│
├── backend/
│   │
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── tweetController.js
│   │   │   ├── followController.js
│   │   │   └── timelineController.js
│   │   │
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── tweetRoutes.js
│   │   │   ├── followRoutes.js
│   │   │   └── timelineRoutes.js
│   │   │
│   │   ├── middleware/
│   │   │   └── authMiddleware.js
│   │   │
│   │   ├── services/
│   │   │   └── authService.js
│   │   │
│   │   ├── db/
│   │   │   ├── index.js
│   │   │   └── schema.js
│   │   │
│   │   ├── redis/
│   │   │   └── index.js
│   │   │
│   │   ├── queue/
│   │   │   └── fanoutQueue.js
│   │   │
│   │   ├── workers/
│   │   │   └── fanoutWorker.js
│   │   │
│   │   └── index.js
│   │
│   └── drizzle.config.js
│
└── frontend/
    │
    ├── src/
    │   ├── components/
    │   │   ├── ComposeBox.jsx
    │   │   ├── TweetCard.jsx
    │   │   └── FollowBox.jsx
    │   │
    │   ├── pages/
    │   │   └── TimelinePage.jsx
    │   │
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   │
    │   └── api/
    │       └── client.js
    │
    └── ...
```

---

# 🛠️ Tech Stack

### Frontend

- React
- Vite
- React Router

### Backend

- Node.js
- Express.js
- JWT
- Password hashing

### Database

- PostgreSQL
- Neon
- Drizzle ORM
- Drizzle Kit

### Caching / Timeline

- Redis
- Upstash Redis
- ioredis

### Background Processing

- BullMQ
- Redis

---

# ⚙️ Environment Variables

## Backend

Create a `.env` file inside `backend/`:

```env
PORT=4000
DATABASE_URL=your_neon_database_url
REDIS_URL=your_redis_url
JWT_SECRET=your_jwt_secret
VITE_FRONTEND_URL=http://localhost:5173
```

## Frontend

Create:

```text
frontend/.env
```

with:

```env
VITE_API_URL=http://localhost:4000
```

---

# 🚀 Running the Project

## 1. Clone the repository

```bash
git clone <your-repository-url>
cd twitter
```

## 2. Install backend dependencies

```bash
cd backend
npm install
```

## 3. Configure environment variables

Create:

```text
backend/.env
```

and configure PostgreSQL, Redis, JWT, and frontend URL variables.

## 4. Push the database schema

```bash
npm run db:push
```

## 5. Start the API

```bash
npm run dev
```

The API runs on:

```text
http://localhost:4000
```

## 6. Start the fan-out worker

Run the worker separately:

```bash
npm run worker
```

You should see:

```text
Fan-out worker started, waiting for jobs...
```

## 7. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on:

```text
http://localhost:5173
```

---

# 🧪 Testing the Timeline System

One of the main goals of this project is observing the timeline architecture.

## Test 1 — Redis Fan-out

1. Create two users.
2. Make User B follow User A.
3. Create a tweet as User A.
4. Wait for the BullMQ worker to process the job.
5. Inspect Redis.

You should find:

```text
timeline:<User-B-ID>
```

containing the tweet ID.

---

## Test 2 — Redis Timeline Read

Log in as User B.

Request:

```http
GET /timeline
```

The response should contain:

```json
{
  "source": "redis"
}
```

This demonstrates that the timeline was served using the Redis materialized timeline.

---

## Test 3 — Pagination

Create enough tweets to exceed the timeline page size.

The first request should return:

```text
source: redis
```

and a `nextCursor`.

Click **Load More**.

The next request sends:

```text
?cursor=<timestamp>
```

Redis uses the cursor to retrieve older entries without using offset pagination.

---

## Test 4 — PostgreSQL Fallback

Once the Redis timeline is exhausted, another Load More request should cause:

```text
Redis
 ↓
No entries for cursor
 ↓
PostgreSQL
```

The response should show:

```json
{
  "source": "pull"
}
```

This demonstrates the hybrid timeline architecture.

---

# 📊 Why This Architecture?

A simple pull-based timeline is easy to implement:

```text
Timeline request
      ↓
Query follows
      ↓
Query tweets
      ↓
Sort
```

But the read cost increases as the user's follow graph grows.

The push-based approach moves work from read time to write time:

```text
Tweet creation
      ↓
Fan-out
      ↓
Redis timelines
```

This makes timeline reads significantly cheaper.

However, pure fan-out-on-write has problems with extremely popular accounts.

If a celebrity has millions of followers, one tweet could require millions of Redis writes.

Therefore this project uses a hybrid strategy:

```text
                 Timeline
                    │
       ┌────────────┴────────────┐
       │                         │
 Normal authors             Celebrity authors
       │                         │
 Fan-out-on-write            Pull-on-read
       │                         │
       └────────────┬────────────┘
                    │
                 Redis +
               PostgreSQL
```

This is the core system-design concept explored by the project.

---

# 🔍 Design Decisions

## Why PostgreSQL?

PostgreSQL is the durable source of truth for:

- Users
- Tweets
- Follows
- Tweet content
- Relationships

Redis can be rebuilt from PostgreSQL if necessary.

## Why Redis?

Redis Sorted Sets provide efficient:

- Ordered timeline storage
- Reverse chronological retrieval
- Cursor-based range queries
- Fast reads

## Why BullMQ?

Fan-out can involve many Redis writes.

Doing this synchronously inside the tweet creation request would make the request slower.

BullMQ allows the expensive fan-out operation to happen asynchronously.

## Why Cursor Pagination?

Offset pagination:

```text
LIMIT 20 OFFSET 10000
```

becomes increasingly expensive and can become inconsistent when new tweets are inserted.

Cursor pagination:

```text
createdAt < cursor
```

allows the database/cache to efficiently continue from the previous position.

---

# ⚠️ Current Limitations

This is a learning/system-design project rather than a production Twitter implementation.

Current limitations include:

- Redis timeline rebuild logic is basic
- No advanced retry/dead-letter strategy for fan-out failures
- No distributed worker deployment
- No rate limiting
- No media uploads
- No likes/replies/reposts
- No real-time WebSocket updates
- No sophisticated celebrity detection
- Redis and PostgreSQL consistency is eventually consistent
- No large-scale load testing yet

---

# 🔮 Future Improvements

Possible improvements include:

- Redis timeline rebuilding
- Automatic retry and dead-letter queues
- Multiple BullMQ workers
- Worker concurrency tuning
- Rate limiting
- Tweet deletion propagation
- Like/reply/repost functionality
- Real-time timeline updates using WebSockets
- Load testing with millions of tweets
- Metrics with Prometheus
- Grafana dashboards
- Docker-based deployment
- Horizontal API scaling
- Better celebrity/fan-out thresholds
- Monitoring queue latency and Redis memory usage

---

# 📈 What This Project Demonstrates

This project goes beyond implementing a basic Twitter clone.

The main goal is understanding how a social-media timeline can be designed when the number of users, follows, and tweets becomes large.

Key concepts demonstrated:

```text
Database design
       +
Caching
       +
Redis Sorted Sets
       +
Fan-out-on-write
       +
Fan-out-on-read
       +
Background jobs
       +
BullMQ
       +
Cursor pagination
       +
Hybrid data retrieval
       +
Scalability trade-offs
```

The project demonstrates an important system-design principle:

> **Optimize the common read path while keeping a durable source of truth and a fallback path for data that is no longer present in the fast storage layer.**

---

# 👨‍💻 Author

Built as a system-design-focused social media project to explore scalable timeline architectures, distributed backend concepts, caching, background processing, and database design.