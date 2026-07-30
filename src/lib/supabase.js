import { resolveExpiresAt } from "./authFlow.js";
import { createScorePersistenceService } from "./scorePersistenceService.js";
import { createShotLogPersistenceService } from "./shotLogPersistenceService.js";

const viteEnv = (typeof import.meta !== "undefined" && import.meta?.env) ? import.meta.env : {};
const baseUrl = viteEnv.VITE_SUPABASE_URL;
const anonKey = viteEnv.VITE_SUPABASE_ANON_KEY;
const hasConfig = Boolean(baseUrl && anonKey);
const projectRef = (() => {
  try { return baseUrl ? new URL(baseUrl).hostname.split(".")[0] : ""; } catch { return ""; }
})();
const SESSION_KEY = "sl:supabase-session";
const LEGACY_TOKEN_KEY = "sl:supabase-access-token";
const APP_SESSION_KEY = "sl:session";
const DEMO_MODE_KEY = "sl:demoMode";
const DEMO_EMAILS = new Set(["demo@shotlab.app", "coach.demo@shotlab.app"]);
const APP_PERSISTENCE_TABLES = new Set(["teams", "players", "player_profiles", "scores", "program_scores", "shot_logs", "events", "rsvps", "sessions"]);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const scorePersistence = createScorePersistenceService({
  fetchImpl: (...args) => globalThis.fetch(...args),
  storage: globalThis?.localStorage,
});
const shotLogPersistence = createShotLogPersistenceService({
  fetchImpl: (...args) => globalThis.fetch(...args),
  storage: globalThis?.localStorage,
});

const compactObject = (value = {}) => Object.fromEntries(
  Object.entries(value).filter(([, field]) => field !== undefined && field !== ""),
);

const readJsonStorage = (key) => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage?.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const isDemoPersistenceSession = () => {
  if (typeof window === "undefined") return false;
  const session = readJsonStorage(APP_SESSION_KEY);
  const email = String(session?.email || "").trim().toLowerCase();
  return DEMO_EMAILS.has(email) || window.localStorage?.getItem(DEMO_MODE_KEY) === "true";
};

const normalizeTeamWriteRow = (row = {}) => {
  const id = String(row.id || row.team_id || row.teamId || "").trim();
  if (!UUID_RE.test(id)) return null;
  const coachUserId = String(row.coach_user_id || row.coachUserId || row.ownerCoachId || "").trim();
  return compactObject({
    id,
    name: String(row.name || row.teamName || "Team").trim() || "Team",
    coach_user_id: UUID_RE.test(coachUserId) ? coachUserId : undefined,
    school: row.school == null ? undefined : String(row.school).trim(),
    level: row.level == null ? undefined : String(row.level).trim(),
  });
};

const normalizePlayerProfileWriteRow = (row = {}) => compactObject({
  id: row.id,
  team_id: row.team_id ?? row.teamId,
  user_id: row.user_id ?? row.userId ?? null,
  email: row.email,
  first_name: row.first_name ?? row.firstName,
  last_name: row.last_name ?? row.lastName,
});

const alignBulkObjectKeys = (rows = []) => {
  const safeRows = rows.filter((row) => row && typeof row === "object" && !Array.isArray(row));
  if (safeRows.length <= 1) return safeRows;
  const keys = [...new Set(safeRows.flatMap((row) => Object.keys(row)))];
  return safeRows.map((row) => Object.fromEntries(
    keys.map((key) => [key, Object.prototype.hasOwnProperty.call(row, key) ? row[key] : null]),
  ));
};

export const normalizeRestWriteBody = (table, body) => {
  const sourceRows = Array.isArray(body) ? body : body && typeof body === "object" ? [body] : [];
  let rows = sourceRows;
  if (table === "teams") rows = rows.map(normalizeTeamWriteRow).filter(Boolean);
  if (table === "player_profiles") rows = rows.map(normalizePlayerProfileWriteRow);
  return alignBulkObjectKeys(rows);
};

const authStateListeners = new Set();
const notifyAuthStateChange = (event, session = null) => {
  for (const listener of authStateListeners) {
    try { listener(event, session); } catch {}
  }
};

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
const AUTH_SAFE_FIELDS = ["status", "code", "message", "error", "error_description", "msg"];
const sanitizeAuthError = (payload, fallbackCode, fallbackMessage, status) => {
  const src = payload && typeof payload === "object" ? payload : {};
  const safe = {};
  AUTH_SAFE_FIELDS.forEach((key) => {
    if (src[key] == null) return;
    safe[key] = typeof src[key] === "string" || typeof src[key] === "number" ? src[key] : String(src[key]);
  });
  if (!safe.status && Number.isFinite(Number(status))) safe.status = Number(status);
  if (!safe.code) safe.code = fallbackCode;
  if (!safe.message) safe.message = safe.error_description || safe.msg || safe.error || fallbackMessage;
  return safe;
};

const buildHeaders = ({ upsert = false } = {}) => {
  const headers = {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
    "Content-Type": "application/json",
  };
  if (upsert) headers.Prefer = "resolution=merge-duplicates,return=representation";
  return headers;
};

const scoreApiRequest = async ({ method = "GET", body } = {}) => {
  try {
    if (method === "GET") {
      const result = await scorePersistence.loadScores();
      return { data: result.scores, error: null };
    }
    const result = await scorePersistence.upsertScores(Array.isArray(body) ? body : body ? [body] : []);
    return { data: result.scores, error: null };
  } catch (error) {
    return {
      data: null,
      error: {
        code: String(error?.code || "score_api_failed"),
        message: String(error?.message || "score_api_failed"),
        status: Number(error?.status || 0),
        details: error?.body || null,
      },
    };
  }
};

const shotLogApiRequest = async ({ method = "GET", body } = {}) => {
  if (method !== "GET") {
    return {
      data: Array.isArray(body) ? body : body ? [body] : [],
      error: null,
      skipped: "dedicated_home_shot_api",
    };
  }
  try {
    const result = await shotLogPersistence.loadShotLogs();
    return { data: result.shotLogs, error: null };
  } catch (error) {
    return {
      data: null,
      error: {
        code: String(error?.code || "shot_log_api_failed"),
        message: String(error?.message || "shot_log_api_failed"),
        status: Number(error?.status || 0),
        details: error?.body || null,
      },
    };
  }
};

const request = async (table, { method = "GET", body, upsert = false, onConflict } = {}) => {
  if (method !== "GET" && APP_PERSISTENCE_TABLES.has(table) && isDemoPersistenceSession()) {
    return { data: Array.isArray(body) ? body : body ? [body] : [], error: null, skipped: "demo_local_only" };
  }

  const normalizedBody = method === "GET" ? body : normalizeRestWriteBody(table, body);
  if (method !== "GET" && body && Array.isArray(normalizedBody) && normalizedBody.length === 0) {
    return { data: [], error: null, skipped: "no_compatible_rows" };
  }

  if (table === "scores") return scoreApiRequest({ method, body: normalizedBody });
  if (table === "shot_logs") return shotLogApiRequest({ method, body: normalizedBody });

  if (!hasConfig) {
    return {
      data: null,
      error: {
        code: "config_missing",
        message: "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.",
      },
    };
  }

  let url;
  try {
    url = new URL(`${baseUrl}/rest/v1/${table}`);
  } catch {
    return {
      data: null,
      error: {
        code: "config_invalid",
        message: `Supabase URL is invalid: ${String(baseUrl)}`,
      },
    };
  }

  if (method === "GET") url.searchParams.set("select", "*");
  if (onConflict) url.searchParams.set("on_conflict", onConflict);

  const response = await fetch(url, {
    method,
    headers: buildHeaders({ upsert, onConflict }),
    body: normalizedBody ? JSON.stringify(normalizedBody) : undefined,
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
          error: { code: "invalid_json_error_response", message: "Supabase returned an invalid error payload." },
        };
      }
      return {
        data: null,
        error: { code: "invalid_json_success_response", message: "Supabase returned an invalid success payload." },
      };
    }
  }

  if (!response.ok) {
    return { data: null, error: data ?? { message: `Request failed with status ${response.status}` } };
  }

  return { data, error: null };
};

export const supabase = {
  isConfigured: hasConfig,
  url: baseUrl || "",
  projectRef,
  auth: {
    async signUp({ email, password }) {
      if (!hasConfig) return { data: null, error: { code: "config_missing", message: "Supabase is not configured." } };
      const response = await fetch(`${baseUrl}/auth/v1/signup`, {
        method: "POST",
        headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) return { data: null, error: sanitizeAuthError(payload, "auth_signup_failed", "Signup failed", response.status) };
      if (payload?.access_token || payload?.refresh_token) {
        storeSession(payload);
        notifyAuthStateChange("SIGNED_UP", payload);
      }
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
      if (!response.ok) return { data: null, error: sanitizeAuthError(payload, "auth_login_failed", "Login failed", response.status) };
      if (payload?.access_token || payload?.refresh_token) {
        storeSession(payload);
        notifyAuthStateChange("SIGNED_UP", payload);
      }
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
      const token = window.localStorage?.getItem(LEGACY_TOKEN_KEY) || "";
      if (hasConfig && token) {
        await fetch(`${baseUrl}/auth/v1/logout`, { method: "POST", headers: { apikey: anonKey, Authorization: `Bearer ${token}` } }).catch(() => null);
      }
      try { clearSession(); } catch {}
      notifyAuthStateChange("SIGNED_OUT", null);
      return { error: null };
    },
    onAuthStateChange(callback) {
      if (typeof callback !== "function") return { data: { subscription: { unsubscribe() {} } } };
      authStateListeners.add(callback);
      return {
        data: {
          subscription: {
            unsubscribe() { authStateListeners.delete(callback); },
          },
        },
      };
    },
  },
  profiles: {
    async upsertCoach(row) {
      if (!hasConfig) return { data: null, error: { code: "config_missing", message: "Supabase is not configured." } };
      return request("users", { method: "POST", body: [row], upsert: true, onConflict: "auth_user_id" });
    },
  },
  from(table) {
    return {
      select() { return request(table); },
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

export const __testUtils = {
  resolveExpiresAt,
  normalizeRestWriteBody,
  alignBulkObjectKeys,
  isDemoPersistenceSession,
  scoreApiRequest,
  shotLogApiRequest,
};
