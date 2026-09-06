import { cleanValue as clean, readActorContext as readContext, requestError, requestSignedJson, signedStorageMode } from "./apiIdentityHeaders.js";

const RESOURCES = new Set(["sessions", "rsvps", "logs"]);

export function createStrengthConditioningPersistenceService({
  fetchImpl = globalThis?.fetch,
  storage = globalThis?.localStorage,
} = {}) {
  const loadState = async ({ teamId = "" } = {}) => {
    if (typeof fetchImpl !== "function") return { ok: false, unavailable: true, sessions: [], rsvps: [], logs: [] };
    const context = readContext(storage);
    const activeTeamId = clean(teamId || context.teamId);
    const query = activeTeamId ? `?team_id=${encodeURIComponent(activeTeamId)}` : "";
    const [body, response] = await requestSignedJson(fetchImpl, `/v1/strength-conditioning${query}`, "GET", storage);
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
      storageMode: signedStorageMode(body),
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
    const [body, response] = await requestSignedJson(fetchImpl, "/v1/strength-conditioning", "POST", storage, { team_id: activeTeamId, resource, rows: Array.isArray(rows) ? rows : [] });
    if (!response?.ok || body?.ok !== true || !Array.isArray(body?.rows) || body?.error) {
      throw requestError(body, response, `strength_conditioning_${resource}_sync_failed`);
    }
    return {
      ok: true,
      storageMode: signedStorageMode(body),
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
