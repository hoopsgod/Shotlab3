import { buildApiIdentityHeaders } from "./apiIdentityHeaders.js";
import { mergeHydratedRows } from "./remotePersistence.js";
import { readRsvpSyncPending, readScheduleContext } from "./schedulePersistenceService.js";

const normalizeIdentity = (value) => String(value || "").trim().toLowerCase();

const DEMO_IDENTITIES = new Set(["demo@shotlab.app", "coach.demo@shotlab.app"]);
const APP_SESSION_KEY = "sl:session";
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
  sc_sessions: { path: "/v1/strength-conditioning", field: "sessions" },
  sc_rsvps: { path: "/v1/strength-conditioning", field: "rsvps" },
  sc_logs: { path: "/v1/strength-conditioning", field: "logs" },
});

const AUTHENTICATED_COLLECTION_GROUPS = Object.freeze([
  { path: "/v1/teams", fields: [{ field: "teams", storageKey: "sl:teams" }] },
  { path: "/v1/players", fields: [{ field: "players", storageKey: "sl:players" }] },
  { path: "/v1/player-profiles", fields: [{ field: "profiles", storageKey: "sl:player-profiles" }] },
  { path: "/v1/scores", fields: [{ field: "scores", storageKey: "sl:scores" }] },
  { path: "/v1/program-scores", fields: [{ field: "program_scores", storageKey: "sl:program-scores" }] },
  { path: "/v1/shot-logs", fields: [{ field: "shot_logs", storageKey: "sl:shotlogs" }] },
  { path: "/v1/events", fields: [{ field: "events", storageKey: "sl:events" }] },
  { path: "/v1/rsvps", fields: [{ field: "rsvps", storageKey: "sl:rsvps" }] },
  {
    path: "/v1/strength-conditioning",
    fields: [
      { field: "sessions", storageKey: "sl:sc-sessions" },
      { field: "rsvps", storageKey: "sl:sc-rsvps" },
      { field: "logs", storageKey: "sl:sc-logs" },
    ],
  },
]);

export const AUTHENTICATED_COLLECTION_STORAGE_KEYS = Object.freeze(
  AUTHENTICATED_COLLECTION_GROUPS.flatMap((group) => group.fields.map((binding) => binding.storageKey)),
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
  if (!email || DEMO_IDENTITIES.has(email)) return "";
  return email;
}

export function readLegacyRegisteredIdentity({
  storage = globalThis?.localStorage,
  supabaseAuthEnabled = false,
} = {}) {
  if (supabaseAuthEnabled) return "";
  return registeredSessionIdentity(storage);
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
    if (current && (!expected || current === expected)) {
      return { ok: true, identity: current };
    }
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
  try {
    return await response.json();
  } catch {
    return {};
  }
}

function signedHeaders(storage, requester = "") {
  return buildApiIdentityHeaders({ requester, storage });
}

async function hydrateGroup({
  group,
  fetchImpl,
  storage,
  requester,
  teamId = "",
  attempts = DEFAULT_GROUP_ATTEMPTS,
  retryDelayMs = DEFAULT_RETRY_DELAY_MS,
}) {
  let lastFailure = "failed";
  const maxAttempts = Math.max(1, Number(attempts) || 1);

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetchImpl(group.path, {
        method: "GET",
        headers: signedHeaders(storage, requester),
      });
      const payload = await readJsonResponse(response);
      if (!response?.ok || payload?.ok === false || payload?.error) {
        lastFailure = String(payload?.error || response?.status || "failed");
      } else {
        const hydrated = [];
        const missingFields = [];
        for (const binding of group.fields) {
          if (!Array.isArray(payload?.[binding.field])) {
            missingFields.push(binding.field);
            continue;
          }
          const localRows = readJson(storage, binding.storageKey);
          const rsvpPending = binding.storageKey === "sl:rsvps"
            && readRsvpSyncPending({ storage, requester, teamId });
          const rows = binding.storageKey === "sl:shotlogs"
            ? mergeHydratedRows(binding.storageKey, localRows, payload[binding.field])
            : rsvpPending
              ? mergeHydratedRows(binding.storageKey, localRows, [])
              : payload[binding.field];
          storage.setItem(binding.storageKey, JSON.stringify(rows));
          hydrated.push(binding.storageKey);
        }
        if (!missingFields.length) return { ok: true, hydrated };
        lastFailure = `missing_fields:${missingFields.join(",")}`;
      }
    } catch (error) {
      lastFailure = String(error?.message || "failed");
    }

    if (attempt < maxAttempts) await delay(retryDelayMs * attempt);
  }

  return { ok: false, hydrated: [], failure: `${group.path}:${lastFailure}` };
}

export async function hydrateAuthenticatedCollectionsToStorage({
  fetchImpl = globalThis?.fetch,
  storage = globalThis?.localStorage,
  expectedIdentity = "",
  expectedTeamId = "",
  sessionWaitMs = DEFAULT_SESSION_WAIT_MS,
  sessionPollMs = DEFAULT_SESSION_POLL_MS,
  groupAttempts = DEFAULT_GROUP_ATTEMPTS,
  retryDelayMs = DEFAULT_RETRY_DELAY_MS,
} = {}) {
  if (typeof fetchImpl !== "function" || typeof storage?.setItem !== "function") {
    return { ok: false, hydrated: [], pending: [], failures: ["storage_unavailable"], identity: "" };
  }

  const session = await waitForRegisteredSession({
    storage,
    expectedIdentity,
    timeoutMs: sessionWaitMs,
    pollMs: sessionPollMs,
  });
  if (!session.ok) {
    return { ok: false, hydrated: [], pending: [], failures: [session.error], identity: session.identity || "" };
  }

  const activeTeamId = String(expectedTeamId || readScheduleContext(storage).teamId || "").trim();

  // These signed GETs are independent and write distinct storage keys. Running them
  // concurrently keeps registered mobile login bounded by the slowest collection
  // instead of the sum of every collection latency, while each group retains its own
  // retry/fail-closed behavior.
  const results = await Promise.all(
    AUTHENTICATED_COLLECTION_GROUPS.map((group) => hydrateGroup({
      group,
      fetchImpl,
      storage,
      requester: session.identity,
      teamId: activeTeamId,
      attempts: groupAttempts,
      retryDelayMs,
    })),
  );

  const hydrated = [];
  const failures = [];
  for (const result of results) {
    hydrated.push(...result.hydrated);
    if (!result.ok) failures.push(result.failure);
  }

  const storedPlayers = readJson(storage, "sl:players");
  const identityHydrated = Array.isArray(storedPlayers)
    && storedPlayers.some((row) => normalizeIdentity(row?.email) === session.identity);
  if (!identityHydrated) failures.push("sl:players:authenticated_identity_missing");

  const missingKeys = AUTHENTICATED_COLLECTION_STORAGE_KEYS.filter((key) => !hydrated.includes(key));
  for (const key of missingKeys) failures.push(`${key}:not_hydrated`);

  return {
    ok: failures.length === 0,
    hydrated: [...new Set(hydrated)],
    pending: readRsvpSyncPending({ storage, requester: session.identity, teamId: activeTeamId }) ? ["sl:rsvps"] : [],
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
  const config = LEGACY_SIGNED_COLLECTIONS[String(table || "")];
  const requester = readLegacyRegisteredIdentity({ storage, supabaseAuthEnabled });
  if (!config || method !== "GET" || !requester || typeof fetchImpl !== "function") return null;

  if (String(table || "") === "rsvps" && readRsvpSyncPending({ storage, requester, teamId: readScheduleContext(storage).teamId })) {
    return {
      data: mergeHydratedRows("sl:rsvps", readJson(storage, "sl:rsvps"), []),
      error: null,
      storageMode: "local_pending",
    };
  }

  try {
    const response = await fetchImpl(config.path, {
      method: "GET",
      headers: signedHeaders(storage, requester),
    });
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
