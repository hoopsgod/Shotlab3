const asText = (value) => String(value ?? "").trim();
const asEmail = (value) => asText(value).toLowerCase();

export const getCoachEventRsvpRows = (rsvps = [], eventId = "", teamId = "") => {
  const targetEventId = asText(eventId);
  const targetTeamId = asText(teamId);
  if (!targetEventId || !targetTeamId || !Array.isArray(rsvps)) return [];
  return rsvps.filter((rsvp) => asText(rsvp?.eventId || rsvp?.event_id) === targetEventId && asText(rsvp?.teamId || rsvp?.team_id) === targetTeamId);
};

export const getCoachRsvpLabel = (rsvp = {}, rosterNameByEmail = new Map()) => {
  const directName = asText(rsvp?.name);
  if (directName) return directName;
  const fallbackEmail = asEmail(rsvp?.email || rsvp?.playerId || rsvp?.player_id);
  const rosterName = typeof rosterNameByEmail?.get === "function" ? asText(rosterNameByEmail.get(fallbackEmail)) : "";
  if (rosterName) return rosterName;
  return asText(rsvp?.email || rsvp?.playerId || rsvp?.player_id || "Unknown player");
};

export const getCoachEventRsvpSummary = ({ event = {}, rsvps = [], teamId = "", knownPlayers = [], rosterNameByEmail = new Map() } = {}) => {
  const rows = getCoachEventRsvpRows(rsvps, event?.id, teamId);
  const names = rows.map((row) => getCoachRsvpLabel(row, rosterNameByEmail));
  const rosterSize = Array.isArray(knownPlayers) ? knownPlayers.length : 0;
  return {
    rows,
    names,
    confirmedCount: rows.length,
    missingCount: Math.max(rosterSize - rows.length, 0),
  };
};
