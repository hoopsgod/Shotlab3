import { installApiIdentityFetchBridge } from "./apiFetchBridge.js";
import { createSignedScoreApi, normalizeSignedIdentity } from "./signedScoreApi.js";

if (typeof window !== "undefined") installApiIdentityFetchBridge(window);

export function createProgramScorePersistenceService({ fetchImpl = globalThis?.fetch, storage = globalThis?.localStorage } = {}) {
  const api = createSignedScoreApi({ endpoint: "/v1/program-scores", payloadField: "program_scores", kind: "program_score", fetchImpl, storage });
  const result = (body) => ({
    ok: true,
    storageMode: String(body?.storage_mode || "signed_api"),
    programScores: Array.isArray(body?.program_scores) ? body.program_scores : [],
  });
  return {
    async loadProgramScores({ teamId = "" } = {}) {
      if (!api.available) return { ok: false, unavailable: true, programScores: [] };
      return result(await api.load(teamId));
    },
    async upsertProgramScores(programScores = []) {
      const rows = Array.isArray(programScores) ? programScores : [programScores];
      if (!rows.length) return { ok: true, programScores: [], storageMode: "local_only" };
      if (!api.available) throw new Error("program_score_api_unavailable");
      return result(await api.upsert(rows));
    },
    async deletePlayerProgramScores({ teamId = "", playerIdentity = "" } = {}) {
      const normalizedTeamId = String(teamId || "").trim();
      const normalizedPlayer = normalizeSignedIdentity(playerIdentity);
      if (!normalizedTeamId || !normalizedPlayer) throw new Error("program_score_delete_identity_required");
      if (!api.available) throw new Error("program_score_api_unavailable");
      const body = await api.remove(normalizedTeamId, normalizedPlayer);
      return { ok: true, storageMode: String(body?.storage_mode || "signed_api"), deletedCount: Number(body?.deleted_count || 0) };
    },
  };
}
