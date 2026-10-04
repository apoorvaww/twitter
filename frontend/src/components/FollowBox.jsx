import { useState, useEffect } from "react";
import { api } from "../api/client.js";

export default function FollowBox() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const fetch = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.searchUsers(query);
        setResults(data.users || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    const timeout = setTimeout(fetch, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  const handleFollow = async (userId) => {
    setError(null);
    setStatus(null);
    try {
      await api.follow(userId);
      setStatus(`Now following ${userId}`);
      // update result list to reflect follow state if needed
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUnfollow = async (userId) => {
    setError(null);
    setStatus(null);
    try {
      await api.unfollow(userId);
      setStatus(`Unfollowed ${userId}`);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section className="overflow-hidden rounded-2xl bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="px-5 py-4">
        <h2 className="text-xl font-bold">Who to follow</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Search users by name or username
        </p>
      </div>

      {/* Search input */}
      <div className="px-5 pb-2">
        <input
          type="text"
          placeholder="Search users..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-11 w-full rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-black px-4 text-sm text-black dark:text-white placeholder-gray-500 outline-none focus:border-[#1d9bf0] focus:ring-1 focus:ring-[#1d9bf0]"
        />
      </div>

      {/* Results list */}
      <ul className="divide-y divide-gray-200 dark:divide-gray-800 px-5">
        {loading && (
          <li className="py-2 text-sm text-gray-500 dark:text-gray-400">Loading...</li>
        )}
        {results.map((user) => (
          <li key={user.id} className="flex items-center justify-between py-2">
            <div>
              <span className="font-medium">{user.displayName}</span>{" "}
              <span className="text-gray-500 dark:text-gray-400">@{user.username}</span>
            </div>
            <button
              onClick={() => (user.isFollowing ? handleUnfollow(user.id) : handleFollow(user.id))}
              className="rounded-full bg-black px-4 py-1 text-sm font-bold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black"
            >
              {user.isFollowing ? "Unfollow" : "Follow"}
            </button>
          </li>
        ))}
        {error && (
          <li className="py-2 text-sm text-red-500">{error}</li>
        )}
        {status && (
          <li className="py-2 text-sm text-green-600">{status}</li>
        )}
      </ul>
    </section>
  );
}
