const DEMO_TEAM_ID = "team-demo-ignite";
const DEMO_PLAYER_EMAIL = "maya.thompson@igniteprep.demo";
const DEMO_PLAYER_NAME = "Maya Thompson";

const baseScore = ({
  drillId,
  score,
  date,
  ts,
  src = "home",
}) => ({
  email: DEMO_PLAYER_EMAIL,
  playerId: DEMO_PLAYER_EMAIL,
  teamId: DEMO_TEAM_ID,
  name: DEMO_PLAYER_NAME,
  drillId,
  score,
  date,
  ts,
  src,
});

const baseShotLog = ({ made, date, ts }) => ({
  email: DEMO_PLAYER_EMAIL,
  playerId: DEMO_PLAYER_EMAIL,
  teamId: DEMO_TEAM_ID,
  name: DEMO_PLAYER_NAME,
  made,
  date,
  ts,
});

const baseRsvp = ({ eventId, ts }) => ({
  eventId,
  email: DEMO_PLAYER_EMAIL,
  playerId: DEMO_PLAYER_EMAIL,
  teamId: DEMO_TEAM_ID,
  name: DEMO_PLAYER_NAME,
  ts,
});

export const DEMO_PROGRAM_EVENTS_FIXTURE = [
  {
    id: 5001,
    teamId: DEMO_TEAM_ID,
    title: "SPRING SHOOTER LAB",
    date: "2026-04-06",
    time: "5:30 PM",
    location: "Ignite Prep Performance Center — Bay 2",
    desc: "Coach-led shooting block with footwork prep, pace shooting, and a competitive closeout series.",
    type: "clinic",
  },
  {
    id: 5002,
    teamId: DEMO_TEAM_ID,
    title: "ELITE SMALL-GROUP WORKOUT",
    date: "2026-04-09",
    time: "6:15 PM",
    location: "Main Gym — Court 1",
    desc: "Invite-only program workout focused on relocation threes, transition reads, and late-clock decision-making.",
    type: "run",
  },
  {
    id: 5003,
    teamId: DEMO_TEAM_ID,
    title: "FILM + RECOVERY NIGHT",
    date: "2026-04-12",
    time: "7:00 PM",
    location: "Player Lounge + Recovery Suite",
    desc: "Game film review followed by guided mobility, NormaTec, and recovery tracking before the next training block.",
    type: "recovery",
  },
];

export const DEMO_AT_HOME_RESULTS_FIXTURE = {
  scores: [
    baseScore({ drillId: "demo-home-warm-up-shooting-4-minute", score: 31, date: "2026-03-24", ts: 1774317600000 }),
    baseScore({ drillId: "demo-home-3-minute-shooting", score: 27, date: "2026-03-26", ts: 1774492200000 }),
    baseScore({ drillId: "demo-home-calipari-shooting", score: 3, date: "2026-03-28", ts: 1774666800000 }),
    baseScore({ drillId: "demo-home-230s", score: 36, date: "2026-03-31", ts: 1774929600000 }),
    baseScore({ drillId: "demo-home-buddy-hield-shooting", score: 24, date: "2026-04-02", ts: 1775106000000 }),
    baseScore({ drillId: "demo-home-3-minute-shooting", score: 32, date: "2026-04-04", ts: 1775278800000 }),
    baseScore({ drillId: "demo-home-47-shooting", score: 11, date: "2026-04-05", ts: 1775367900000 }),
  ],
  shotLogs: [
    baseShotLog({ made: 215, date: "2026-03-24", ts: 1774321200000 }),
    baseShotLog({ made: 248, date: "2026-03-26", ts: 1774495800000 }),
    baseShotLog({ made: 264, date: "2026-03-31", ts: 1774933200000 }),
    baseShotLog({ made: 286, date: "2026-04-04", ts: 1775282400000 }),
    baseShotLog({ made: 301, date: "2026-04-05", ts: 1775371500000 }),
  ],
};

export const DEMO_PROGRESS_HISTORY_FIXTURE = {
  scores: [
    baseScore({ drillId: "demo-program-warm-up-shooting-4-minute", score: 34, date: "2026-03-25", ts: 1774404000000, src: "program" }),
    baseScore({ drillId: "demo-home-3-minute-shooting", score: 29, date: "2026-03-27", ts: 1774578600000 }),
    baseScore({ drillId: "demo-program-calipari-shooting", score: 4, date: "2026-03-29", ts: 1774751400000, src: "program" }),
    baseScore({ drillId: "demo-home-230s", score: 38, date: "2026-04-01", ts: 1775017800000 }),
    baseScore({ drillId: "demo-program-3-minute-shooting", score: 35, date: "2026-04-03", ts: 1775190600000, src: "program" }),
    baseScore({ drillId: "demo-home-3-minute-shooting", score: 33, date: "2026-04-06", ts: 1775451600000 }),
    baseScore({ drillId: "demo-program-47-shooting", score: 13, date: "2026-04-08", ts: 1775628000000, src: "program" }),
  ],
  shotLogs: [
    baseShotLog({ made: 232, date: "2026-03-25", ts: 1774407600000 }),
    baseShotLog({ made: 251, date: "2026-03-29", ts: 1774755000000 }),
    baseShotLog({ made: 278, date: "2026-04-03", ts: 1775194200000 }),
    baseShotLog({ made: 309, date: "2026-04-08", ts: 1775631600000 }),
  ],
  rsvps: [
    baseRsvp({ eventId: 5001, ts: 1774209600000 }),
    baseRsvp({ eventId: 5002, ts: 1774468800000 }),
    baseRsvp({ eventId: 5003, ts: 1774728000000 }),
  ],
};

export const SHOTLAB_DEMO_FIXTURES = {
  teamId: DEMO_TEAM_ID,
  player: {
    email: DEMO_PLAYER_EMAIL,
    playerId: DEMO_PLAYER_EMAIL,
    teamId: DEMO_TEAM_ID,
    name: DEMO_PLAYER_NAME,
  },
  programEvents: DEMO_PROGRAM_EVENTS_FIXTURE,
  atHome: DEMO_AT_HOME_RESULTS_FIXTURE,
  progress: DEMO_PROGRESS_HISTORY_FIXTURE,
};

export default SHOTLAB_DEMO_FIXTURES;
