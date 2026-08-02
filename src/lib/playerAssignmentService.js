import { buildApiIdentityHeaders } from "./apiIdentityHeaders.js";

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

function readSession(storage = globalThis?.localStorage) {
  const raw = parseJson(storage?.getItem?.("sl:session"), {});
  const session = Array.isArray(raw) ? raw[0] : raw;
  return {
    requester: identity(session?.email || session?.userEmail || session?.user_id),
    teamId: clean(session?.teamId || session?.team_id, 180),
    role: identity(session?.role),
  };
}

export function normalizePlayerAssignment(value = {}) {
  const state = identity(value?.state || "assigned");
  const row = {
    teamId: clean(value?.team_id || value?.teamId, 180),
    playerIdentity: identity(value?.player_identity || value?.playerIdentity),
    playerName: clean(value?.player_name || value?.playerName, 320),
    assignmentText: clean(value?.assignment_text || value?.assignmentText, 4000),
    resultDetail: clean(value?.result_detail || value?.resultDetail, 1000),
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
  storage?.setItem?.(PLAYER_ASSIGNMENT_STORAGE_KEY, JSON.stringify(store));
  announce(normalized);
  return normalized;
}

export function getPlayerAssignmentLocal({ teamId = "", playerIdentity = "", storage = globalThis?.localStorage } = {}) {
  return normalizePlayerAssignment(readPlayerAssignmentStore(storage)?.[keyFor(teamId, playerIdentity)] || {});
}

function headers(storage, extra = {}) {
  const { requester } = readSession(storage);
  return buildApiIdentityHeaders({ requester, storage, headers: extra });
}

export async function loadPlayerAssignment({
  teamId = "",
  playerIdentity = "",
  storage = globalThis?.localStorage,
  fetchImpl = globalThis?.fetch,
} = {}) {
  const session = readSession(storage);
  const activeTeamId = clean(teamId || session.teamId, 180);
  const targetIdentity = identity(playerIdentity || (session.role === "player" ? session.requester : ""));
  const local = targetIdentity ? getPlayerAssignmentLocal({ teamId: activeTeamId, playerIdentity: targetIdentity, storage }) : null;
  if (!session.requester || !activeTeamId || typeof fetchImpl !== "function") return { ok: true, storageMode: "local_only", assignment: local };

  const query = new URLSearchParams({ team_id: activeTeamId });
  if (targetIdentity && session.role !== "player") query.set("player_identity", targetIdentity);
  try {
    const response = await fetchImpl(`/v1/player-assignments?${query.toString()}`, { method: "GET", headers: headers(storage) });
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
  storage = globalThis?.localStorage,
  fetchImpl = globalThis?.fetch,
} = {}) {
  const session = readSession(storage);
  const activeTeamId = clean(teamId || session.teamId, 180);
  const draft = normalizePlayerAssignment({
    teamId: activeTeamId,
    playerIdentity,
    playerName,
    assignmentText,
    resultDetail,
    state: "assigned",
    assignedBy: session.requester,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  if (!draft) return { ok: false, message: "A player and assignment are required." };
  const local = savePlayerAssignmentLocal(draft, storage);
  if (!session.requester || typeof fetchImpl !== "function") return { ok: true, storageMode: "local_only", assignment: local, message: "Assignment saved on this device only." };

  try {
    const response = await fetchImpl("/v1/player-assignments", {
      method: "POST",
      headers: headers(storage, { "Content-Type": "application/json" }),
      body: JSON.stringify({
        team_id: activeTeamId,
        action: "assign",
        assignment: {
          player_identity: draft.playerIdentity,
          player_name: draft.playerName,
          assignment_text: draft.assignmentText,
          result_detail: draft.resultDetail,
        },
      }),
    });
    const body = await readJson(response);
    if (!response?.ok || body?.error) return { ok: false, localSaved: true, storageMode: "local_fallback", assignment: local, error: body?.error || "assignment_write_failed", message: "Saved locally, but player delivery sync failed." };
    const remote = normalizePlayerAssignment(body?.assignment) || local;
    savePlayerAssignmentLocal(remote, storage);
    return { ok: true, storageMode: body?.storage_mode || "team_remote", assignment: remote, message: body?.storage_mode === "demo_local" ? "Assignment saved in this demo session." : "Assignment delivered to the player." };
  } catch (error) {
    return { ok: false, localSaved: true, storageMode: "local_fallback", assignment: local, error: String(error?.message || "assignment_write_failed"), message: "Saved locally, but player delivery sync failed." };
  }
}

export async function updatePlayerAssignmentState({
  teamId = "",
  action = "acknowledge",
  storage = globalThis?.localStorage,
  fetchImpl = globalThis?.fetch,
} = {}) {
  const session = readSession(storage);
  const activeTeamId = clean(teamId || session.teamId, 180);
  const current = getPlayerAssignmentLocal({ teamId: activeTeamId, playerIdentity: session.requester, storage });
  const nextState = action === "acknowledge" ? "acknowledged" : action === "start" ? "started" : "completed";
  if (!current) return { ok: false, message: "Assignment is unavailable." };
  const optimistic = savePlayerAssignmentLocal({ ...current, state: nextState, updatedAt: new Date().toISOString() }, storage);
  if (!session.requester || typeof fetchImpl !== "function") return { ok: true, storageMode: "local_only", assignment: optimistic, message: "Assignment updated on this device only." };

  try {
    const response = await fetchImpl("/v1/player-assignments", {
      method: "POST",
      headers: headers(storage, { "Content-Type": "application/json" }),
      body: JSON.stringify({ team_id: activeTeamId, action, assignment: { player_identity: session.requester } }),
    });
    const body = await readJson(response);
    if (!response?.ok || body?.error) {
      savePlayerAssignmentLocal(current, storage);
      return { ok: false, assignment: current, error: body?.error || "assignment_state_failed", message: "Assignment status could not be synced." };
    }
    const remote = normalizePlayerAssignment(body?.assignment) || optimistic;
    savePlayerAssignmentLocal(remote, storage);
    return { ok: true, storageMode: body?.storage_mode || "team_remote", assignment: remote, message: nextState === "completed" ? "Assignment marked complete." : nextState === "started" ? "Assignment started." : "Assignment acknowledged." };
  } catch (error) {
    savePlayerAssignmentLocal(current, storage);
    return { ok: false, assignment: current, error: String(error?.message || "assignment_state_failed"), message: "Assignment status could not be synced." };
  }
}

export const __testUtils = { readSession, keyFor };
