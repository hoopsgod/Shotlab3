export const TEAM_STORE_OPEN_EVENT = "shotlab:team-store:open";

const clean = (value) => String(value ?? "").trim();

export function normalizeTeamStorePortalIdentity(value = {}) {
  const teamId = clean(value.teamId || value.team_id);
  if (!teamId) return null;

  const email = clean(value.email).toLowerCase();
  const isCoach = value.isCoach === true || clean(value.role).toLowerCase() === "coach";

  return {
    email,
    role: isCoach ? "coach" : "player",
    isCoach,
    teamId,
    teamName: clean(value.teamName || value.team_name || value.name) || "Your Team",
  };
}

export function openTeamStorePortal(identity, eventTarget = globalThis.window) {
  const normalizedIdentity = normalizeTeamStorePortalIdentity(identity);
  const EventConstructor = eventTarget?.CustomEvent || globalThis.CustomEvent;
  if (!normalizedIdentity || typeof eventTarget?.dispatchEvent !== "function" || typeof EventConstructor !== "function") {
    return false;
  }

  eventTarget.dispatchEvent(new EventConstructor(TEAM_STORE_OPEN_EVENT, { detail: normalizedIdentity }));
  return true;
}
