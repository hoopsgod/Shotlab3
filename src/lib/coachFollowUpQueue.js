import { getCoachRosterPlayers } from "./playerDataManagement.js";
import { loadCoachFollowUps, sanitizeCoachFollowUp } from "./coachFollowUpService.js";

const clean = (value) => String(value ?? "").trim();
const identity = (value) => clean(value).toLowerCase();
const safeArray = (value) => (Array.isArray(value) ? value : []);

const parse = (raw, fallback) => {
  try { return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
};

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

const isCoachRosterRow = (row = {}) => {
  const role = identity(row?.role);
  return row?.isCoach === true || role === "coach" || role === "assistant_coach";
};

export function deriveCoachFollowUpQueue({ records = [], roster = [], teamId = "" } = {}) {
  const targetTeamId = clean(teamId);
  const activeIdentities = new Set(safeArray(roster).filter((row) => !isCoachRosterRow(row)).flatMap(rosterIdentityKeys));
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
  const roster = getCoachRosterPlayers({ players, playerProfiles: profiles, teamId }).filter((row) => !isCoachRosterRow(row));
  return { requester, teamId, roster };
}

export async function loadCoachFollowUpQueue({
  storage = globalThis?.localStorage,
  fetchImpl = globalThis?.fetch,
} = {}) {
  const context = readCoachFollowUpQueueContext(storage);
  const result = await loadCoachFollowUps({ teamId: context.teamId, storage, fetchImpl });
  return {
    ok: result.ok,
    storageMode: result.storageMode,
    queue: deriveCoachFollowUpQueue({ records: result.records, roster: context.roster, teamId: context.teamId }),
    context,
    ...(result.error ? { error: result.error } : {}),
  };
}
