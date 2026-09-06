import { cleanValue as clean, readActorContext as readContext, requestError, requestSignedJson, signedStorageMode } from "./apiIdentityHeaders.js";

export function createPlayerProfilePersistenceService({
  fetchImpl = globalThis?.fetch,
  storage = globalThis?.localStorage,
} = {}) {
  const loadProfiles = async ({ teamId = "" } = {}) => {
    if (typeof fetchImpl !== "function") return { ok: false, unavailable: true, rows: [] };
    const context = readContext(storage);
    const activeTeamId = clean(teamId || context.teamId);
    const query = activeTeamId ? `?team_id=${encodeURIComponent(activeTeamId)}` : "";
    const [body, response] = await requestSignedJson(fetchImpl, `/v1/player-profiles${query}`, "GET", storage);
    if (!response?.ok || body?.error) throw requestError(body, response, "profile_load_failed");
    return {
      ok: true,
      storageMode: signedStorageMode(body),
      rows: Array.isArray(body?.profiles) ? body.profiles : [],
    };
  };

  const syncProfiles = async (profiles = [], { teamId = "" } = {}) => {
    if (typeof fetchImpl !== "function") throw new Error("profile_api_unavailable");
    const context = readContext(storage);
    const activeTeamId = clean(teamId || context.teamId || profiles?.[0]?.team_id || profiles?.[0]?.teamId);
    if (!activeTeamId) throw new Error("profile_team_required");
    const scopedProfiles = (Array.isArray(profiles) ? profiles : []).filter((row) => {
      const rowTeamId = clean(row?.team_id || row?.teamId);
      return !rowTeamId || rowTeamId === activeTeamId;
    });
    const [body, response] = await requestSignedJson(fetchImpl, "/v1/player-profiles", "POST", storage, { team_id: activeTeamId, profiles: scopedProfiles });
    if (!response?.ok || body?.error) throw requestError(body, response, "profile_sync_failed");
    return {
      ok: true,
      storageMode: signedStorageMode(body),
      rows: Array.isArray(body?.profiles) ? body.profiles : [],
      ignoredCount: Number(body?.ignored_count || 0),
    };
  };

  return {
    loadProfiles,
    syncProfiles,
    readContext: () => readContext(storage),
  };
}

export const __testUtils = { readContext };
