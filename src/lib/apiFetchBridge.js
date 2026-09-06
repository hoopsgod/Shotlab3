import { buildApiIdentityHeaders } from "./apiIdentityHeaders.js";
import { createSchedulePersistenceService } from "./schedulePersistenceService.js";
import { createPlayerProfilePersistenceService } from "./playerProfilePersistenceService.js";
import { createPlayerIdentityPersistenceService } from "./playerIdentityPersistenceService.js";
import { createTeamPersistenceService } from "./teamPersistenceService.js";
import { createStrengthConditioningPersistenceService } from "./strengthConditioningPersistenceService.js";

const BRIDGE_MARKER = Symbol.for("shotlab.apiIdentityFetchBridge");

export function parseStored(storage, key, fallback) {
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function writeStored(storage, key, value) {
  try {
    if (value === null) storage.removeItem(key);
    else storage.setItem(key, value);
  } catch {}
}

export function normalizeIdentity(value) {
  return String(value || "").trim().toLowerCase();
}

export function readSession(storage = globalThis.localStorage) {
  const parsed = parseStored(storage, "sl:session", null);
  return Array.isArray(parsed) ? parsed[0] : parsed;
}

export function readRequester(storage = globalThis.localStorage) {
  const session = readSession(storage);
  return normalizeIdentity(session?.email || session?.userEmail || session?.user_id);
}

export const signedStorageMode = (body) => String(body?.storage_mode || "signed_api");

export async function requestSignedBody(fetchImpl, path, method, storage, data, fallback) {
  const response = await fetchImpl(path, {
    method,
    headers: buildApiIdentityHeaders({ requester: readRequester(storage), storage, headers: data == null ? {} : { "Content-Type": "application/json" } }),
    ...(data == null ? {} : { body: JSON.stringify(data) }),
  });
  let body;
  try { body = await response.json(); } catch { body = {}; }
  if (!response?.ok || body?.ok === false || body?.error) {
    const code = String(body?.error || fallback), error = new Error(code);
    error.code = code; error.status = Number(response?.status || 0); error.body = body; throw error;
  }
  return body;
}

function isDemoRequester(requester) {
  return requester === "coach.demo@shotlab.app" || requester === "demo@shotlab.app";
}

function readActorContext(storage = globalThis.localStorage) {
  const session = readSession(storage);
  const requester = normalizeIdentity(session?.email || session?.userEmail || session?.user_id);
  const players = parseStored(storage, "sl:players", []);
  const actor = (Array.isArray(players) ? players : []).find((row) => normalizeIdentity(row?.email) === requester);
  return {
    requester,
    role: normalizeIdentity(session?.role || actor?.role),
    teamId: String(session?.teamId || session?.team_id || actor?.teamId || actor?.team_id || "").trim(),
  };
}

function pruneTeamCache(storage = globalThis.localStorage) {
  const { requester, teamId } = readActorContext(storage);
  if (!requester || isDemoRequester(requester)) return [];
  const teams = parseStored(storage, "sl:teams", []);
  if (!Array.isArray(teams) || !teams.length || !teamId) return Array.isArray(teams) ? teams : [];
  const filtered = teams.filter((row) => String(row?.id || row?.teamId || row?.team_id || "").trim() === teamId);
  if (filtered.length !== teams.length) writeStored(storage, "sl:teams", JSON.stringify(filtered));
  return filtered;
}

function prunePlayerCache(storage = globalThis.localStorage) {
  const { requester, role, teamId } = readActorContext(storage);
  if (!requester || isDemoRequester(requester)) return [];
  const players = parseStored(storage, "sl:players", []);
  if (!Array.isArray(players) || !players.length) return [];
  const filtered = players.filter((row) => {
    if (normalizeIdentity(row?.email) === requester) return true;
    if ((role === "coach" || role === "assistant_coach") && teamId) {
      return String(row?.teamId || row?.team_id || "").trim() === teamId;
    }
    return false;
  });
  if (filtered.length !== players.length) writeStored(storage, "sl:players", JSON.stringify(filtered));
  return filtered;
}

function prunePlayerProfileCache(storage = globalThis.localStorage) {
  const { requester, role, teamId } = readActorContext(storage);
  if (!requester || isDemoRequester(requester)) return [];
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
  if (filtered.length !== profiles.length) writeStored(storage, "sl:player-profiles", JSON.stringify(filtered));
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
    const match = url.pathname.match(/\/rest\/v1\/(events|rsvps|player_profiles|players|teams|sc_sessions|sc_rsvps|sc_logs)\/?$/i);
    return String(match?.[1] || "").toLowerCase();
  } catch {
    return "";
  }
}

function signedScheduleResourceFor(input, target = globalThis) {
  const resource = signedSupabaseResourceFor(input, target);
  return resource === "events" || resource === "rsvps" ? resource : "";
}

function signedPlayerProfileResourceFor(input, target = globalThis) {
  return signedSupabaseResourceFor(input, target) === "player_profiles";
}

function signedPlayerResourceFor(input, target = globalThis) {
  return signedSupabaseResourceFor(input, target) === "players";
}

function signedTeamResourceFor(input, target = globalThis) {
  return signedSupabaseResourceFor(input, target) === "teams";
}

function signedStrengthResourceFor(input, target = globalThis) {
  const resource = signedSupabaseResourceFor(input, target);
  if (resource === "sc_sessions") return "sessions";
  if (resource === "sc_rsvps") return "rsvps";
  if (resource === "sc_logs") return "logs";
  return "";
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
  return new target.Response(JSON.stringify(payload), {
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

const methodNotAllowed = (target) => jsonResponse(target, { error: "method_not_allowed" }, 405);

export function installApiIdentityFetchBridge(target = globalThis) {
  if (!target || typeof target.fetch !== "function") return null;
  if (target.fetch[BRIDGE_MARKER]) return target.fetch;

  const storage = target.localStorage;
  pruneTeamCache(storage);
  prunePlayerCache(storage);
  prunePlayerProfileCache(storage);
  const originalFetch = target.fetch.bind(target);
  const schedulePersistence = createSchedulePersistenceService({ fetchImpl: originalFetch, storage });
  const playerProfilePersistence = createPlayerProfilePersistenceService({ fetchImpl: originalFetch, storage });
  const playerIdentityPersistence = createPlayerIdentityPersistenceService({ fetchImpl: originalFetch, storage });
  const teamPersistence = createTeamPersistenceService({ fetchImpl: originalFetch, storage });
  const strengthPersistence = createStrengthConditioningPersistenceService({ fetchImpl: originalFetch, storage });

  const wrappedFetch = async (input, init = {}) => {
    const signedResource = signedSupabaseResourceFor(input, target);
    const method = signedResource ? methodFor(input, init) : "";
    const strengthResource = signedResource.startsWith("sc_") ? signedResource.slice(3) : "";
    if (strengthResource) {
      try {
        if (method === "GET") {
          const result = await strengthPersistence.loadState();
          return jsonResponse(target, result[strengthResource]);
        }
        if (method === "POST") {
          const rows = parseRows(init?.body);
          const methodName = `sync${strengthResource[0].toUpperCase()}${strengthResource.slice(1)}`;
          const result = await strengthPersistence[methodName](rows);
          return jsonResponse(target, result.rows);
        }
        return methodNotAllowed(target);
      } catch (error) {
        return errorResponse(target, error, "strength_conditioning_api_failed");
      }
    }

    if (signedResource === "teams") {
      try {
        if (method === "GET") {
          const result = await teamPersistence.loadTeams();
          writeStored(storage, "sl:teams", JSON.stringify(result.rows));
          return jsonResponse(target, result.rows);
        }
        if (method === "POST") {
          const result = await teamPersistence.syncTeams(parseRows(init?.body));
          return jsonResponse(target, result.rows);
        }
        return methodNotAllowed(target);
      } catch (error) {
        return errorResponse(target, error, "team_api_failed");
      }
    }

    if (signedResource === "players") {
      try {
        if (method === "GET") {
          const result = await playerIdentityPersistence.loadPlayers();
          writeStored(storage, "sl:players", JSON.stringify(result.rows));
          return jsonResponse(target, result.rows);
        }
        if (method === "POST") {
          const result = await playerIdentityPersistence.syncPlayers(parseRows(init?.body), { replace: true });
          return jsonResponse(target, result.rows);
        }
        return methodNotAllowed(target);
      } catch (error) {
        return errorResponse(target, error, "player_api_failed");
      }
    }

    if (signedResource === "player_profiles") {
      try {
        if (method === "GET") {
          const result = await playerProfilePersistence.loadProfiles();
          writeStored(storage, "sl:player-profiles", JSON.stringify(result.rows));
          return jsonResponse(target, result.rows);
        }
        if (method === "POST") {
          const result = await playerProfilePersistence.syncProfiles(parseRows(init?.body));
          return jsonResponse(target, result.rows);
        }
        return methodNotAllowed(target);
      } catch (error) {
        return errorResponse(target, error, "profile_api_failed");
      }
    }

    const scheduleResource = signedResource === "events" || signedResource === "rsvps" ? signedResource : "";
    if (scheduleResource) {
      try {
        const isEvents = scheduleResource === "events";
        if (method === "GET") {
          const result = isEvents ? await schedulePersistence.loadEvents() : await schedulePersistence.loadRsvps();
          return jsonResponse(target, result.rows);
        }
        if (method === "POST") {
          const rows = parseRows(init?.body);
          const pending = !isEvents && readSession(storage)?.rp;
          if (pending) writeStored(storage, "sl:rp", pending);
          const result = isEvents ? await schedulePersistence.syncEvents(rows) : await schedulePersistence.syncRsvps(rows);
          if (pending) writeStored(storage, "sl:rp", null);
          return jsonResponse(target, result.rows);
        }
        return methodNotAllowed(target);
      } catch (error) {
        return errorResponse(target, error, "schedule_api_failed");
      }
    }

    if (!apiPathFor(input, target)) return originalFetch(input, init);
    const currentHeaders = new Headers(init?.headers || (typeof input === "object" && input?.headers ? input.headers : undefined));
    const identityHeaders = buildApiIdentityHeaders({ requester: readRequester(storage), storage });
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
  pruneTeamCache,
  prunePlayerCache,
  prunePlayerProfileCache,
  signedSupabaseResourceFor,
  signedScheduleResourceFor,
  signedPlayerProfileResourceFor,
  signedPlayerResourceFor,
  signedTeamResourceFor,
  signedStrengthResourceFor,
  methodFor,
  parseRows,
  BRIDGE_MARKER,
};
