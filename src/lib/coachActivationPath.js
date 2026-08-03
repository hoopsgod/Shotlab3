import { installCoachAssignmentAccountabilityEnhancer } from "./coachAssignmentAccountabilityEnhancer.js";
import { installCoachAssignmentDeadlineEnhancer } from "./coachAssignmentDeadlineEnhancer.js";
import { installCoachAssignmentOutcomeEnhancer } from "./coachAssignmentOutcomeEnhancer.js";
import { installCoachFollowUpEnhancer } from "./coachFollowUpEnhancer.js";
import { installCoachFollowUpQueueEnhancer } from "./coachFollowUpQueueEnhancer.js";
import { installCoachHomeHierarchyEnhancer } from "./coachHomeHierarchyEnhancer.js";
import { installCoachQuickAssignDeadlineEnhancer } from "./coachQuickAssignDeadlineEnhancer.js";
import { installCoachQuickAssignEnhancer } from "./coachQuickAssignEnhancer.js";
import { installCoachResponseLoopEnhancer } from "./coachResponseLoopEnhancer.js";
import { installPlayerAssignmentEnhancer } from "./playerAssignmentEnhancer.js";

installCoachAssignmentOutcomeEnhancer();
installCoachFollowUpEnhancer();
installCoachFollowUpQueueEnhancer();
installCoachAssignmentAccountabilityEnhancer();
installCoachAssignmentDeadlineEnhancer();
installCoachQuickAssignEnhancer();
installCoachQuickAssignDeadlineEnhancer();
installCoachHomeHierarchyEnhancer();
installCoachResponseLoopEnhancer();
installPlayerAssignmentEnhancer();

const clean = (value) => String(value ?? "").trim();
const safeCount = (value) => Math.max(0, Number(value) || 0);
const normalizeName = (value) => clean(value).toLowerCase().replace(/\s+/g, " ");
const normalizeAsset = (value) => clean(value).split("?")[0].split("#")[0];

const PLACEHOLDER_TEAM_NAMES = new Set([
  "team",
  "your team",
  "shotlab team",
  "thomas titans",
]);

export const isCoachIdentityConfigured = ({ teamName = "", logoUrl = "", fallbackLogo = "" } = {}) => {
  const normalizedName = normalizeName(teamName);
  const namedTeam = Boolean(normalizedName) && !PLACEHOLDER_TEAM_NAMES.has(normalizedName);
  const normalizedLogo = normalizeAsset(logoUrl);
  const normalizedFallback = normalizeAsset(fallbackLogo);
  const customLogo = Boolean(normalizedLogo) && (!normalizedFallback || normalizedLogo !== normalizedFallback);
  return namedTeam || customLogo;
};

export function deriveCoachActivationPath({
  teamCode = "",
  teamName = "",
  logoUrl = "",
  fallbackLogo = "",
  rosterSize = 0,
  hasScheduledSession = false,
  activeTodayCount = 0,
  hasLiveActivity = false,
} = {}) {
  const rosterCount = safeCount(rosterSize);
  const identityConfigured = isCoachIdentityConfigured({ teamName, logoUrl, fallbackLogo });
  const engagementConfirmed = safeCount(activeTodayCount) > 0 || Boolean(hasLiveActivity);

  const milestones = [
    {
      id: "team-access",
      done: Boolean(clean(teamCode)),
      title: "Confirm team access",
      detail: "Verify the team code before inviting players so every account connects to the correct program.",
      action: "team-tools",
      label: "Open team code",
      icon: "settings",
    },
    {
      id: "team-identity",
      done: identityConfigured,
      title: "Set your team identity",
      detail: "Confirm the team name and logo players should recognize throughout ShotLab.",
      action: "branding",
      label: "Open team branding",
      icon: "spark",
    },
    {
      id: "first-player",
      done: rosterCount > 0,
      title: "Connect your first player",
      detail: "Add or invite one player and make sure their account appears in the active roster.",
      action: "add-player",
      label: "Add player",
      icon: "users",
    },
    {
      id: "first-session",
      done: Boolean(hasScheduledSession),
      title: "Schedule the first team session",
      detail: "Give players a real date, time, and reason to return to ShotLab.",
      action: "schedule-session",
      label: "Create session",
      icon: "calendar",
    },
    {
      id: "first-engagement",
      done: engagementConfirmed,
      title: "Confirm the first player response",
      detail: "Verify that a player has logged training, responded to a team commitment, or created another live team signal.",
      action: "review-engagement",
      label: "Review players",
      icon: "chart",
    },
  ];

  const completed = milestones.filter((milestone) => milestone.done).length;
  const nextIndex = milestones.findIndex((milestone) => !milestone.done);
  const next = nextIndex >= 0 ? milestones[nextIndex] : null;
  const total = milestones.length;

  return {
    milestones,
    completed,
    remaining: total - completed,
    total,
    progress: Math.round((completed / total) * 100),
    complete: completed === total,
    next,
    nextIndex,
    identityConfigured,
    engagementConfirmed,
  };
}
