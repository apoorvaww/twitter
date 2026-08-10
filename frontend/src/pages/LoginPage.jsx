import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login({ username, password });
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white text-black dark:bg-black dark:text-white flex items-center justify-center px-4">
      <div className="w-full max-w-[420px] rounded-2xl bg-white dark:bg-black px-8 py-10">
        {/* X Logo */}
        <div className="flex justify-center mb-8">
          <div className="text-4xl font-bold">𝕏</div>
        </div>

        {/* Heading */}
        <h1 className="text-3xl font-bold text-center mb-8">
          Log in to your account
        </h1>

        {/* Error */}
        {error && (
          <div className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            className="
              w-full
              h-[58px]
              rounded-md
              border
              border-gray-300
              dark:border-gray-700
              bg-white
              dark:bg-black
              px-4
              text-[17px]
              text-black
              dark:text-white
              placeholder-gray-500
              outline-none
              focus:border-[#1d9bf0]
              focus:ring-1
              focus:ring-[#1d9bf0]
              transition
            "
          />

          {/* Password */}
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className="
              w-full
              h-[58px]
              rounded-md
              border
              border-gray-300
              dark:border-gray-700
              bg-white
              dark:bg-black
              px-4
              text-[17px]
              text-black
              dark:text-white
              placeholder-gray-500
              outline-none
              focus:border-[#1d9bf0]
              focus:ring-1
              focus:ring-[#1d9bf0]
              transition
            "
          />

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="
              w-full
              h-[52px]
              mt-2
              rounded-full
              bg-black
              dark:bg-white
              text-white
              dark:text-black
              text-[17px]
              font-bold
              hover:opacity-90
              active:scale-[0.98]
              disabled:opacity-50
              disabled:cursor-not-allowed
              transition
            "
          >
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

        {/* Signup */}
        <p className="mt-7 text-center text-sm text-gray-500 dark:text-gray-400">
          Don't have an account?{" "}
          <Link to="/signup" className="text-[#1d9bf0] hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
