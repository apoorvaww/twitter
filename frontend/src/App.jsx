import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import SignupPage from "./pages/SignupPage.jsx";
import TimelinePage from "./pages/TimelinePage.jsx";
import UserProfilePage from "./pages/UserProfilePage.jsx";

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
      <Route path="/profile" element={<UserProfilePage/>} />
    </Routes>
  );
}