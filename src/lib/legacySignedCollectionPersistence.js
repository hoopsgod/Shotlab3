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
      headers: { Accept: "application/json" },
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
