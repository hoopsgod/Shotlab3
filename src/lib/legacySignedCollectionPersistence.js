import { mergeHydratedRows } from "./remotePersistence.js";
import { hasPendingScoreRows, normalizeIdentity, parseStored, readRequester, readSession, reconcilePendingScoreRows, requestSignedJson } from "./scorePersistenceService.js";

const SC_PATH = "/v1/strength-conditioning";

export const LEGACY_SIGNED_COLLECTIONS = /* @__PURE__ */ Object.freeze({
  teams: { path: "/v1/teams", field: "teams" },
  players: { path: "/v1/players", field: "players" },
  player_profiles: { path: "/v1/player-profiles", field: "profiles" },
  events: { path: "/v1/events", field: "events" },
  rsvps: { path: "/v1/rsvps", field: "rsvps" },
  sc_sessions: { path: SC_PATH, field: "sessions" },
  sc_rsvps: { path: SC_PATH, field: "rsvps" },
  sc_logs: { path: SC_PATH, field: "logs" },
});

const GROUPS = [
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

export const AUTHENTICATED_COLLECTION_STORAGE_KEYS = /* @__PURE__ */ Object.freeze(
  GROUPS.flatMap(([, ...bindings]) => bindings.filter((_, index) => index % 2)),
);

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const registeredIdentity = (storage) => {
  const email = readRequester(storage);
  return !email || email === "demo@shotlab.app" || email === "coach.demo@shotlab.app" ? "" : email;
};
const rsvpPending = (storage) => storage?.getItem?.("sl:rp") === readSession(storage)?.rp;

export function readLegacyRegisteredIdentity({ storage = globalThis?.localStorage, supabaseAuthEnabled = false } = {}) {
  return supabaseAuthEnabled ? "" : registeredIdentity(storage);
}

export async function waitForRegisteredSession({ storage = globalThis?.localStorage, expectedIdentity = "", timeoutMs = 4_000, pollMs = 25 } = {}) {
  const expected = normalizeIdentity(expectedIdentity), deadline = Date.now() + Number(timeoutMs || 0);
  for (;;) {
    const identity = registeredIdentity(storage);
    if (identity && (!expected || identity === expected)) return { ok: true, identity };
    if (Date.now() >= deadline) return { ok: false, identity, error: expected && identity && identity !== expected ? "session_identity_mismatch" : "session_not_ready" };
    await delay(pollMs);
  }
}

async function get(fetchImpl, path, storage, requester) {
  const [response, payload] = await requestSignedJson(fetchImpl, path, "GET", requester, storage);
  return { response, payload, failed: !response?.ok || payload?.ok === false || payload?.error };
}

async function hydrateGroup(group, fetchImpl, storage, requester, attempts, retryDelayMs) {
  const [path, ...bindings] = group, maxAttempts = Math.max(1, Number(attempts) || 1);
  let failure = "failed";
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const result = await get(fetchImpl, path, storage, requester), hydrated = [];
      if (!result.failed) {
        let complete = true;
        for (let index = 0; index < bindings.length; index += 2) {
          const field = bindings[index], key = bindings[index + 1], remote = result.payload?.[field];
          if (!Array.isArray(remote)) { complete = false; continue; }
          const rows = key === "sl:shotlogs"
            ? mergeHydratedRows(key, parseStored(storage, key), remote)
            : key === "sl:scores"
              ? reconcilePendingScoreRows({ storage, requester, localRows: parseStored(storage, key), remoteRows: remote })
              : remote;
          storage.setItem(key, JSON.stringify(rows));
          hydrated.push(key);
        }
        if (complete) return hydrated;
        failure = "missing_fields";
      } else failure = String(result.payload?.error || result.response?.status || "failed");
    } catch (error) { failure = String(error?.message || "failed"); }
    if (attempt < maxAttempts) await delay(retryDelayMs * attempt);
  }
  return `${path}:${failure}`;
}

export async function hydrateAuthenticatedCollectionsToStorage({ fetchImpl = globalThis?.fetch, storage = globalThis?.localStorage, expectedIdentity = "", sessionWaitMs = 4_000, sessionPollMs = 25, groupAttempts = 2, retryDelayMs = 80 } = {}) {
  if (typeof fetchImpl !== "function" || typeof storage?.setItem !== "function") return { ok: false, hydrated: [], failures: ["storage_unavailable"], identity: "" };
  const session = await waitForRegisteredSession({ storage, expectedIdentity, timeoutMs: sessionWaitMs, pollMs: sessionPollMs });
  if (!session.ok) return { ok: false, hydrated: [], failures: [session.error], identity: session.identity || "" };
  const pendingRsvps = rsvpPending(storage);
  const results = await Promise.all(GROUPS.map((group) => pendingRsvps && group[0] === "/v1/rsvps"
    ? ["sl:rsvps"]
    : hydrateGroup(group, fetchImpl, storage, session.identity, groupAttempts, retryDelayMs)));
  const hydrated = results.filter(Array.isArray).flat(), failures = results.filter((result) => !Array.isArray(result));
  const players = parseStored(storage, "sl:players"), identityHydrated = Array.isArray(players) && players.some((row) => normalizeIdentity(row?.email) === session.identity);
  if (!identityHydrated) failures.push("sl:players:authenticated_identity_missing");
  return {
    ok: failures.length === 0,
    hydrated: [...new Set(hydrated)],
    pending: [pendingRsvps ? "sl:rsvps" : "", hasPendingScoreRows(storage, session.identity) ? "sl:scores" : ""].filter(Boolean),
    failures: [...new Set(failures)],
    identity: session.identity,
    identityHydrated,
  };
}

function configFor(table) {
  if (table === "player_profiles") return ["/v1/player-profiles", "profiles"];
  if (/^sc_(sessions|rsvps|logs)$/.test(table)) return [SC_PATH, table.slice(3)];
  return /^(teams|players|events|rsvps)$/.test(table) ? [`/v1/${table}`, table] : null;
}

export async function requestLegacySignedCollection({ table, method = "GET", fetchImpl = globalThis?.fetch, storage = globalThis?.localStorage, supabaseAuthEnabled = false } = {}) {
  const config = configFor(table), requester = supabaseAuthEnabled ? "" : registeredIdentity(storage);
  if (!config || method !== "GET" || !requester || typeof fetchImpl !== "function") return null;
  if (table === "rsvps" && rsvpPending(storage)) {
    const rows = parseStored(storage, "sl:rsvps");
    return { data: Array.isArray(rows) ? rows : [], error: null, storageMode: "local_pending" };
  }
  try {
    const result = await get(fetchImpl, config[0], storage, requester);
    if (result.failed) return {
      data: null,
      error: {
        code: String(result.payload?.error || `signed_collection_http_${result.response?.status || 0}`),
        message: String(result.payload?.message || result.payload?.error || "signed_collection_load_failed"),
        status: Number(result.response?.status || 0),
      },
    };
    return { data: Array.isArray(result.payload?.[config[1]]) ? result.payload[config[1]] : [], error: null, storageMode: String(result.payload?.storage_mode || "signed_api") };
  } catch (error) {
    return { data: null, error: { code: String(error?.code || "signed_collection_load_failed"), message: String(error?.message || "signed_collection_load_failed"), status: Number(error?.status || 0) } };
  }
}
