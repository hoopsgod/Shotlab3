const APP_SESSION_KEY = "sl:session";
const SHOT_LOGS_KEY = "sl:shotlogs";
const SUPABASE_SESSION_KEY = "sl:supabase-session";
const SUPABASE_ACCESS_TOKEN_KEY = "sl:supabase-access-token";
const DEMO_MODE_KEY = "sl:demoMode";
const DEMO_EMAILS = new Set(["demo@shotlab.app", "coach.demo@shotlab.app"]);
const AUTO_SYNC_STATES = new Set(["local_pending", "background_saved"]);

const normalizeEmail = (value) => String(value || "").trim().toLowerCase();

const boolValue = (value) => ["1", "true", "yes", "on"].includes(String(value || "").trim().toLowerCase());

export function isDemoRuntimeEnabled({ env, location } = {}) {
  const resolvedEnv = env || (typeof import.meta !== "undefined" ? import.meta.env : {});
  const resolvedLocation = location || (typeof window !== "undefined" ? window.location : null);
  const hostname = String(resolvedLocation?.hostname || "").toLowerCase();
  const localHost = ["localhost", "127.0.0.1", "::1"].includes(hostname);
  return Boolean(resolvedEnv?.DEV || localHost || boolValue(resolvedEnv?.VITE_ENABLE_DEMO_MODE));
}

export function isSupabaseAuthEnabled(env) {
  const resolvedEnv = env || (typeof import.meta !== "undefined" ? import.meta.env : {});
  return boolValue(resolvedEnv?.VITE_ENABLE_SUPABASE_AUTH);
}

export function isSessionAuthError(error) {
  const code = String(error?.code || error?.error || "").trim().toLowerCase();
  return ["session_refresh_failed", "session_invalid", "invalid_token", "refresh_token_not_found"].includes(code);
}

export async function readRuntimeJson(key, options = {}) {
  if (typeof window === "undefined" && !options.storage && !options.localStorage) return null;
  const storage = options.storage ?? window.storage;
  const localStorage = options.localStorage ?? window.localStorage;

  try {
    const result = await storage?.get?.(key, true);
    if (result?.value) return JSON.parse(result.value);
  } catch {}

  try {
    const raw = localStorage?.getItem?.(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function writeRuntimeJson(key, value, options = {}) {
  if (typeof window === "undefined" && !options.storage && !options.localStorage) return false;
  const storage = options.storage ?? window.storage;
  const localStorage = options.localStorage ?? window.localStorage;
  const serialized = JSON.stringify(value);
  let saved = false;

  try {
    await storage?.set?.(key, serialized, true);
    saved = true;
  } catch {}

  try {
    localStorage?.setItem?.(key, serialized);
    saved = true;
  } catch {}

  return saved;
}

export async function clearPersistedAuthSession(options = {}) {
  const localStorage = options.localStorage ?? (typeof window !== "undefined" ? window.localStorage : null);
  await writeRuntimeJson(APP_SESSION_KEY, null, options);
  try { localStorage?.removeItem?.(SUPABASE_SESSION_KEY); } catch {}
  try { localStorage?.removeItem?.(SUPABASE_ACCESS_TOKEN_KEY); } catch {}
}

export async function clearStaleDemoSession(options = {}) {
  if (isDemoRuntimeEnabled(options)) return false;
  const localStorage = options.localStorage ?? (typeof window !== "undefined" ? window.localStorage : null);
  const session = await readRuntimeJson(APP_SESSION_KEY, options);
  const email = normalizeEmail(session?.email);
  try { localStorage?.removeItem?.(DEMO_MODE_KEY); } catch {}
  if (!DEMO_EMAILS.has(email)) return false;
  await clearPersistedAuthSession(options);
  return true;
}

function normalizeSavedShotLog(remoteRow = {}, localRow = {}) {
  const made = Number(remoteRow.made ?? localRow.made ?? 0);
  return {
    ...localRow,
    ...remoteRow,
    id: remoteRow.id || localRow.id,
    teamId: remoteRow.teamId || remoteRow.team_id || localRow.teamId || localRow.team_id,
    playerId: remoteRow.playerId || remoteRow.player_id || localRow.playerId || localRow.player_id || localRow.email,
    email: normalizeEmail(remoteRow.email || localRow.email),
    name: remoteRow.name || localRow.name,
    made: Number.isFinite(made) ? made : 0,
    date: remoteRow.date || localRow.date,
    ts: Number(remoteRow.ts || localRow.ts || Date.now()),
    syncState: "remote_saved",
    syncSource: "remote",
    syncError: "",
    syncDiagnostic: null,
  };
}

export function getAutoSyncShotLogs(logs = [], authEmail = "") {
  const normalizedAuthEmail = normalizeEmail(authEmail);
  return (Array.isArray(logs) ? logs : []).filter((log) => {
    const email = normalizeEmail(log?.email || log?.player_email);
    if (!AUTO_SYNC_STATES.has(String(log?.syncState || ""))) return false;
    if (log?.demo === true || DEMO_EMAILS.has(email)) return false;
    if (normalizedAuthEmail && email !== normalizedAuthEmail) return false;
    return Boolean(log?.id && (log?.teamId || log?.team_id) && email);
  });
}

export async function syncPendingHomeShotLogs(options = {}) {
  const fetchImpl = options.fetchImpl || (typeof fetch === "function" ? fetch : null);
  if (!fetchImpl) return { ok: false, synced: 0, failed: 0, pending: 0, error: "fetch_unavailable" };

  const authEmail = normalizeEmail(options.authEmail);
  const logs = await readRuntimeJson(SHOT_LOGS_KEY, options);
  const sourceLogs = Array.isArray(logs) ? logs : [];
  const candidates = getAutoSyncShotLogs(sourceLogs, authEmail).slice(0, Math.max(1, Number(options.maxAttempts || 20)));
  if (!candidates.length) return { ok: true, synced: 0, failed: 0, pending: 0, requiresAuth: false };
  if (!authEmail) return { ok: false, synced: 0, failed: 0, pending: candidates.length, requiresAuth: true };

  const replacements = new Map();
  let synced = 0;
  let failed = 0;
  let requiresAuth = false;

  for (const log of candidates) {
    try {
      const response = await fetchImpl("/v1/home-shots/log", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": authEmail },
        body: JSON.stringify({
          id: log.id,
          ts: log.ts,
          team_id: log.teamId || log.team_id,
          player_id: log.playerId || log.player_id || log.email,
          email: normalizeEmail(log.email),
          name: log.name,
          made: Number(log.made || 0),
          date: log.date,
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (response.status === 401 || response.status === 403) {
        requiresAuth = true;
        break;
      }
      if (!response.ok) {
        failed += 1;
        if (response.status >= 400 && response.status < 500) {
          replacements.set(log.id, {
            ...log,
            syncState: "failed_sync",
            syncSource: "local",
            syncError: String(body?.error || `http_${response.status}`),
          });
        }
        continue;
      }
      replacements.set(log.id, normalizeSavedShotLog(body?.shot_log || {}, log));
      synced += 1;
    } catch {
      failed += 1;
    }
  }

  if (replacements.size) {
    const nextLogs = sourceLogs.map((log) => replacements.get(log.id) || log);
    await writeRuntimeJson(SHOT_LOGS_KEY, nextLogs, options);
  }

  const remainingLogs = replacements.size
    ? sourceLogs.map((log) => replacements.get(log.id) || log)
    : sourceLogs;
  const pending = getAutoSyncShotLogs(remainingLogs, authEmail).length;
  return {
    ok: failed === 0 && !requiresAuth,
    synced,
    failed,
    pending,
    requiresAuth,
  };
}

export const RUNTIME_STORAGE_KEYS = {
  appSession: APP_SESSION_KEY,
  shotLogs: SHOT_LOGS_KEY,
  demoMode: DEMO_MODE_KEY,
};
