import { requestError, requestSignedJson, signedStorageMode } from "./apiIdentityHeaders.js";

export function createShotLogPersistenceService({
  fetchImpl = globalThis?.fetch,
  storage = globalThis?.localStorage,
} = {}) {
  const loadShotLogs = async ({ teamId = "" } = {}) => {
    if (typeof fetchImpl !== "function") return { ok: false, unavailable: true, shotLogs: [] };
    const activeTeamId = String(teamId || "").trim();
    const [body, response] = await requestSignedJson(fetchImpl, `/v1/shot-logs${activeTeamId ? `?team_id=${encodeURIComponent(activeTeamId)}` : ""}`, "GET", storage);
    if (!response?.ok || body?.error) throw requestError(body, response, "shot_log_load_failed");
    return {
      ok: true,
      storageMode: signedStorageMode(body),
      shotLogs: Array.isArray(body?.shot_logs) ? body.shot_logs : [],
    };
  };

  return { loadShotLogs };
}
