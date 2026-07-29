import { STORAGE_KEYS, sanitizeCoachPriorities } from "./appDataModels";

const normalizeIdentity = (value) => String(value || "").trim().toLowerCase();
const asPriorityMap = (value) => value && typeof value === "object" && !Array.isArray(value) ? value : {};
const sanitizePriorityMap = (value) => Object.fromEntries(
  Object.entries(asPriorityMap(value))
    .map(([teamId, priorities]) => [String(teamId || "").trim(), sanitizeCoachPriorities(priorities)])
    .filter(([teamId]) => Boolean(teamId)),
);

const readJson = async (response) => {
  try {
    return await response.json();
  } catch {
    return {};
  }
};

export const installCoachPrioritySaveBridge = (target = globalThis) => {
  if (!target || typeof target !== "object") return null;
  if (typeof target.savePlayerPriorities === "function" && !target.savePlayerPriorities.__shotlabPriorityBridge) {
    return target.savePlayerPriorities;
  }

  const bridge = async ({ teamId, draft, onSaveCoachPriorities } = {}) => {
    if (!teamId || typeof onSaveCoachPriorities !== "function") {
      return { ok: false, message: "Team priority delivery is unavailable." };
    }
    try {
      const result = await onSaveCoachPriorities(teamId, draft);
      return result?.ok
        ? result
        : { ok: false, message: result?.message || "Could not save priorities." };
    } catch (error) {
      return {
        ok: false,
        message: "Priorities were saved on this device but could not be delivered to the team. Check your connection and retry.",
        errorCode: String(error?.code || error?.message || "priority_delivery_failed"),
      };
    }
  };
  bridge.__shotlabPriorityBridge = true;
  target.savePlayerPriorities = bridge;
  return bridge;
};

installCoachPrioritySaveBridge();

export const createAppPersistenceService = ({ db, fetchImpl = fetch }) => {
  const getCollection = async (key, fallback = []) => {
    const result = await db.get(key);
    return Array.isArray(result) ? result : fallback;
  };

  const setCollection = async (key, nextValue, setState, options = {}) => {
    await db.set(key, nextValue, options);
    setState(nextValue);
    return nextValue;
  };

  const getRequesterIdentity = async () => {
    const session = await db.get(STORAGE_KEYS.sessions);
    return normalizeIdentity(session?.email || session?.userEmail || session?.user_id);
  };

  const getPlayerPriorities = async () => {
    const localPriorities = sanitizePriorityMap(await db.get(STORAGE_KEYS.coachPriorities));
    const requester = await getRequesterIdentity();
    if (!requester) return localPriorities;

    try {
      const response = await fetchImpl("/v1/team-priorities", {
        method: "GET",
        headers: { "x-user-id": requester },
      });
      if (!response?.ok) return localPriorities;
      const body = await readJson(response);
      const remotePriorities = sanitizePriorityMap(body?.priorities_by_team);
      const merged = { ...localPriorities, ...remotePriorities };
      await db.set(STORAGE_KEYS.coachPriorities, merged, { strictLocal: true });
      return merged;
    } catch {
      return localPriorities;
    }
  };

  const savePlayerPriorities = async (priorities) => {
    const nextPriorities = sanitizePriorityMap(priorities);
    await db.set(STORAGE_KEYS.coachPriorities, nextPriorities, { strictLocal: true });

    const requester = await getRequesterIdentity();
    const entries = Object.entries(nextPriorities);
    if (!requester || entries.length === 0) {
      return { ok: true, storageMode: "local_only", deliveredTeamIds: [] };
    }

    const deliveredTeamIds = [];
    let storageMode = "team_remote";
    for (const [teamId, teamPriorities] of entries) {
      const response = await fetchImpl("/v1/team-priorities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": requester,
        },
        body: JSON.stringify({ team_id: teamId, priorities: teamPriorities }),
      });
      const body = await readJson(response);
      if (!response?.ok || body?.ok === false || body?.error) {
        const error = new Error(String(body?.error || `priority_delivery_http_${response?.status || 0}`));
        error.code = String(body?.error || "priority_delivery_failed");
        error.status = response?.status || 0;
        throw error;
      }
      storageMode = body?.storage_mode || storageMode;
      deliveredTeamIds.push(teamId);
    }

    return { ok: true, storageMode, deliveredTeamIds };
  };

  const getProgramDrills = async () => getCollection(STORAGE_KEYS.programDrills);

  const saveDrillScore = async ({ getScores, nextScore, setScores }) => {
    const scores = Array.isArray(getScores?.()) ? getScores() : [];
    const nextScores = [...scores, nextScore];
    await db.set(STORAGE_KEYS.scores, nextScores);
    setScores(nextScores);
    return nextScores;
  };

  const getLeaderboardData = async ({ teamId, scope = "players", limit = 10 }) => {
    const url = `/v1/leaderboards/home-shots?team_id=${encodeURIComponent(teamId)}&limit=${limit}&scope=${encodeURIComponent(scope)}`;
    const res = await fetchImpl(url);
    const contentType = String(res.headers?.get?.("content-type") || "").toLowerCase();
    const parseMode = contentType.includes("application/json") ? "json" : "non_json";
    const body = parseMode === "json" ? await res.json() : null;
    return { url, res, body, parseMode };
  };

  return {
    getCollection,
    setCollection,
    getPlayerPriorities,
    savePlayerPriorities,
    getProgramDrills,
    saveDrillScore,
    getLeaderboardData,
  };
};
