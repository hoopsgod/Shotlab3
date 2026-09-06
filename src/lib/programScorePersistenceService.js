import { normalizeIdentity, requestSignedBody, signedStorageMode } from "./apiFetchBridge.js";

export function createProgramScorePersistenceService({ fetchImpl = globalThis?.fetch, storage = globalThis?.localStorage } = {}) {
  const request = (method, data, teamId = "") => {
    if (typeof fetchImpl !== "function") throw new Error("program_score_api_unavailable");
    return requestSignedBody(fetchImpl, `/v1/program-scores${teamId ? `?team_id=${encodeURIComponent(teamId)}` : ""}`, method, storage, data, `program_score_${method === "GET" ? "load" : method === "POST" ? "write" : "delete"}_failed`);
  };

  const loadProgramScores = async ({ teamId = "" } = {}) => {
    if (typeof fetchImpl !== "function") return { ok: false, unavailable: true, programScores: [] };
    const body = await request("GET", null, String(teamId || "").trim());
    return { ok: true, storageMode: signedStorageMode(body), programScores: Array.isArray(body?.program_scores) ? body.program_scores : [] };
  };

  const upsertProgramScores = async (programScores = []) => {
    const rows = Array.isArray(programScores) ? programScores : [programScores];
    if (!rows.length) return { ok: true, programScores: [], storageMode: "local_only" };
    const body = await request("POST", { program_scores: rows });
    return { ok: true, storageMode: signedStorageMode(body), programScores: Array.isArray(body?.program_scores) ? body.program_scores : [] };
  };

  const deletePlayerProgramScores = async ({ teamId = "", playerIdentity = "" } = {}) => {
    const normalizedTeamId = String(teamId || "").trim(), normalizedPlayer = normalizeIdentity(playerIdentity);
    if (!normalizedTeamId || !normalizedPlayer) throw new Error("program_score_delete_identity_required");
    const body = await request("DELETE", { team_id: normalizedTeamId, player_identity: normalizedPlayer });
    return { ok: true, storageMode: signedStorageMode(body), deletedCount: Number(body?.deleted_count || 0) };
  };

  return { loadProgramScores, upsertProgramScores, deletePlayerProgramScores };
}
