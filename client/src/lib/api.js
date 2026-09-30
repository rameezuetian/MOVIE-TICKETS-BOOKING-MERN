const API_BASE = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

export async function apiRequest(path, options = {}) {
  const { token, ...requestOptions } = options;
  const response = await fetch(`${API_BASE}${path}`, {
    ...requestOptions,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...requestOptions.headers },
  });
  const data = await response.json();
  if (!response.ok || data.success === false) throw new Error(data.message || "Request failed");
  return data;
}
