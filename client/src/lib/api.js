/**
 * Base URL for all API requests.
 *
 * In development the Vite dev-server proxy forwards /api to the Express
 * backend, so an empty string works.  In production the env var
 * VITE_API_BASE_URL should point to the deployed backend origin
 * (e.g. https://codesync-hub-api.onrender.com).
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Lightweight wrapper around fetch that prepends the API base URL and
 * defaults to JSON content-type.
 */
export async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `API error ${res.status}`);
  }

  return res.json();
}
