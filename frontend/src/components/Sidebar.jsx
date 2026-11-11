import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Sidebar({ unreadCount = 0 }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    {
      name: "Home",
      path: "/",
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="w-7 h-7 fill-current">
          <g>
            <path d="M12 1.696L.622 8.807l1.06 1.696L3 9.679V20a2 2 0 0 0 2 2h4.5a.5.5 0 0 0 .5-.5V15a1.5 1.5 0 0 1 1.5-1.5h1a1.5 1.5 0 0 1 1.5 1.5v6.5a.5.5 0 0 0 .5.5H19a2 2 0 0 0 2-2V9.679l1.318.824 1.06-1.696L12 1.696zM19 20h-3v-5a3.5 3.5 0 0 0-3.5-3.5h-1A3.5 3.5 0 0 0 8 15v5H5V8.428l7-4.375 7 4.375V20z" />
          </g>
        </svg>
      ),
    },
    {
      name: "Notifications",
      path: "/notifications",
      badge: unreadCount,
      icon: (
        <div className="relative">
          <svg viewBox="0 0 24 24" aria-hidden="true" className="w-7 h-7 fill-current">
            <g>
              <path d="M21.697 16.468c-.457-.678-1.396-1.488-1.396-4.468V8.5C20.301 3.81 16.582 0 12 0S3.699 3.81 3.699 8.5v3.5c0 2.98-.939 3.79-1.396 4.468C1.868 17.114 2.27 18 3.067 18H8.5c.27 2.222 2.16 4 4.5 4s4.23-1.778 4.5-4h5.433c.797 0 1.199-.886.764-1.532zM12 20c-1.302 0-2.402-.839-2.816-2h5.632c-.414 1.161-1.514 2-2.816 2zm-8.232-4c.499-.982 1.232-2.325 1.232-4.5V8.5C5 4.916 8.14 2 12 2s7 2.916 7 6.5v3.5c0 2.175.733 3.518 1.232 4.5H3.768z" />
            </g>
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#1d9bf0] px-1 text-[11px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>
      ),
    },
    {
      name: "Profile",
      path: "/profile",
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="w-7 h-7 fill-current">
          <g>
            <path d="M12 11.816A5.413 5.413 0 0 1 6.59 6.406 5.413 5.413 0 0 1 12 1a5.413 5.413 0 0 1 5.41 5.406A5.413 5.413 0 0 1 12 11.816zm0-8.816a3.413 3.413 0 0 0-3.41 3.406A3.413 3.413 0 0 0 12 9.816a3.413 3.413 0 0 0 3.41-3.41A3.413 3.413 0 0 0 12 3zm9.64 19a1 1 0 0 1-.99-1.127 7.989 7.989 0 0 0-7.79-6.873h-1.72a7.99 7.99 0 0 0-7.79 6.873 1 1 0 0 1-1.98-.246A9.99 9.99 0 0 1 9.14 12h1.72a9.99 9.99 0 0 1 9.77 8.627 1 1 0 0 1-.99 1.373z" />
          </g>
        </svg>
      ),
    },
  ];

  return (
    <aside className="hidden md:flex w-[88px] lg:w-[260px] min-h-screen flex-col border-r border-gray-200 dark:border-gray-800 px-3 lg:px-5 py-4 sticky top-0 h-screen">
      {/* Twitter / X Logo */}
      <div className="flex h-12 w-12 items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition mb-2">
        <Link to="/" aria-label="X">
          <svg viewBox="0 0 24 24" aria-hidden="true" className="w-7 h-7 fill-current text-black dark:text-white">
            <g>
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </g>
          </svg>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex w-full items-center justify-center lg:justify-start gap-4 rounded-full px-4 py-3 text-xl transition hover:bg-gray-100 dark:hover:bg-gray-900 ${
                isActive ? "font-bold text-black dark:text-white" : "text-gray-700 dark:text-gray-300"
              }`}
            >
              <span>{item.icon}</span>
              <span className="hidden lg:inline">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Section at Bottom */}
      <div className="mt-auto">
        <div className="hidden lg:flex items-center justify-between mb-3 rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-900 transition cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1d9bf0] text-white font-bold">
              {user?.displayName?.charAt(0)?.toUpperCase() || user?.username?.charAt(0)?.toUpperCase() || "?"}
            </div>
            <div className="leading-tight overflow-hidden">
              <p className="font-bold text-sm truncate">{user?.displayName || user?.username}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">@{user?.username}</p>
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex w-full items-center justify-center lg:justify-start gap-4 rounded-full px-4 py-3 font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900 transition"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="w-6 h-6 fill-current">
            <g>
              <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H18a2.5 2.5 0 0 1 2.5 2.5v15a2.5 2.5 0 0 1-2.5 2.5H6.5A2.5 2.5 0 0 1 4 19.5v-15zM6.5 4a.5.5 0 0 0-.5.5v15a.5.5 0 0 0 .5.5H18a.5.5 0 0 0 .5-.5v-15a.5.5 0 0 0-.5-.5H6.5z" />
              <path d="M12 11h6v2h-6zM10.854 8.146l3.5 3.5a.5.5 0 0 1 0 .708l-3.5 3.5-.708-.708L13.293 12 10.146 8.854l.708-.708z" />
            </g>
          </svg>
          <span className="hidden lg:inline text-sm">Log out</span>
        </button>
      </div>
    </aside>
  );
}
