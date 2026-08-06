export const CAREER_MILESTONES = Object.freeze([100, 500, 1000, 2500, 5000, 10000]);

const formatNumber = (value) => Number(value || 0).toLocaleString();

export function formatCareerMilestone(value) {
  const milestone = Number(value) || 0;
  if (milestone >= 1000 && milestone % 1000 === 0) return `${milestone / 1000}K`;
  if (milestone >= 1000) return `${milestone / 1000}K`;
  return String(milestone);
}

export function buildPlayerCareerMilestoneStory(careerMakes) {
  const total = Math.max(0, Number(careerMakes) || 0);
  const highest = CAREER_MILESTONES.at(-1);
  const complete = total >= highest;
  const next = CAREER_MILESTONES.find((milestone) => milestone > total) || highest;
  const previous = [...CAREER_MILESTONES].reverse().find((milestone) => milestone <= total) || 0;
  const span = Math.max(1, next - previous);
  const progress = complete ? 100 : Math.min(100, Math.max(0, ((total - previous) / span) * 100));
  const remaining = Math.max(0, next - total);
  const ladder = CAREER_MILESTONES.map((value) => ({
    value,
    label: formatCareerMilestone(value),
    state: total >= value ? "complete" : value === next ? "current" : "locked",
  }));

  return {
    total,
    complete,
    previous,
    next,
    progress,
    remaining,
    ladder,
    title: complete ? "10,000-make milestone reached" : `${formatNumber(next)} makes is next`,
    detail: complete
      ? "Your verified career record has crossed ShotLab’s highest milestone tier."
      : `${formatNumber(remaining)} verified makes remain to reach the next career marker.`,
    status: complete
      ? "Milestone complete"
      : previous > 0
        ? `${formatNumber(previous)} milestone secured`
        : `${formatNumber(total)} of ${formatNumber(next)}`,
  };
}
