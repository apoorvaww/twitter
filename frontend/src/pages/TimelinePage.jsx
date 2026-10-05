import { useState, useEffect, useCallback } from "react";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import ComposeBox from "../components/ComposeBox.jsx";
import TweetCard from "../components/TweetCard.jsx";
import FollowBox from "../components/FollowBox.jsx";
import { Link } from "react-router-dom";

export default function TimelinePage() {
  const { user, logout } = useAuth();

  const [tweets, setTweets] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [source, setSource] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadPage = useCallback(async (cursor) => {
    setLoading(true);
    setError(null);

    try {
      const data = await api.getTimeline(cursor);

      setTweets((prev) => (cursor ? [...prev, ...data.tweets] : data.tweets));

      setNextCursor(data.nextCursor);
      setSource(data.source);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  return (
    <div className="min-h-screen bg-white text-black dark:bg-black dark:text-white">
      <div className="mx-auto flex max-w-325">
        {/* sidebar */}
        <aside
          className="
            hidden
            md:flex
            w-22
            lg:w-65
            min-h-screen
            flex-col
            border-r
            border-gray-200
            dark:border-gray-800
            px-3
            lg:px-5
            py-4
            sticky
            top-0
            h-screen
          "
        >
          {/* Logo */}
          <div className="flex h-12 items-center px-3 mb-4">
            <span className="text-3xl font-bold">𝕏</span>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            <Link
              to="/"
              className="
                flex
                w-full
                items-center
                justify-center
                lg:justify-start
                gap-4
                rounded-full
                px-3
                py-3
                text-xl
                font-bold
                hover:bg-gray-100
                dark:hover:bg-gray-900
                transition
              "
            >
              <span>⌂</span>

              <span className="hidden lg:inline">Home</span>
            </Link>

            <Link
              to="/profile"
              className="
                flex
                w-full
                items-center
                justify-center
                lg:justify-start
                gap-4
                rounded-full
                px-3
                py-3
                text-xl
                hover:bg-gray-100
                dark:hover:bg-gray-900
                transition
              "
            >
              <span>♙</span>

              <span className="hidden lg:inline">Profile</span>
            </Link>
          </nav>

          {/* User section */}
          <div className="mt-auto">
            <div
              className="
                hidden
                lg:block
                mb-3
                rounded-xl
                px-3
                py-3
                hover:bg-gray-100
                dark:hover:bg-gray-900
              "
            >
              <p className="font-bold">{user.username}</p>

              <p className="text-sm text-gray-500 dark:text-gray-400">
                @{user.username}
              </p>
            </div>

            <button
              onClick={logout}
              className="
                flex
                w-full
                items-center
                justify-center
                lg:justify-start
                gap-4
                rounded-full
                px-3
                py-3
                font-bold
                hover:bg-gray-100
                dark:hover:bg-gray-900
                transition
              "
            >
              <span>↪</span>

              <span className="hidden lg:inline">Log out</span>
            </button>
          </div>
        </aside>

        <main
          className="
            w-full
            md:w-150
            lg:w-162.5
            border-r
            border-gray-200
            dark:border-gray-800
            min-h-screen
          "
        >
          {/* Timeline Header */}
          <header
            className="
              sticky
              top-0
              z-10
              border-b
              border-gray-200
              dark:border-gray-800
              bg-white/80
              dark:bg-black/80
              backdrop-blur-md
            "
          >
            <div className="px-5 py-4">
              <h1 className="text-xl font-bold">Home</h1>
            </div>

            {/* Tabs */}
            <div className="grid grid-cols-2">
              <button
                className="
                  relative
                  py-4
                  text-sm
                  font-bold
                  hover:bg-gray-100
                  dark:hover:bg-gray-900
                "
              >
                For you
                <span
                  className="
                    absolute
                    bottom-0
                    left-1/2
                    h-1
                    w-14
                    -translate-x-1/2
                    rounded-full
                    bg-[#1d9bf0]
                  "
                />
              </button>

              <button
                className="
                  py-4
                  text-sm
                  font-medium
                  text-gray-500
                  hover:bg-gray-100
                  dark:hover:bg-gray-900
                "
              >
                Following
              </button>
            </div>
          </header>

          {/* Compose */}
          <ComposeBox
            onTweetCreated={(tweet) => {
              setTweets((prev) => [tweet, ...prev]);
            }}
          />

          {/* Debug source */}
          {source && (
            <div className="border-b border-gray-200 dark:border-gray-800 px-5 py-2">
              <span
                className="
                  rounded-full
                  bg-gray-100
                  dark:bg-gray-900
                  px-3
                  py-1
                  text-xs
                  text-gray-500
                  dark:text-gray-400
                "
              >
                served via: {source}
              </span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="border-b border-gray-200 dark:border-gray-800 px-5 py-4">
              <p className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-500">
                {error}
              </p>
            </div>
          )}

          {/* Tweets */}
          <ul className="divide-y divide-gray-200 dark:divide-gray-800">
            {tweets.map((tweet) => (
              <li key={tweet.id}>
                <TweetCard tweet={tweet} />
              </li>
            ))}
          </ul>

          {/* Load More */}
          {nextCursor && (
            <div className="flex justify-center py-6">
              <button
                onClick={() => loadPage(nextCursor)}
                disabled={loading}
                className="
                  rounded-full
                  bg-black
                  dark:bg-white
                  px-6
                  py-3
                  text-sm
                  font-bold
                  text-white
                  dark:text-black
                  hover:opacity-90
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                  transition
                "
              >
                {loading ? "Loading..." : "Load more"}
              </button>
            </div>
          )}

          {/* Empty state */}
          {!loading && tweets.length === 0 && (
            <div className="px-6 py-16 text-center">
              <h2 className="text-xl font-bold">Your timeline is empty</h2>

              <p className="mt-2 text-gray-500 dark:text-gray-400">
                Follow someone or post your first tweet.
              </p>
            </div>
          )}

          {/* Loading */}
          {loading && tweets.length === 0 && (
            <div className="py-10 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                Loading your timeline...
              </p>
            </div>
          )}
        </main>

        {/* =========================================
            RIGHT SIDEBAR
        ========================================= */}
        <aside
          className="
            hidden
            lg:block
            w-87.5
            px-6
            py-4
            sticky
            top-0
            h-screen
          "
        >


          {/* Follow Box */}
          <div className="mt-5">
            <FollowBox />
          </div>

          {/* Footer */}
          <div className="mt-8 px-4 text-xs text-gray-500 dark:text-gray-500">
            <p>Terms · Privacy Policy · Cookies</p>

            <p className="mt-2">© 2026 Your Twitter Clone</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
