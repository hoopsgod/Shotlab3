import { buildApiIdentityHeaders } from "./apiIdentityHeaders.js";
import { mergeHydratedRows } from "./remotePersistence.js";

const normalizeIdentity = (value) => String(value || "").trim().toLowerCase();
const APP_SESSION_KEY = "sl:session";
const SC_PATH = "/v1/strength-conditioning";
const DEFAULT_SESSION_WAIT_MS = 4_000;
const DEFAULT_SESSION_POLL_MS = 25;
const DEFAULT_GROUP_ATTEMPTS = 2;
const DEFAULT_RETRY_DELAY_MS = 80;

export const LEGACY_SIGNED_COLLECTIONS = Object.freeze({
  teams: { path: "/v1/teams", field: "teams" },
  players: { path: "/v1/players", field: "players" },
  player_profiles: { path: "/v1/player-profiles", field: "profiles" },
  events: { path: "/v1/events", field: "events" },
  rsvps: { path: "/v1/rsvps", field: "rsvps" },
  sc_sessions: { path: SC_PATH, field: "sessions" },
  sc_rsvps: { path: SC_PATH, field: "rsvps" },
  sc_logs: { path: SC_PATH, field: "logs" },
});

const AUTHENTICATED_COLLECTION_GROUPS = [
  ["/v1/teams", "teams", "sl:teams"],
  ["/v1/players", "players", "sl:players"],
  ["/v1/player-profiles", "profiles", "sl:player-profiles"],
  ["/v1/scores", "scores", "sl:scores"],
  ["/v1/program-scores", "program_scores", "sl:program-scores"],
  ["/v1/shot-logs", "shot_logs", "sl:shotlogs"],
  ["/v1/events", "events", "sl:events"],
  ["/v1/rsvps", "rsvps", "sl:rsvps"],
  [SC_PATH, "sessions", "sl:sc-sessions", "rsvps", "sl:sc-rsvps", "logs", "sl:sc-logs"],
];

export const AUTHENTICATED_COLLECTION_STORAGE_KEYS = Object.freeze(
  AUTHENTICATED_COLLECTION_GROUPS.flatMap(([, ...bindings]) => bindings.filter((_, index) => index % 2)),
);

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, Math.max(0, Number(milliseconds) || 0)));

function readJson(storage, key) {
  try {
    const raw = storage?.getItem?.(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function registeredSessionIdentity(storage) {
  const session = readJson(storage, APP_SESSION_KEY);
  const email = normalizeIdentity(session?.email || session?.userEmail || session?.user_id);
  return !email || email === "demo@shotlab.app" || email === "coach.demo@shotlab.app" ? "" : email;
}

function rsvpPending(storage, requester) {
  const session = readJson(storage, APP_SESSION_KEY);
  let teamId = session?.rsvpTeamId || session?.teamId || session?.team_id;
  if (!teamId) {
    const players = readJson(storage, "sl:players");
    const actor = (Array.isArray(players) ? players : []).find((row) => normalizeIdentity(row?.email) === requester);
    teamId = actor?.teamId || actor?.team_id;
  }
  return storage?.getItem?.("sl:rp") === `${requester}\t${String(teamId || "").trim()}`;
}

export function readLegacyRegisteredIdentity({ storage = globalThis?.localStorage, supabaseAuthEnabled = false } = {}) {
  return supabaseAuthEnabled ? "" : registeredSessionIdentity(storage);
}

export async function waitForRegisteredSession({
  storage = globalThis?.localStorage,
  expectedIdentity = "",
  timeoutMs = DEFAULT_SESSION_WAIT_MS,
  pollMs = DEFAULT_SESSION_POLL_MS,
} = {}) {
  const expected = normalizeIdentity(expectedIdentity);
  const deadline = Date.now() + Math.max(0, Number(timeoutMs) || 0);
  while (true) {
    const current = registeredSessionIdentity(storage);
    if (current && (!expected || current === expected)) return { ok: true, identity: current };
    if (Date.now() >= deadline) {
      return {
        ok: false,
        identity: current,
        error: expected && current && current !== expected ? "session_identity_mismatch" : "session_not_ready",
      };
    }
    await delay(pollMs);
  }
}

async function readJsonResponse(response) {
  try { return await response.json(); } catch { return {}; }
}

function signedHeaders(storage, requester = "") {
  return buildApiIdentityHeaders({ requester, storage });
}

async function hydrateGroup({
  group,
  fetchImpl,
  storage,
  requester,
  attempts = DEFAULT_GROUP_ATTEMPTS,
  retryDelayMs = DEFAULT_RETRY_DELAY_MS,
}) {
  const [path, ...bindings] = group;
  let lastFailure = "failed";
  const maxAttempts = Math.max(1, Number(attempts) || 1);
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetchImpl(path, { method: "GET", headers: signedHeaders(storage, requester) });
      const payload = await readJsonResponse(response);
      if (!response?.ok || payload?.ok === false || payload?.error) {
        lastFailure = String(payload?.error || response?.status || "failed");
      } else {
        const hydrated = [];
        const missingFields = [];
        for (let index = 0; index < bindings.length; index += 2) {
          const field = bindings[index];
          const storageKey = bindings[index + 1];
          if (!Array.isArray(payload?.[field])) {
            missingFields.push(field);
            continue;
          }
          const rows = storageKey === "sl:shotlogs"
            ? mergeHydratedRows(storageKey, readJson(storage, storageKey), payload[field])
            : payload[field];
          storage.setItem(storageKey, JSON.stringify(rows));
          hydrated.push(storageKey);
        }
        if (!missingFields.length) return { hydrated };
        lastFailure = `missing_fields:${missingFields.join(",")}`;
      }
    } catch (error) {
      lastFailure = String(error?.message || "failed");
    }
    if (attempt < maxAttempts) await delay(retryDelayMs * attempt);
  }
  return { hydrated: [], failure: `${path}:${lastFailure}` };
}

export async function hydrateAuthenticatedCollectionsToStorage({
  fetchImpl = globalThis?.fetch,
  storage = globalThis?.localStorage,
  expectedIdentity = "",
  sessionWaitMs = DEFAULT_SESSION_WAIT_MS,
  sessionPollMs = DEFAULT_SESSION_POLL_MS,
  groupAttempts = DEFAULT_GROUP_ATTEMPTS,
  retryDelayMs = DEFAULT_RETRY_DELAY_MS,
} = {}) {
  if (typeof fetchImpl !== "function" || typeof storage?.setItem !== "function") {
    return { ok: false, hydrated: [], failures: ["storage_unavailable"], identity: "" };
  }
  const session = await waitForRegisteredSession({
    storage,
    expectedIdentity,
    timeoutMs: sessionWaitMs,
    pollMs: sessionPollMs,
  });
  if (!session.ok) {
    return { ok: false, hydrated: [], failures: [session.error], identity: session.identity || "" };
  }

  const pendingRsvps = rsvpPending(storage, session.identity);
  const results = await Promise.all(
    AUTHENTICATED_COLLECTION_GROUPS.map((group) => pendingRsvps && group[0] === "/v1/rsvps"
      ? { hydrated: ["sl:rsvps"] }
      : hydrateGroup({ group, fetchImpl, storage, requester: session.identity, attempts: groupAttempts, retryDelayMs })),
  );

  const hydrated = results.flatMap((result) => result.hydrated);
  const failures = results.flatMap((result) => result.failure ? [result.failure] : []);
  const storedPlayers = readJson(storage, "sl:players");
  const identityHydrated = Array.isArray(storedPlayers)
    && storedPlayers.some((row) => normalizeIdentity(row?.email) === session.identity);
  if (!identityHydrated) failures.push("sl:players:authenticated_identity_missing");

  for (const key of AUTHENTICATED_COLLECTION_STORAGE_KEYS) {
    if (!hydrated.includes(key)) failures.push(`${key}:not_hydrated`);
  }

  return {
    ok: failures.length === 0,
    hydrated: [...new Set(hydrated)],
    pending: pendingRsvps ? ["sl:rsvps"] : [],
    failures: [...new Set(failures)],
    identity: session.identity,
    identityHydrated,
  };
}

export async function requestLegacySignedCollection({
  table,
  method = "GET",
  fetchImpl = globalThis?.fetch,
  storage = globalThis?.localStorage,
  supabaseAuthEnabled = false,
} = {}) {
  const config = LEGACY_SIGNED_COLLECTIONS[table];
  const requester = readLegacyRegisteredIdentity({ storage, supabaseAuthEnabled });
  if (!config || method !== "GET" || !requester || typeof fetchImpl !== "function") return null;
  if (table === "rsvps" && rsvpPending(storage, requester)) {
    const rows = readJson(storage, "sl:rsvps");
    return { data: Array.isArray(rows) ? rows : [], error: null, storageMode: "local_pending" };
  }

  try {
    const response = await fetchImpl(config.path, { method: "GET", headers: signedHeaders(storage, requester) });
    const payload = await readJsonResponse(response);
    if (!response?.ok || payload?.ok === false || payload?.error) {
      return {
        data: null,
        error: {
          code: String(payload?.error || `signed_collection_http_${response?.status || 0}`),
          message: String(payload?.message || payload?.error || "signed_collection_load_failed"),
          status: Number(response?.status || 0),
        },
      };
    }
    return {
      data: Array.isArray(payload?.[config.field]) ? payload[config.field] : [],
      error: null,
      storageMode: String(payload?.storage_mode || "signed_api"),
    };
  } catch (error) {
    return {
      data: null,
      error: {
        code: String(error?.code || "signed_collection_load_failed"),
        message: String(error?.message || "signed_collection_load_failed"),
        status: Number(error?.status || 0),
      },
    };
  }
}
