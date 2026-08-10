const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

function getToken() {
  return localStorage.getItem("token");
}

async function request(path, { method = "GET", body, auth = true } = {}) {
  const headers = {
    "Content-Type": "application/json",
  };

  if (auth) {
    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;

  try {
    data = await res.json();
  } catch {
    // e.g. 204 No Content has no body
  }

  if (!res.ok) {
    const error = new Error(
      data?.error || `Request failed with status ${res.status}`,
    );

    error.status = res.status;
    error.body = data;
    throw error;
  }

  return data;
}

export const api = {
  signup: (payload) =>
    request("/auth/signup", {
      method: "POST",
      body: payload,
      auth: false,
    }),

  login: (payload) =>
    request("/auth/login", {
      method: "POST",
      body: payload,
      auth: false,
    }),

  me: () => request("/me"),

  getTimeline: (cursor) =>
    request(`/timeline${cursor ? `?cursor=${cursor}` : ""}`),

  createTweet: (content) =>
    request("/tweets", {
      method: "POST",
      body: { content },
    }),

  getUserTweets: (userId) =>
    request(`/tweets/user/${userId}`, {
      auth: false,
    }),

  follow: (userId) =>
    request(`/follows/${userId}`, {
      method: "POST",
    }),

  unfollow: (userId) =>
    request(`/follows/${userId}`, {
      method: "DELETE",
    }),
};
