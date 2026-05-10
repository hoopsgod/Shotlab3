const RECENT_ACTIVITY_LIMIT = 5;

const normalizeDateValue = (dateValue, fallbackTs = 0) => {
  if (!dateValue) return Number.isFinite(fallbackTs) ? fallbackTs : 0;
  const ts = Date.parse(`${dateValue}T12:00:00Z`);
  if (Number.isNaN(ts)) return Number.isFinite(fallbackTs) ? fallbackTs : 0;
  return ts;
};

const formatActor = (entry = {}, fallback = "Player") => entry.name || (entry.email ? entry.email.split("@")[0] : fallback);

export function deriveActivityFeedItems({ view = "player", user = null, events = [], rsvps = [], shotLogs = [], players = [], scores = [], today = "" }) {
  const items = [];
  const teamPlayers = Array.isArray(players) ? players : [];
  const scopedEvents = Array.isArray(events) ? events : [];
  const scopedRsvps = Array.isArray(rsvps) ? rsvps : [];
  const scopedShots = Array.isArray(shotLogs) ? shotLogs : [];
  const scopedScores = Array.isArray(scores) ? scores : [];

  const shotGroups = new Map();
  scopedShots.forEach((log) => {
    const email = String(log.email || "");
    const date = log.date || today;
    const key = `${email}__${date}`;
    const current = shotGroups.get(key) || { email, date, name: log.name, made: 0, ts: 0 };
    current.made += Number(log.made) || 0;
    current.ts = Math.max(current.ts, Number(log.ts) || normalizeDateValue(date));
    if (!current.name && log.name) current.name = log.name;
    shotGroups.set(key, current);
  });
  shotGroups.forEach((shotSummary) => {
    const isSelf = user && shotSummary.email === user.email;
    const actor = isSelf ? "You" : formatActor(shotSummary);
    items.push({ text: `${actor} logged ${shotSummary.made} At Home Shots`, date: shotSummary.date, ts: shotSummary.ts, type: "shots" });
  });

  scopedRsvps.forEach((rsvp) => {
    const ev = scopedEvents.find((event) => event.id === rsvp.eventId);
    const eventName = (ev?.title || "Team event").toUpperCase();
    const isSelf = user && rsvp.email === user.email;
    const actor = isSelf ? "You" : formatActor(rsvp);
    items.push({ text: `${actor} RSVP’d YES to ${eventName}`, date: rsvp.date || ev?.date || today, ts: Number(rsvp.ts) || normalizeDateValue(rsvp.date || ev?.date), type: "rsvp" });
  });

  scopedEvents.forEach((event) => {
    items.push({ text: `Coach added ${(event.title || "Team event").toUpperCase()}`, date: event.date || today, ts: Number(event.ts) || normalizeDateValue(event.date), type: "event" });
  });

  if (view === "coach") {
    teamPlayers.forEach((player) => {
      items.push({ text: `${formatActor(player)} joined the team`, date: player.joinedAt || today, ts: normalizeDateValue(player.joinedAt, Number(player.ts) || 0), type: "join" });
    });
    const activeToday = new Set(scopedScores.filter((score) => score.date === today).map((score) => score.email)).size;
    if (activeToday > 0) items.push({ text: `${activeToday} players logged activity today`, date: today, ts: normalizeDateValue(today), type: "summary" });
  } else {
    const ownScores = scopedScores.filter((score) => user && score.email === user.email);
    if (ownScores.length >= 3) items.push({ text: "New workout available", date: today, ts: normalizeDateValue(today) - 1, type: "workout" });
    if (scopedShots.filter((log) => user && log.email === user.email).length >= 3) items.push({ text: "You reached a streak milestone", date: today, ts: normalizeDateValue(today) - 2, type: "streak" });
  }

  return items.sort((a, b) => (b.ts || 0) - (a.ts || 0)).slice(0, RECENT_ACTIVITY_LIMIT);
}

export { RECENT_ACTIVITY_LIMIT };
