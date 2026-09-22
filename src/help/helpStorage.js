const HELP_READ_STORAGE_KEY = "shotlab:help:last-read";

function toTimestamp(value) {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export function getUnreadReleaseCount(notes = []) {
  if (!Array.isArray(notes) || notes.length === 0) return 0;

  const lastReadRaw = window.localStorage.getItem(HELP_READ_STORAGE_KEY);
  const lastRead = toTimestamp(lastReadRaw) ?? 0;

  return notes.reduce((count, note) => {
    const publishedAt = toTimestamp(note?.date ?? note?.publishedAt);
    if (publishedAt == null) return count;
    return publishedAt > lastRead ? count + 1 : count;
  }, 0);
}

export function markHelpAsRead(date = new Date().toISOString()) {
  window.localStorage.setItem(HELP_READ_STORAGE_KEY, date);
  window.dispatchEvent(new Event("shotlab:help-updated"));
}
