import { getCoachRosterPlayers } from "./playerDataManagement.js";
import {
  readCoachFollowUpStore,
  sanitizeCoachFollowUp,
  writeCoachFollowUpStore,
} from "./coachFollowUpService.js";

const clean = (value) => String(value ?? "").trim();
const identity = (value) => clean(value).toLowerCase();
const safeArray = (value) => (Array.isArray(value) ? value : []);

const parse = (raw, fallback) => {
  try { return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
};

const readJson = async (response) => {
  try { return await response.json(); } catch { return {}; }
};

const recordKey = (record = {}) => `${clean(record.teamId)}::${identity(record.playerIdentity)}`;
const dateValue = (value) => {
  const time = Date.parse(String(value || ""));
  return Number.isFinite(time) ? time : 0;
};

const rosterIdentityKeys = (row = {}) => [
  row?.email,
  row?.player_email,
  row?.playerId,
  row?.player_id,
  row?.userId,
  row?.user_id,
  row?.profileId,
  row?.profile_id,
  row?.id,
].map(identity).filter(Boolean);

export function deriveCoachFollowUpQueue({ records = [], roster = [], teamId = "" } = {}) {
  const targetTeamId = clean(teamId);
  const activeIdentities = new Set(safeArray(roster).flatMap(rosterIdentityKeys));
  const activeRecords = safeArray(records)
    .map(sanitizeCoachFollowUp)
    .filter((record) => (
      record.teamId === targetTeamId
      && record.state !== "dismissed"
      && record.playerIdentity
      && activeIdentities.has(record.playerIdentity)
    ));

  const planned = activeRecords
    .filter((record) => record.state === "planned")
    .sort((a, b) => dateValue(b.updatedAt) - dateValue(a.updatedAt) || a.playerName.localeCompare(b.playerName));
  const completed = activeRecords
    .filter((record) => record.state === "completed")
    .sort((a, b) => dateValue(b.completedAt || b.updatedAt) - dateValue(a.completedAt || a.updatedAt) || a.playerName.localeCompare(b.playerName));

  return {
    teamId: targetTeamId,
    planned,
    completed,
    openCount: planned.length,
    completedCount: completed.length,
    totalCount: activeRecords.length,
    hasRecords: activeRecords.length > 0,
  };
}

export function readCoachFollowUpQueueContext(storage = globalThis?.localStorage) {
  const sessionRaw = parse(storage?.getItem?.("sl:session"), {});
  const session = Array.isArray(sessionRaw) ? sessionRaw[0] : sessionRaw;
  const requester = identity(session?.email || session?.userEmail || session?.user_id);
  const players = parse(storage?.getItem?.("sl:players"), []);
  const profiles = parse(storage?.getItem?.("sl:player-profiles"), []);
  const actor = safeArray(players).find((player) => identity(player?.email) === requester);
  const teamId = clean(session?.teamId || session?.team_id || actor?.teamId || actor?.team_id);
  const roster = getCoachRosterPlayers({ players, playerProfiles: profiles, teamId });
  return { requester, teamId, roster };
}

export async function loadCoachFollowUpQueue({
  storage = globalThis?.localStorage,
  fetchImpl = globalThis?.fetch,
} = {}) {
  const context = readCoachFollowUpQueueContext(storage);
  const localRecords = Object.values(readCoachFollowUpStore(storage)).map(sanitizeCoachFollowUp);
  const localQueue = deriveCoachFollowUpQueue({ records: localRecords, roster: context.roster, teamId: context.teamId });

  if (!context.requester || !context.teamId || typeof fetchImpl !== "function") {
    return { ok: true, storageMode: "local_only", queue: localQueue, context };
  }

  try {
    const response = await fetchImpl(`/v1/coach-follow-ups?team_id=${encodeURIComponent(context.teamId)}`, {
      method: "GET",
      headers: { "x-user-id": context.requester },
    });
    const body = await readJson(response);
    if (!response?.ok || body?.error) {
      return {
        ok: false,
        storageMode: "local_fallback",
        queue: localQueue,
        context,
        error: String(body?.error || "follow_up_queue_load_failed"),
      };
    }

    const remoteRecords = safeArray(body?.follow_ups).map(sanitizeCoachFollowUp);
    const store = { ...readCoachFollowUpStore(storage) };
    for (const record of remoteRecords) {
      if (record.teamId && record.playerIdentity) store[recordKey(record)] = record;
    }
    writeCoachFollowUpStore(storage, store);
    const queue = deriveCoachFollowUpQueue({ records: remoteRecords, roster: context.roster, teamId: context.teamId });
    return { ok: true, storageMode: body?.storage_mode || "team_remote", queue, context };
  } catch (error) {
    return {
      ok: false,
      storageMode: "local_fallback",
      queue: localQueue,
      context,
      error: String(error?.message || "follow_up_queue_load_failed"),
    };
  }
}
