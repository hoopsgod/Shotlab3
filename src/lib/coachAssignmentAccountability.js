import { loadTeamPlayerAssignments } from "./playerAssignmentService.js";

const STATES = ["unassigned", "assigned", "acknowledged", "started", "completed"];
const PRIORITY = new Map(STATES.map((state, index) => [state, index]));
const clean = (value, max = 4000) => String(value ?? "").trim().slice(0, max);
const identity = (value) => clean(value, 320).toLowerCase();
const parse = (value, fallback) => {
  try { return value ? JSON.parse(value) : fallback; } catch { return fallback; }
};

function sessionContext(storage = globalThis?.localStorage) {
  const raw = parse(storage?.getItem?.("sl:session"), {});
  const session = Array.isArray(raw) ? raw[0] : raw;
  return {
    teamId: clean(session?.teamId || session?.team_id, 180),
    requester: identity(session?.email || session?.userEmail || session?.user_id),
  };
}

function playerIdentity(player = {}) {
  return [player?.email, player?.player_email, player?.playerId, player?.player_id, player?.userId, player?.user_id, player?.id]
    .map(identity)
    .find(Boolean) || "";
}

function playerName(player = {}, fallback = "Player") {
  return clean(player?.name || player?.displayName || player?.display_name || [player?.firstName, player?.lastName].filter(Boolean).join(" ") || fallback, 320);
}

function activePlayer(player = {}, teamId = "") {
  const role = identity(player?.role || (player?.isCoach ? "coach" : "player"));
  const playerTeamId = clean(player?.teamId || player?.team_id, 180);
  const rosterStatus = identity(player?.rosterStatus || player?.roster_status);
  return role === "player"
    && playerTeamId === teamId
    && rosterStatus !== "removed"
    && !player?.removedFromTeamId
    && !player?.removed_from_team_id
    && player?.hideFromLeaderboards !== true
    && player?.hide_from_leaderboards !== true;
}

export function readActiveCoachRoster({ teamId = "", storage = globalThis?.localStorage } = {}) {
  const context = sessionContext(storage);
  const activeTeamId = clean(teamId || context.teamId, 180);
  const players = parse(storage?.getItem?.("sl:players"), []);
  const byIdentity = new Map();
  for (const player of Array.isArray(players) ? players : []) {
    if (!activePlayer(player, activeTeamId)) continue;
    const email = playerIdentity(player);
    if (!email || byIdentity.has(email)) continue;
    byIdentity.set(email, {
      teamId: activeTeamId,
      playerIdentity: email,
      playerName: playerName(player, email),
    });
  }
  return [...byIdentity.values()].sort((left, right) => left.playerName.localeCompare(right.playerName));
}

const validState = (value) => {
  const state = identity(value);
  return PRIORITY.has(state) && state !== "unassigned" ? state : "assigned";
};

const timeValue = (value) => {
  const parsed = Date.parse(value || "");
  return Number.isFinite(parsed) ? parsed : 0;
};

export function buildCoachAssignmentAccountability({ teamId = "", players = [], assignments = [] } = {}) {
  const activeTeamId = clean(teamId, 180);
  const assignmentByPlayer = new Map();
  for (const assignment of Array.isArray(assignments) ? assignments : []) {
    const target = identity(assignment?.playerIdentity || assignment?.player_identity);
    const assignmentTeamId = clean(assignment?.teamId || assignment?.team_id, 180);
    if (!target || assignmentTeamId !== activeTeamId) continue;
    assignmentByPlayer.set(target, {
      teamId: activeTeamId,
      playerIdentity: target,
      playerName: clean(assignment?.playerName || assignment?.player_name, 320),
      assignmentText: clean(assignment?.assignmentText || assignment?.assignment_text, 4000),
      resultDetail: clean(assignment?.resultDetail || assignment?.result_detail, 1000),
      state: validState(assignment?.state),
      createdAt: clean(assignment?.createdAt || assignment?.created_at, 120),
      updatedAt: clean(assignment?.updatedAt || assignment?.updated_at, 120),
      acknowledgedAt: clean(assignment?.acknowledgedAt || assignment?.acknowledged_at, 120),
      startedAt: clean(assignment?.startedAt || assignment?.started_at, 120),
      completedAt: clean(assignment?.completedAt || assignment?.completed_at, 120),
    });
  }

  const rows = (Array.isArray(players) ? players : []).map((player) => {
    const playerIdentityValue = identity(player?.playerIdentity || player?.player_identity || player?.email);
    const assignment = assignmentByPlayer.get(playerIdentityValue) || null;
    const state = assignment?.state || "unassigned";
    return {
      teamId: activeTeamId,
      playerIdentity: playerIdentityValue,
      playerName: clean(player?.playerName || player?.player_name || player?.name || assignment?.playerName || playerIdentityValue, 320),
      state,
      assignmentText: assignment?.assignmentText || "",
      resultDetail: assignment?.resultDetail || "",
      updatedAt: assignment?.updatedAt || assignment?.createdAt || "",
      completedAt: assignment?.completedAt || "",
    };
  }).filter((row) => row.playerIdentity);

  rows.sort((left, right) => {
    const rank = (PRIORITY.get(left.state) ?? 99) - (PRIORITY.get(right.state) ?? 99);
    if (rank) return rank;
    if (left.state === "completed") return timeValue(right.completedAt || right.updatedAt) - timeValue(left.completedAt || left.updatedAt);
    const leftTime = timeValue(left.updatedAt);
    const rightTime = timeValue(right.updatedAt);
    if (leftTime !== rightTime) return leftTime - rightTime;
    return left.playerName.localeCompare(right.playerName);
  });

  const counts = Object.fromEntries(STATES.map((state) => [state, rows.filter((row) => row.state === state).length]));
  const delivered = rows.length - counts.unassigned;
  const responded = counts.acknowledged + counts.started + counts.completed;
  const actionRows = rows.filter((row) => row.state !== "completed");
  const completedRows = rows.filter((row) => row.state === "completed");

  return {
    teamId: activeTeamId,
    total: rows.length,
    delivered,
    responded,
    responseRate: delivered ? Math.round((responded / delivered) * 100) : 0,
    completionRate: delivered ? Math.round((counts.completed / delivered) * 100) : 0,
    actionCount: actionRows.length,
    counts,
    rows,
    actionRows,
    completedRows,
    hasRoster: rows.length > 0,
    hasAssignments: delivered > 0,
  };
}

export async function loadCoachAssignmentAccountability({
  teamId = "",
  storage = globalThis?.localStorage,
  fetchImpl = globalThis?.fetch,
} = {}) {
  const context = sessionContext(storage);
  const activeTeamId = clean(teamId || context.teamId, 180);
  const roster = readActiveCoachRoster({ teamId: activeTeamId, storage });
  const result = await loadTeamPlayerAssignments({ teamId: activeTeamId, storage, fetchImpl });
  return {
    ...result,
    model: buildCoachAssignmentAccountability({ teamId: activeTeamId, players: roster, assignments: result.assignments }),
  };
}

export const __testUtils = { sessionContext, playerIdentity, activePlayer };
