export const COACH_FOLLOW_UP_STORAGE_KEY = "sl:coach-follow-ups";
export const COACH_FOLLOW_UP_STATES = new Set(["planned", "completed", "dismissed"]);
export const COACH_FOLLOW_UP_CHANGE_EVENT = "shotlab:coach-follow-ups-changed";

const clean = (value, max = 500) => String(value ?? "").trim().slice(0, max);
const identity = (value) => clean(value, 320).toLowerCase();
const recordKey = (teamId, playerIdentity) => `${clean(teamId, 160)}::${identity(playerIdentity)}`;

const parseJson = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const readJson = async (response) => {
  try {
    return await response.json();
  } catch {
    return {};
  }
};

export function sanitizeCoachFollowUp(value = {}) {
  const state = identity(value?.state);
  return {
    teamId: clean(value?.team_id || value?.teamId, 160),
    playerIdentity: identity(value?.player_identity || value?.playerIdentity),
    playerName: clean(value?.player_name || value?.playerName, 320),
    state: COACH_FOLLOW_UP_STATES.has(state) ? state : "planned",
    note: clean(value?.note, 4000),
    createdAt: clean(value?.created_at || value?.createdAt, 120),
    updatedAt: clean(value?.updated_at || value?.updatedAt, 120),
    completedAt: clean(value?.completed_at || value?.completedAt, 120),
    updatedBy: identity(value?.updated_by || value?.updatedBy),
  };
}

export function readCoachFollowUpStore(storage = globalThis?.localStorage) {
  const parsed = parseJson(storage?.getItem?.(COACH_FOLLOW_UP_STORAGE_KEY), {});
  return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
}

export function writeCoachFollowUpStore(storage, store) {
  storage?.setItem?.(COACH_FOLLOW_UP_STORAGE_KEY, JSON.stringify(store || {}));
  return store;
}

export function getCoachFollowUpFromStore({ storage = globalThis?.localStorage, teamId = "", playerIdentity = "" } = {}) {
  const raw = readCoachFollowUpStore(storage)?.[recordKey(teamId, playerIdentity)];
  return raw ? sanitizeCoachFollowUp(raw) : null;
}

function announceFollowUpChange(record) {
  try {
    if (typeof globalThis?.dispatchEvent !== "function" || typeof globalThis?.CustomEvent !== "function") return;
    globalThis.dispatchEvent(new CustomEvent(COACH_FOLLOW_UP_CHANGE_EVENT, {
      detail: {
        teamId: record?.teamId || "",
        playerIdentity: record?.playerIdentity || "",
        state: record?.state || "",
      },
    }));
  } catch {}
}

function saveLocalRecord(storage, value) {
  const record = sanitizeCoachFollowUp(value);
  if (!record.teamId || !record.playerIdentity) return null;
  const store = readCoachFollowUpStore(storage);
  store[recordKey(record.teamId, record.playerIdentity)] = record;
  writeCoachFollowUpStore(storage, store);
  announceFollowUpChange(record);
  return record;
}

function readRequester(storage = globalThis?.localStorage) {
  const session = parseJson(storage?.getItem?.("sl:session"), {});
  const resolved = Array.isArray(session) ? session[0] : session;
  return identity(resolved?.email || resolved?.userEmail || resolved?.user_id);
}

export async function loadCoachFollowUp({
  teamId = "",
  playerIdentity = "",
  storage = globalThis?.localStorage,
  fetchImpl = globalThis?.fetch,
} = {}) {
  const local = getCoachFollowUpFromStore({ storage, teamId, playerIdentity });
  const requester = readRequester(storage);
  if (!requester || typeof fetchImpl !== "function") return { ok: true, storageMode: "local_only", record: local };

  try {
    const response = await fetchImpl(`/v1/coach-follow-ups?team_id=${encodeURIComponent(clean(teamId, 160))}`, {
      method: "GET",
      headers: { "x-user-id": requester },
    });
    const body = await readJson(response);
    if (!response?.ok || body?.error) return { ok: false, storageMode: "local_fallback", record: local, error: body?.error || "follow_up_load_failed" };
    const remote = (Array.isArray(body?.follow_ups) ? body.follow_ups : [])
      .map(sanitizeCoachFollowUp)
      .find((item) => item.teamId === clean(teamId, 160) && item.playerIdentity === identity(playerIdentity));
    if (remote) saveLocalRecord(storage, remote);
    return { ok: true, storageMode: body?.storage_mode || "team_remote", record: remote || local };
  } catch (error) {
    return { ok: false, storageMode: "local_fallback", record: local, error: String(error?.message || "follow_up_load_failed") };
  }
}

export async function saveCoachFollowUp({
  teamId = "",
  playerIdentity = "",
  playerName = "",
  state = "planned",
  note = "",
  storage = globalThis?.localStorage,
  fetchImpl = globalThis?.fetch,
} = {}) {
  const previous = getCoachFollowUpFromStore({ storage, teamId, playerIdentity });
  const now = new Date().toISOString();
  const draft = sanitizeCoachFollowUp({
    ...previous,
    teamId,
    playerIdentity,
    playerName,
    state,
    note,
    createdAt: previous?.createdAt || now,
    updatedAt: now,
    completedAt: state === "completed" ? now : "",
  });
  if (!draft.teamId || !draft.playerIdentity) return { ok: false, message: "Player follow-up identity is unavailable." };

  const localRecord = saveLocalRecord(storage, draft);
  const requester = readRequester(storage);
  if (!requester || typeof fetchImpl !== "function") {
    return { ok: true, storageMode: "local_only", record: localRecord, message: "Saved on this device only." };
  }

  try {
    const response = await fetchImpl("/v1/coach-follow-ups", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": requester },
      body: JSON.stringify({
        team_id: draft.teamId,
        player_identity: draft.playerIdentity,
        player_name: draft.playerName,
        state: draft.state,
        note: draft.note,
        created_at: draft.createdAt,
      }),
    });
    const body = await readJson(response);
    if (!response?.ok || body?.error) {
      return {
        ok: false,
        localSaved: true,
        storageMode: "local_fallback",
        record: localRecord,
        message: "Saved on this device, but team sync failed. Retry when connected.",
        error: body?.error || "follow_up_write_failed",
      };
    }
    const remoteRaw = body?.follow_up || (Array.isArray(body?.follow_ups) ? body.follow_ups[0] : null);
    const remote = remoteRaw ? sanitizeCoachFollowUp(remoteRaw) : localRecord;
    saveLocalRecord(storage, remote);
    return {
      ok: true,
      storageMode: body?.storage_mode || "team_remote",
      record: remote,
      message: body?.storage_mode === "demo_local" ? "Saved in this demo session." : "Follow-up record synced.",
    };
  } catch (error) {
    return {
      ok: false,
      localSaved: true,
      storageMode: "local_fallback",
      record: localRecord,
      message: "Saved on this device, but team sync failed. Retry when connected.",
      error: String(error?.message || "follow_up_write_failed"),
    };
  }
}
