/**
 * Base URL configuration for CodeSync Hub API.
 * Supports:
 * - VITE_API_URL (e.g. 'http://localhost:5001/api' or 'http://localhost:5001')
 * - VITE_API_BASE_URL (legacy / deployment URL)
 * - Empty string fallback (relies on Vite dev proxy `/api` in local development)
 */
const rawApiUrl = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

export const API_BASE_URL = rawApiUrl;

/**
 * Token storage helper in memory (with localStorage as optional backup for Bearer token fallback).
 * Note: When HTTP-only cookies are used, browser automatically manages the cookie.
 */
const TOKEN_KEY = 'codesync_auth_token';

export function getStoredToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // Ignore storage errors in private browsing
  }
}

export function removeStoredToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Ignore
  }
}

/**
 * Normalizes request endpoint URL.
 */
function resolveUrl(endpoint) {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  if (!API_BASE_URL) {
    return cleanEndpoint;
  }

  // If base URL already ends with /api and endpoint starts with /api, avoid /api/api
  if (API_BASE_URL.endsWith('/api') && cleanEndpoint.startsWith('/api/')) {
    return `${API_BASE_URL}${cleanEndpoint.slice(4)}`;
  }

  return `${API_BASE_URL}${cleanEndpoint}`;
}

/**
 * Lightweight HTTP client wrapper for fetch.
 * Sends credentials (cookies) and Authorization Bearer header if token exists.
 */
export async function apiFetch(endpoint, options = {}) {
  const url = resolveUrl(endpoint);
  const token = getStoredToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    credentials: 'include', // Ensures HTTP-only cookies are sent across origins
    ...options,
    headers,
  };

  let res;
  try {
    res = await fetch(url, config);
  } catch (netErr) {
    throw new Error('Unable to connect to CodeSync Hub API. Please check if the server is running.');
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const errorMsg = data.message || `Request failed with status ${res.status}`;
    const error = new Error(errorMsg);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

/**
 * Dedicated Auth API services
 */
export const authApi = {
  async register({ name, email, password, confirmPassword }) {
    const data = await apiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, confirmPassword }),
    });
    if (data.token) {
      setStoredToken(data.token);
    }
    return data;
  },

  async login({ email, password }) {
    const data = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.token) {
      setStoredToken(data.token);
    }
    return data;
  },

  async getMe() {
    return apiFetch('/api/auth/me', {
      method: 'GET',
    });
  },

  async logout() {
    try {
      await apiFetch('/api/auth/logout', {
        method: 'POST',
      });
    } finally {
      removeStoredToken();
    }
  },
};

/**
 * Dedicated Room API services
 */
export const roomApi = {
  async createRoom({ title, language }) {
    return apiFetch('/api/rooms', {
      method: 'POST',
      body: JSON.stringify({ title, language }),
    });
  },

  async getRooms(params = {}) {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.limit) query.append('limit', params.limit);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return apiFetch(`/api/rooms${queryString}`, {
      method: 'GET',
    });
  },

  async getRoom(roomId) {
    return apiFetch(`/api/rooms/${encodeURIComponent(roomId)}`, {
      method: 'GET',
    });
  },

  async joinRoom(roomId) {
    return apiFetch(`/api/rooms/${encodeURIComponent(roomId)}/join`, {
      method: 'POST',
    });
  },

  async endRoom(roomId) {
    return apiFetch(`/api/rooms/${encodeURIComponent(roomId)}/end`, {
      method: 'POST',
    });
  },
};
