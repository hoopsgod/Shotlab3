import { installApiIdentityFetchBridge, normalizeIdentity, parseStored, readRequester, readSession, requestSignedBody, signedStorageMode, writeStored } from "./apiFetchBridge.js";

if (typeof window !== "undefined") installApiIdentityFetchBridge(window);

const id = (row) => String(row?.id || "").trim();
const team = (row) => String(row?.team_id || row?.teamId || "").trim();
const owner = (storage, requester = "") => {
  let marker;
  try { marker = String(storage?.getItem?.("sl:sp") || ""); } catch { return null; }
  const session = readSession(storage), identity = normalizeIdentity(requester) || readRequester(storage);
  return marker.startsWith(`${identity}\t`) && (!session?.rp || marker.startsWith(`${session.rp}\t`)) ? marker.split("\t") : null;
};
const save = (storage, parts) => writeStored(storage, "sl:sp", parts[2] ? parts.join("\t") : null);

export const hasPendingScoreRows = (storage = globalThis?.localStorage, requester = "") => !!owner(storage, requester);

export function reconcilePendingScoreRows({ storage = globalThis?.localStorage, requester = "", localRows = [], remoteRows = [] } = {}) {
  const remote = Array.isArray(remoteRows) ? remoteRows : [], parts = owner(storage, requester);
  if (!parts) return remote;
  const local = (Array.isArray(localRows) ? localRows : []).filter((row) => {
    const rowId = id(row);
    return parts.includes(rowId, 2) && !remote.some((item) => id(item) === rowId) && normalizeIdentity(row?.email || row?.player_email) === parts[0] && team(row) === parts[1];
  });
  save(storage, [parts[0], parts[1], ...local.map(id)]);
  return remote.concat(local);
}

export function createScorePersistenceService({ fetchImpl = globalThis?.fetch, storage = globalThis?.localStorage } = {}) {
  const request = (method, data, teamId = "") => {
    if (typeof fetchImpl !== "function") throw new Error("score_api_unavailable");
    return requestSignedBody(fetchImpl, `/v1/scores${teamId ? `?team_id=${encodeURIComponent(teamId)}` : ""}`, method, storage, data, `score_${method === "GET" ? "load" : method === "POST" ? "write" : "delete"}_failed`);
  };

  const loadScores = async ({ teamId = "" } = {}) => {
    if (typeof fetchImpl !== "function") return { ok: false, unavailable: true, scores: [] };
    const body = await request("GET", null, String(teamId || "").trim());
    return { ok: true, storageMode: signedStorageMode(body), scores: reconcilePendingScoreRows({ storage, requester: readRequester(storage), localRows: parseStored(storage, "sl:scores", []), remoteRows: Array.isArray(body?.scores) ? body.scores : [] }) };
  };

  const upsertScores = async (scores = []) => {
    const rows = Array.isArray(scores) ? scores : [scores];
    if (!rows.length) return { ok: true, scores: [], storageMode: "local_only" };
    const identity = readRequester(storage), teamId = team(rows[0]), parts = owner(storage, identity);
    if (identity && teamId) save(storage, [...new Set([...(parts?.[1] === teamId ? parts : [identity, teamId]), ...rows.map(id).filter(Boolean)])]);
    const body = await request("POST", { scores: rows }), confirmed = Array.isArray(body?.scores) ? body.scores : [];
    reconcilePendingScoreRows({ storage, requester: identity, localRows: parseStored(storage, "sl:scores", rows), remoteRows: confirmed });
    return { ok: true, storageMode: signedStorageMode(body), scores: confirmed };
  };

  const deletePlayerScores = async ({ teamId = "", playerIdentity = "" } = {}) => {
    const teamIdValue = String(teamId || "").trim(), player = normalizeIdentity(playerIdentity);
    if (!teamIdValue || !player) throw new Error("score_delete_identity_required");
    const body = await request("DELETE", { team_id: teamIdValue, player_identity: player });
    if (owner(storage, player)?.[1] === teamIdValue) save(storage, []);
    return { ok: true, storageMode: signedStorageMode(body), deletedCount: Number(body?.deleted_count || 0) };
  };

  return { loadScores, upsertScores, deletePlayerScores };
}
