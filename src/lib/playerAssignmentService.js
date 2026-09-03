import { buildApiIdentityHeaders } from "./apiIdentityHeaders.js";
import { normalizeAssignmentDueDate } from "./assignmentDeadline.js";

export const PLAYER_ASSIGNMENT_STORAGE_KEY = "sl:player-assignments";
export const PLAYER_ASSIGNMENT_CHANGE_EVENT = "shotlab:player-assignment-changed";
const STATES = new Set(["assigned", "acknowledged", "started", "completed"]);
const clean = (value, max = 4000) => String(value ?? "").trim().slice(0, max);
const identity = (value) => clean(value, 320).toLowerCase();
const keyFor = (teamId, playerIdentity) => `${clean(teamId, 180)}::${identity(playerIdentity)}`;

const parseJson = (value, fallback) => {
  try { return value ? JSON.parse(value) : fallback; } catch { return fallback; }
};

const readJson = async (response) => {
  try { return await response.json(); } catch { return {}; }
};

export function assignmentReadState(result = {}, value = null) {
  const hasValue = Array.isArray(value) ? value.length : value;
  if (result.storageMode === "forbidden" || result.error === "coach_required") return "denied";
  return result.ok ? (hasValue ? "success" : "empty") : (hasValue ? "degraded" : "failure");
}

export function readAssignmentSession(storage = globalThis?.localStorage) {
  const raw = parseJson(storage?.getItem?.("sl:session"), {});
  const session = Array.isArray(raw) ? raw[0] : raw;
  return {
    requester: identity(session?.email || session?.userEmail || session?.user_id),
    teamId: clean(session?.teamId || session?.team_id, 180),
    role: identity(session?.role),
  };
}

export function assignmentHeaders(storage, extra = {}) {
  const { requester } = readAssignmentSession(storage);
  return buildApiIdentityHeaders({ requester, storage, headers: extra });
}

export function normalizePlayerAssignment(value = {}) {
  const state = identity(value?.state || "assigned");
  const row = {
    teamId: clean(value?.team_id || value?.teamId, 180),
    playerIdentity: identity(value?.player_identity || value?.playerIdentity),
    playerName: clean(value?.player_name || value?.playerName, 320),
    assignmentText: clean(value?.assignment_text || value?.assignmentText, 4000),
    resultDetail: clean(value?.result_detail || value?.resultDetail, 1000),
    dueDate: normalizeAssignmentDueDate(value?.due_date || value?.dueDate),
    state: STATES.has(state) ? state : "assigned",
    assignedBy: identity(value?.assigned_by || value?.assignedBy),
    createdAt: clean(value?.created_at || value?.createdAt, 120),
    updatedAt: clean(value?.updated_at || value?.updatedAt, 120),
    acknowledgedAt: clean(value?.acknowledged_at || value?.acknowledgedAt, 120),
    startedAt: clean(value?.started_at || value?.startedAt, 120),
    completedAt: clean(value?.completed_at || value?.completedAt, 120),
  };
  return row.teamId && row.playerIdentity && row.assignmentText ? row : null;
}

export function readPlayerAssignmentStore(storage = globalThis?.localStorage) {
  const parsed = parseJson(storage?.getItem?.(PLAYER_ASSIGNMENT_STORAGE_KEY), {});
  return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
}

function writePlayerAssignmentStore(store, storage = globalThis?.localStorage) {
  storage?.setItem?.(PLAYER_ASSIGNMENT_STORAGE_KEY, JSON.stringify(store || {}));
}

function announce(record) {
  try {
    globalThis?.dispatchEvent?.(new CustomEvent(PLAYER_ASSIGNMENT_CHANGE_EVENT, { detail: record }));
  } catch {}
}

export function savePlayerAssignmentLocal(record, storage = globalThis?.localStorage) {
  const normalized = normalizePlayerAssignment(record);
  if (!normalized) return null;
  const store = readPlayerAssignmentStore(storage);
  store[keyFor(normalized.teamId, normalized.playerIdentity)] = normalized;
  writePlayerAssignmentStore(store, storage);
  announce(normalized);
  return normalized;
}

export function getPlayerAssignmentLocal({ teamId = "", playerIdentity = "", storage = globalThis?.localStorage } = {}) {
  return normalizePlayerAssignment(readPlayerAssignmentStore(storage)?.[keyFor(teamId, playerIdentity)] || {});
}

export function listPlayerAssignmentsLocal({ teamId = "", storage = globalThis?.localStorage } = {}) {
  const activeTeamId = clean(teamId, 180);
  return Object.values(readPlayerAssignmentStore(storage))
    .map(normalizePlayerAssignment)
    .filter((row) => row && (!activeTeamId || row.teamId === activeTeamId))
    .sort((left, right) => String(right.updatedAt || right.createdAt).localeCompare(String(left.updatedAt || left.createdAt)));
}

export function replaceTeamPlayerAssignmentsLocal(assignments = [], { teamId = "", storage = globalThis?.localStorage } = {}) {
  const activeTeamId = clean(teamId, 180);
  if (!activeTeamId) return [];
  const store = readPlayerAssignmentStore(storage);
  for (const [key, value] of Object.entries(store)) {
    const normalized = normalizePlayerAssignment(value);
    if (normalized?.teamId === activeTeamId || key.startsWith(`${activeTeamId}::`)) delete store[key];
  }
  const normalizedAssignments = assignments
    .map(normalizePlayerAssignment)
    .filter((row) => row?.teamId === activeTeamId);
  for (const row of normalizedAssignments) store[keyFor(row.teamId, row.playerIdentity)] = row;
  writePlayerAssignmentStore(store, storage);
  return normalizedAssignments;
}

export async function loadTeamPlayerAssignments({
  teamId = "",
  storage = globalThis?.localStorage,
  fetchImpl = globalThis?.fetch,
} = {}) {
  const session = readAssignmentSession(storage);
  const activeTeamId = clean(teamId || session.teamId, 180);
  const local = listPlayerAssignmentsLocal({ teamId: activeTeamId, storage });
  if (session.role && session.role !== "coach") return { ok: false, storageMode: "forbidden", assignments: [], error: "coach_required" };
  if (!session.requester || !activeTeamId || typeof fetchImpl !== "function") return { ok: true, storageMode: "local_only", assignments: local };

  const query = new URLSearchParams({ team_id: activeTeamId });
  try {
    const response = await fetchImpl(`/v1/player-assignments?${query.toString()}`, { method: "GET", headers: assignmentHeaders(storage) });
    const body = await readJson(response);
    if (!response?.ok || body?.error) return { ok: false, storageMode: "local_fallback", assignments: local, error: body?.error || "assignment_load_failed" };
    const remote = replaceTeamPlayerAssignmentsLocal(Array.isArray(body?.assignments) ? body.assignments : [], { teamId: activeTeamId, storage });
    return { ok: true, storageMode: body?.storage_mode || "team_remote", assignments: remote };
  } catch (error) {
    return { ok: false, storageMode: "local_fallback", assignments: local, error: String(error?.message || "assignment_load_failed") };
  }
}

export async function loadPlayerAssignment({
  teamId = "",
  playerIdentity = "",
  storage = globalThis?.localStorage,
  fetchImpl = globalThis?.fetch,
} = {}) {
  const session = readAssignmentSession(storage);
  const activeTeamId = clean(teamId || session.teamId, 180);
  const targetIdentity = identity(playerIdentity || (session.role === "player" ? session.requester : ""));
  const local = targetIdentity ? getPlayerAssignmentLocal({ teamId: activeTeamId, playerIdentity: targetIdentity, storage }) : null;
  if (!session.requester || !activeTeamId || typeof fetchImpl !== "function") return { ok: true, storageMode: "local_only", assignment: local };

  const query = new URLSearchParams({ team_id: activeTeamId });
  if (targetIdentity && session.role !== "player") query.set("player_identity", targetIdentity);
  try {
    const response = await fetchImpl(`/v1/player-assignments?${query.toString()}`, { method: "GET", headers: assignmentHeaders(storage) });
    const body = await readJson(response);
    if (!response?.ok || body?.error) return { ok: false, storageMode: "local_fallback", assignment: local, error: body?.error || "assignment_load_failed" };
    const remote = (Array.isArray(body?.assignments) ? body.assignments : []).map(normalizePlayerAssignment).filter(Boolean)
      .find((row) => !targetIdentity || row.playerIdentity === targetIdentity) || null;
    if (remote) savePlayerAssignmentLocal(remote, storage);
    return { ok: true, storageMode: body?.storage_mode || "team_remote", assignment: remote || local };
  } catch (error) {
    return { ok: false, storageMode: "local_fallback", assignment: local, error: String(error?.message || "assignment_load_failed") };
  }
}

export async function savePlayerAssignment({
  teamId = "",
  playerIdentity = "",
  playerName = "",
  assignmentText = "",
  resultDetail = "",
  dueDate = "",
  storage = globalThis?.localStorage,
  fetchImpl = globalThis?.fetch,
} = {}) {
  const session = readAssignmentSession(storage);
  const activeTeamId = clean(teamId || session.teamId, 180);
  const now = new Date().toISOString();
  const draft = normalizePlayerAssignment({
    teamId: activeTeamId,
    playerIdentity,
    playerName,
    assignmentText,
    resultDetail,
    dueDate,
    state: "assigned",
    assignedBy: session.requester,
    createdAt: now,
    updatedAt: now,
  });
  if (!draft) return { ok: false, message: "Player and assignment required." };
  if (!session.requester || typeof fetchImpl !== "function") {
    const local = savePlayerAssignmentLocal(draft, storage);
    return { ok: true, storageMode: "local_only", assignment: local, message: "Saved locally." };
  }

  try {
    const response = await fetchImpl("/v1/player-assignments", {
      method: "POST",
      headers: assignmentHeaders(storage, { "Content-Type": "application/json" }),
      body: JSON.stringify({
        team_id: activeTeamId,
        action: "assign",
        assignment: {
          player_identity: draft.playerIdentity,
          player_name: draft.playerName,
          assignment_text: draft.assignmentText,
          result_detail: draft.resultDetail,
          due_date: draft.dueDate || null,
        },
      }),
    });
    const body = await readJson(response);
    if (!response?.ok || body?.error) {
      const local = savePlayerAssignmentLocal(draft, storage);
      return { ok: false, localSaved: true, storageMode: "local_fallback", assignment: local, error: body?.error || "assignment_write_failed", message: "Saved locally; sync failed." };
    }
    const remote = normalizePlayerAssignment(body?.assignment) || draft;
    savePlayerAssignmentLocal(remote, storage);
    return { ok: true, storageMode: body?.storage_mode || "team_remote", assignment: remote, message: body?.storage_mode === "demo_local" ? "Saved in demo." : "Assignment delivered to the player." };
  } catch (error) {
    const local = savePlayerAssignmentLocal(draft, storage);
    return { ok: false, localSaved: true, storageMode: "local_fallback", assignment: local, error: String(error?.message || "assignment_write_failed"), message: "Saved locally; sync failed." };
  }
}

export async function updatePlayerAssignmentState({
  teamId = "",
  action = "acknowledge",
  storage = globalThis?.localStorage,
  fetchImpl = globalThis?.fetch,
} = {}) {
  const session = readAssignmentSession(storage);
  const activeTeamId = clean(teamId || session.teamId, 180);
  const current = getPlayerAssignmentLocal({ teamId: activeTeamId, playerIdentity: session.requester, storage });
  const nextState = action === "acknowledge" ? "acknowledged" : action === "start" ? "started" : "completed";
  if (!current) return { ok: false, message: "Assignment unavailable." };
  const optimistic = savePlayerAssignmentLocal({ ...current, state: nextState, updatedAt: new Date().toISOString() }, storage);
  if (!session.requester || typeof fetchImpl !== "function") return { ok: true, storageMode: "local_only", assignment: optimistic, message: "Updated locally." };

  try {
    const response = await fetchImpl("/v1/player-assignments", {
      method: "POST",
      headers: assignmentHeaders(storage, { "Content-Type": "application/json" }),
      body: JSON.stringify({ team_id: activeTeamId, action, assignment: { player_identity: session.requester } }),
    });
    const body = await readJson(response);
    if (!response?.ok || body?.error) {
      savePlayerAssignmentLocal(current, storage);
      return { ok: false, assignment: current, error: body?.error || "assignment_state_failed", message: "Status sync failed." };
    }
    const remote = normalizePlayerAssignment(body?.assignment) || optimistic;
    savePlayerAssignmentLocal(remote, storage);
    return { ok: true, storageMode: body?.storage_mode || "team_remote", assignment: remote, message: nextState === "completed" ? "Completed." : nextState === "started" ? "Started." : "Acknowledged." };
  } catch (error) {
    savePlayerAssignmentLocal(current, storage);
    return { ok: false, assignment: current, error: String(error?.message || "assignment_state_failed"), message: "Status sync failed." };
  }
}

export const __testUtils = { readSession: readAssignmentSession, keyFor };
