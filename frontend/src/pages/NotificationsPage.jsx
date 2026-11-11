import { useState, useEffect } from "react";
import { api } from "../api/client.js";
import Sidebar from "../components/Sidebar.jsx";
import FollowBox from "../components/FollowBox.jsx";
import { Link } from "react-router-dom";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // 'all' or 'unread'

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await api.getNotifications();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error("Error loading notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const handleItemClick = async (notif) => {
    if (!notif.read) {
      try {
        await api.markNotificationRead(notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const filteredList =
    filter === "unread" ? notifications.filter((n) => !n.read) : notifications;

  const renderIcon = (type) => {
    switch (type) {
      case "like":
        return <span className="text-pink-500 text-2xl">❤️</span>;
      case "retweet":
        return <span className="text-green-500 text-2xl">🔁</span>;
      case "comment":
        return <span className="text-[#1d9bf0] text-2xl">💬</span>;
      case "follow":
      default:
        return <span className="text-[#1d9bf0] text-2xl">👤</span>;
    }
  };

  const renderMessage = (notif) => {
    switch (notif.type) {
      case "like":
        return "liked your tweet";
      case "retweet":
        return "reposted your tweet";
      case "comment":
        return "replied to your tweet";
      case "follow":
      default:
        return "followed you";
    }
  };

  return (
    <div className="min-h-screen bg-white text-black dark:bg-black dark:text-white">
      <div className="mx-auto flex max-w-[1300px]">
        {/* Left Sidebar */}
        <Sidebar unreadCount={unreadCount} />

        {/* Main Feed */}
        <main className="w-full md:w-[600px] lg:w-[650px] border-r border-gray-200 dark:border-gray-800 min-h-screen">
          {/* Header */}
          <header className="sticky top-0 z-10 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-black/80 backdrop-blur-md px-4 py-3 flex items-center justify-between">
            <h1 className="text-xl font-bold">Notifications</h1>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-sm font-semibold text-[#1d9bf0] hover:underline"
              >
                Mark all as read
              </button>
            )}
          </header>

          {/* Filter Tabs */}
          <div className="grid grid-cols-2 border-b border-gray-200 dark:border-gray-800">
            <button
              onClick={() => setFilter("all")}
              className={`py-3 text-sm font-bold transition hover:bg-gray-100 dark:hover:bg-gray-900 ${
                filter === "all" ? "border-b-2 border-[#1d9bf0] text-black dark:text-white" : "text-gray-500"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`py-3 text-sm font-bold transition hover:bg-gray-100 dark:hover:bg-gray-900 ${
                filter === "unread" ? "border-b-2 border-[#1d9bf0] text-black dark:text-white" : "text-gray-500"
              }`}
            >
              Unread {unreadCount > 0 && `(${unreadCount})`}
            </button>
          </div>

          {/* Notifications List */}
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading notifications...</div>
          ) : filteredList.length === 0 ? (
            <div className="p-12 text-center">
              <h2 className="text-lg font-bold">No notifications yet</h2>
              <p className="mt-1 text-sm text-gray-500">
                {filter === "unread"
                  ? "You have caught up with all notifications."
                  : "From likes to reposts and new followers, that’s where the action will happen."}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-800">
              {filteredList.map((notif) => (
                <li
                  key={notif.id}
                  onClick={() => handleItemClick(notif)}
                  className={`flex gap-4 p-4 transition cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-950 ${
                    !notif.read ? "bg-blue-50/40 dark:bg-blue-950/20" : ""
                  }`}
                >
                  <div className="shrink-0 pt-1">{renderIcon(notif.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/profile/${notif.actor.username}`}
                        className="font-bold hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {notif.actor.displayName || notif.actor.username}
                      </Link>
                      <span className="text-sm text-gray-500">
                        @{notif.actor.username}
                      </span>
                      <span className="text-sm text-gray-400">
                        {renderMessage(notif)}
                      </span>
                    </div>

                    {notif.tweetContent && (
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        "{notif.tweetContent}"
                      </p>
                    )}

                    <span className="mt-2 block text-xs text-gray-400">
                      {new Date(notif.createdAt).toLocaleDateString()} ·{" "}
                      {new Date(notif.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  {!notif.read && (
                    <span className="h-2.5 w-2.5 rounded-full bg-[#1d9bf0] self-center shrink-0" />
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
