const finite = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

export const derivePlayerPerformanceNarrative = ({ daily = {}, weekly = {}, streak = 0, firstSession = {}, primaryAction = {} } = {}) => {
  const makes = Math.max(0, finite(daily.makes));
  const goal = Math.max(1, finite(daily.goal) || 1);
  const remaining = Math.max(goal - makes, 0);
  const delta = makes - goal;
  const complete = makes >= goal || finite(daily.pct) >= 100 || primaryAction.urgency === "complete";
  const run = Math.max(0, finite(streak));
  const weeklyMakes = Math.max(0, finite(weekly.makes));
  const weeklyGoal = Math.max(0, finite(weekly.goal));

  let interpretation = `${remaining} TO TARGET`;
  let interpretationTone = "building";
  if (delta > 0) {
    interpretation = `+${delta} ABOVE TARGET`;
    interpretationTone = "positive";
  } else if (complete) {
    interpretation = "TARGET COMPLETE";
    interpretationTone = "positive";
  }

  const headline = firstSession.pending
    ? "Set your baseline."
    : complete
      ? "Daily work banked."
      : makes > 0
        ? "Stay on today’s standard."
        : "Today starts here.";

  const description = firstSession.pending
    ? "Log one completed shooting set. That first result gives ShotLab a real baseline to build from."
    : complete
      ? "Today’s standard is complete. Build on the week or take on your next team commitment."
      : makes > 0
        ? `${remaining} makes remain. Finish the standard, then decide what comes next.`
        : `Your daily standard is ${goal} makes. Start a focused block and bank the result.`;

  return {
    makes,
    goal,
    complete,
    remaining,
    delta,
    interpretation,
    interpretationTone,
    headline,
    description,
    contextLabel: firstSession.pending ? "Baseline" : primaryAction.source === "coach" ? "Coach plan" : complete ? "Target complete" : "Daily standard",
    weeklyText: weeklyGoal > 0 ? `${weeklyMakes} / ${weeklyGoal}` : `${weeklyMakes}`,
    weeklyLabel: weeklyGoal > 0 ? "This week" : "This week · no target",
    streakText: run > 0 ? `${run} day${run === 1 ? "" : "s"} run` : "No active run",
  };
};
