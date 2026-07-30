import { buildApiIdentityHeaders } from "./apiIdentityHeaders.js";
import { installApiIdentityFetchBridge } from "./apiFetchBridge.js";

if (typeof window !== "undefined") installApiIdentityFetchBridge(window);

const normalizeIdentity = (value) => String(value || "").trim().toLowerCase();

function readSession(storage = globalThis?.localStorage) {
  try {
    const raw = storage?.getItem?.("sl:session");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed[0] || null : parsed;
  } catch {
    return null;
  }
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

export function createProgramScorePersistenceService({
  fetchImpl = globalThis?.fetch,
  storage = globalThis?.localStorage,
} = {}) {
  const requester = () => {
    const session = readSession(storage);
    return normalizeIdentity(session?.email || session?.userEmail || session?.user_id);
  };

  const headers = (extra = {}) => buildApiIdentityHeaders({
    requester: requester(),
    storage,
    headers: extra,
  });

  const loadProgramScores = async ({ teamId = "" } = {}) => {
    if (typeof fetchImpl !== "function") return { ok: false, unavailable: true, programScores: [] };
    const query = String(teamId || "").trim() ? `?team_id=${encodeURIComponent(String(teamId).trim())}` : "";
    const response = await fetchImpl(`/v1/program-scores${query}`, {
      method: "GET",
      headers: headers(),
    });
    const body = await readJson(response);
    if (!response?.ok || body?.error) throw requestError(body, response, "program_score_load_failed");
    return {
      ok: true,
      storageMode: String(body?.storage_mode || "signed_api"),
      programScores: Array.isArray(body?.program_scores) ? body.program_scores : [],
    };
  };

  const upsertProgramScores = async (programScores = []) => {
    const rows = Array.isArray(programScores) ? programScores : [programScores];
    if (!rows.length) return { ok: true, programScores: [], storageMode: "local_only" };
    if (typeof fetchImpl !== "function") throw new Error("program_score_api_unavailable");
    const response = await fetchImpl("/v1/program-scores", {
      method: "POST",
      headers: headers({ "Content-Type": "application/json" }),
      body: JSON.stringify({ program_scores: rows }),
    });
    const body = await readJson(response);
    if (!response?.ok || body?.error) throw requestError(body, response, "program_score_write_failed");
    return {
      ok: true,
      storageMode: String(body?.storage_mode || "signed_api"),
      programScores: Array.isArray(body?.program_scores) ? body.program_scores : [],
    };
  };

  const deletePlayerProgramScores = async ({ teamId = "", playerIdentity = "" } = {}) => {
    const normalizedTeamId = String(teamId || "").trim();
    const normalizedPlayer = normalizeIdentity(playerIdentity);
    if (!normalizedTeamId || !normalizedPlayer) throw new Error("program_score_delete_identity_required");
    if (typeof fetchImpl !== "function") throw new Error("program_score_api_unavailable");
    const response = await fetchImpl("/v1/program-scores", {
      method: "DELETE",
      headers: headers({ "Content-Type": "application/json" }),
      body: JSON.stringify({ team_id: normalizedTeamId, player_identity: normalizedPlayer }),
    });
    const body = await readJson(response);
    if (!response?.ok || body?.error) throw requestError(body, response, "program_score_delete_failed");
    return {
      ok: true,
      storageMode: String(body?.storage_mode || "signed_api"),
      deletedCount: Number(body?.deleted_count || 0),
    };
  };

  return { loadProgramScores, upsertProgramScores, deletePlayerProgramScores };
}
