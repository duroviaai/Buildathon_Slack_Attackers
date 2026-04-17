const BASE_URL = "/api";

/**
 * Core fetch wrapper — handles JSON, auth header, and error normalization.
 * @param {string} endpoint
 * @param {object} options
 * @returns {Promise<{data?: any, error?: string}>}
 */
async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem("mf_token");
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return { error: json.error || "Something went wrong." };
    return { data: json };
  } catch {
    return { error: "Network error. Is the server running?" };
  }
}

export const api = {
  register: (payload) =>
    apiFetch("/auth/register", { method: "POST", body: JSON.stringify(payload) }),

  login: (payload) =>
    apiFetch("/auth/login", { method: "POST", body: JSON.stringify(payload) }),
};
