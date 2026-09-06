import { cleanValue as clean, readActorContext as readContext, requestError, requestSignedJson, signedStorageMode } from "./apiIdentityHeaders.js";

export function createPlayerIdentityPersistenceService({
  fetchImpl = globalThis?.fetch,
  storage = globalThis?.localStorage,
} = {}) {
  const loadPlayers = async ({ teamId = "" } = {}) => {
    if (typeof fetchImpl !== "function") return { ok: false, unavailable: true, rows: [] };
    const context = readContext(storage);
    const activeTeamId = clean(teamId || context.teamId);
    const query = activeTeamId ? `?team_id=${encodeURIComponent(activeTeamId)}` : "";
    const [body, response] = await requestSignedJson(fetchImpl, `/v1/players${query}`, "GET", storage);
    if (!response?.ok || body?.error) throw requestError(body, response, "player_load_failed");
    return {
      ok: true,
      storageMode: signedStorageMode(body),
      rows: Array.isArray(body?.players) ? body.players : [],
    };
  };

  const syncPlayers = async (players = [], { replace = true } = {}) => {
    if (typeof fetchImpl !== "function") throw new Error("player_api_unavailable");
    const [body, response] = await requestSignedJson(fetchImpl, "/v1/players", "POST", storage, { players: Array.isArray(players) ? players : [], replace: replace === true });
    if (!response?.ok || body?.error) throw requestError(body, response, "player_sync_failed");
    return {
      ok: true,
      storageMode: signedStorageMode(body),
      rows: Array.isArray(body?.players) ? body.players : [],
      ignoredCount: Number(body?.ignored_count || 0),
      deletedSelf: body?.deleted_self === true,
    };
  };

  return { loadPlayers, syncPlayers, readContext: () => readContext(storage) };
}

export const __testUtils = { readContext };
