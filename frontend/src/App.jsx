import { Routes, Route, Navigate } from "react-router-dom";
import EditProfilePage from "./pages/EditProfilePage.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import SignupPage from "./pages/SignupPage.jsx";
import TimelinePage from "./pages/TimelinePage.jsx";
import UserProfilePage from "./pages/UserProfilePage.jsx";
import NotificationsPage from "./pages/NotificationsPage.jsx";
import FollowListPage from "./pages/FollowListPage.jsx";

function RequireAuth({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <TimelinePage />
          </RequireAuth>
        }
      />
      <Route
        path="/notifications"
        element={
          <RequireAuth>
            <NotificationsPage />
          </RequireAuth>
        }
      />
      <Route
        path="/profile"
        element={
          <RequireAuth>
            <UserProfilePage />
          </RequireAuth>
        }
      />
      <Route
        path="/profile/:username"
        element={
          <RequireAuth>
            <UserProfilePage />
          </RequireAuth>
        }
      />
      <Route
        path="/profile/:username/followers"
        element={
          <RequireAuth>
            <FollowListPage type="followers" />
          </RequireAuth>
        }
      />
      <Route
        path="/profile/:username/following"
        element={
          <RequireAuth>
            <FollowListPage type="following" />
          </RequireAuth>
        }
      />
      <Route
        path="/profile/edit"
        element={
          <RequireAuth>
            <EditProfilePage />
          </RequireAuth>
        }
      />
    </Routes>
  );
}
