import { buildApiIdentityHeaders } from "./apiIdentityHeaders.js";
import { createSchedulePersistenceService } from "./schedulePersistenceService.js";
import { createPlayerProfilePersistenceService } from "./playerProfilePersistenceService.js";

const BRIDGE_MARKER = Symbol.for("shotlab.apiIdentityFetchBridge");
const SIGNED_SCHEDULE_RESOURCES = new Set(["events", "rsvps"]);

function readRequester(storage = globalThis?.localStorage) {
  try {
    const raw = storage?.getItem?.("sl:session");
    if (!raw) return "";
    const parsed = JSON.parse(raw);
    const session = Array.isArray(parsed) ? parsed[0] : parsed;
    return String(session?.email || session?.userEmail || session?.user_id || "").trim().toLowerCase();
  } catch {
    return "";
  }
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

function signedScheduleResourceFor(input, target = globalThis) {
  try {
    const raw = rawUrlFor(input);
    if (!raw) return "";
    const base = target?.location?.origin || "https://shotlab.invalid";
    const url = new URL(raw, base);
    if (!/(^|\.)supabase\.co$/i.test(url.hostname) && url.hostname !== "example.supabase.co") return "";
    const match = url.pathname.match(/\/rest\/v1\/(events|rsvps)\/?$/i);
    const resource = String(match?.[1] || "").toLowerCase();
    return SIGNED_SCHEDULE_RESOURCES.has(resource) ? resource : "";
  } catch {
    return "";
  }
}

function signedPlayerProfileResourceFor(input, target = globalThis) {
  try {
    const raw = rawUrlFor(input);
    if (!raw) return false;
    const base = target?.location?.origin || "https://shotlab.invalid";
    const url = new URL(raw, base);
    if (!/(^|\.)supabase\.co$/i.test(url.hostname) && url.hostname !== "example.supabase.co") return false;
    return /\/rest\/v1\/player_profiles\/?$/i.test(url.pathname);
  } catch {
    return false;
  }
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

export function installApiIdentityFetchBridge(target = globalThis) {
  if (!target || typeof target.fetch !== "function") return null;
  if (target.fetch?.[BRIDGE_MARKER]) return target.fetch;

  const originalFetch = target.fetch.bind(target);
  const schedulePersistence = createSchedulePersistenceService({
    fetchImpl: originalFetch,
    storage: target?.localStorage,
  });
  const playerProfilePersistence = createPlayerProfilePersistenceService({
    fetchImpl: originalFetch,
    storage: target?.localStorage,
  });

  const wrappedFetch = async (input, init = {}) => {
    if (signedPlayerProfileResourceFor(input, target)) {
      try {
        const method = methodFor(input, init);
        if (method === "GET") {
          const result = await playerProfilePersistence.loadProfiles();
          return jsonResponse(target, result.rows, 200);
        }
        if (method === "POST") {
          const rows = parseRows(init?.body);
          const result = await playerProfilePersistence.syncProfiles(rows);
          return jsonResponse(target, result.rows, 200);
        }
        return jsonResponse(target, { error: "method_not_allowed" }, 405);
      } catch (error) {
        return jsonResponse(
          target,
          error?.body && typeof error.body === "object" ? error.body : { error: String(error?.code || error?.message || "profile_api_failed") },
          Number(error?.status || 500) || 500,
        );
      }
    }

    const scheduleResource = signedScheduleResourceFor(input, target);
    if (scheduleResource) {
      try {
        const method = methodFor(input, init);
        const isEvents = scheduleResource === "events";
        if (method === "GET") {
          const result = isEvents
            ? await schedulePersistence.loadEvents()
            : await schedulePersistence.loadRsvps();
          return jsonResponse(target, result.rows, 200);
        }
        if (method === "POST") {
          const rows = parseRows(init?.body);
          const result = isEvents
            ? await schedulePersistence.syncEvents(rows)
            : await schedulePersistence.syncRsvps(rows);
          return jsonResponse(target, result.rows, 200);
        }
        return jsonResponse(target, { error: "method_not_allowed" }, 405);
      } catch (error) {
        return jsonResponse(
          target,
          error?.body && typeof error.body === "object" ? error.body : { error: String(error?.code || error?.message || "schedule_api_failed") },
          Number(error?.status || 500) || 500,
        );
      }
    }

    if (!apiPathFor(input, target)) return originalFetch(input, init);

    const currentHeaders = new Headers(
      init?.headers || (typeof input === "object" && input?.headers ? input.headers : undefined),
    );
    const identityHeaders = buildApiIdentityHeaders({
      requester: readRequester(target?.localStorage),
      storage: target?.localStorage,
    });
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
  signedScheduleResourceFor,
  signedPlayerProfileResourceFor,
  methodFor,
  parseRows,
  BRIDGE_MARKER,
};
