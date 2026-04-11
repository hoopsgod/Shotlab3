const DISMISSED_COACHMARKS_KEY = "shotlab.help.dismissedCoachmarks.v1";
const LAST_SEEN_RELEASE_KEY = "shotlab.help.lastSeenReleaseId.v1";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readJson(key, fallback) {
  if (!canUseStorage()) return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  if (!canUseStorage()) return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // fail quietly
  }
}

export function isCoachmarkDismissed(id) {
  const dismissed = readJson(DISMISSED_COACHMARKS_KEY, {});
  return Boolean(dismissed[id]);
}

export function dismissCoachmark(id) {
  const dismissed = readJson(DISMISSED_COACHMARKS_KEY, {});
  dismissed[id] = true;
  writeJson(DISMISSED_COACHMARKS_KEY, dismissed);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("shotlab:help-updated"));
  }
}

export function getLastSeenReleaseId() {
  if (!canUseStorage()) return null;

  try {
    return window.localStorage.getItem(LAST_SEEN_RELEASE_KEY);
  } catch {
    return null;
  }
}

export function markLatestReleaseSeen(releaseNotes) {
  if (!canUseStorage() || !releaseNotes?.length) return;

  const latestId = releaseNotes[0].id;

  try {
    window.localStorage.setItem(LAST_SEEN_RELEASE_KEY, latestId);
  } catch {
    // fail quietly
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("shotlab:help-updated"));
  }
}

export function getUnreadReleaseCount(releaseNotes) {
  if (!releaseNotes?.length) return 0;

  const lastSeenId = getLastSeenReleaseId();
  if (!lastSeenId) return releaseNotes.length;

  const seenIndex = releaseNotes.findIndex((note) => note.id === lastSeenId);
  if (seenIndex === -1) return releaseNotes.length;

  return seenIndex;
}
