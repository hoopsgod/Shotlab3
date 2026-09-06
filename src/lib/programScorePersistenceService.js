import { normalizeIdentity, requestSignedBody, signedResult } from "./scorePersistenceService.js";

export function createProgramScorePersistenceService({ fetchImpl = globalThis?.fetch, storage = globalThis?.localStorage } = {}) {
  const request = (method, data, teamId = "", fallback) => {
    if (typeof fetchImpl !== "function") throw new Error("program_score_api_unavailable");
    return requestSignedBody(fetchImpl, `/v1/program-scores${teamId ? `?team_id=${encodeURIComponent(teamId)}` : ""}`, method, storage, data, fallback);
  };

  const loadProgramScores = async ({ teamId = "" } = {}) => {
    if (typeof fetchImpl !== "function") return { ok: false, unavailable: true, programScores: [] };
    const body = await request("GET", null, String(teamId || "").trim(), "program_score_load_failed");
    return signedResult(body, { programScores: Array.isArray(body?.program_scores) ? body.program_scores : [] });
  };

  const upsertProgramScores = async (programScores = []) => {
    const rows = Array.isArray(programScores) ? programScores : [programScores];
    if (!rows.length) return { ok: true, programScores: [], storageMode: "local_only" };
    const body = await request("POST", { program_scores: rows }, "", "program_score_write_failed");
    return signedResult(body, { programScores: Array.isArray(body?.program_scores) ? body.program_scores : [] });
  };

  const deletePlayerProgramScores = async ({ teamId = "", playerIdentity = "" } = {}) => {
    const normalizedTeamId = String(teamId || "").trim(), normalizedPlayer = normalizeIdentity(playerIdentity);
    if (!normalizedTeamId || !normalizedPlayer) throw new Error("program_score_delete_identity_required");
    const body = await request("DELETE", { team_id: normalizedTeamId, player_identity: normalizedPlayer }, "", "program_score_delete_failed");
    return signedResult(body, { deletedCount: Number(body?.deleted_count || 0) });
  };

  return { loadProgramScores, upsertProgramScores, deletePlayerProgramScores };
}
