const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

export function getApiUrl() {
  return API_URL;
}

export function getToken() {
  return localStorage.getItem("pulsecrm_token") || "";
}

export function setToken(token) {
  localStorage.setItem("pulsecrm_token", token);
}

export function clearToken() {
  localStorage.removeItem("pulsecrm_token");
}

export async function apiFetch(path, { tenantId, auth = true, ...options } = {}) {
  const url = `${API_URL}${path.startsWith("/") ? "" : "/"}${path}`;

  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");

  if (tenantId) headers.set("X-Tenant-Id", tenantId);

  if (auth) {
    const token = getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(url, { ...options, headers });

  if (!res.ok) {
    let text = "";
    try { text = await res.text(); } catch {}
    throw new Error(`HTTP ${res.status} - ${text || res.statusText}`);
  }

  // pode ter 204
  if (res.status === 204) return null;

  return res.json();
}