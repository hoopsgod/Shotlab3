import { buildApiIdentityHeaders } from "./apiIdentityHeaders.js";

const normalizeIdentity = (value) => String(value || "").trim().toLowerCase();

const DEMO_IDENTITIES = new Set(["demo@shotlab.app", "coach.demo@shotlab.app"]);
const APP_SESSION_KEY = "sl:session";

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

function readJson(storage, key) {
  try {
    const raw = storage?.getItem?.(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function readLegacyRegisteredIdentity({
  storage = globalThis?.localStorage,
  supabaseAuthEnabled = false,
} = {}) {
  if (supabaseAuthEnabled) return "";
  const session = readJson(storage, APP_SESSION_KEY);
  const email = normalizeIdentity(session?.email || session?.userEmail || session?.user_id);
  if (!email || DEMO_IDENTITIES.has(email)) return "";
  return email;
}

async function readJsonResponse(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

function signedHeaders(storage) {
  return buildApiIdentityHeaders({
    storage,
    headers: { Accept: "application/json" },
  });
}

export async function hydrateAuthenticatedCollectionsToStorage({
  fetchImpl = globalThis?.fetch,
  storage = globalThis?.localStorage,
} = {}) {
  if (typeof fetchImpl !== "function" || typeof storage?.setItem !== "function") {
    return { ok: false, hydrated: [], failures: ["storage_unavailable"] };
  }

  const hydrated = [];
  const failures = [];
  for (const group of AUTHENTICATED_COLLECTION_GROUPS) {
    try {
      const response = await fetchImpl(group.path, {
        method: "GET",
        credentials: "same-origin",
        headers: signedHeaders(storage),
      });
      const payload = await readJsonResponse(response);
      if (!response?.ok || payload?.ok === false || payload?.error) {
        failures.push(`${group.path}:${payload?.error || response?.status || "failed"}`);
        continue;
      }
      for (const binding of group.fields) {
        if (!Array.isArray(payload?.[binding.field])) continue;
        storage.setItem(binding.storageKey, JSON.stringify(payload[binding.field]));
        hydrated.push(binding.storageKey);
      }
    } catch (error) {
      failures.push(`${group.path}:${String(error?.message || "failed")}`);
    }
  }
  return { ok: hydrated.length > 0, hydrated, failures };
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

  try {
    const response = await fetchImpl(config.path, {
      method: "GET",
      credentials: "same-origin",
      headers: signedHeaders(storage),
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
