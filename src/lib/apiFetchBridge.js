import { buildApiIdentityHeaders } from "./apiIdentityHeaders.js";
import { createSchedulePersistenceService } from "./schedulePersistenceService.js";
import { createPlayerProfilePersistenceService } from "./playerProfilePersistenceService.js";
import { createPlayerIdentityPersistenceService } from "./playerIdentityPersistenceService.js";

const BRIDGE_MARKER = Symbol.for("shotlab.apiIdentityFetchBridge");
const SIGNED_SCHEDULE_RESOURCES = new Set(["events", "rsvps"]);

function parseStored(storage, key, fallback) {
  try {
    const raw = storage?.getItem?.(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function normalizeIdentity(value) {
  return String(value || "").trim().toLowerCase();
}

function readSession(storage = globalThis?.localStorage) {
  const parsed = parseStored(storage, "sl:session", null);
  return Array.isArray(parsed) ? parsed[0] : parsed;
}

function readRequester(storage = globalThis?.localStorage) {
  const session = readSession(storage);
  return normalizeIdentity(session?.email || session?.userEmail || session?.user_id);
}

function isDemoRequester(requester) {
  return requester === "coach.demo@shotlab.app" || requester === "demo@shotlab.app";
}

function prunePlayerCache(storage = globalThis?.localStorage) {
  const session = readSession(storage);
  const requester = normalizeIdentity(session?.email || session?.userEmail || session?.user_id);
  if (!requester || isDemoRequester(requester)) return [];

  const players = parseStored(storage, "sl:players", []);
  if (!Array.isArray(players) || !players.length) return [];
  const actor = players.find((row) => normalizeIdentity(row?.email) === requester);
  const role = normalizeIdentity(session?.role || actor?.role);
  const teamId = String(session?.teamId || session?.team_id || actor?.teamId || actor?.team_id || "").trim();

  const filtered = players.filter((row) => {
    if (normalizeIdentity(row?.email) === requester) return true;
    if ((role === "coach" || role === "assistant_coach") && teamId) {
      return String(row?.teamId || row?.team_id || "").trim() === teamId;
    }
    return false;
  });
  if (filtered.length !== players.length) {
    try { storage?.setItem?.("sl:players", JSON.stringify(filtered)); } catch {}
  }
  return filtered;
}

function prunePlayerProfileCache(storage = globalThis?.localStorage) {
  const session = readSession(storage);
  const requester = normalizeIdentity(session?.email || session?.userEmail || session?.user_id);
  if (!requester || isDemoRequester(requester)) return [];

  const players = parseStored(storage, "sl:players", []);
  const actor = (Array.isArray(players) ? players : []).find((row) => normalizeIdentity(row?.email) === requester);
  const role = normalizeIdentity(session?.role || actor?.role);
  const teamId = String(session?.teamId || session?.team_id || actor?.teamId || actor?.team_id || "").trim();
  const profiles = parseStored(storage, "sl:player-profiles", []);
  if (!Array.isArray(profiles) || !profiles.length) return [];

  let filtered = profiles;
  if (role === "player") {
    filtered = profiles.filter((row) => normalizeIdentity(row?.userId || row?.user_id || row?.email || row?.player_email) === requester);
  } else if ((role === "coach" || role === "assistant_coach") && teamId) {
    filtered = profiles.filter((row) => String(row?.teamId || row?.team_id || "").trim() === teamId);
  } else {
    return profiles;
  }

  if (filtered.length !== profiles.length) {
    try { storage?.setItem?.("sl:player-profiles", JSON.stringify(filtered)); } catch {}
  }
  return filtered;
}

function rawUrlFor(input) {
  return typeof input === "string" || input instanceof URL ? String(input) : String(input?.url || "");
}

function apiPathFor(input, target = globalThis) {
  try {
    const raw = rawUrlFor(input);
    if (!raw) return "";
    if (raw.startsWith("/v1/")) return raw;
    const base = target?.location?.origin || "https://shotlab.invalid";
    const url = new URL(raw, base);
    if (target?.location?.origin && url.origin !== target.location.origin) return "";
    return url.pathname.startsWith("/v1/") ? `${url.pathname}${url.search}` : "";
  } catch {
    return "";
  }
}

function signedSupabaseResourceFor(input, target = globalThis) {
  try {
    const raw = rawUrlFor(input);
    if (!raw) return "";
    const base = target?.location?.origin || "https://shotlab.invalid";
    const url = new URL(raw, base);
    if (!/(^|\.)supabase\.co$/i.test(url.hostname) && url.hostname !== "example.supabase.co") return "";
    const match = url.pathname.match(/\/rest\/v1\/(events|rsvps|player_profiles|players)\/?$/i);
    return String(match?.[1] || "").toLowerCase();
  } catch {
    return "";
  }
}

function signedScheduleResourceFor(input, target = globalThis) {
  const resource = signedSupabaseResourceFor(input, target);
  return SIGNED_SCHEDULE_RESOURCES.has(resource) ? resource : "";
}

function signedPlayerProfileResourceFor(input, target = globalThis) {
  return signedSupabaseResourceFor(input, target) === "player_profiles";
}

function signedPlayerResourceFor(input, target = globalThis) {
  return signedSupabaseResourceFor(input, target) === "players";
}

function methodFor(input, init = {}) {
  return String(init?.method || (typeof input === "object" ? input?.method : "") || "GET").toUpperCase();
}

function parseRows(body) {
  if (Array.isArray(body)) return body;
  if (typeof body !== "string" || !body.trim()) return [];
  try {
    const parsed = JSON.parse(body);
    return Array.isArray(parsed) ? parsed : parsed ? [parsed] : [];
  } catch {
    return [];
  }
}

function jsonResponse(target, payload, status = 200) {
  const ResponseCtor = target?.Response || globalThis.Response;
  return new ResponseCtor(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function errorResponse(target, error, fallback) {
  return jsonResponse(
    target,
    error?.body && typeof error.body === "object" ? error.body : { error: String(error?.code || error?.message || fallback) },
    Number(error?.status || 500) || 500,
  );
}

export function installApiIdentityFetchBridge(target = globalThis) {
  if (!target || typeof target.fetch !== "function") return null;
  if (target.fetch?.[BRIDGE_MARKER]) return target.fetch;

  prunePlayerCache(target?.localStorage);
  prunePlayerProfileCache(target?.localStorage);
  const originalFetch = target.fetch.bind(target);
  const schedulePersistence = createSchedulePersistenceService({ fetchImpl: originalFetch, storage: target?.localStorage });
  const playerProfilePersistence = createPlayerProfilePersistenceService({ fetchImpl: originalFetch, storage: target?.localStorage });
  const playerIdentityPersistence = createPlayerIdentityPersistenceService({ fetchImpl: originalFetch, storage: target?.localStorage });

  const wrappedFetch = async (input, init = {}) => {
    if (signedPlayerResourceFor(input, target)) {
      try {
        const method = methodFor(input, init);
        if (method === "GET") {
          const result = await playerIdentityPersistence.loadPlayers();
          try { target?.localStorage?.setItem?.("sl:players", JSON.stringify(result.rows)); } catch {}
          return jsonResponse(target, result.rows, 200);
        }
        if (method === "POST") {
          const result = await playerIdentityPersistence.syncPlayers(parseRows(init?.body), { replace: true });
          return jsonResponse(target, result.rows, 200);
        }
        return jsonResponse(target, { error: "method_not_allowed" }, 405);
      } catch (error) {
        return errorResponse(target, error, "player_api_failed");
      }
    }

    if (signedPlayerProfileResourceFor(input, target)) {
      try {
        const method = methodFor(input, init);
        if (method === "GET") {
          const result = await playerProfilePersistence.loadProfiles();
          try { target?.localStorage?.setItem?.("sl:player-profiles", JSON.stringify(result.rows)); } catch {}
          return jsonResponse(target, result.rows, 200);
        }
        if (method === "POST") {
          const result = await playerProfilePersistence.syncProfiles(parseRows(init?.body));
          return jsonResponse(target, result.rows, 200);
        }
        return jsonResponse(target, { error: "method_not_allowed" }, 405);
      } catch (error) {
        return errorResponse(target, error, "profile_api_failed");
      }
    }

    const scheduleResource = signedScheduleResourceFor(input, target);
    if (scheduleResource) {
      try {
        const method = methodFor(input, init);
        const isEvents = scheduleResource === "events";
        if (method === "GET") {
          const result = isEvents ? await schedulePersistence.loadEvents() : await schedulePersistence.loadRsvps();
          return jsonResponse(target, result.rows, 200);
        }
        if (method === "POST") {
          const rows = parseRows(init?.body);
          const result = isEvents ? await schedulePersistence.syncEvents(rows) : await schedulePersistence.syncRsvps(rows);
          return jsonResponse(target, result.rows, 200);
        }
        return jsonResponse(target, { error: "method_not_allowed" }, 405);
      } catch (error) {
        return errorResponse(target, error, "schedule_api_failed");
      }
    }

    if (!apiPathFor(input, target)) return originalFetch(input, init);
    const currentHeaders = new Headers(init?.headers || (typeof input === "object" && input?.headers ? input.headers : undefined));
    const identityHeaders = buildApiIdentityHeaders({ requester: readRequester(target?.localStorage), storage: target?.localStorage });
    for (const [key, value] of Object.entries(identityHeaders)) {
      if (value && !currentHeaders.has(key)) currentHeaders.set(key, value);
    }
    return originalFetch(input, { ...init, headers: currentHeaders });
  };
  Object.defineProperty(wrappedFetch, BRIDGE_MARKER, { value: true });
  target.fetch = wrappedFetch;
  return wrappedFetch;
}

export const __testUtils = {
  apiPathFor,
  readRequester,
  prunePlayerCache,
  prunePlayerProfileCache,
  signedSupabaseResourceFor,
  signedScheduleResourceFor,
  signedPlayerProfileResourceFor,
  signedPlayerResourceFor,
  methodFor,
  parseRows,
  BRIDGE_MARKER,
};
