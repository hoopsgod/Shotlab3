import { useMemo } from "react";
import { withTeamBranding } from "../../features/branding/utils/brandingUtils";

export default function useTeamScopeState({
  user,
  players,
  scores,
  events,
  rsvps,
  shotLogs,
  challenges,
  scSessions,
  scRsvps,
  scLogs,
  teams,
}) {
  const teamId = user?.teamId;

  return useMemo(() => ({
    scopedPlayers: players.filter((player) => player.teamId === teamId),
    scopedScores: scores.filter((score) => score.teamId === teamId),
    scopedEvents: events.filter((event) => event.teamId === teamId),
    scopedRsvps: rsvps.filter((rsvp) => rsvp.teamId === teamId),
    scopedShotLogs: shotLogs.filter((log) => log.teamId === teamId),
    scopedChallenges: challenges.filter((challenge) => challenge.teamId === teamId),
    scopedScSessions: scSessions.filter((session) => session.teamId === teamId),
    scopedScRsvps: scRsvps.filter((rsvp) => rsvp.teamId === teamId),
    scopedScLogs: scLogs.filter((log) => log.teamId === teamId),
    myTeam: withTeamBranding(teams.find((team) => team.id === teamId) || null),
  }), [challenges, events, players, rsvps, scLogs, scRsvps, scSessions, scores, shotLogs, teamId, teams]);
}
