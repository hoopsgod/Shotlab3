import { buildApiIdentityHeaders } from "./apiIdentityHeaders.js";
import { installApiIdentityFetchBridge } from "./apiFetchBridge.js";

if (typeof window !== "undefined") installApiIdentityFetchBridge(window);

export const normalizeIdentity = (value) => String(value || "").trim().toLowerCase();
export function parseStored(storage, key, fallback = null) {
  try {
    const raw = storage?.getItem?.(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}
export function readSession(storage = globalThis?.localStorage) {
  const value = parseStored(storage, "sl:session", null);
  return Array.isArray(value) ? value[0] || null : value;
}
export const readRequester = (storage = globalThis?.localStorage) => {
  const current = readSession(storage);
  return normalizeIdentity(current?.email || current?.userEmail || current?.user_id);
};

const id = (row) => String(row?.id || "").trim();
const team = (row) => String(row?.team_id || row?.teamId || "").trim();
const owner = (storage, requester = "") => {
  let parts;
  try { parts = String(storage?.getItem?.("sl:sp") || "").split("\t"); } catch { return null; }
  const current = readSession(storage), identity = normalizeIdentity(requester || current?.email || current?.userEmail || current?.user_id);
  return parts[2] && parts[0] === identity && (!current?.rp || current.rp === `${identity}\t${parts[1]}`) ? parts : null;
};
const save = (storage, parts) => {
  try { parts[2] ? storage?.setItem?.("sl:sp", parts.join("\t")) : storage?.removeItem?.("sl:sp"); } catch {}
};

export const hasPendingScoreRows = (storage = globalThis?.localStorage, requester = "") => !!owner(storage, requester);

export function reconcilePendingScoreRows({ storage = globalThis?.localStorage, requester = "", localRows = [], remoteRows = [] } = {}) {
  const remote = Array.isArray(remoteRows) ? remoteRows : [], parts = owner(storage, requester);
  if (!parts) return remote;
  const remoteIds = remote.map(id);
  const local = (Array.isArray(localRows) ? localRows : []).filter((row) => {
    const rowId = id(row);
    return parts.includes(rowId, 2) && !remoteIds.includes(rowId) && normalizeIdentity(row?.email || row?.player_email) === parts[0] && team(row) === parts[1];
  });
  save(storage, [parts[0], parts[1], ...local.map(id)]);
  return remote.concat(local);
}

export async function requestSignedBody(fetchImpl, path, method, storage, data, fallback) {
  const response = await fetchImpl(path, {
    method,
    headers: buildApiIdentityHeaders({ requester: readRequester(storage), storage, headers: data == null ? {} : { "Content-Type": "application/json" } }),
    ...(data == null ? {} : { body: JSON.stringify(data) }),
  });
  let body;
  try { body = await response.json(); } catch { body = {}; }
  if (!response?.ok || body?.ok === false || body?.error) {
    const code = String(body?.error || fallback), error = new Error(code);
    error.code = code; error.status = Number(response?.status || 0); error.body = body; throw error;
  }
  return body;
}

export const signedResult = (body, extra) => ({ ok: true, storageMode: String(body?.storage_mode || "signed_api"), ...extra });

export function createScorePersistenceService({ fetchImpl = globalThis?.fetch, storage = globalThis?.localStorage } = {}) {
  const request = (method, data, teamId = "") => {
    if (typeof fetchImpl !== "function") throw new Error("score_api_unavailable");
    return requestSignedBody(fetchImpl, `/v1/scores${teamId ? `?team_id=${encodeURIComponent(teamId)}` : ""}`, method, storage, data, `score_${method === "GET" ? "load" : method === "POST" ? "write" : "delete"}_failed`);
  };

  const loadScores = async ({ teamId = "" } = {}) => {
    if (typeof fetchImpl !== "function") return { ok: false, unavailable: true, scores: [] };
    const body = await request("GET", null, String(teamId || "").trim());
    return signedResult(body, { scores: reconcilePendingScoreRows({ storage, requester: readRequester(storage), localRows: parseStored(storage, "sl:scores", []), remoteRows: Array.isArray(body?.scores) ? body.scores : [] }) });
  };

  const upsertScores = async (scores = []) => {
    const rows = Array.isArray(scores) ? scores : [scores];
    if (!rows.length) return { ok: true, scores: [], storageMode: "local_only" };
    const identity = readRequester(storage), teamId = team(rows[0]), parts = owner(storage, identity);
    if (identity && teamId) save(storage, [identity, teamId, ...new Set([...(parts?.[1] === teamId ? parts.slice(2) : []), ...rows.map(id).filter(Boolean)])]);
    const body = await request("POST", { scores: rows }), confirmed = Array.isArray(body?.scores) ? body.scores : [];
    reconcilePendingScoreRows({ storage, requester: identity, localRows: parseStored(storage, "sl:scores", rows), remoteRows: confirmed });
    return signedResult(body, { scores: confirmed });
  };

  const deletePlayerScores = async ({ teamId = "", playerIdentity = "" } = {}) => {
    const teamIdValue = String(teamId || "").trim(), player = normalizeIdentity(playerIdentity);
    if (!teamIdValue || !player) throw new Error("score_delete_identity_required");
    const body = await request("DELETE", { team_id: teamIdValue, player_identity: player });
    if (owner(storage, player)?.[1] === teamIdValue) save(storage, []);
    return signedResult(body, { deletedCount: Number(body?.deleted_count || 0) });
  };

  return { loadScores, upsertScores, deletePlayerScores };
}
