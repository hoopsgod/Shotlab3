import { SHOTLAB_DEMO_FIXTURES } from "../demoFixtures";

export function buildDemoFixtureBundle({
  defaultBranding,
  homeDrills,
  programDrills,
  events,
  scSessions,
  demoCoach,
  demoPlayer,
  now,
  genId,
  generateJoinCode,
  hashPw,
}) {
  const teamId = genId("team");
  const createdAt = now();
  const coach = {
    email: demoCoach.email,
    name: demoCoach.name,
    password: hashPw(demoCoach.password),
    role: "coach",
    teamId,
    hideFromLeaderboards: false,
  };
  const player = {
    email: demoPlayer.email,
    name: demoPlayer.name,
    password: hashPw(demoPlayer.password),
    role: "player",
    teamId,
    hideFromLeaderboards: false,
  };
  const seededProgress = SHOTLAB_DEMO_FIXTURES.progress || {};
  const remapDemoRecord = (record) => ({
    ...record,
    email: demoPlayer.email,
    playerId: demoPlayer.email,
    teamId,
    name: demoPlayer.name,
  });

  return {
    drills: homeDrills,
    programDrills,
    players: [coach, player],
    playerProfiles: [
      {
        id: genId("pp"),
        userId: demoPlayer.email,
        teamId,
        firstName: "Demo",
        lastName: "Player",
        createdAt,
      },
    ],
    teams: [
      {
        id: teamId,
        name: "Demo Team",
        ownerCoachId: demoCoach.email,
        joinCode: generateJoinCode([]),
        joinCodeUpdatedAt: createdAt,
        createdAt,
        branding: defaultBranding,
      },
    ],
    scores: (seededProgress.scores || []).map(remapDemoRecord),
    rsvps: (seededProgress.rsvps || []).map(remapDemoRecord),
    shotLogs: (seededProgress.shotLogs || []).map(remapDemoRecord),
    challenges: [],
    events,
    scSessions,
    scRsvps: [],
    scLogs: [],
    session: null,
  };
}
