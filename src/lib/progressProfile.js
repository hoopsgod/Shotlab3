const DAY_MS = 24 * 60 * 60 * 1000;

const normalizeEmail = (value = "") => String(value || "").trim().toLowerCase();
const toDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const dayKey = (d) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;

export function derivePlayerProgressProfile({ playerEmail, shotLogs = [], scores = [], rsvps = [], events = [], players = [], now = new Date() }) {
  const email = normalizeEmail(playerEmail);
  const nowDate = toDate(now) || new Date();
  const today = new Date(Date.UTC(nowDate.getUTCFullYear(), nowDate.getUTCMonth(), nowDate.getUTCDate()));
  const start7 = new Date(today.getTime() - (6 * DAY_MS));
  const playerShots = shotLogs.filter((s) => normalizeEmail(s?.email || s?.playerId) === email);
  const totalAtHomeShots = playerShots.reduce((a, s) => a + (Number(s?.made) || 0), 0);
  const activityDays = new Set(playerShots.map((s) => toDate(s?.date || s?.ts || s?.createdAt)).filter(Boolean).map(dayKey));
  const sortedDays = [...activityDays].sort().map((k) => new Date(`${k}T00:00:00.000Z`));
  let currentStreak = 0;
  let cursor = today;
  while (activityDays.has(dayKey(cursor))) {
    currentStreak += 1;
    cursor = new Date(cursor.getTime() - DAY_MS);
  }
  const weeklyActivityCount = playerShots.filter((s) => {
    const d = toDate(s?.date || s?.ts || s?.createdAt);
    return d && d >= start7 && d <= nowDate;
  }).length;
  const playerRsvps = rsvps.filter((r) => normalizeEmail(r?.email || r?.playerId) === email);
  const eventsAttended = playerRsvps.length;
  const scopedEventIds = new Set(events.map((e) => e?.id).filter(Boolean));
  const validRsvps = playerRsvps.filter((r) => scopedEventIds.size === 0 || scopedEventIds.has(r?.eventId));
  const rsvpParticipationRate = events.length ? Math.round((validRsvps.length / events.length) * 100) : 0;
  const sevenDayTrend = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(start7.getTime() + (index * DAY_MS));
    const key = dayKey(day);
    const made = playerShots.filter((s) => {
      const d = toDate(s?.date || s?.ts || s?.createdAt);
      return d && dayKey(d) === key;
    }).reduce((a, s) => a + (Number(s?.made) || 0), 0);
    return { day: key, made };
  });
  const recentActivitySummary = [
    `${totalAtHomeShots} at-home makes total`,
    `${weeklyActivityCount} shot logs in last 7 days`,
    `${eventsAttended} event RSVPs`,
  ];
  const coachSnapshot = {
    consistency: currentStreak >= 3 ? "Building consistency" : "Needs consistency reps",
    engagement: rsvpParticipationRate >= 60 ? "High event engagement" : "Low event engagement",
    developmentSignal: scores.filter((s) => normalizeEmail(s?.email || s?.playerId) === email).length > 0 ? "Score logs present" : "No drill score logs yet",
  };
  return { totalAtHomeShots, currentStreak, weeklyActivityCount, eventsAttended, rsvpParticipationRate, recentActivitySummary, sevenDayTrend, coachSnapshot, isEmpty: sortedDays.length === 0 && eventsAttended === 0, rosterSize: players.length };
}
