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
    scores: [],
    rsvps: [],
    shotLogs: [],
    challenges: [],
    events,
    scSessions,
    scRsvps: [],
    scLogs: [],
    session: null,
  };
}
