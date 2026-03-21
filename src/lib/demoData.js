const STORAGE_KEYS = Object.freeze({
  teams: "sl:teams",
  players: "sl:players",
  playerProfiles: "sl:player-profiles",
  events: "sl:events",
  rsvps: "sl:rsvps",
  scores: "sl:scores",
  shotLogs: "sl:shotlogs",
  progressSnapshots: "sl:progress-snapshots",
  demoMeta: "sl:demo-data-meta",
});

const DEMO_TEAM_ID = "team-demo-titans";
const DEMO_TIMESTAMP = Date.parse("2026-03-20T12:00:00.000Z");

const basePlayers = [
  { id: "player-demo-ava-brooks", email: "ava.brooks@demo.shotlab.app", name: "Ava Brooks", role: "player", teamId: DEMO_TEAM_ID, hideFromLeaderboards: false, createdAt: DEMO_TIMESTAMP },
  { id: "player-demo-jordan-lee", email: "jordan.lee@demo.shotlab.app", name: "Jordan Lee", role: "player", teamId: DEMO_TEAM_ID, hideFromLeaderboards: false, createdAt: DEMO_TIMESTAMP + 1 },
  { id: "player-demo-micah-santos", email: "micah.santos@demo.shotlab.app", name: "Micah Santos", role: "player", teamId: DEMO_TEAM_ID, hideFromLeaderboards: false, createdAt: DEMO_TIMESTAMP + 2 },
  { id: "player-demo-primary", email: "demo@shotlab.app", name: "Demo Player", role: "player", teamId: DEMO_TEAM_ID, hideFromLeaderboards: false, createdAt: DEMO_TIMESTAMP + 3 },
];

const basePlayerProfiles = [
  { id: "profile-demo-ava-brooks", userId: "ava.brooks@demo.shotlab.app", teamId: DEMO_TEAM_ID, firstName: "Ava", lastName: "Brooks", jerseyNumber: "3", createdAt: DEMO_TIMESTAMP },
  { id: "profile-demo-jordan-lee", userId: "jordan.lee@demo.shotlab.app", teamId: DEMO_TEAM_ID, firstName: "Jordan", lastName: "Lee", jerseyNumber: "11", createdAt: DEMO_TIMESTAMP + 1 },
  { id: "profile-demo-micah-santos", userId: "micah.santos@demo.shotlab.app", teamId: DEMO_TEAM_ID, firstName: "Micah", lastName: "Santos", jerseyNumber: "24", createdAt: DEMO_TIMESTAMP + 2 },
  { id: "profile-demo-primary", userId: "demo@shotlab.app", teamId: DEMO_TEAM_ID, firstName: "Demo", lastName: "Player", jerseyNumber: "0", createdAt: DEMO_TIMESTAMP + 3 },
];

const baseEvents = [
  { id: "event-demo-january-open-gym", teamId: DEMO_TEAM_ID, title: "January Open Gym", date: "2026-01-18", time: "5:30 PM", location: "Main Gym", desc: "Team shooting and finishing reps.", type: "workout" },
  { id: "event-demo-february-skills-clinic", teamId: DEMO_TEAM_ID, title: "February Skills Clinic", date: "2026-02-07", time: "9:00 AM", location: "Aux Gym", desc: "Ball-screen reads and finishing counters.", type: "clinic" },
  { id: "event-demo-february-recovery-lab", teamId: DEMO_TEAM_ID, title: "Recovery Lab", date: "2026-02-21", time: "11:15 AM", location: "Training Room", desc: "Recovery-focused mobility session.", type: "recovery" },
  { id: "evt-upcoming-1", teamId: DEMO_TEAM_ID, title: "Gym Session", date: "2026-03-25", time: "10:00 AM", location: "Main Gym", type: "workout" },
  { id: "event-demo-skill-lab", teamId: DEMO_TEAM_ID, title: "Skill Lab: Finishing Reads", date: "2026-03-27", time: "6:15 PM", location: "Main Gym Court 2", desc: "Guard-footwork and rim-finishing session.", type: "workout" },
  { id: "event-demo-shooting-club", teamId: DEMO_TEAM_ID, title: "Morning Shooting Club", date: "2026-03-29", time: "6:30 AM", location: "Aux Gym", desc: "High-volume catch-and-shoot reps.", type: "shooting" },
  { id: "event-demo-film-room", teamId: DEMO_TEAM_ID, title: "Film Room + Recovery", date: "2026-04-01", time: "4:45 PM", location: "Team Room", desc: "Scout-film review and mobility work.", type: "recovery" },
];

const baseRsvps = baseEvents.slice(0, 6).map((event, index) => ({
  id: "rsvp-demo-00" + (index + 1),
  email: "demo@shotlab.app",
  playerId: "demo@shotlab.app",
  name: "Demo Player",
  eventId: event.id,
  teamId: DEMO_TEAM_ID,
  attended: true,
  ts: DEMO_TIMESTAMP + index,
}));

const demoPrimaryScores = [
  { id: "score-dp-s01", email: "demo@shotlab.app", name: "Demo Player", teamId: DEMO_TEAM_ID, drillId: "demo-home-warm-up-shooting​​​​​​​​​​​​​​​​
