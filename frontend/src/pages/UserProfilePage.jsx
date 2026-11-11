import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api/client.js";
import TweetCard from "../components/TweetCard.jsx";
import Sidebar from "../components/Sidebar.jsx";
import FollowBox from "../components/FollowBox.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function UserProfilePage() {
  const { username: routeUsername } = useParams();
  const { user } = useAuth();
  const username = routeUsername || user?.username;
  const [profile, setProfile] = useState(null);
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("tweets"); // tweets, retweets, replies, likes

  useEffect(() => {
    const fetchData = async () => {
      if (!username) {
        setError("No username found");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const profileData = await api.getUserProfile(username);
        const userObj = profileData.user;
        setProfile(userObj);
        await loadTabData("tweets", userObj.id);
      } catch (err) {
        console.error("PROFILE ERROR:", err);
        setError(err.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [username]);

  const loadTabData = async (selectedTab, profileId = profile?.id) => {
    setLoading(true);
    try {
      let data;
      const userId = profileId;
      switch (selectedTab) {
        case "tweets":
          data = await api.getUserTweets(userId);
          break;
        case "retweets":
          data = await api.getUserRetweets(userId);
          break;
        case "replies":
          data = await api.getUserReplies(userId);
          break;
        case "likes":
          data = await api.getUserLikes(userId);
          break;
        default:
          data = [];
      }
      setTweets(data.tweets || data.replies || data || []);
      setTab(selectedTab);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFollow = async () => {
    if (!profile) return;
    try {
      if (profile.isFollowing) {
        await api.unfollow(profile.id);
        setProfile((p) => ({
          ...p,
          isFollowing: false,
          followerCount: Math.max(0, (p.followerCount || 0) - 1),
        }));
      } else {
        await api.follow(profile.id);
        setProfile((p) => ({
          ...p,
          isFollowing: true,
          followerCount: (p.followerCount || 0) + 1,
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
      <div className="mx-auto max-w-[1300px] flex">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Main profile area */}
        <main className="w-full md:w-[600px] lg:w-[650px] border-r border-gray-200 dark:border-gray-800 min-h-screen">
          {/* Header */}
          <header className="sticky top-0 z-10 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-black/80 backdrop-blur-md px-4 py-2 flex items-center gap-6">
            <Link
              to="/"
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
              <p className="text-xs text-gray-500">
                {profile?.tweetCount ?? 0} posts
              </p>
            </div>
          </header>

          {loading && !profile ? (
            <div className="px-5 py-8 text-center text-gray-500">Loading profile...</div>
          ) : error ? (
            <div className="px-5 py-8 text-center text-red-500">{error}</div>
          ) : (
            <>
              {/* Profile Banner */}
              <div className="h-44 bg-gray-200 dark:bg-gray-800 w-full" />

              {/* Profile Details Container */}
              <div className="px-5 pb-4">
                {/* Avatar & Action Button Row */}
                <div className="flex justify-between items-end -mt-16 mb-4">
                  <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-white dark:border-black bg-[#1d9bf0] text-4xl font-bold text-white shadow-sm">
                    {profile?.displayName?.charAt(0)?.toUpperCase() ||
                      profile?.username?.charAt(0)?.toUpperCase()}
                  </div>

                  <div>
                    {profile?.isSelf ? (
                      <Link
                        to="/profile/edit"
                        className="rounded-full border border-gray-300 dark:border-gray-600 px-5 py-2 text-sm font-bold transition hover:bg-gray-100 dark:hover:bg-gray-900"
                      >
                        Edit profile
                      </Link>
                    ) : (
                      <button
                        onClick={handleToggleFollow}
                        className={`rounded-full px-5 py-2 text-sm font-bold transition ${
                          profile?.isFollowing
                            ? "border border-gray-300 dark:border-gray-600 hover:border-red-500 hover:text-red-500 hover:bg-red-500/10"
                            : "bg-black text-white dark:bg-white dark:text-black hover:opacity-90"
                        }`}
                      >
                        {profile?.isFollowing ? "Following" : "Follow"}
                      </button>
                    )}
                  </div>
                </div>

                {/* Name & Handle */}
                <div>
                  <h2 className="text-xl font-bold leading-tight">
                    {profile?.displayName}
                  </h2>
                  <p className="text-sm text-gray-500">@{profile?.username}</p>
                </div>

                {profile?.bio && (
                  <p className="mt-3 text-[15px] whitespace-pre-wrap">{profile.bio}</p>
                )}

                {/* Join Date */}
                <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="w-4 h-4 fill-current">
                    <g>
                      <path d="M7 4V3h2v1h6V3h2v1h1.5C19.89 4 21 5.12 21 6.5v12c0 1.38-1.11 2.5-2.5 2.5h-13C4.12 21 3 19.88 3 18.5v-12C3 5.12 4.12 4 5.5 4H7zm0 2H5.5c-.27 0-.5.22-.5.5v1.5h14V6.5c0-.28-.23-.5-.5-.5H17v1h-2V6H9v1H7V6zm11 5H6v7.5c0 .28.22.5.5.5h11c.27 0 .5-.22.5-.5V11z" />
                    </g>
                  </svg>
                  <span>
                    Joined{" "}
                    {profile?.createdAt
                      ? new Date(profile.createdAt).toLocaleDateString(undefined, {
                          month: "long",
                          year: "numeric",
                        })
                      : "recently"}
                  </span>
                </div>

                {/* Follower / Following links */}
                <div className="mt-3 flex gap-4 text-sm">
                  <Link
                    to={`/profile/${profile?.username}/following`}
                    className="hover:underline"
                  >
                    <span className="font-bold text-black dark:text-white">
                      {profile?.followingCount ?? 0}
                    </span>{" "}
                    <span className="text-gray-500">Following</span>
                  </Link>

                  <Link
                    to={`/profile/${profile?.username}/followers`}
                    className="hover:underline"
                  >
                    <span className="font-bold text-black dark:text-white">
                      {profile?.followerCount ?? 0}
                    </span>{" "}
                    <span className="text-gray-500">Followers</span>
                  </Link>
                </div>
              </div>

              {/* Subsections: Tweets, Retweets, Replies, Likes */}
              <nav className="flex border-b border-gray-200 dark:border-gray-800">
                {[
                  { key: "tweets", label: "Posts" },
                  { key: "retweets", label: "Reposts" },
                  { key: "replies", label: "Replies" },
                  { key: "likes", label: "Likes" },
                ].map((t) => (
                  <button
                    key={t.key}
                    onClick={() => loadTabData(t.key)}
                    className={`flex-1 py-3 text-center text-sm font-bold transition hover:bg-gray-100 dark:hover:bg-gray-900 ${
                      tab === t.key
                        ? "border-b-2 border-[#1d9bf0] text-black dark:text-white"
                        : "text-gray-500"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </nav>

              {/* Tweet list */}
              {loading ? (
                <div className="p-8 text-center text-gray-500">Loading...</div>
              ) : tweets.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  No {tab} yet.
                </div>
              ) : (
                <ul className="divide-y divide-gray-200 dark:divide-gray-800">
                  {tweets.map((item) => {
                    // Normalize tweet structure if reply
                    const tweetObj = item.parentTweet || item;
                    return (
                      <li key={item.id || item.commentId}>
                        {item.retweetedBy && (
                          <div className="flex items-center gap-2 px-8 pt-2 text-xs font-semibold text-gray-500">
                            <span>🔁</span>
                            <span>{item.retweetedBy} reposted</span>
                          </div>
                        )}
                        {item.author && (
                          <div className="px-8 pt-2 text-xs text-gray-500">
                            Replied: "{item.content}"
                          </div>
                        )}
                        <TweetCard tweet={tweetObj} />
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}
        </main>

        {/* Right sidebar */}
        <aside className="hidden lg:block w-[350px] px-6 py-4 sticky top-0 h-screen">
          <FollowBox />
        </aside>
      </div>
    </div>
  );
}
