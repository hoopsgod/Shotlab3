import { STORAGE_KEYS, sanitizeCoachPriorities } from "./appDataModels.js";
import { buildApiIdentityHeaders } from "./apiIdentityHeaders.js";

const normalizeIdentity = (value) => String(value || "").trim().toLowerCase();
const asPriorityMap = (value) => value && typeof value === "object" && !Array.isArray(value) ? value : {};
const sanitizePriorityMap = (value) => Object.fromEntries(
  Object.entries(asPriorityMap(value))
    .map(([teamId, priorities]) => [String(teamId || "").trim(), sanitizeCoachPriorities(priorities)])
    .filter(([teamId]) => Boolean(teamId)),
);
const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const readJson = async (response) => {
  try {
    return await response.json();
  } catch {
    return {};
  }
};

const readBrowserValue = (key) => {
  try {
    if (typeof globalThis?.localStorage?.getItem !== "function") return null;
    const raw = globalThis.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const installCoachPrioritySaveBridge = (target = globalThis) => {
  if (!target || typeof target !== "object") return null;
  if (typeof target.savePlayerPriorities === "function" && !target.savePlayerPriorities.__shotlabPriorityBridge) {
    return target.savePlayerPriorities;
  }
  if (target.savePlayerPriorities?.__shotlabPriorityBridge) return target.savePlayerPriorities;

  const bridge = async ({ teamId, draft, onSaveCoachPriorities } = {}) => {
    if (!teamId || typeof onSaveCoachPriorities !== "function") {
      return { ok: false, message: "Team priority delivery is unavailable." };
    }
    const publishedAt = new Date().toISOString();
    const stampedDraft = { ...draft, updatedAt: publishedAt };
    try {
      const result = await onSaveCoachPriorities(teamId, stampedDraft);
      return result?.ok
        ? { ...result, publishedAt: result?.publishedAt || publishedAt }
        : { ok: false, message: result?.message || "Could not save priorities." };
    } catch (error) {
      return {
        ok: false,
        message: "Priorities were saved on this device but could not be delivered to the team. Check your connection and retry.",
        errorCode: String(error?.code || error?.message || "priority_delivery_failed"),
        publishedAt,
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

  const readRequesterContext = async () => {
    const browserSession = readBrowserValue(STORAGE_KEYS.sessions);
    const storedSession = browserSession || await db.get(STORAGE_KEYS.sessions);
    const session = Array.isArray(storedSession) ? storedSession[0] : storedSession;
    const requester = normalizeIdentity(session?.email || session?.userEmail || session?.user_id);

    const browserPlayers = readBrowserValue(STORAGE_KEYS.players);
    const storedPlayers = Array.isArray(browserPlayers) ? browserPlayers : await getCollection(STORAGE_KEYS.players);
    const actor = (Array.isArray(storedPlayers) ? storedPlayers : []).find((player) => normalizeIdentity(player?.email) === requester);
    const teamId = String(actor?.teamId || actor?.team_id || "").trim();
    return { requester, teamId };
  };

  const getRequesterContext = async () => {
    let context = await readRequesterContext();
    if (context.requester || typeof globalThis?.localStorage?.getItem !== "function") return context;

    // Authentication and demo entry can commit the workspace before the durable
    // session write completes. Hold the first identity-dependent request at this
    // boundary instead of accepting stale local data for the rest of the session.
    for (let attempt = 0; attempt < 40 && !context.requester; attempt += 1) {
      await wait(50);
      context = await readRequesterContext();
    }
    return context;
  };

  const getPlayerPriorities = async () => {
    const localPriorities = sanitizePriorityMap(await db.get(STORAGE_KEYS.coachPriorities));
    const { requester } = await getRequesterContext();
    if (!requester) return localPriorities;

    try {
      const response = await fetchImpl("/v1/team-priorities", {
        method: "GET",
        headers: buildApiIdentityHeaders({ requester }),
      });
      if (!response?.ok) return localPriorities;
      const body = await readJson(response);
      const metadataByTeam = asPriorityMap(body?.metadata_by_team);
      const remoteWithMetadata = Object.fromEntries(
        Object.entries(asPriorityMap(body?.priorities_by_team)).map(([teamId, priorities]) => [teamId, {
          ...priorities,
          updatedAt: String(
            metadataByTeam?.[teamId]?.updatedAt
            || metadataByTeam?.[teamId]?.updated_at
            || priorities?.updatedAt
            || priorities?.updated_at
            || "",
          ).trim(),
        }]),
      );
      const remotePriorities = sanitizePriorityMap(remoteWithMetadata);
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

    const { requester, teamId: activeTeamId } = await getRequesterContext();
    const allEntries = Object.entries(nextPriorities);
    const entries = activeTeamId && nextPriorities[activeTeamId]
      ? [[activeTeamId, nextPriorities[activeTeamId]]]
      : allEntries.length === 1
        ? allEntries
        : [];
    if (!requester || entries.length === 0) {
      return { ok: true, storageMode: "local_only", deliveredTeamIds: [] };
    }

    const deliveredTeamIds = [];
    let storageMode = "team_remote";
    let authoritativeLocalWrite = false;
    for (const [teamId, teamPriorities] of entries) {
      const response = await fetchImpl("/v1/team-priorities", {
        method: "POST",
        headers: buildApiIdentityHeaders({
          requester,
          headers: { "Content-Type": "application/json" },
        }),
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
      const authoritativeUpdatedAt = String(body?.updated_at || body?.updatedAt || "").trim();
      if (authoritativeUpdatedAt) {
        nextPriorities[teamId] = sanitizeCoachPriorities({
          ...(body?.priorities && typeof body.priorities === "object" ? body.priorities : teamPriorities),
          updatedAt: authoritativeUpdatedAt,
        });
        authoritativeLocalWrite = true;
      }
      deliveredTeamIds.push(teamId);
    }

    if (authoritativeLocalWrite) {
      await db.set(STORAGE_KEYS.coachPriorities, nextPriorities, { strictLocal: true });
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
