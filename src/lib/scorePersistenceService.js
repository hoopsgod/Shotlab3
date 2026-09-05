import { buildApiIdentityHeaders } from "./apiIdentityHeaders.js";
import { installApiIdentityFetchBridge } from "./apiFetchBridge.js";

if (typeof window !== "undefined") installApiIdentityFetchBridge(window);

const normalizeIdentity = (value) => String(value || "").trim().toLowerCase();
const PENDING_SCORE_KEY = "sl:sp";

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

function readPending(storage) {
  try {
    const [identity, teamId, ...ids] = String(storage?.getItem?.(PENDING_SCORE_KEY) || "").split("\t");
    return identity && teamId && ids.length ? { identity, teamId, ids: [...new Set(ids.filter(Boolean))] } : null;
  } catch {
    return null;
  }
}

function writePending(storage, pending) {
  try {
    const ids = pending?.ids?.filter(Boolean) || [];
    if (pending?.identity && pending?.teamId && ids.length) {
      storage?.setItem?.(PENDING_SCORE_KEY, [pending.identity, pending.teamId, ...new Set(ids)].join("\t"));
    } else storage?.removeItem?.(PENDING_SCORE_KEY);
  } catch {}
}

const rowId = (row) => String(row?.id || "").trim();
const rowTeam = (row) => String(row?.team_id || row?.teamId || "").trim();

function updatePending(storage, rows, identity, remove = false) {
  const ids = rows.map(rowId).filter(Boolean);
  const teamId = rowTeam(rows[0]);
  if (!identity || !teamId || !ids.length) return;
  const prior = readPending(storage);
  if (remove) {
    if (prior?.identity === identity && prior?.teamId === teamId) {
      writePending(storage, { ...prior, ids: prior.ids.filter((id) => !ids.includes(id)) });
    }
    return;
  }
  writePending(storage, {
    identity,
    teamId,
    ids: prior?.identity === identity && prior?.teamId === teamId ? [...prior.ids, ...ids] : ids,
  });
}

function activePending(storage, requester = "") {
  const pending = readPending(storage);
  const session = readSession(storage);
  const identity = normalizeIdentity(requester || session?.email || session?.userEmail || session?.user_id);
  if (!pending || !identity || pending.identity !== identity) return null;
  const scope = String(session?.rp || "");
  return scope && scope !== `${identity}\t${pending.teamId}` ? null : pending;
}

export const hasPendingScoreRows = (storage = globalThis?.localStorage, requester = "") => Boolean(activePending(storage, requester));

export function reconcilePendingScoreRows({
  storage = globalThis?.localStorage,
  requester = "",
  localRows = [],
  remoteRows = [],
} = {}) {
  const remote = Array.isArray(remoteRows) ? remoteRows : [];
  const pending = activePending(storage, requester);
  if (!pending) return remote;
  const identity = pending.identity;
  const remoteIds = new Set(remote.map(rowId));
  const remaining = new Set(pending.ids.filter((id) => !remoteIds.has(id)));
  const local = (Array.isArray(localRows) ? localRows : []).filter((row) => (
    remaining.has(rowId(row))
    && normalizeIdentity(row?.email || row?.player_email) === identity
    && rowTeam(row) === pending.teamId
  ));
  writePending(storage, { ...pending, ids: local.map(rowId) });
  return [...remote, ...local];
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
    const identity = requester();
    updatePending(storage, rows, identity);
    if (typeof fetchImpl !== "function") throw new Error("score_api_unavailable");
    const response = await fetchImpl("/v1/scores", {
      method: "POST",
      headers: headers({ "Content-Type": "application/json" }),
      body: JSON.stringify({ scores: rows }),
    });
    const body = await readJson(response);
    if (!response?.ok || body?.error) throw requestError(body, response, "score_write_failed");
    updatePending(storage, rows, identity, true);
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
    const pending = readPending(storage);
    if (pending?.identity === normalizedPlayer && pending?.teamId === normalizedTeamId) writePending(storage, null);
    return {
      ok: true,
      storageMode: String(body?.storage_mode || "signed_api"),
      deletedCount: Number(body?.deleted_count || 0),
    };
  };

  return { loadScores, upsertScores, deletePlayerScores };
}
