const baseUrl = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const hasConfig = Boolean(baseUrl && anonKey);
const SESSION_KEY = "sl:supabase-session";
const LEGACY_TOKEN_KEY = "sl:supabase-access-token";

const readStoredSession = () => {
  try {
    const raw = window.localStorage?.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
};
const storeSession = (payload) => {
  if (!payload) return;
  const session = {
    access_token: payload.access_token || "",
    refresh_token: payload.refresh_token || "",
    expires_at: resolveExpiresAt(payload),
    expires_in: payload.expires_in || null,
    token_type: payload.token_type || "bearer",
    user: payload.user || null,
  };
  window.localStorage?.setItem(SESSION_KEY, JSON.stringify(session));
  if (session.access_token) window.localStorage?.setItem(LEGACY_TOKEN_KEY, session.access_token);
};
const clearSession = () => {
  window.localStorage?.removeItem(SESSION_KEY);
  window.localStorage?.removeItem(LEGACY_TOKEN_KEY);
};

const buildHeaders = ({ upsert = false, onConflict } = {}) => {
  const headers = {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
    "Content-Type": "application/json",
  };

  if (upsert) {
    headers.Prefer = "resolution=merge-duplicates,return=representation";
  }

  return headers;
};

const request = async (table, { method = "GET", body, upsert = false, onConflict } = {}) => {
  if (!hasConfig) {
    return {
      data: null,
      error: {
        code: "config_missing",
        message:
          "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.",
      },
    };
  }

  let url;
  try {
    url = new URL(`${baseUrl}/rest/v1/${table}`);
  } catch (error) {
    return {
      data: null,
      error: {
        code: "config_invalid",
        message: `Supabase URL is invalid: ${String(baseUrl)}`,
      },
    };
  }

  if (method === "GET") {
    url.searchParams.set("select", "*");
  }

  if (onConflict) {
    url.searchParams.set("on_conflict", onConflict);
  }

  const response = await fetch(url, {
    method,
    headers: buildHeaders({ upsert, onConflict }),
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      if (!response.ok) {
        return {
          data: null,
          error: {
            code: "invalid_json_error_response",
            message: "Supabase returned an invalid error payload.",
          },
        };
      }
      return {
        data: null,
        error: {
          code: "invalid_json_success_response",
          message: "Supabase returned an invalid success payload.",
        },
      };
    }
  }

  if (!response.ok) {
    return {
      data: null,
      error: data ?? { message: `Request failed with status ${response.status}` },
    };
  }

  return { data, error: null };
};

export const supabase = {
  isConfigured: hasConfig,
  auth: {
    async signUp({ email, password }) {
      if (!hasConfig) return { data: null, error: { code: "config_missing", message: "Supabase is not configured." } };
      const response = await fetch(`${baseUrl}/auth/v1/signup`, {
        method: "POST",
        headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) return { data: null, error: payload?.error ? payload : { code: payload?.code || "auth_signup_failed", message: payload?.msg || "Signup failed" } };
      if (payload?.access_token || payload?.refresh_token) storeSession(payload);
      return { data: payload, error: null };
    },
    async signInWithPassword({ email, password }) {
      if (!hasConfig) return { data: null, error: { code: "config_missing", message: "Supabase is not configured." } };
      const response = await fetch(`${baseUrl}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) return { data: null, error: payload?.error ? payload : { code: payload?.code || "auth_login_failed", message: payload?.error_description || "Login failed" } };
      if (payload?.access_token || payload?.refresh_token) storeSession(payload);
      return { data: payload, error: null };
    },
    async getSession() {
      if (!hasConfig) return { data: { session: null }, error: null };
      const stored = readStoredSession();
      const legacyToken = window.localStorage?.getItem(LEGACY_TOKEN_KEY) || "";
      let token = stored?.access_token || legacyToken;
      let refreshToken = stored?.refresh_token || "";
      const expiresAt = Number(stored?.expires_at || 0);
      const isExpired = expiresAt ? Date.now() >= (expiresAt * 1000) - 30_000 : false;
      if ((!token || isExpired) && refreshToken) {
        const refreshRes = await fetch(`${baseUrl}/auth/v1/token?grant_type=refresh_token`, {
          method: "POST",
          headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
        const refreshPayload = await refreshRes.json().catch(() => ({}));
        if (refreshRes.ok && (refreshPayload?.access_token || refreshPayload?.refresh_token)) {
          storeSession(refreshPayload);
          token = refreshPayload.access_token || token;
          refreshToken = refreshPayload.refresh_token || refreshToken;
        } else {
          clearSession();
          return { data: { session: null }, error: { code: "session_refresh_failed", message: "Session refresh failed" } };
        }
      }
      if (!token) return { data: { session: null }, error: null };
      let response = await fetch(`${baseUrl}/auth/v1/user`, { headers: { apikey: anonKey, Authorization: `Bearer ${token}` } });
      if (!response.ok && response.status === 401 && refreshToken) {
        const refreshRes = await fetch(`${baseUrl}/auth/v1/token?grant_type=refresh_token`, {
          method: "POST",
          headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
        const refreshPayload = await refreshRes.json().catch(() => ({}));
        if (refreshRes.ok && (refreshPayload?.access_token || refreshPayload?.refresh_token)) {
          storeSession(refreshPayload);
          token = refreshPayload.access_token || token;
          refreshToken = refreshPayload.refresh_token || refreshToken;
          response = await fetch(`${baseUrl}/auth/v1/user`, { headers: { apikey: anonKey, Authorization: `Bearer ${token}` } });
        }
      }
      if (!response.ok) return { data: { session: null }, error: { code: "session_invalid", message: "Session invalid" } };
      const user = await response.json().catch(() => null);
      const session = user ? { access_token: token, refresh_token: refreshToken, user, expires_at: stored?.expires_at || null, expires_in: stored?.expires_in || null } : null;
      return { data: { session }, error: null };
    },
    async signOut() {
      const token = window.localStorage?.getItem("sl:supabase-access-token") || "";
      if (hasConfig && token) {
        await fetch(`${baseUrl}/auth/v1/logout`, { method: "POST", headers: { apikey: anonKey, Authorization: `Bearer ${token}` } }).catch(() => null);
      }
      try { clearSession(); } catch {}
      return { error: null };
    },
  },
  from(table) {
    return {
      select() {
        return request(table);
      },
      upsert(values, options = {}) {
        return request(table, {
          method: "POST",
          body: Array.isArray(values) ? values : [values],
          upsert: true,
          onConflict: options.onConflict,
        });
      },
    };
  },
};

export const __testUtils = { resolveExpiresAt };
const resolveExpiresAt = (payload) => {
  const expiresAt = Number(payload?.expires_at || 0);
  if (expiresAt) return expiresAt;
  const expiresIn = Number(payload?.expires_in || 0);
  if (!expiresIn) return null;
  return Math.floor(Date.now() / 1000) + expiresIn;
};
