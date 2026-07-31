import { buildApiIdentityHeaders } from "./apiIdentityHeaders.js";

const normalizeIdentity = (value) => String(value || "").trim().toLowerCase();
const clean = (value) => String(value ?? "").trim();
const RESOURCES = new Set(["sessions", "rsvps", "logs"]);

function parseStored(storage, key, fallback) {
  try {
    const raw = storage?.getItem?.(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function readContext(storage = globalThis?.localStorage) {
  const rawSession = parseStored(storage, "sl:session", null);
  const session = Array.isArray(rawSession) ? rawSession[0] : rawSession;
  const requester = normalizeIdentity(session?.email || session?.userEmail || session?.user_id);
  const players = parseStored(storage, "sl:players", []);
  const actor = (Array.isArray(players) ? players : []).find((row) => normalizeIdentity(row?.email) === requester);
  const teamId = clean(session?.teamId || session?.team_id || actor?.teamId || actor?.team_id);
  return { requester, teamId, role: normalizeIdentity(session?.role || actor?.role) };
}

async function readJson(response) {
  try { return await response.json(); } catch { return {}; }
}

function requestError(body, response, fallback) {
  const error = new Error(String(body?.error || fallback));
  error.code = String(body?.error || fallback);
  error.status = Number(response?.status || 0);
  error.body = body;
  return error;
}

export function createStrengthConditioningPersistenceService({
  fetchImpl = globalThis?.fetch,
  storage = globalThis?.localStorage,
} = {}) {
  const headers = (extra = {}) => {
    const context = readContext(storage);
    return buildApiIdentityHeaders({ requester: context.requester, storage, headers: extra });
  };

  const loadState = async ({ teamId = "" } = {}) => {
    if (typeof fetchImpl !== "function") return { ok: false, unavailable: true, sessions: [], rsvps: [], logs: [] };
    const context = readContext(storage);
    const activeTeamId = clean(teamId || context.teamId);
    const query = activeTeamId ? `?team_id=${encodeURIComponent(activeTeamId)}` : "";
    const response = await fetchImpl(`/v1/strength-conditioning${query}`, {
      method: "GET",
      headers: headers(),
    });
    const body = await readJson(response);
    if (
      !response?.ok
      || body?.ok !== true
      || !Array.isArray(body?.sessions)
      || !Array.isArray(body?.rsvps)
      || !Array.isArray(body?.logs)
      || body?.error
    ) {
      throw requestError(body, response, "strength_conditioning_load_failed");
    }
    return {
      ok: true,
      storageMode: String(body?.storage_mode || "signed_api"),
      teamId: clean(body?.team_id || activeTeamId),
      canWriteSessions: body?.can_write_sessions === true,
      sessions: body.sessions,
      rsvps: body.rsvps,
      logs: body.logs,
    };
  };

  const syncCollection = async (resource, rows = [], { teamId = "" } = {}) => {
    if (!RESOURCES.has(resource)) throw new Error("strength_conditioning_resource_invalid");
    if (typeof fetchImpl !== "function") throw new Error("strength_conditioning_api_unavailable");
    const context = readContext(storage);
    const activeTeamId = clean(teamId || context.teamId || rows?.[0]?.team_id || rows?.[0]?.teamId);
    if (!activeTeamId) throw new Error("strength_conditioning_team_required");
    const response = await fetchImpl("/v1/strength-conditioning", {
      method: "POST",
      headers: headers({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        team_id: activeTeamId,
        resource,
        rows: Array.isArray(rows) ? rows : [],
      }),
    });
    const body = await readJson(response);
    if (!response?.ok || body?.ok !== true || !Array.isArray(body?.rows) || body?.error) {
      throw requestError(body, response, `strength_conditioning_${resource}_sync_failed`);
    }
    return {
      ok: true,
      storageMode: String(body?.storage_mode || "signed_api"),
      teamId: clean(body?.team_id || activeTeamId),
      rows: body.rows,
      deletedCount: Number(body?.deleted_count || 0),
    };
  };

  return {
    loadState,
    loadSessions: async (options = {}) => {
      const loaded = await loadState(options);
      return { ...loaded, rows: loaded.sessions };
    },
    loadRsvps: async (options = {}) => {
      const loaded = await loadState(options);
      return { ...loaded, rows: loaded.rsvps };
    },
    loadLogs: async (options = {}) => {
      const loaded = await loadState(options);
      return { ...loaded, rows: loaded.logs };
    },
    syncSessions: (rows, options = {}) => syncCollection("sessions", rows, options),
    syncRsvps: (rows, options = {}) => syncCollection("rsvps", rows, options),
    syncLogs: (rows, options = {}) => syncCollection("logs", rows, options),
    readContext: () => readContext(storage),
  };
}

export const __testUtils = { readContext };
