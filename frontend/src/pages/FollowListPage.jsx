import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api/client.js";
import Sidebar from "../components/Sidebar.jsx";
import FollowBox from "../components/FollowBox.jsx";

export default function FollowListPage({ type = "followers" }) {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const activeTab = type; // 'followers' or 'following'

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const profileData = await api.getUserProfile(username);
        const userObj = profileData.user;
        setProfile(userObj);

        let res;
        if (activeTab === "followers") {
          res = await api.getFollowers(userObj.id);
        } else {
          res = await api.getFollowing(userObj.id);
        }
        setUsersList(res.users || []);
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load list");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [username, activeTab]);

  const handleToggleFollow = async (targetUser) => {
    try {
      if (targetUser.isFollowing) {
        await api.unfollow(targetUser.id);
        setUsersList((prev) =>
          prev.map((u) => (u.id === targetUser.id ? { ...u, isFollowing: false } : u))
        );
      } else {
        await api.follow(targetUser.id);
        setUsersList((prev) =>
          prev.map((u) => (u.id === targetUser.id ? { ...u, isFollowing: true } : u))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black dark:bg-black dark:text-white">
      <div className="mx-auto flex max-w-[1300px]">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <main className="w-full md:w-[600px] lg:w-[650px] border-r border-gray-200 dark:border-gray-800 min-h-screen">
          {/* Header */}
          <header className="sticky top-0 z-10 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-black/80 backdrop-blur-md px-4 py-2 flex items-center gap-6">
            <Link
              to={`/profile/${username}`}
              className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="w-5 h-5 fill-current">
                <g>
                  <path d="M7.414 13l5.043 5.04-1.414 1.42L3.586 12l7.457-7.46 1.414 1.42L7.414 11H21v2H7.414z" />
                </g>
              </svg>
            </Link>
            <div>
              <h1 className="text-xl font-bold leading-tight">
                {profile?.displayName || username}
              </h1>
              <p className="text-xs text-gray-500">@{username}</p>
            </div>
          </header>

          {/* Subsections: Followers vs Following */}
          <div className="grid grid-cols-2 border-b border-gray-200 dark:border-gray-800">
            <Link
              to={`/profile/${username}/followers`}
              className={`py-3 text-center text-sm font-bold transition hover:bg-gray-100 dark:hover:bg-gray-900 ${
                activeTab === "followers"
                  ? "border-b-2 border-[#1d9bf0] text-black dark:text-white"
                  : "text-gray-500"
              }`}
            >
              Followers
            </Link>
            <Link
              to={`/profile/${username}/following`}
              className={`py-3 text-center text-sm font-bold transition hover:bg-gray-100 dark:hover:bg-gray-900 ${
                activeTab === "following"
                  ? "border-b-2 border-[#1d9bf0] text-black dark:text-white"
                  : "text-gray-500"
              }`}
            >
              Following
            </Link>
          </div>

          {/* User List */}
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : error ? (
            <div className="p-8 text-center text-red-500">{error}</div>
          ) : usersList.length === 0 ? (
            <div className="p-12 text-center">
              <h2 className="text-lg font-bold">
                {activeTab === "followers"
                  ? "Looking for followers?"
                  : "Not following anyone yet"}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {activeTab === "followers"
                  ? "When someone follows this account, they'll show up here."
                  : "When this account follows someone, they'll show up here."}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-800">
              {usersList.map((targetUser) => (
                <li
                  key={targetUser.id}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-950 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-800 font-bold text-gray-700 dark:text-gray-300">
                      {targetUser.displayName?.charAt(0)?.toUpperCase() ||
                        targetUser.username?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <Link
                        to={`/profile/${targetUser.username}`}
                        className="font-bold hover:underline truncate block"
                      >
                        {targetUser.displayName || targetUser.username}
                      </Link>
                      <p className="text-sm text-gray-500 truncate">
                        @{targetUser.username}
                      </p>
                      {targetUser.bio && (
                        <p className="mt-1 text-sm text-gray-700 dark:text-gray-300 line-clamp-1">
                          {targetUser.bio}
                        </p>
                      )}
                    </div>
                  </div>

                  {!targetUser.isSelf && (
                    <button
                      onClick={() => handleToggleFollow(targetUser)}
                      className={`ml-4 rounded-full px-4 py-1.5 text-sm font-bold transition shrink-0 ${
                        targetUser.isFollowing
                          ? "border border-gray-300 dark:border-gray-600 hover:border-red-500 hover:text-red-500 hover:bg-red-500/10"
                          : "bg-black text-white dark:bg-white dark:text-black hover:opacity-90"
                      }`}
                    >
                      {targetUser.isFollowing ? "Following" : "Follow"}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </main>

        {/* Right Sidebar */}
        <aside className="hidden lg:block w-[350px] px-6 py-4 sticky top-0 h-screen">
          <FollowBox />
        </aside>
      </div>
    </div>
  );
}
