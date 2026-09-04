const RSVP_SYNC_PENDING_KEY = "sl:rsvps-sync-pending";

const normalizeIdentity = (value) => String(value || "").trim().toLowerCase();
const clean = (value) => String(value ?? "").trim();

function parseMarker(storage) {
  try {
    const raw = storage?.getItem?.(RSVP_SYNC_PENDING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function markerMatches(marker, { requester = "", teamId = "" } = {}) {
  if (!marker?.pending) return false;
  const expectedRequester = normalizeIdentity(requester);
  const markerRequester = normalizeIdentity(marker.requester);
  if (expectedRequester && markerRequester !== expectedRequester) return false;
  const expectedTeamId = clean(teamId);
  const markerTeamId = clean(marker.teamId);
  if (expectedTeamId && markerTeamId && markerTeamId !== expectedTeamId) return false;
  return Boolean(markerRequester);
}

export function readRsvpSyncPending({
  storage = globalThis?.localStorage,
  requester = "",
  teamId = "",
} = {}) {
  const marker = parseMarker(storage);
  return markerMatches(marker, { requester, teamId }) ? marker : null;
}

export function markRsvpSyncPending({
  storage = globalThis?.localStorage,
  requester = "",
  teamId = "",
  now = Date.now(),
} = {}) {
  const normalizedRequester = normalizeIdentity(requester);
  if (!normalizedRequester || typeof storage?.setItem !== "function") return null;
  const marker = {
    pending: true,
    requester: normalizedRequester,
    teamId: clean(teamId),
    updatedAt: Number(now) || Date.now(),
  };
  try {
    storage.setItem(RSVP_SYNC_PENDING_KEY, JSON.stringify(marker));
    return marker;
  } catch {
    return null;
  }
}

export function clearRsvpSyncPending({
  storage = globalThis?.localStorage,
  requester = "",
  teamId = "",
} = {}) {
  const marker = readRsvpSyncPending({ storage, requester, teamId });
  if (!marker) return false;
  try {
    if (typeof storage?.removeItem === "function") storage.removeItem(RSVP_SYNC_PENDING_KEY);
    else if (typeof storage?.setItem === "function") storage.setItem(RSVP_SYNC_PENDING_KEY, "");
    else return false;
    return true;
  } catch {
    return false;
  }
}

export { RSVP_SYNC_PENDING_KEY };
