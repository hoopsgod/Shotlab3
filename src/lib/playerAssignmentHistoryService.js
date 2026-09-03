import { normalizeAssignmentDueDate } from "./assignmentDeadline.js";
import {
  assignmentHeaders,
  getPlayerAssignmentLocal,
  normalizePlayerAssignment,
  readAssignmentSession,
  savePlayerAssignmentLocal,
} from "./playerAssignmentService.js";

export const PLAYER_ASSIGNMENT_HISTORY_STORAGE_KEY = "sl:player-assignment-history";
const clean = (value, max = 4000) => String(value ?? "").trim().slice(0, max);
const identity = (value) => clean(value, 320).toLowerCase();
const parse = (value, fallback) => {
  try { return value ? JSON.parse(value) : fallback; } catch { return fallback; }
};
const keyFor = (row) => `${clean(row?.teamId, 180)}::${identity(row?.playerIdentity)}::${clean(row?.createdAt, 120)}`;

export function normalizePlayerAssignmentHistory(value = {}) {
  const assignment = normalizePlayerAssignment(value);
  if (!assignment || assignment.state !== "completed" || !assignment.completedAt) return null;
  return { ...assignment, archivedAt: clean(value?.archived_at || value?.archivedAt, 120) };
}

export function readPlayerAssignmentHistoryStore(storage = globalThis?.localStorage) {
  const parsed = parse(storage?.getItem?.(PLAYER_ASSIGNMENT_HISTORY_STORAGE_KEY), {});
  return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
}

function writeHistoryStore(store, storage = globalThis?.localStorage) {
  storage?.setItem?.(PLAYER_ASSIGNMENT_HISTORY_STORAGE_KEY, JSON.stringify(store || {}));
}

export function archivePlayerAssignmentLocal(record, storage = globalThis?.localStorage) {
  const normalized = normalizePlayerAssignmentHistory({ ...record, archivedAt: record?.archivedAt || new Date().toISOString() });
  if (!normalized) return null;
  const store = readPlayerAssignmentHistoryStore(storage);
  store[keyFor(normalized)] = normalized;
  writeHistoryStore(store, storage);
  return normalized;
}

export function listPlayerAssignmentHistoryLocal({ teamId = "", storage = globalThis?.localStorage } = {}) {
  const activeTeamId = clean(teamId, 180);
  return Object.values(readPlayerAssignmentHistoryStore(storage))
    .map(normalizePlayerAssignmentHistory)
    .filter((row) => row && (!activeTeamId || row.teamId === activeTeamId))
    .sort((left, right) => String(right.completedAt || right.archivedAt).localeCompare(String(left.completedAt || left.archivedAt)));
}

export function replaceTeamPlayerAssignmentHistoryLocal(history = [], { teamId = "", storage = globalThis?.localStorage } = {}) {
  const activeTeamId = clean(teamId, 180);
  if (!activeTeamId) return [];
  const store = readPlayerAssignmentHistoryStore(storage);
  for (const [key, value] of Object.entries(store)) {
    const row = normalizePlayerAssignmentHistory(value);
    if (row?.teamId === activeTeamId || key.startsWith(`${activeTeamId}::`)) delete store[key];
  }
  const normalized = history.map(normalizePlayerAssignmentHistory).filter((row) => row?.teamId === activeTeamId);
  for (const row of normalized) store[keyFor(row)] = row;
  writeHistoryStore(store, storage);
  return normalized;
}

export async function loadCoachAssignmentHistory({
  teamId = "",
  storage = globalThis?.localStorage,
  fetchImpl = globalThis?.fetch,
} = {}) {
  const session = readAssignmentSession(storage);
  const activeTeamId = clean(teamId || session.teamId, 180);
  const local = listPlayerAssignmentHistoryLocal({ teamId: activeTeamId, storage });
  if (session.role && session.role !== "coach") return { ok: false, storageMode: "forbidden", history: [], error: "coach_required" };
  if (!session.requester || !activeTeamId || typeof fetchImpl !== "function") return { ok: true, storageMode: "local_only", history: local };
  try {
    const query = new URLSearchParams({ team_id: activeTeamId });
    const response = await fetchImpl(`/v1/player-assignment-history?${query.toString()}`, { method: "GET", headers: assignmentHeaders(storage) });
    const body = await response.json().catch(() => ({}));
    if (!response?.ok || body?.error) return { ok: false, storageMode: "local_fallback", history: local, error: body?.error || "assignment_history_load_failed" };
    const history = replaceTeamPlayerAssignmentHistoryLocal(Array.isArray(body?.history) ? body.history : [], { teamId: activeTeamId, storage });
    return { ok: true, storageMode: body?.storage_mode || "team_remote", history };
  } catch (error) {
    return { ok: false, storageMode: "local_fallback", history: local, error: String(error?.message || "assignment_history_load_failed") };
  }
}

export async function saveNextPlayerAssignment({
  teamId = "",
  playerIdentity = "",
  playerName = "",
  assignmentText = "",
  dueDate = "",
  storage = globalThis?.localStorage,
  fetchImpl = globalThis?.fetch,
} = {}) {
  const session = readAssignmentSession(storage);
  const activeTeamId = clean(teamId || session.teamId, 180);
  const target = identity(playerIdentity);
  const current = getPlayerAssignmentLocal({ teamId: activeTeamId, playerIdentity: target, storage });
  if (!current || current.state !== "completed") return { ok: false, message: "Complete current assignment before assigning next.", error: "completed_assignment_required" };
  const text = clean(assignmentText, 4000);
  if (!text) return { ok: false, message: "New assignment required.", error: "assignment_text_required" };

  const archived = archivePlayerAssignmentLocal(current, storage);
  const now = new Date().toISOString();
  const draft = normalizePlayerAssignment({
    teamId: activeTeamId,
    playerIdentity: target,
    playerName: clean(playerName || current.playerName, 320),
    assignmentText: text,
    resultDetail: "",
    dueDate: normalizeAssignmentDueDate(dueDate),
    state: "assigned",
    assignedBy: session.requester,
    createdAt: now,
    updatedAt: now,
  });

  if (!session.requester || typeof fetchImpl !== "function") {
    const local = savePlayerAssignmentLocal(draft, storage);
    return { ok: true, storageMode: "local_only", assignment: local, archivedAssignment: archived, message: "Next assignment saved locally; completed work remains in history." };
  }

  try {
    const response = await fetchImpl("/v1/player-assignment-history", {
      method: "POST",
      headers: assignmentHeaders(storage, { "Content-Type": "application/json" }),
      body: JSON.stringify({
        team_id: activeTeamId,
        assignment: {
          player_identity: target,
          player_name: draft.playerName,
          assignment_text: draft.assignmentText,
          due_date: draft.dueDate || null,
        },
      }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response?.ok || body?.error) {
      return { ok: false, retryable: true, historySaved: true, storageMode: "local_fallback", assignment: current, archivedAssignment: archived, error: body?.error || "assignment_next_failed", message: "Completed assignment preserved; next delivery failed. Retry when sync returns." };
    }
    const remote = normalizePlayerAssignment(body?.assignment) || draft;
    savePlayerAssignmentLocal(remote, storage);
    if (body?.archived_assignment) archivePlayerAssignmentLocal(body.archived_assignment, storage);
    return { ok: true, storageMode: body?.storage_mode || "team_remote", assignment: remote, archivedAssignment: normalizePlayerAssignmentHistory(body?.archived_assignment) || archived, message: body?.storage_mode === "demo_local" ? "Next assignment saved in demo." : "Next assignment delivered; previous work preserved in history." };
  } catch (error) {
    return { ok: false, retryable: true, historySaved: true, storageMode: "local_fallback", assignment: current, archivedAssignment: archived, error: String(error?.message || "assignment_next_failed"), message: "Completed assignment preserved; next delivery failed. Retry when sync returns." };
  }
}

export const __testUtils = { readSession: readAssignmentSession, keyFor };
