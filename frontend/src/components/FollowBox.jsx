import { useState } from "react";
import { api } from "../api/client.js";

export default function FollowBox() {
  const [userId, setUserId] = useState("");
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleFollow() {
    const id = userId.trim();

    if (!id) return;

    setError(null);
    setStatus(null);
    setLoading(true);

    try {
      await api.follow(id);
      setStatus(`Now following ${id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleUnfollow() {
    const id = userId.trim();

    if (!id) return;

    setError(null);
    setStatus(null);
    setLoading(true);

    try {
      await api.unfollow(id);
      setStatus(`Unfollowed ${id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      className="
        overflow-hidden
        rounded-2xl
        bg-gray-50
        dark:bg-gray-900
      "
    >
      {/* Header */}
      <div className="px-5 py-4">
        <h2 className="text-xl font-bold">Who to follow</h2>

        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Connect with other people
        </p>
      </div>

      {/* Follow form */}
      <div className="px-5 pb-5">
        <input
          type="text"
          placeholder="Enter user ID"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="
            h-11
            w-full
            rounded-full
            border
            border-gray-300
            dark:border-gray-700
            bg-white
            dark:bg-black
            px-4
            text-sm
            text-black
            dark:text-white
            placeholder-gray-500
            outline-none
            focus:border-[#1d9bf0]
            focus:ring-1
            focus:ring-[#1d9bf0]
          "
        />

        {/* Buttons */}
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={handleFollow}
            disabled={loading || !userId.trim()}
            className="
              flex-1
              rounded-full
              bg-black
              px-4
              py-2
              text-sm
              font-bold
              text-white
              hover:opacity-90
              disabled:cursor-not-allowed
              disabled:opacity-50
              dark:bg-white
              dark:text-black
            "
          >
            {loading ? "..." : "Follow"}
          </button>

          <button
            type="button"
            onClick={handleUnfollow}
            disabled={loading || !userId.trim()}
            className="
              flex-1
              rounded-full
              border
              border-gray-300
              dark:border-gray-700
              bg-transparent
              px-4
              py-2
              text-sm
              font-bold
              text-black
              dark:text-white
              hover:bg-gray-200
              dark:hover:bg-gray-800
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            Unfollow
          </button>
        </div>

        {/* Status */}
        {status && (
          <div
            className="
              mt-3
              rounded-lg
              bg-green-500/10
              px-3
              py-2
              text-sm
              text-green-600
              dark:text-green-400
            "
          >
            {status}
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            className="
              mt-3
              rounded-lg
              bg-red-500/10
              px-3
              py-2
              text-sm
              text-red-500
            "
          >
            {error}
          </div>
        )}
      </div>
    </section>
  );
}
