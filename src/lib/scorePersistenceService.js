import { buildApiIdentityHeaders } from "./apiIdentityHeaders.js";
import { installApiIdentityFetchBridge } from "./apiFetchBridge.js";

if (typeof window !== "undefined") installApiIdentityFetchBridge(window);

const norm = (value) => String(value || "").trim().toLowerCase();
const scoreId = (row) => String(row?.id || "").trim();
const scoreTeam = (row) => String(row?.team_id || row?.teamId || "").trim();
const mode = (body) => String(body?.storage_mode || "signed_api");
function stored(storage, key) {
  try { return JSON.parse(storage?.getItem?.(key) || "null"); } catch { return null; }
}
function readSession(storage) {
  const value = stored(storage, "sl:session");
  return Array.isArray(value) ? value[0] || null : value;
}
function pending(storage, requester = "") {
  let parts;
  try { parts = String(storage?.getItem?.("sl:sp") || "").split("\t"); } catch { return null; }
  const current = readSession(storage);
  const identity = norm(requester || current?.email || current?.userEmail || current?.user_id);
  return parts.length > 2 && parts[0] === identity && (!current?.rp || current.rp === `${identity}\t${parts[1]}`) ? parts : null;
}
function save(storage, parts) {
  try { parts.length > 2 ? storage?.setItem?.("sl:sp", parts.join("\t")) : storage?.removeItem?.("sl:sp"); } catch {}
}

export const hasPendingScoreRows = (storage = globalThis?.localStorage, requester = "") => Boolean(pending(storage, requester));

export function reconcilePendingScoreRows({ storage = globalThis?.localStorage, requester = "", localRows = [], remoteRows = [] } = {}) {
  const remote = Array.isArray(remoteRows) ? remoteRows : [];
  const current = pending(storage, requester);
  if (!current) return remote;
  const remoteIds = remote.map(scoreId);
  const pendingIds = current.slice(2);
  const local = (Array.isArray(localRows) ? localRows : []).filter((row) => {
    const id = scoreId(row);
    return pendingIds.includes(id) && !remoteIds.includes(id)
      && norm(row?.email || row?.player_email) === current[0] && scoreTeam(row) === current[1];
  });
  save(storage, [current[0], current[1], ...local.map(scoreId)]);
  return [...remote, ...local];
}

export function createScorePersistenceService({ fetchImpl = globalThis?.fetch, storage = globalThis?.localStorage } = {}) {
  const requester = () => {
    const current = readSession(storage);
    return norm(current?.email || current?.userEmail || current?.user_id);
  };
  const request = async (method, payload, teamId = "") => {
    const response = await fetchImpl(`/v1/scores${method === "GET" && teamId ? `?team_id=${encodeURIComponent(teamId)}` : ""}`, {
      method,
      headers: buildApiIdentityHeaders({ requester: requester(), storage, headers: method === "GET" ? {} : { "Content-Type": "application/json" } }),
      ...(payload ? { body: JSON.stringify(payload) } : {}),
    });
    let body;
    try { body = await response.json(); } catch { body = {}; }
    if (!response?.ok || body?.error) {
      const fallback = method === "GET" ? "score_load_failed" : method === "POST" ? "score_write_failed" : "score_delete_failed";
      const code = String(body?.error || fallback);
      const error = new Error(code);
      error.code = code;
      error.status = Number(response?.status || 0);
      error.body = body;
      throw error;
    }
    return body;
  };

  const loadScores = async ({ teamId = "" } = {}) => {
    if (typeof fetchImpl !== "function") return { ok: false, unavailable: true, scores: [] };
    const body = await request("GET", null, String(teamId || "").trim());
    return {
      ok: true,
      storageMode: mode(body),
      scores: reconcilePendingScoreRows({ storage, requester: requester(), localRows: stored(storage, "sl:scores") || [], remoteRows: Array.isArray(body?.scores) ? body.scores : [] }),
    };
  };

  const upsertScores = async (scores = []) => {
    const rows = Array.isArray(scores) ? scores : [scores];
    if (!rows.length) return { ok: true, scores: [], storageMode: "local_only" };
    const identity = requester();
    const teamId = scoreTeam(rows[0]);
    if (identity && teamId) {
      const current = pending(storage, identity);
      save(storage, [identity, teamId, ...new Set([...(current?.[1] === teamId ? current.slice(2) : []), ...rows.map(scoreId).filter(Boolean)])]);
    }
    if (typeof fetchImpl !== "function") throw new Error("score_api_unavailable");
    const body = await request("POST", { scores: rows });
    const confirmed = Array.isArray(body?.scores) ? body.scores : [];
    const current = pending(storage, identity);
    if (current?.[1] === teamId) {
      const ids = confirmed.map(scoreId);
      save(storage, [identity, teamId, ...current.slice(2).filter((value) => !ids.includes(value))]);
    }
    return { ok: true, storageMode: mode(body), scores: confirmed };
  };

  const deletePlayerScores = async ({ teamId = "", playerIdentity = "" } = {}) => {
    const teamIdValue = String(teamId || "").trim();
    const player = norm(playerIdentity);
    if (!teamIdValue || !player) throw new Error("score_delete_identity_required");
    if (typeof fetchImpl !== "function") throw new Error("score_api_unavailable");
    const body = await request("DELETE", { team_id: teamIdValue, player_identity: player });
    if (pending(storage, player)?.[1] === teamIdValue) save(storage, []);
    return { ok: true, storageMode: mode(body), deletedCount: Number(body?.deleted_count || 0) };
  };

  return { loadScores, upsertScores, deletePlayerScores };
}
