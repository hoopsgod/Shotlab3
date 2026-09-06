import { cleanValue as clean, readActorContext, requestError, requestSignedJson, signedStorageMode } from "./apiIdentityHeaders.js";

function readContext(storage = globalThis?.localStorage) {
  const { requester, teamId } = readActorContext(storage);
  return { requester, teamId };
}

export function createSchedulePersistenceService({
  fetchImpl = globalThis?.fetch,
  storage = globalThis?.localStorage,
} = {}) {
  const loadCollection = async (resource, field, teamId = "") => {
    if (typeof fetchImpl !== "function") return { ok: false, unavailable: true, rows: [] };
    const context = readContext(storage);
    const activeTeamId = clean(teamId || context.teamId);
    const query = activeTeamId ? `?team_id=${encodeURIComponent(activeTeamId)}` : "";
    const [body, response] = await requestSignedJson(fetchImpl, `/v1/${resource}${query}`, "GET", storage);
    if (!response?.ok || body?.error) throw requestError(body, response, `${resource}_load_failed`);
    return {
      ok: true,
      storageMode: signedStorageMode(body),
      rows: Array.isArray(body?.[field]) ? body[field] : [],
    };
  };

  const syncCollection = async (resource, field, rows = [], teamId = "") => {
    if (typeof fetchImpl !== "function") throw new Error(`${resource}_api_unavailable`);
    const context = readContext(storage);
    const activeTeamId = clean(teamId || context.teamId || rows?.[0]?.team_id || rows?.[0]?.teamId);
    if (!activeTeamId) throw new Error(`${resource}_team_required`);
    const [body, response] = await requestSignedJson(fetchImpl, `/v1/${resource}`, "POST", storage, { team_id: activeTeamId, [field]: Array.isArray(rows) ? rows : [] });
    if (!response?.ok || body?.error) throw requestError(body, response, `${resource}_sync_failed`);
    return {
      ok: true,
      storageMode: signedStorageMode(body),
      rows: Array.isArray(body?.[field]) ? body[field] : [],
      deletedCount: Number(body?.deleted_count || 0),
    };
  };

  return {
    loadEvents: ({ teamId = "" } = {}) => loadCollection("events", "events", teamId),
    syncEvents: (events, { teamId = "" } = {}) => syncCollection("events", "events", events, teamId),
    loadRsvps: ({ teamId = "" } = {}) => loadCollection("rsvps", "rsvps", teamId),
    syncRsvps: (rsvps, { teamId = "" } = {}) => syncCollection("rsvps", "rsvps", rsvps, teamId),
    readContext: () => readContext(storage),
  };
}

export const __testUtils = { readContext };
