import { assignmentDateKey, normalizeAssignmentDueDate } from "./assignmentDeadline.js";
import { loadCoachAssignmentHistory } from "./playerAssignmentHistoryService.js";
import { loadTeamPlayerAssignments, normalizePlayerAssignment } from "./playerAssignmentService.js";

const clean = (value, max = 4000) => String(value ?? "").trim().slice(0, max);
const identity = (value) => clean(value, 320).toLowerCase();
const DAY_MS = 24 * 60 * 60 * 1000;

const timeValue = (value) => {
  const parsed = Date.parse(value || "");
  return Number.isFinite(parsed) ? parsed : null;
};

const durationBetween = (start, end) => {
  const startMs = timeValue(start);
  const endMs = timeValue(end);
  if (startMs == null || endMs == null || endMs < startMs) return null;
  return endMs - startMs;
};

const dateKeyValue = (value) => {
  const normalized = normalizeAssignmentDueDate(value);
  if (!normalized) return null;
  const [year, month, day] = normalized.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
};

const median = (values = []) => {
  const ordered = values.filter(Number.isFinite).sort((left, right) => left - right);
  if (!ordered.length) return null;
  const middle = Math.floor(ordered.length / 2);
  return ordered.length % 2 ? ordered[middle] : (ordered[middle - 1] + ordered[middle]) / 2;
};

function normalizeCompletedCycle(value = {}, source = "history") {
  const assignment = normalizePlayerAssignment(value);
  if (!assignment || assignment.state !== "completed" || !assignment.completedAt) return null;
  const completionMs = durationBetween(assignment.createdAt, assignment.completedAt);
  const completionDate = assignmentDateKey(assignment.completedAt);
  const dueDate = normalizeAssignmentDueDate(assignment.dueDate);
  const onTime = Number.isFinite(completionMs) && dueDate && completionDate ? completionDate <= dueDate : null;
  const dueValue = dateKeyValue(dueDate);
  const completionValue = dateKeyValue(completionDate);
  return {
    ...assignment,
    source,
    key: `${assignment.teamId}::${assignment.playerIdentity}::${assignment.createdAt}`,
    acknowledgeMs: durationBetween(assignment.createdAt, assignment.acknowledgedAt),
    startMs: durationBetween(assignment.createdAt, assignment.startedAt),
    completionMs,
    onTime,
    lateDays: onTime === false && dueValue != null && completionValue != null
      ? Math.max(1, Math.round((completionValue - dueValue) / DAY_MS))
      : 0,
  };
}

export function buildCoachAssignmentEffectiveness({
  teamId = "",
  history = [],
  assignments = [],
} = {}) {
  const activeTeamId = clean(teamId, 180);
  const byKey = new Map();
  for (const row of Array.isArray(history) ? history : []) {
    const cycle = normalizeCompletedCycle(row, "history");
    if (cycle?.teamId === activeTeamId) byKey.set(cycle.key, cycle);
  }
  for (const row of Array.isArray(assignments) ? assignments : []) {
    const cycle = normalizeCompletedCycle(row, "current");
    if (cycle?.teamId === activeTeamId && !byKey.has(cycle.key)) byKey.set(cycle.key, cycle);
  }

  const cycles = [...byKey.values()].sort((left, right) => String(right.completedAt).localeCompare(String(left.completedAt)));
  const deadlineCycles = cycles.filter((row) => row.onTime != null);
  const onTimeCount = deadlineCycles.filter((row) => row.onTime).length;
  const lateCount = deadlineCycles.length - onTimeCount;
  const playerMap = new Map();

  for (const cycle of cycles) {
    const playerKey = identity(cycle.playerIdentity);
    if (!playerKey) continue;
    const aggregate = playerMap.get(playerKey) || {
      playerIdentity: playerKey,
      playerName: clean(cycle.playerName || playerKey, 320),
      cycles: 0,
      deadlineCycles: 0,
      onTimeCount: 0,
      lateCount: 0,
      lateDays: 0,
      responseDurations: [],
      completionDurations: [],
      lastCompletedAt: "",
      recentAssignmentText: "",
    };
    aggregate.cycles += 1;
    if (cycle.onTime != null) {
      aggregate.deadlineCycles += 1;
      if (cycle.onTime) aggregate.onTimeCount += 1;
      else {
        aggregate.lateCount += 1;
        aggregate.lateDays += cycle.lateDays;
      }
    }
    if (Number.isFinite(cycle.acknowledgeMs)) aggregate.responseDurations.push(cycle.acknowledgeMs);
    if (Number.isFinite(cycle.completionMs)) aggregate.completionDurations.push(cycle.completionMs);
    if (!aggregate.lastCompletedAt || String(cycle.completedAt) > String(aggregate.lastCompletedAt)) {
      aggregate.lastCompletedAt = cycle.completedAt;
      aggregate.recentAssignmentText = cycle.assignmentText;
      aggregate.playerName = clean(cycle.playerName || aggregate.playerName, 320);
    }
    playerMap.set(playerKey, aggregate);
  }

  const players = [...playerMap.values()].map((row) => ({
    ...row,
    onTimeRate: row.deadlineCycles ? Math.round((row.onTimeCount / row.deadlineCycles) * 100) : null,
    medianResponseMs: median(row.responseDurations),
    medianCompletionMs: median(row.completionDurations),
  })).sort((left, right) => {
    if (left.lateCount !== right.lateCount) return right.lateCount - left.lateCount;
    const leftPace = Number.isFinite(left.medianCompletionMs) ? left.medianCompletionMs : -1;
    const rightPace = Number.isFinite(right.medianCompletionMs) ? right.medianCompletionMs : -1;
    if (leftPace !== rightPace) return rightPace - leftPace;
    if (left.lastCompletedAt !== right.lastCompletedAt) return String(right.lastCompletedAt).localeCompare(String(left.lastCompletedAt));
    return left.playerName.localeCompare(right.playerName);
  });

  const total = cycles.length;
  return {
    teamId: activeTeamId,
    total,
    playerCount: players.length,
    deadlineCount: deadlineCycles.length,
    onTimeCount,
    lateCount,
    onTimeRate: deadlineCycles.length ? Math.round((onTimeCount / deadlineCycles.length) * 100) : null,
    medianResponseMs: median(cycles.map((row) => row.acknowledgeMs)),
    medianStartMs: median(cycles.map((row) => row.startMs)),
    medianCompletionMs: median(cycles.map((row) => row.completionMs)),
    responseSampleCount: cycles.filter((row) => Number.isFinite(row.acknowledgeMs)).length,
    completionSampleCount: cycles.filter((row) => Number.isFinite(row.completionMs)).length,
    attentionCount: players.filter((row) => row.lateCount > 0).length,
    sampleLabel: total >= 8 ? "Established" : total >= 3 ? "Developing" : "Early signal",
    cycles,
    players,
    hasEvidence: total > 0,
  };
}

export async function loadCoachAssignmentEffectiveness({
  teamId = "",
  storage = globalThis?.localStorage,
  fetchImpl = globalThis?.fetch,
} = {}) {
  const [historyResult, assignmentResult] = await Promise.all([
    loadCoachAssignmentHistory({ teamId, storage, fetchImpl }),
    loadTeamPlayerAssignments({ teamId, storage, fetchImpl }),
  ]);
  const resolvedTeamId = clean(teamId || historyResult?.history?.[0]?.teamId || assignmentResult?.assignments?.[0]?.teamId, 180);
  const model = buildCoachAssignmentEffectiveness({
    teamId: resolvedTeamId,
    history: historyResult?.history || [],
    assignments: assignmentResult?.assignments || [],
  });
  const bothRemote = historyResult?.storageMode === "team_remote" && assignmentResult?.storageMode === "team_remote";
  const forbidden = historyResult?.storageMode === "forbidden" || assignmentResult?.storageMode === "forbidden";
  return {
    ok: !forbidden && Boolean(historyResult?.ok || assignmentResult?.ok),
    storageMode: forbidden ? "forbidden" : bothRemote ? "team_remote" : historyResult?.storageMode || assignmentResult?.storageMode || "local_only",
    model,
    errors: [historyResult?.error, assignmentResult?.error].filter(Boolean),
  };
}

export const __testUtils = { normalizeCompletedCycle, durationBetween, median };
