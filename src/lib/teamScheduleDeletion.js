const sameId = (a, b) => String(a ?? "") === String(b ?? "");
const sameTeam = (row, teamId) => sameId(row?.teamId ?? row?.team_id, teamId);
const sameEvent = (row, eventId) => sameId(row?.eventId ?? row?.event_id, eventId);
const sameSession = (row, sessionId) => sameId(row?.sessionId ?? row?.session_id, sessionId);

export const isActiveTeamCoach = (user = {}, teamId = "") => Boolean(
  user?.role === "coach" && user?.teamId && sameId(user.teamId, teamId)
);

export const deleteTeamEvent = ({ events = [], rsvps = [], eventId, teamId, user } = {}) => {
  if (!isActiveTeamCoach(user, teamId) || !eventId) return { ok: false, error: "Not authorized", events, rsvps, removedEventCount: 0, removedRsvpCount: 0 };
  const nextEvents = events.filter((event) => !(sameId(event?.id, eventId) && sameTeam(event, teamId)));
  const nextRsvps = rsvps.filter((rsvp) => !(sameEvent(rsvp, eventId) && sameTeam(rsvp, teamId)));
  return { ok: true, events: nextEvents, rsvps: nextRsvps, removedEventCount: events.length - nextEvents.length, removedRsvpCount: rsvps.length - nextRsvps.length };
};

export const deleteTeamScSession = ({ scSessions = [], scRsvps = [], scLogs = [], sessionId, teamId, user } = {}) => {
  if (!isActiveTeamCoach(user, teamId) || !sessionId) return { ok: false, error: "Not authorized", scSessions, scRsvps, scLogs, removedSessionCount: 0, removedRsvpCount: 0, removedLogCount: 0 };
  const nextSessions = scSessions.filter((session) => !(sameId(session?.id, sessionId) && sameTeam(session, teamId)));
  const nextRsvps = scRsvps.filter((rsvp) => !(sameSession(rsvp, sessionId) && sameTeam(rsvp, teamId)));
  const nextLogs = scLogs.filter((log) => !(sameSession(log, sessionId) && sameTeam(log, teamId)));
  return { ok: true, scSessions: nextSessions, scRsvps: nextRsvps, scLogs: nextLogs, removedSessionCount: scSessions.length - nextSessions.length, removedRsvpCount: scRsvps.length - nextRsvps.length, removedLogCount: scLogs.length - nextLogs.length };
};
