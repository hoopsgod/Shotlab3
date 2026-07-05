const toArray = (value) => (Array.isArray(value) ? value : []);
const rowTeamId = (row) => String(row?.teamId ?? row?.team_id ?? "");
const sameTeam = (teamId) => (row) => rowTeamId(row) === String(teamId || "");
const deepClone = (value) => JSON.parse(JSON.stringify(value ?? null));
const numberFrom = (row, keys) => {
  for (const key of keys) {
    const value = Number(row?.[key]);
    if (Number.isFinite(value)) return value;
  }
  return 0;
};
const makeArchiveId = ({ teamId, seasonName, createdAt }) => {
  const slug = String(seasonName || "season").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 36) || "season";
  return `season_${String(teamId).replace(/[^a-zA-Z0-9_-]/g, "")}_${slug}_${String(createdAt).replace(/[^0-9]/g, "") || Date.now()}`;
};

export function createSeasonArchive({
  teamId,
  coach,
  seasonName,
  seasonStartDate = "",
  seasonEndDate = "",
  players = [],
  playerProfiles = [],
  scores = [],
  programScores = [],
  shotLogs = [],
  events = [],
  rsvps = [],
  scSessions = [],
  scRsvps = [],
  scLogs = [],
  programDrills = [],
  drills = [],
  challenges = [],
  existingArchives = [],
  now = () => new Date().toISOString(),
} = {}) {
  const normalizedTeamId = String(teamId || "").trim();
  if (!coach || coach.role !== "coach" || String(coach.teamId || "") !== normalizedTeamId) {
    return { ok: false, error: "Only an authenticated coach for the active team can archive a season." };
  }
  if (!normalizedTeamId) return { ok: false, error: "A teamId is required to archive a season." };
  const normalizedSeasonName = String(seasonName || "").trim();
  if (!normalizedSeasonName) return { ok: false, error: "Season name is required." };

  const createdAt = typeof now === "function" ? now() : now;
  const inTeam = sameTeam(normalizedTeamId);
  const rosterSnapshot = deepClone(toArray(players).filter(inTeam));
  const playerProfileSnapshot = deepClone(toArray(playerProfiles).filter(inTeam));
  const homeScoresSnapshot = deepClone(toArray(scores).filter(inTeam));
  const programScoresSnapshot = deepClone(toArray(programScores).filter(inTeam));
  const shotLogsSnapshot = deepClone(toArray(shotLogs).filter(inTeam));
  const eventSnapshot = deepClone(toArray(events).filter(inTeam));
  const eventRsvpSnapshot = deepClone(toArray(rsvps).filter(inTeam));
  const scSessionSnapshot = deepClone(toArray(scSessions).filter(inTeam));
  const scRsvpSnapshot = deepClone(toArray(scRsvps).filter(inTeam));
  const scLogSnapshot = deepClone(toArray(scLogs).filter(inTeam));
  const programDrillSnapshot = deepClone(toArray(programDrills));
  const drillSnapshot = deepClone(toArray(drills));
  const challengeSnapshot = deepClone(toArray(challenges).filter(inTeam));

  const summary = {
    rosterCount: rosterSnapshot.length,
    playerProfileCount: playerProfileSnapshot.length,
    homeScoreCount: homeScoresSnapshot.length,
    programScoreCount: programScoresSnapshot.length,
    shotLogCount: shotLogsSnapshot.length,
    eventCount: eventSnapshot.length,
    eventRsvpCount: eventRsvpSnapshot.length,
    scSessionCount: scSessionSnapshot.length,
    scRsvpCount: scRsvpSnapshot.length,
    scLogCount: scLogSnapshot.length,
    totalHomeMakes: homeScoresSnapshot.reduce((sum, row) => sum + numberFrom(row, ["makes", "made", "score"]), 0),
    totalProgramScore: programScoresSnapshot.reduce((sum, row) => sum + numberFrom(row, ["score", "makes", "made"]), 0),
    totalShotLogMakes: shotLogsSnapshot.reduce((sum, row) => sum + numberFrom(row, ["makes", "made", "score"]), 0),
  };

  const archive = {
    id: makeArchiveId({ teamId: normalizedTeamId, seasonName: normalizedSeasonName, createdAt }),
    teamId: normalizedTeamId,
    seasonName: normalizedSeasonName,
    seasonStartDate: seasonStartDate || "",
    seasonEndDate: seasonEndDate || "",
    createdAt,
    archivedBy: { email: coach.email || "", name: coach.name || "", role: "coach" },
    version: 1,
    rosterSnapshot,
    playerProfileSnapshot,
    homeScoresSnapshot,
    programScoresSnapshot,
    shotLogsSnapshot,
    eventSnapshot,
    eventRsvpSnapshot,
    scSessionSnapshot,
    scRsvpSnapshot,
    scLogSnapshot,
    programDrillSnapshot,
    drillSnapshot,
    challengeSnapshot,
    summary,
  };

  return { ok: true, archive, seasonArchives: [...toArray(existingArchives), archive] };
}
