import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/client.js";
import TweetCard from "../components/TweetCard.jsx";
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
        console.log("Fetching profile for:", username);

        const profileData = await api.getUserProfile(username);

        console.log("Profile response:", profileData);

        // API returns { user: {...} }
        const profile = profileData.user;

        setProfile(profile);

        // Use the actual user's ID
        await loadTabData("tweets", profile.id);
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
      setTweets(data.tweets || data);
      setTab(selectedTab);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="px-5 py-4">Loading profile...</div>;
  }

  if (error) {
    return (
      <div className="px-5 py-4 text-red-500">
        Failed to load profile: {error}
      </div>
    );
  }

  if (!profile) {
    return <div className="px-5 py-4">Profile not found.</div>;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
      <div className="mx-auto max-w-[1300px] flex">
        {/* Left sidebar – reuse existing navigation */}
        <aside className="hidden md:flex w-[88px] lg:w-[260px] min-h-screen flex-col border-r border-gray-200 dark:border-gray-800 px-3 lg:px-5 py-4 sticky top-0 h-screen">
          {/* Logo and navigation omitted for brevity – could import a component */}
        </aside>

        {/* Main profile area */}
        <main className="w-full md:w-[600px] lg:w-[650px] border-r border-gray-200 dark:border-gray-800 min-h-screen">
          {/* Header with banner and follow button */}
          <section className="bg-gray-100 dark:bg-gray-900 p-6">
            <h1 className="text-2xl font-bold">{profile.displayName}</h1>
            <p className="text-gray-600 dark:text-gray-400">
              @{profile.username}
            </p>
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => {
                  if (profile.isFollowing) {
                    api
                      .unfollow(profile.id)
                      .then(() =>
                        setProfile({ ...profile, isFollowing: false }),
                      );
                  } else {
                    api
                      .follow(profile.id)
                      .then(() =>
                        setProfile({ ...profile, isFollowing: true }),
                      );
                  }
                }}
                className="rounded-full bg-black px-4 py-2 text-sm font-bold text-white hover:opacity-90 dark:bg-white dark:text-black"
              >
                {profile.isFollowing ? "Unfollow" : "Follow"}
              </button>
            </div>
            {/* Edit Profile button for own profile */}
            {user && user.username === profile.username && (
              <button
                onClick={() => (window.location.href = "/profile/edit")}
                className="ml-4 rounded bg-gray-200 px-3 py-1 hover:bg-gray-300"
              >
                Edit Profile
              </button>
            )}
          </section>

          {/* Tab navigation */}
          <nav className="flex border-b border-gray-200 dark:border-gray-800">
            {"tweets retweets replies likes".split(" ").map((t) => (
              <button
                key={t}
                onClick={() => loadTabData(t)}
                className={`px-4 py-2 ${tab === t ? "border-b-2 border-[#1d9bf0] font-bold" : "text-gray-500"}`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </nav>

          {/* Tweet list */}
          {loading ? (
            <div className="p-5 text-gray-500">Loading...</div>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-800">
              {tweets.map((tweet) => (
                <li key={tweet.id}>
                  <TweetCard tweet={tweet} />
                </li>
              ))}
            </ul>
          )}
        </main>

        {/* Right sidebar – keep existing FollowBox or other widgets */}
        <aside className="hidden lg:block w-[350px] px-6 py-4 sticky top-0 h-screen">
          {/* Reuse FollowBox component */}
          <div className="mt-5">
            {/* Insert FollowBox here */}
            {/* It will be rendered via import in TimelinePage – can also import directly */}
          </div>
        </aside>
      </div>
    </div>
  );
}
