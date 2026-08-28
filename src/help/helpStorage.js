const STORAGE_KEY = "sl:help:lastSeenReleaseId";

export function getUnreadReleaseCount(releaseNotes = []) {
  if (!Array.isArray(releaseNotes) || releaseNotes.length === 0) return 0;

  const latestSeenId = window.localStorage.getItem(STORAGE_KEY);
  if (!latestSeenId) return releaseNotes.length;

  const seenIndex = releaseNotes.findIndex((note) => note.id === latestSeenId);
  if (seenIndex === -1) return releaseNotes.length;

  return seenIndex;
}

export function markLatestReleaseSeen(releaseNotes = []) {
  if (!Array.isArray(releaseNotes) || releaseNotes.length === 0) return;
  window.localStorage.setItem(STORAGE_KEY, releaseNotes[0].id);
}
