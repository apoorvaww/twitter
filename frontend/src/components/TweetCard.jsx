import { useState, useEffect } from "react";
import { api } from "../api/client.js";


export default function TweetCard({ tweet }) {
  const [localTweet, setLocalTweet] = useState(tweet);

  // Update local state when tweet prop changes
  useEffect(() => {
    setLocalTweet(tweet);
  }, [tweet]);

  const handleLike = async () => {
    try {
      if (localTweet.liked) {
        await api.unlikeTweet(localTweet.id);
        setLocalTweet({
          ...localTweet,
          liked: false,
          likeCount: Math.max(0, (localTweet.likeCount || 0) - 1),
        });
      } else {
        await api.likeTweet(localTweet.id);
        setLocalTweet({
          ...localTweet,
          liked: true,
          likeCount: (localTweet.likeCount || 0) + 1,
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRetweet = async () => {
    try {
      if (localTweet.retweeted) {
        await api.unretweet(localTweet.id);
        setLocalTweet({
          ...localTweet,
          retweeted: false,
          retweetCount: Math.max(0, (localTweet.retweetCount || 0) - 1),
        });
      } else {
        await api.retweet(localTweet.id);
        setLocalTweet({
          ...localTweet,
          retweeted: true,
          retweetCount: (localTweet.retweetCount || 0) + 1,
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReply = async () => {
    const content = window.prompt("Reply to tweet:");
    if (!content) return;

    try {
      await api.addComment(localTweet.id, content);
      setLocalTweet({
        ...localTweet,
        commentCount: (localTweet.commentCount || 0) + 1,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleBookmark = async () => {
    try {
      if (localTweet.bookmarked) {
        await api.removeBookmark(localTweet.id);
      } else {
        await api.addBookmark(localTweet.id);
      }
      setLocalTweet({
        ...localTweet,
        bookmarked: !localTweet.bookmarked,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const formattedDate = new Date(localTweet.createdAt).toLocaleString();

  return (
    <li className="border-b border-gray-200 dark:border-gray-800 px-4 py-4 transition hover:bg-gray-50 dark:hover:bg-gray-950">
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="shrink-0">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-800 text-lg font-bold text-gray-600 dark:text-gray-300">
            {localTweet.displayName?.charAt(0)?.toUpperCase() || "?"}
          </div>
        </div>

        {/* Tweet body */}
        <div className="min-w-0 flex-1">
          {/* Header */}
          <div className="flex items-center gap-1 text-[15px]">
            <strong className="truncate font-bold text-black dark:text-white">
              {localTweet.displayName}
            </strong>
            <span className="truncate text-gray-500 dark:text-gray-500">@{localTweet.username}</span>
            <span className="text-gray-500 dark:text-gray-500">·</span>
            <span className="shrink-0 text-gray-500 dark:text-gray-500" title={formattedDate}>
              {formatTimestamp(localTweet.createdAt)}
            </span>
            {/* More button */}
            <button type="button" className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-500 hover:bg-blue-500/10 hover:text-[#1d9bf0]" aria-label="More">
              …
            </button>
          </div>

          {/* Tweet content */}
          <p className="mt-1 whitespace-pre-wrap wrap-break-word text-[15px] leading-5 text-black dark:text-white">
            {localTweet.content}
          </p>

          {/* Actions */}
          <div className="mt-3 flex max-w-106.25 items-center justify-between text-gray-500 dark:text-gray-500">
            {/* Reply */}
            <button type="button" className="group flex items-center gap-1 text-sm" aria-label="Reply" onClick={handleReply}>
              <span className="flex h-8 w-8 items-center justify-center rounded-full group-hover:bg-blue-500/10 group-hover:text-[#1d9bf0]">💬</span>
              <span className="hidden sm:inline">Reply</span>
              {localTweet.commentCount > 0 && (
                <span className="ml-1 text-xs">{localTweet.commentCount}</span>
              )}
            </button>

            {/* Repost */}
            <button type="button" className="group flex items-center gap-1 text-sm" aria-label="Repost" onClick={handleRetweet}>
              <span className="flex h-8 w-8 items-center justify-center rounded-full group-hover:bg-green-500/10 group-hover:text-green-500">🔁</span>
              <span className="hidden sm:inline">Repost</span>
              {localTweet.retweetCount > 0 && (
                <span className="ml-1 text-xs">{localTweet.retweetCount}</span>
              )}
            </button>

            {/* Like */}
            <button type="button" className="group flex items-center gap-1 text-sm" aria-label="Like" onClick={handleLike}>
              <span className="flex h-8 w-8 items-center justify-center rounded-full group-hover:bg-pink-500/10 group-hover:text-pink-500">
                {localTweet.liked ? "❤️" : "♡"}
              </span>
              <span className="hidden sm:inline">Like</span>
              {localTweet.likeCount > 0 && (
                <span className="ml-1 text-xs">{localTweet.likeCount}</span>
              )}
            </button>

            {/* Bookmark */}
            <button type="button" className="group flex items-center gap-1 text-sm" aria-label="Bookmark" onClick={handleBookmark}>
              <span className="flex h-8 w-8 items-center justify-center rounded-full group-hover:bg-yellow-500/10 group-hover:text-yellow-500">
                {localTweet.bookmarked ? "🔖" : "🔖"}
              </span>
              <span className="hidden sm:inline">Bookmark</span>
            </button>

            {/* Share */}
            <button type="button" className="group flex items-center gap-1 text-sm" aria-label="Share">
              <span className="flex h-8 w-8 items-center justify-center rounded-full group-hover:bg-blue-5..." >↗</span>
              <span className="hidden sm:inline">Share</span>
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}

/* -----------------------------------------
   Timestamp helper
----------------------------------------- */

function formatTimestamp(dateString) {
  const date = new Date(dateString);
  const now = new Date();

  const diff = Math.floor((now - date) / 1000);

  if (diff < 60) {
    return `${diff}s`;
  }

  if (diff < 60 * 60) {
    return `${Math.floor(diff / 60)}m`;
  }

  if (diff < 60 * 60 * 24) {
    return `${Math.floor(diff / (60 * 60))}h`;
  }

  if (diff < 60 * 60 * 24 * 7) {
    return `${Math.floor(diff / (60 * 60 * 24))}d`;
  }

  return date.toLocaleDateString();
}
