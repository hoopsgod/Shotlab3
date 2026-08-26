const normalizeIdentity = (value = "") => String(value || "").trim().toLowerCase();

const rosterIdentity = (player = {}) => normalizeIdentity(
  player.email
  || player.player_email
  || player.playerEmail
  || player.playerId
  || player.player_id
  || player.userId
  || player.user_id
  || player.id,
);

const logIdentity = (log = {}) => normalizeIdentity(
  log.email
  || log.player_email
  || log.playerEmail
  || log.playerId
  || log.player_id
  || log.userId
  || log.user_id,
);

const toDateKey = (value) => {
  const raw = String(value || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const addDays = (dateKey, days) => {
  const date = new Date(`${dateKey}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  date.setDate(date.getDate() + days);
  return toDateKey(date);
};

const safeMakes = (value) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
};

export function deriveCoachProgramPulse({
  roster = [],
  shotLogs = [],
  weeklyGoal,
  weekStart,
} = {}) {
  const goal = Number(weeklyGoal);
  const start = toDateKey(weekStart);
  const end = start ? addDays(start, 6) : "";
  const eligible = (Array.isArray(roster) ? roster : [])
    .map((player) => ({ player, identity: rosterIdentity(player) }))
    .filter((entry) => entry.identity);

  if (!start || !end || !Number.isFinite(goal) || goal <= 0 || eligible.length === 0) {
    return {
      available: false,
      value: null,
      displayValue: "—",
      detail: "No weekly goal data",
      eligibleAthletes: eligible.length,
      creditedMakes: 0,
      totalGoal: 0,
      weekStart: start,
      weekEnd: end,
      athleteProgress: [],
    };
  }

  const makesByIdentity = new Map();
  for (const log of Array.isArray(shotLogs) ? shotLogs : []) {
    const identity = logIdentity(log);
    const date = toDateKey(log?.date || log?.createdAt || log?.created_at || log?.ts);
    if (!identity || !date || date < start || date > end) continue;
    makesByIdentity.set(identity, (makesByIdentity.get(identity) || 0) + safeMakes(log?.made ?? log?.makes));
  }

  const athleteProgress = eligible.map(({ player, identity }) => {
    const makes = makesByIdentity.get(identity) || 0;
    const creditedMakes = Math.min(makes, goal);
    return {
      identity,
      name: String(player?.name || player?.displayName || player?.email || "Athlete"),
      makes,
      creditedMakes,
      goal,
      percent: Math.round((creditedMakes / goal) * 100),
    };
  });

  const creditedMakes = athleteProgress.reduce((total, row) => total + row.creditedMakes, 0);
  const totalGoal = goal * athleteProgress.length;
  const value = totalGoal > 0 ? Math.round((creditedMakes / totalGoal) * 100) : null;

  return {
    available: value !== null,
    value,
    displayValue: value === null ? "—" : `${value}%`,
    detail: `${Math.round(creditedMakes).toLocaleString()} of ${Math.round(totalGoal).toLocaleString()} goal-adjusted makes`,
    eligibleAthletes: athleteProgress.length,
    creditedMakes,
    totalGoal,
    weekStart: start,
    weekEnd: end,
    athleteProgress,
  };
}
