import { SHOTLAB_DEMO_FIXTURES } from "../demoFixtures";

const asArray = (value, fallback = []) => (Array.isArray(value) ? value : fallback);
const asObject = (value, fallback = {}) =>
  value && typeof value === "object" && !Array.isArray(value) ? value : fallback;

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
  const seededFixtures = asObject(SHOTLAB_DEMO_FIXTURES);
  const seededProgress = asObject(seededFixtures.progress);
  const remapDemoRecord = (record) => ({
    ...asObject(record),
    email: demoPlayer.email,
    playerId: demoPlayer.email,
    teamId,
    name: demoPlayer.name,
  });

  return {
    drills: asArray(homeDrills),
    programDrills: asArray(programDrills),
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
    scores: asArray(seededProgress.scores).map(remapDemoRecord),
    rsvps: asArray(seededProgress.rsvps).map(remapDemoRecord),
    shotLogs: asArray(seededProgress.shotLogs).map(remapDemoRecord),
    challenges: [],
    events: asArray(events),
    scSessions: asArray(scSessions),
    scRsvps: [],
    scLogs: [],
    session: null,
  };
}
