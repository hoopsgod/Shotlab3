const identityOf = (row = {}) => String(
  row.email || row.player_email || row.playerEmail || row.playerId || row.player_id || row.userId || row.user_id || row.id || "",
).trim().toLowerCase();

const addDays = (dateKey, days) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dateKey || ""))) return "";
  const date = new Date(`${dateKey}T12:00:00`);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

export function deriveCoachProgramPulse({ roster = [], shotLogs = [], weeklyGoal, weekStart } = {}) {
  const goal = Number(weeklyGoal);
  const start = /^\d{4}-\d{2}-\d{2}$/.test(String(weekStart || "")) ? String(weekStart) : "";
  const stop = addDays(start, 7);
  const eligible = (Array.isArray(roster) ? roster : []).map((player) => [player, identityOf(player)]).filter(([, id]) => id);
  const unavailable = () => ({ available: false, value: null, displayValue: "—", detail: "No weekly goal data", eligibleAthletes: eligible.length, creditedMakes: 0, totalGoal: 0, athleteProgress: [] });
  if (!start || !stop || !Number.isFinite(goal) || goal <= 0 || !eligible.length) return unavailable();

  const makesByPlayer = new Map();
  for (const log of Array.isArray(shotLogs) ? shotLogs : []) {
    const id = identityOf(log);
    const date = String(log?.date || "").slice(0, 10);
    const makes = Number(log?.made ?? log?.makes);
    if (!id || date < start || date >= stop || !Number.isFinite(makes) || makes <= 0) continue;
    makesByPlayer.set(id, (makesByPlayer.get(id) || 0) + makes);
  }

  const athleteProgress = eligible.map(([, identity]) => {
    const makes = makesByPlayer.get(identity) || 0;
    const creditedMakes = Math.min(makes, goal);
    return { identity, makes, creditedMakes, goal, percent: Math.round((creditedMakes / goal) * 100) };
  });
  const creditedMakes = athleteProgress.reduce((sum, row) => sum + row.creditedMakes, 0);
  const totalGoal = goal * athleteProgress.length;
  const value = Math.round((creditedMakes / totalGoal) * 100);
  return { available: true, value, displayValue: `${value}%`, detail: `${Math.round(creditedMakes)} of ${Math.round(totalGoal)} goal-adjusted makes`, eligibleAthletes: athleteProgress.length, creditedMakes, totalGoal, athleteProgress };
}
