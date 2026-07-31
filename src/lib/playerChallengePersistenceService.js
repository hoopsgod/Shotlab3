import { buildApiIdentityHeaders } from "./apiIdentityHeaders.js";

const normalizeIdentity = (value) => String(value || "").trim().toLowerCase();
const clean = (value) => String(value ?? "").trim();
const finiteNumber = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

function parseStored(storage, key, fallback) {
  try {
    const raw = storage?.getItem?.(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function readContext(storage = globalThis?.localStorage) {
  const rawSession = parseStored(storage, "sl:session", null);
  const session = Array.isArray(rawSession) ? rawSession[0] : rawSession;
  const requester = normalizeIdentity(session?.email || session?.userEmail || session?.user_id);
  const players = parseStored(storage, "sl:players", []);
  const actor = (Array.isArray(players) ? players : []).find((row) => normalizeIdentity(row?.email) === requester);
  return {
    requester,
    role: normalizeIdentity(session?.role || actor?.role),
    teamId: clean(session?.teamId || session?.team_id || actor?.teamId || actor?.team_id),
  };
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

export function normalizePlayerChallenge(value = {}) {
  const score = finiteNumber(value?.score ?? value?.challenger_score);
  const maxScore = finiteNumber(value?.max ?? value?.max_score);
  const responseScore = finiteNumber(value?.respScore ?? value?.response_score);
  const status = clean(value?.status || "pending").toLowerCase();
  const row = {
    id: clean(value?.id),
    teamId: clean(value?.teamId || value?.team_id),
    playerId: normalizeIdentity(value?.playerId || value?.player_id || value?.from || value?.challenger_id),
    from: normalizeIdentity(value?.from || value?.challenger_id),
    fromName: clean(value?.fromName || value?.challenger_name),
    to: normalizeIdentity(value?.to || value?.opponent_id),
    toName: clean(value?.toName || value?.opponent_name),
    drillId: clean(value?.drillId || value?.drill_id),
    drillName: clean(value?.drillName || value?.drill_name),
    score,
    max: maxScore,
    respScore: responseScore,
    status: ["pending", "won", "tied", "lost"].includes(status) ? status : "pending",
    ts: finiteNumber(value?.ts ?? value?.created_ts),
    respTs: finiteNumber(value?.respTs ?? value?.responded_ts),
  };
  if (!row.id || !row.teamId || !row.from || !row.to || !row.drillId || score === null) return null;
  return Object.fromEntries(Object.entries(row).filter(([, item]) => item !== null && item !== ""));
}

export function mergePlayerChallenges(localRows = [], remoteRows = []) {
  const byId = new Map();
  for (const row of Array.isArray(localRows) ? localRows : []) {
    const normalized = normalizePlayerChallenge(row);
    if (normalized) byId.set(normalized.id, normalized);
  }
  for (const row of Array.isArray(remoteRows) ? remoteRows : []) {
    const normalized = normalizePlayerChallenge(row);
    if (normalized) byId.set(normalized.id, normalized);
  }
  return [...byId.values()].sort((a, b) => Number(b?.respTs || b?.ts || 0) - Number(a?.respTs || a?.ts || 0));
}

function visibleLocalRows(rows, context, teamId) {
  if (!context.requester || !teamId) return [];
  return (Array.isArray(rows) ? rows : [])
    .map(normalizePlayerChallenge)
    .filter((row) => row && row.teamId === teamId && (row.from === context.requester || row.to === context.requester));
}

export function createPlayerChallengePersistenceService({
  fetchImpl = (...args) => globalThis.fetch(...args),
  storage = globalThis?.localStorage,
} = {}) {
  const headers = (extra = {}) => {
    const context = readContext(storage);
    return buildApiIdentityHeaders({ requester: context.requester, storage, headers: extra });
  };

  const loadChallenges = async ({ teamId = "" } = {}) => {
    if (typeof fetchImpl !== "function") throw new Error("player_challenge_api_unavailable");
    const context = readContext(storage);
    const activeTeamId = clean(teamId || context.teamId);
    if (!activeTeamId) throw new Error("player_challenge_team_required");
    const response = await fetchImpl(`/v1/player-challenges?team_id=${encodeURIComponent(activeTeamId)}`, {
      method: "GET",
      headers: headers(),
    });
    const body = await readJson(response);
    if (!response?.ok || body?.ok !== true || !Array.isArray(body?.challenges) || body?.error) {
      throw requestError(body, response, "player_challenge_load_failed");
    }
    return {
      ok: true,
      storageMode: clean(body?.storage_mode || "signed_api"),
      teamId: clean(body?.team_id || activeTeamId),
      rows: body.challenges.map(normalizePlayerChallenge).filter(Boolean),
    };
  };

  const mutateChallenge = async (action, payload = {}, { teamId = "" } = {}) => {
    if (typeof fetchImpl !== "function") throw new Error("player_challenge_api_unavailable");
    const context = readContext(storage);
    const activeTeamId = clean(teamId || context.teamId || payload?.teamId || payload?.team_id);
    if (!activeTeamId) throw new Error("player_challenge_team_required");
    const response = await fetchImpl("/v1/player-challenges", {
      method: "POST",
      headers: headers({ "Content-Type": "application/json" }),
      body: JSON.stringify({ team_id: activeTeamId, action, challenge: payload }),
    });
    const body = await readJson(response);
    const challenge = normalizePlayerChallenge(body?.challenge);
    if (!response?.ok || body?.ok !== true || !challenge || body?.error) {
      throw requestError(body, response, `player_challenge_${action}_failed`);
    }
    return {
      ok: true,
      storageMode: clean(body?.storage_mode || "signed_api"),
      teamId: clean(body?.team_id || activeTeamId),
      challenge,
    };
  };

  const createChallenge = (challenge, options = {}) => mutateChallenge("create", challenge, options);
  const respondChallenge = ({ id, score, teamId = "" } = {}) => mutateChallenge("respond", { id, score }, { teamId });

  const hydrateChallenges = async ({ teamId = "", localChallenges = [] } = {}) => {
    const context = readContext(storage);
    const activeTeamId = clean(teamId || context.teamId);
    const localRows = visibleLocalRows(localChallenges, context, activeTeamId);
    if (!context.requester || context.role !== "player" || !activeTeamId) {
      return { ok: true, useRemote: false, storageMode: "local_only", teamId: activeTeamId, rows: localRows };
    }
    const loaded = await loadChallenges({ teamId: activeTeamId });
    if (loaded.storageMode === "demo_local") {
      return { ...loaded, useRemote: false, rows: localRows, promotedCount: 0 };
    }
    let remoteRows = loaded.rows;
    let promotedCount = 0;
    const remoteIds = new Set(remoteRows.map((row) => row.id));
    const promotable = localRows.filter((row) => row.from === context.requester && row.status === "pending" && !remoteIds.has(row.id)).slice(0, 25);
    for (const row of promotable) {
      try {
        const promoted = await createChallenge(row, { teamId: activeTeamId });
        remoteRows = mergePlayerChallenges(remoteRows, [promoted.challenge]);
        remoteIds.add(promoted.challenge.id);
        promotedCount += 1;
      } catch {
        // Keep the legacy row locally. It must never be promoted as an incoming
        // challenge because only its original challenger may create it.
      }
    }
    const retainedLocalRows = localRows.filter((row) => row.from === context.requester);
    return {
      ...loaded,
      useRemote: true,
      promotedCount,
      rows: mergePlayerChallenges(retainedLocalRows, remoteRows),
    };
  };

  return {
    loadChallenges,
    createChallenge,
    respondChallenge,
    hydrateChallenges,
    readContext: () => readContext(storage),
  };
}

export const __testUtils = { readContext, visibleLocalRows };
