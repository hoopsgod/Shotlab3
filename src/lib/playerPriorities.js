const STORAGE_KEY = "shotlab.playerPriorities.v1";

export const getPlayerPriorities = (defaults) => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaults };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return { ...defaults };
    return { ...defaults, ...parsed };
  } catch (_error) {
    return { ...defaults };
  }
};

export const savePlayerPriorities = (updatedPriorities) => {
  const payload = { ...(updatedPriorities || {}) };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  return payload;
};

export const resetPlayerPrioritiesToDefaults = (defaults) => {
  const payload = { ...(defaults || {}) };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  return payload;
};

export const PLAYER_PRIORITIES_STORAGE_KEY = STORAGE_KEY;
