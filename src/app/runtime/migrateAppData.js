import { DEFAULT_TEAM_BRANDING } from "../../features/branding/constants/defaultTeamBranding";
import { withTeamBranding } from "../../features/branding/utils/brandingUtils";
import { genId, generateJoinCode } from "../../shared/utils/coreUtils";

export default function migrateAppData({
  players: rawPlayers,
  playerProfiles: rawPlayerProfiles,
  scores: rawScores,
  events: rawEvents,
  rsvps: rawRsvps,
  shotLogs: rawShotLogs,
  challenges: rawChallenges,
  scSessions: rawScSessions,
  scRsvps: rawScRsvps,
  scLogs: rawScLogs,
  teams: rawTeams,
}) {
  const ps = (rawPlayers || []).map((p) => ({ ...p, role: p.role || "player" }));
  const existingTeams = rawTeams || [];
  const coaches = ps.filter((p) => p.role === "coach");
  const hasTeams = existingTeams.length > 0;
  const map = {};
  let ts = [...existingTeams];
  const used = ts.map((t) => t.joinCode);

  if (!hasTeams) {
    if (coaches.length === 0) {
      const tid = genId("team");
      ts = [
        {
          id: tid,
          name: "ShotLab Team",
          ownerCoachId: null,
          joinCode: generateJoinCode(used),
          joinCodeUpdatedAt: Date.now(),
          createdAt: Date.now(),
          branding: { ...DEFAULT_TEAM_BRANDING },
        },
      ];
      ps.forEach((p) => {
        map[p.email] = tid;
      });
    } else {
      coaches.forEach((c, i) => {
        const tid = genId("team");
        const code = generateJoinCode([...used, ...ts.map((t) => t.joinCode)]);
        ts.push({
          id: tid,
          name: c.name ? `${c.name.split(" ")[0]}'s Team` : `Team ${i + 1}`,
          ownerCoachId: c.email,
          joinCode: code,
          joinCodeUpdatedAt: Date.now(),
          createdAt: Date.now(),
          branding: { ...DEFAULT_TEAM_BRANDING },
        });
        map[c.email] = tid;
      });
      ps.forEach((p) => {
        if (p.role !== "coach") {
          const firstCoach = coaches[0];
          if (firstCoach) map[p.email] = map[firstCoach.email];
        }
      });
    }
  } else {
    ts.forEach((t) => {
      if (t.ownerCoachId) map[t.ownerCoachId] = t.id;
    });
  }

  ts = ts.map(withTeamBranding);
  const playersMigrated = ps.map((p) => ({ ...p, teamId: p.teamId || map[p.email] || ts[0]?.id || null }));
  const profilesExisting = rawPlayerProfiles || [];
  const profilesMigrated = (
    profilesExisting.length
      ? profilesExisting
      : playersMigrated
          .filter((p) => p.role !== "coach")
          .map((p) => ({
            id: genId("pp"),
            userId: p.email,
            teamId: p.teamId,
            firstName: (p.name || "").split(" ")[0] || "Player",
            lastName: (p.name || "").split(" ").slice(1).join(" "),
            createdAt: Date.now(),
          }))
  ).map((pp) => ({
    ...pp,
    teamId: pp.teamId || playersMigrated.find((p) => p.email === pp.userId)?.teamId || ts[0]?.id || null,
  }));

  const teamForEmail = (e) => playersMigrated.find((p) => p.email === e)?.teamId || ts[0]?.id || null;
  const scoresM = (rawScores || []).map((s) => ({ ...s, playerId: s.playerId || s.email, teamId: s.teamId || teamForEmail(s.email) }));
  const eventsM = (rawEvents || []).map((e) => ({ ...e, teamId: e.teamId || teamForEmail(e.ownerCoachId) }));
  const rsvpsM = (rawRsvps || []).map((r) => ({ ...r, playerId: r.playerId || r.email, teamId: r.teamId || teamForEmail(r.email) }));
  const shotM = (rawShotLogs || []).map((l) => ({ ...l, playerId: l.playerId || l.email, teamId: l.teamId || teamForEmail(l.email) }));
  const chM = (rawChallenges || []).map((c) => ({ ...c, teamId: c.teamId || teamForEmail(c.from), playerId: c.playerId || c.from }));
  const scSM = (rawScSessions || []).map((s) => ({ ...s, teamId: s.teamId || teamForEmail(s.ownerCoachId) }));
  const scRM = (rawScRsvps || []).map((r) => ({ ...r, playerId: r.playerId || r.email, teamId: r.teamId || teamForEmail(r.email) }));
  const scLM = (rawScLogs || []).map((l) => ({ ...l, playerId: l.playerId || l.email, teamId: l.teamId || teamForEmail(l.email) }));

  return { playersMigrated, profilesMigrated, teamsMigrated: ts, scoresM, eventsM, rsvpsM, shotM, chM, scSM, scRM, scLM };
}
