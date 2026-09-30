const configuredBase = import.meta.env.VITE_BASE_URL || import.meta.env.VITE_API_URL || "/api";
const normalizedBase = configuredBase.replace(/\/$/, "");
const API_BASE = normalizedBase.endsWith("/api") ? normalizedBase : `${normalizedBase}/api`;

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
