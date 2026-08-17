const finite = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const clampPerformanceRatio = (value) => Math.min(1, Math.max(0, finite(value)));

export function deriveShotLabPerformanceVisual({ value = 0, target = 0 } = {}) {
  const made = Math.max(0, finite(value));
  const goal = Math.max(0, finite(target));
  const hasTarget = goal > 0;
  const targetRatio = hasTarget ? clampPerformanceRatio(made / goal) : 0;
  const aboveTarget = hasTarget ? Math.max(0, made - goal) : 0;
  const overflowRatio = hasTarget ? clampPerformanceRatio(aboveTarget / goal) : 0;

  let state = "untargeted";
  if (hasTarget) {
    if (made <= 0) state = "zero";
    else if (made > goal) state = "above";
    else if (made === goal) state = "complete";
    else if (made / goal >= 0.8) state = "near";
    else state = "partial";
  }

  const roundedMade = Math.round(made);
  const roundedGoal = Math.round(goal);
  const roundedAbove = Math.round(aboveTarget);
  const remaining = Math.max(0, Math.round(goal - made));

  let accessibleLabel = `${roundedMade} makes today. No daily target set.`;
  if (hasTarget) {
    if (state === "above") accessibleLabel = `${roundedMade} makes today. Target ${roundedGoal}. ${roundedAbove} above target.`;
    else if (state === "complete") accessibleLabel = `${roundedMade} makes today. Target ${roundedGoal}. Target complete.`;
    else accessibleLabel = `${roundedMade} makes today. Target ${roundedGoal}. ${remaining} to target.`;
  }

  return {
    made,
    target: goal,
    hasTarget,
    state,
    targetRatio,
    targetPercent: Math.round(targetRatio * 1000) / 10,
    remaining,
    aboveTarget,
    overflowRatio,
    overflowPercent: Math.round(overflowRatio * 1000) / 10,
    accessibleLabel,
  };
}
