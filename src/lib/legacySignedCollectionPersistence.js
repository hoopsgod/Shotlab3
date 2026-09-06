import { mergeHydratedRows } from "./remotePersistence.js";
import { hasPendingScoreRows, normalizeIdentity, parseStored, readRequester, readSession, reconcilePendingScoreRows, requestSignedJson } from "./scorePersistenceService.js";

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
const registeredSessionIdentity = (storage) => {
  const email = readRequester(storage);
  return !email || email === "demo@shotlab.app" || email === "coach.demo@shotlab.app" ? "" : email;
};
const rsvpPending = (storage) => storage?.getItem?.("sl:rp") === readSession(storage)?.rp;

export function readLegacyRegisteredIdentity({ storage = globalThis?.localStorage, supabaseAuthEnabled = false } = {}) {
  return supabaseAuthEnabled ? "" : registeredSessionIdentity(storage);
}

export async function waitForRegisteredSession({ storage = globalThis?.localStorage, expectedIdentity = "", timeoutMs = DEFAULT_SESSION_WAIT_MS, pollMs = DEFAULT_SESSION_POLL_MS } = {}) {
  const expected = normalizeIdentity(expectedIdentity), deadline = Date.now() + Math.max(0, Number(timeoutMs) || 0);
  for (;;) {
    const current = registeredSessionIdentity(storage);
    if (current && (!expected || current === expected)) return { ok: true, identity: current };
    if (Date.now() >= deadline) return { ok: false, identity: current, error: expected && current && current !== expected ? "session_identity_mismatch" : "session_not_ready" };
    await delay(pollMs);
  }
}

async function signedGet(fetchImpl, path, storage, requester) {
  const [response, payload] = await requestSignedJson(fetchImpl, path, "GET", requester, storage);
  if (!response?.ok || payload?.ok === false || payload?.error) {
    const status = Number(response?.status || 0), error = new Error(String(payload?.message || payload?.error || "signed_collection_load_failed"));
    error.code = String(payload?.error || `signed_collection_http_${status}`);
    error.status = status;
    error.failure = String(payload?.error || status || "failed");
    throw error;
  }
  return payload;
}

async function hydrateGroup({ group, fetchImpl, storage, requester, attempts = DEFAULT_GROUP_ATTEMPTS, retryDelayMs = DEFAULT_RETRY_DELAY_MS }) {
  const [path, ...bindings] = group, maxAttempts = Math.max(1, Number(attempts) || 1);
  let lastFailure = "failed";
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const payload = await signedGet(fetchImpl, path, storage, requester), hydrated = [];
      let missing = "";
      for (let index = 0; index < bindings.length; index += 2) {
        const field = bindings[index], storageKey = bindings[index + 1], remote = payload?.[field];
        if (!Array.isArray(remote)) { missing += `${missing ? "," : ""}${field}`; continue; }
        const rows = storageKey === "sl:shotlogs"
          ? mergeHydratedRows(storageKey, parseStored(storage, storageKey, null), remote)
          : storageKey === "sl:scores"
            ? reconcilePendingScoreRows({ storage, requester, localRows: parseStored(storage, storageKey, null), remoteRows: remote })
            : remote;
        storage.setItem(storageKey, JSON.stringify(rows));
        hydrated.push(storageKey);
      }
      if (!missing) return hydrated;
      lastFailure = `missing_fields:${missing}`;
    } catch (error) { lastFailure = String(error?.failure || error?.message || "failed"); }
    if (attempt < maxAttempts) await delay(retryDelayMs * attempt);
  }
  return `${path}:${lastFailure}`;
}

export async function hydrateAuthenticatedCollectionsToStorage({ fetchImpl = globalThis?.fetch, storage = globalThis?.localStorage, expectedIdentity = "", sessionWaitMs = DEFAULT_SESSION_WAIT_MS, sessionPollMs = DEFAULT_SESSION_POLL_MS, groupAttempts = DEFAULT_GROUP_ATTEMPTS, retryDelayMs = DEFAULT_RETRY_DELAY_MS } = {}) {
  if (typeof fetchImpl !== "function" || typeof storage?.setItem !== "function") return { ok: false, hydrated: [], failures: ["storage_unavailable"], identity: "" };
  const session = await waitForRegisteredSession({ storage, expectedIdentity, timeoutMs: sessionWaitMs, pollMs: sessionPollMs });
  if (!session.ok) return { ok: false, hydrated: [], failures: [session.error], identity: session.identity || "" };
  const pendingRsvps = rsvpPending(storage);
  const results = await Promise.all(AUTHENTICATED_COLLECTION_GROUPS.map((group) => pendingRsvps && group[0] === "/v1/rsvps"
    ? ["sl:rsvps"]
    : hydrateGroup({ group, fetchImpl, storage, requester: session.identity, attempts: groupAttempts, retryDelayMs })));
  const hydrated = results.filter(Array.isArray).flat(), failures = results.filter((result) => !Array.isArray(result));
  const storedPlayers = parseStored(storage, "sl:players", null);
  const identityHydrated = Array.isArray(storedPlayers) && storedPlayers.some((row) => normalizeIdentity(row?.email) === session.identity);
  if (!identityHydrated) failures.push("sl:players:authenticated_identity_missing");
  for (const key of AUTHENTICATED_COLLECTION_STORAGE_KEYS) if (!hydrated.includes(key)) failures.push(`${key}:not_hydrated`);
  return {
    ok: failures.length === 0,
    hydrated: [...new Set(hydrated)],
    pending: [pendingRsvps ? "sl:rsvps" : "", hasPendingScoreRows(storage, session.identity) ? "sl:scores" : ""].filter(Boolean),
    failures: [...new Set(failures)],
    identity: session.identity,
    identityHydrated,
  };
}

export async function requestLegacySignedCollection({ table, method = "GET", fetchImpl = globalThis?.fetch, storage = globalThis?.localStorage, supabaseAuthEnabled = false } = {}) {
  const config = LEGACY_SIGNED_COLLECTIONS[table], requester = readLegacyRegisteredIdentity({ storage, supabaseAuthEnabled });
  if (!config || method !== "GET" || !requester || typeof fetchImpl !== "function") return null;
  if (table === "rsvps" && rsvpPending(storage)) {
    const rows = parseStored(storage, "sl:rsvps", null);
    return { data: Array.isArray(rows) ? rows : [], error: null, storageMode: "local_pending" };
  }
  try {
    const payload = await signedGet(fetchImpl, config.path, storage, requester);
    return { data: Array.isArray(payload?.[config.field]) ? payload[config.field] : [], error: null, storageMode: String(payload?.storage_mode || "signed_api") };
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
