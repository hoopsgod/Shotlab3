import { buildApiIdentityHeaders } from "./apiIdentityHeaders.js";
import { installApiIdentityFetchBridge } from "./apiFetchBridge.js";

if (typeof window !== "undefined") installApiIdentityFetchBridge(window);

const norm = (v) => String(v || "").trim().toLowerCase();
const id = (v) => String(v?.id || "").trim();
const team = (v) => String(v?.team_id || v?.teamId || "").trim();
const read = (s, k) => { try { return JSON.parse(s?.getItem?.(k) || "null"); } catch { return null; } };
const session = (s) => { const v = read(s, "sl:session"); return Array.isArray(v) ? v[0] : v; };
const owner = (s, who = "") => {
  let p;
  try { p = String(s?.getItem?.("sl:sp") || "").split("\t"); } catch { return null; }
  const q = session(s), whoId = norm(who || q?.email || q?.userEmail || q?.user_id);
  return p.length > 2 && p[0] === whoId && (!q?.rp || q.rp === `${whoId}\t${p[1]}`) ? p : null;
};
const save = (s, p) => { try { p.length > 2 ? s?.setItem?.("sl:sp", p.join("\t")) : s?.removeItem?.("sl:sp"); } catch {} };

export const hasPendingScoreRows = (storage = globalThis?.localStorage, requester = "") => !!owner(storage, requester);

export function reconcilePendingScoreRows({ storage = globalThis?.localStorage, requester = "", localRows = [], remoteRows = [] } = {}) {
  const remote = Array.isArray(remoteRows) ? remoteRows : [], p = owner(storage, requester);
  if (!p) return remote;
  const pending = p.slice(2), remoteIds = remote.map(id);
  const local = (Array.isArray(localRows) ? localRows : []).filter((row) => {
    const rowId = id(row);
    return pending.includes(rowId) && !remoteIds.includes(rowId) && norm(row?.email || row?.player_email) === p[0] && team(row) === p[1];
  });
  save(storage, [p[0], p[1], ...local.map(id)]);
  return remote.concat(local);
}

export function createScorePersistenceService({ fetchImpl = globalThis?.fetch, storage = globalThis?.localStorage } = {}) {
  const who = () => { const s = session(storage); return norm(s?.email || s?.userEmail || s?.user_id); };
  const request = async (method, data, teamId = "") => {
    const response = await fetchImpl(`/v1/scores${teamId ? `?team_id=${encodeURIComponent(teamId)}` : ""}`, {
      method,
      headers: buildApiIdentityHeaders({ requester: who(), storage, headers: method === "GET" ? {} : { "Content-Type": "application/json" } }),
      ...(data ? { body: JSON.stringify(data) } : {}),
    });
    let body;
    try { body = await response.json(); } catch { body = {}; }
    if (!response?.ok || body?.error) {
      const code = String(body?.error || `score_${method === "GET" ? "load" : method === "POST" ? "write" : "delete"}_failed`), error = new Error(code);
      error.code = code; error.status = Number(response?.status || 0); error.body = body; throw error;
    }
    return body;
  };
  const result = (body, extra) => ({ ok: true, storageMode: String(body?.storage_mode || "signed_api"), ...extra });

  const loadScores = async ({ teamId = "" } = {}) => {
    if (typeof fetchImpl !== "function") return { ok: false, unavailable: true, scores: [] };
    const body = await request("GET", null, String(teamId || "").trim());
    return result(body, { scores: reconcilePendingScoreRows({ storage, requester: who(), localRows: read(storage, "sl:scores") || [], remoteRows: Array.isArray(body?.scores) ? body.scores : [] }) });
  };

  const upsertScores = async (scores = []) => {
    const rows = Array.isArray(scores) ? scores : [scores];
    if (!rows.length) return { ok: true, scores: [], storageMode: "local_only" };
    const identity = who(), teamId = team(rows[0]);
    if (identity && teamId) {
      const p = owner(storage, identity);
      save(storage, [identity, teamId, ...new Set([...(p?.[1] === teamId ? p.slice(2) : []), ...rows.map(id).filter(Boolean)])]);
    }
    if (typeof fetchImpl !== "function") throw new Error("score_api_unavailable");
    const body = await request("POST", { scores: rows }), confirmed = Array.isArray(body?.scores) ? body.scores : [], p = owner(storage, identity);
    if (p?.[1] === teamId) {
      const confirmedIds = confirmed.map(id);
      save(storage, [identity, teamId, ...p.slice(2).filter((v) => !confirmedIds.includes(v))]);
    }
    return result(body, { scores: confirmed });
  };

  const deletePlayerScores = async ({ teamId = "", playerIdentity = "" } = {}) => {
    const teamIdValue = String(teamId || "").trim(), player = norm(playerIdentity);
    if (!teamIdValue || !player) throw new Error("score_delete_identity_required");
    if (typeof fetchImpl !== "function") throw new Error("score_api_unavailable");
    const body = await request("DELETE", { team_id: teamIdValue, player_identity: player });
    if (owner(storage, player)?.[1] === teamIdValue) save(storage, []);
    return result(body, { deletedCount: Number(body?.deleted_count || 0) });
  };

  return { loadScores, upsertScores, deletePlayerScores };
}
