import { useState, useEffect } from "react";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function EditProfilePage() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    displayName: "",
    bio: "",
    avatarUrl: "",
    private: false,
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await api.getMyProfile();
        const { user } = data;
        setForm({
          displayName: user.displayName || "",
          bio: user.bio || "",
          avatarUrl: user.avatarUrl || "",
          private: user.private || false,
        });
      } catch (err) {
        console.error(err);
        setMessage({ type: "error", text: err.message });
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    try {
      await api.updateMyProfile(form);
      setMessage({ type: "success", text: "Profile updated" });
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: err.message });
    }
  };

  if (loading) {
    return <div className="p-5">Loading profile…</div>;
  }

  return (
    <div className="max-w-xl mx-auto p-5">
      <h1 className="text-2xl font-bold mb-4">Edit Profile</h1>
      {message && (
        <div
          className={`p-3 mb-4 rounded ${{
            success: "bg-green-100 text-green-800",
            error: "bg-red-100 text-red-800",
          }[message.type]}`}
        >
          {message.text}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium mb-1" htmlFor="displayName">
            Display Name
          </label>
          <input
            id="displayName"
            name="displayName"
            type="text"
            value={form.displayName}
            onChange={handleChange}
            className="w-full border rounded p-2"
            required
          />
        </div>
        <div>
          <label className="block font-medium mb-1" htmlFor="bio">
            Bio
          </label>
          <textarea
            id="bio"
            name="bio"
            value={form.bio}
            onChange={handleChange}
            className="w-full border rounded p-2"
            rows={3}
          />
        </div>
        <div>
          <label className="block font-medium mb-1" htmlFor="avatarUrl">
            Avatar URL
          </label>
          <input
            id="avatarUrl"
            name="avatarUrl"
            type="url"
            value={form.avatarUrl}
            onChange={handleChange}
            className="w-full border rounded p-2"
          />
        </div>
        <div className="flex items-center">
          <input
            id="private"
            name="private"
            type="checkbox"
            checked={form.private}
            onChange={handleChange}
            className="mr-2"
          />
          <label htmlFor="private" className="font-medium">
            Private account (hide tweets from non‑followers)
          </label>
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Save Changes
        </button>
      </form>
    </div>
  );
}
