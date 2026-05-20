import { STORAGE_KEYS } from "./appDataModels";

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

  const getPlayerPriorities = async () => db.get(STORAGE_KEYS.coachPriorities);
  const savePlayerPriorities = async (priorities) => db.set(STORAGE_KEYS.coachPriorities, priorities);

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
