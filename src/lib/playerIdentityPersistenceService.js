import { cleanValue as clean, normalizeIdentity, parseStored, readActorContext as readContext, requestSignedBody, signedStorageMode } from "./apiIdentityHeaders.js";

const PENDING_KEY = "sl:ip";
const writePending = (storage, value) => {
  try {
    if (value) storage?.setItem?.(PENDING_KEY, value);
    else if (typeof storage?.removeItem === "function") storage.removeItem(PENDING_KEY);
    else storage?.setItem?.(PENDING_KEY, "");
  } catch {}
};

function pendingContext(storage, teamId = "") {
  const context = readContext(storage);
  const activeTeamId = clean(teamId || context.teamId);
  let marker = "";
  try { marker = storage?.getItem?.(PENDING_KEY) || ""; } catch {}
  return context.requester && marker === `${context.requester}\t${activeTeamId}`
    ? { ...context, teamId: activeTeamId }
    : null;
}

function pendingLocalRows(storage, context) {
  const rows = parseStored(storage, "sl:players", []);
  if (!Array.isArray(rows)) return [];
  return rows.filter((row) => {
    if (normalizeIdentity(row?.email) === context.requester) return true;
    return (context.role === "coach" || context.role === "assistant_coach")
      && clean(row?.team_id ?? row?.teamId) === context.teamId;
  });
}

export const hasPendingPlayerRows = (storage = globalThis?.localStorage, teamId = "") => Boolean(pendingContext(storage, teamId));

export function reconcilePendingPlayerRows({ storage = globalThis?.localStorage, teamId = "", remoteRows = [] } = {}) {
  const context = pendingContext(storage, teamId);
  return context ? pendingLocalRows(storage, context) : Array.isArray(remoteRows) ? remoteRows : [];
}

export function createPlayerIdentityPersistenceService({
  fetchImpl = globalThis?.fetch,
  storage = globalThis?.localStorage,
} = {}) {
  const loadPlayers = async ({ teamId = "" } = {}) => {
    const context = readContext(storage);
    const activeTeamId = clean(teamId || context.teamId);
    if (typeof fetchImpl !== "function") {
      return { ok: false, unavailable: true, rows: reconcilePendingPlayerRows({ storage, teamId: activeTeamId }) };
    }
    const query = activeTeamId ? `?team_id=${encodeURIComponent(activeTeamId)}` : "";
    const body = await requestSignedBody(fetchImpl, `/v1/players${query}`, "GET", storage, null, "player_load_failed");
    return {
      ok: true,
      storageMode: signedStorageMode(body),
      rows: reconcilePendingPlayerRows({ storage, teamId: activeTeamId, remoteRows: body?.players }),
    };
  };

  const syncPlayers = async (players = [], { replace = true } = {}) => {
    if (typeof fetchImpl !== "function") throw new Error("player_api_unavailable");
    const context = readContext(storage);
    if (replace === true && context.requester) writePending(storage, `${context.requester}\t${clean(context.teamId)}`);
    const body = await requestSignedBody(fetchImpl, "/v1/players", "POST", storage, {
      players: Array.isArray(players) ? players : [],
      replace: replace === true,
    }, "player_sync_failed");
    writePending(storage, "");
    return {
      ok: true,
      storageMode: signedStorageMode(body),
      rows: Array.isArray(body?.players) ? body.players : [],
      ignoredCount: Number(body?.ignored_count || 0),
      deletedSelf: body?.deleted_self === true,
    };
  };

  return { loadPlayers, syncPlayers, readContext: () => readContext(storage) };
}
