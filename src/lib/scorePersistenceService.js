import { installApiIdentityFetchBridge } from "./apiFetchBridge.js";
import { createSignedScoreApi, normalizeSignedIdentity, readSignedStorageJson } from "./signedScoreApi.js";

if (typeof window !== "undefined") installApiIdentityFetchBridge(window);

const PENDING_SCORE_KEY = "sl:sp";
const readPending = (storage) => {
  try { return String(storage?.getItem?.(PENDING_SCORE_KEY) || "").split("\t"); } catch { return []; }
};
const rowId = (row) => String(row?.id || "").trim();
const rowTeam = (row) => String(row?.team_id || row?.teamId || "").trim();

function savePending(storage, parts) {
  try { parts.length > 2 ? storage?.setItem?.(PENDING_SCORE_KEY, parts.join("\t")) : storage?.removeItem?.(PENDING_SCORE_KEY); } catch {}
}

function activePending(storage, requester = "") {
  const pending = readPending(storage);
  const value = readSignedStorageJson(storage, "sl:session");
  const session = Array.isArray(value) ? value[0] || null : value;
  const identity = normalizeSignedIdentity(requester || session?.email || session?.userEmail || session?.user_id);
  return pending.length > 2 && pending[0] === identity && pending[1]
    && (!session?.rp || session.rp === `${identity}\t${pending[1]}`) ? pending : null;
}

function updatePending(storage, rows, identity, remove = false) {
  const ids = rows.map(rowId).filter(Boolean);
  const teamId = rowTeam(rows[0]);
  if (!identity || !teamId || !ids.length) return;
  const pending = readPending(storage);
  const sameScope = pending[0] === identity && pending[1] === teamId;
  if (remove && !sameScope) return;
  const prior = sameScope ? pending.slice(2) : [];
  savePending(storage, [identity, teamId, ...(remove
    ? prior.filter((id) => !ids.includes(id))
    : [...new Set([...prior, ...ids])])]);
}

export const hasPendingScoreRows = (storage = globalThis?.localStorage, requester = "") => Boolean(activePending(storage, requester));

export function reconcilePendingScoreRows({ storage = globalThis?.localStorage, requester = "", localRows = [], remoteRows = [] } = {}) {
  const remote = Array.isArray(remoteRows) ? remoteRows : [];
  const pending = activePending(storage, requester);
  if (!pending) return remote;
  const remoteIds = remote.map(rowId);
  const wanted = pending.slice(2).filter((id) => !remoteIds.includes(id));
  const local = (Array.isArray(localRows) ? localRows : []).filter((row) => (
    wanted.includes(rowId(row))
    && normalizeSignedIdentity(row?.email || row?.player_email) === pending[0]
    && rowTeam(row) === pending[1]
  ));
  savePending(storage, [pending[0], pending[1], ...local.map(rowId)]);
  return [...remote, ...local];
}

export function createScorePersistenceService({ fetchImpl = globalThis?.fetch, storage = globalThis?.localStorage } = {}) {
  const api = createSignedScoreApi({ endpoint: "/v1/scores", payloadField: "scores", kind: "score", fetchImpl, storage });
  const result = (body, scores = body?.scores) => ({
    ok: true,
    storageMode: String(body?.storage_mode || "signed_api"),
    scores: Array.isArray(scores) ? scores : [],
  });
  return {
    async loadScores({ teamId = "" } = {}) {
      if (!api.available) return { ok: false, unavailable: true, scores: [] };
      const body = await api.load(teamId);
      return result(body, reconcilePendingScoreRows({
        storage,
        requester: api.requester(),
        localRows: readSignedStorageJson(storage, "sl:scores"),
        remoteRows: body?.scores,
      }));
    },
    async upsertScores(scores = []) {
      const rows = Array.isArray(scores) ? scores : [scores];
      if (!rows.length) return { ok: true, scores: [], storageMode: "local_only" };
      const identity = api.requester();
      updatePending(storage, rows, identity);
      if (!api.available) throw new Error("score_api_unavailable");
      const body = await api.upsert(rows);
      updatePending(storage, rows, identity, true);
      return result(body);
    },
    async deletePlayerScores({ teamId = "", playerIdentity = "" } = {}) {
      const normalizedTeamId = String(teamId || "").trim();
      const normalizedPlayer = normalizeSignedIdentity(playerIdentity);
      if (!normalizedTeamId || !normalizedPlayer) throw new Error("score_delete_identity_required");
      if (!api.available) throw new Error("score_api_unavailable");
      const body = await api.remove(normalizedTeamId, normalizedPlayer);
      const pending = readPending(storage);
      if (pending[0] === normalizedPlayer && pending[1] === normalizedTeamId) savePending(storage, []);
      return { ok: true, storageMode: String(body?.storage_mode || "signed_api"), deletedCount: Number(body?.deleted_count || 0) };
    },
  };
}
