import { buildApiIdentityHeaders } from "./apiIdentityHeaders.js";

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

export function createScorePersistenceService({
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

  const loadScores = async ({ teamId = "" } = {}) => {
    if (typeof fetchImpl !== "function") return { ok: false, unavailable: true, scores: [] };
    const query = String(teamId || "").trim() ? `?team_id=${encodeURIComponent(String(teamId).trim())}` : "";
    const response = await fetchImpl(`/v1/scores${query}`, {
      method: "GET",
      headers: headers(),
    });
    const body = await readJson(response);
    if (!response?.ok || body?.error) throw requestError(body, response, "score_load_failed");
    return {
      ok: true,
      storageMode: String(body?.storage_mode || "signed_api"),
      scores: Array.isArray(body?.scores) ? body.scores : [],
    };
  };

  const upsertScores = async (scores = []) => {
    const rows = Array.isArray(scores) ? scores : [scores];
    if (!rows.length) return { ok: true, scores: [], storageMode: "local_only" };
    if (typeof fetchImpl !== "function") throw new Error("score_api_unavailable");
    const response = await fetchImpl("/v1/scores", {
      method: "POST",
      headers: headers({ "Content-Type": "application/json" }),
      body: JSON.stringify({ scores: rows }),
    });
    const body = await readJson(response);
    if (!response?.ok || body?.error) throw requestError(body, response, "score_write_failed");
    return {
      ok: true,
      storageMode: String(body?.storage_mode || "signed_api"),
      scores: Array.isArray(body?.scores) ? body.scores : [],
    };
  };

  const deletePlayerScores = async ({ teamId = "", playerIdentity = "" } = {}) => {
    const normalizedTeamId = String(teamId || "").trim();
    const normalizedPlayer = normalizeIdentity(playerIdentity);
    if (!normalizedTeamId || !normalizedPlayer) throw new Error("score_delete_identity_required");
    if (typeof fetchImpl !== "function") throw new Error("score_api_unavailable");
    const response = await fetchImpl("/v1/scores", {
      method: "DELETE",
      headers: headers({ "Content-Type": "application/json" }),
      body: JSON.stringify({ team_id: normalizedTeamId, player_identity: normalizedPlayer }),
    });
    const body = await readJson(response);
    if (!response?.ok || body?.error) throw requestError(body, response, "score_delete_failed");
    return {
      ok: true,
      storageMode: String(body?.storage_mode || "signed_api"),
      deletedCount: Number(body?.deleted_count || 0),
    };
  };

  return { loadScores, upsertScores, deletePlayerScores };
}
