import { installCoachAssignmentOutcomeEnhancer } from "./coachAssignmentOutcomeEnhancer.js";
import { installCoachFollowUpEnhancer } from "./coachFollowUpEnhancer.js";
import { installCoachFollowUpQueueEnhancer } from "./coachFollowUpQueueEnhancer.js";
import { installCoachHomeHierarchyEnhancer } from "./coachHomeHierarchyEnhancer.js";

installCoachAssignmentOutcomeEnhancer();
installCoachFollowUpEnhancer();
installCoachFollowUpQueueEnhancer();
installCoachHomeHierarchyEnhancer();

const clean = (value) => String(value ?? "").trim();
const safeCount = (value) => Math.max(0, Number(value) || 0);

export function deriveCoachActivationPath({
  teamCode = "",
  rosterSize = 0,
  hasScheduledSession = false,
  activeTodayCount = 0,
  hasLiveActivity = false,
} = {}) {
  const rosterCount = safeCount(rosterSize);
  const legacyOperationalTeam = rosterCount >= 2;
  const milestones = [
    {
      id: "team-access",
      done: Boolean(clean(teamCode)),
      title: "Confirm team access",
      detail: "Make sure the team code is ready before players are invited.",
      action: "team-tools",
      label: "Open team code",
      icon: "settings",
    },
    {
      id: "first-player",
      done: rosterCount > 0,
      title: "Invite your first player",
      detail: "Create the first roster account and send a secure setup link.",
      action: "add-player",
      label: "Invite player",
      icon: "users",
    },
    {
      id: "first-session",
      done: Boolean(hasScheduledSession) || legacyOperationalTeam,
      title: "Schedule the first team session",
      detail: "Give players a clear date, time, and reason to open ShotLab.",
      action: "schedule-session",
      label: "Create session",
      icon: "calendar",
    },
    {
      id: "first-engagement",
      done: safeCount(activeTodayCount) > 0 || Boolean(hasLiveActivity) || legacyOperationalTeam,
      title: "Confirm the first player response",
      detail: "Review the roster and verify that at least one athlete has connected and acted.",
      action: "review-engagement",
      label: "Review players",
      icon: "chart",
    },
  ];

  const completed = milestones.filter((milestone) => milestone.done).length;
  const next = milestones.find((milestone) => !milestone.done) || null;
  const total = milestones.length;

  return {
    milestones,
    completed,
    total,
    progress: Math.round((completed / total) * 100),
    complete: completed === total,
    next,
  };
}
