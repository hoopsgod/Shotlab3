export const STORAGE_KEYS = {
  scores: "sl:scores",
  players: "sl:players",
  playerProfiles: "sl:player-profiles",
  events: "sl:events",
  rsvps: "sl:rsvps",
  shotLogs: "sl:shotlogs",
  teams: "sl:teams",
  sessions: "sl:session",
  coachPriorities: "sl:coach-priorities",
  drills: "sl:drills",
  programDrills: "sl:program-drills",
  scSessions: "sl:sc-sessions",
  scRsvps: "sl:sc-rsvps",
  scLogs: "sl:sc-logs",
};

export const TABLE_MAP = {
  [STORAGE_KEYS.scores]: "scores",
  [STORAGE_KEYS.players]: "players",
  [STORAGE_KEYS.playerProfiles]: "player_profiles",
  [STORAGE_KEYS.events]: "events",
  [STORAGE_KEYS.rsvps]: "rsvps",
  [STORAGE_KEYS.shotLogs]: "shot_logs",
  [STORAGE_KEYS.teams]: "teams",
  [STORAGE_KEYS.sessions]: "sessions",
};

export const PLAYER_DAILY_SHOT_TARGET = 100;
export const PLAYER_WEEKLY_SHOT_TARGET = 500;

export const COACH_PRIORITIES_INIT = {
  todayFocusText: "Daily shot volume + clean mechanics",
  focusEmphasis: "Volume",
  priorityDrillText: "At-home drill block",
  challengeText: "Build momentum: complete one drill and log shots today.",
  weeklyMakesTarget: PLAYER_WEEKLY_SHOT_TARGET,
  weeklyCheckinsTarget: 2,
};

export const sanitizeCoachPriorities = (value = {}) => {
  const weeklyMakesTarget = Number(value?.weeklyMakesTarget);
  const weeklyCheckinsTargetRaw = value?.weeklyCheckinsTarget;
  const weeklyCheckinsTarget = weeklyCheckinsTargetRaw === "" ? "" : Number(weeklyCheckinsTargetRaw);
  return {
    todayFocusText: String(value?.todayFocusText || COACH_PRIORITIES_INIT.todayFocusText),
    focusEmphasis: String(value?.focusEmphasis || COACH_PRIORITIES_INIT.focusEmphasis),
    priorityDrillText: String(value?.priorityDrillText || COACH_PRIORITIES_INIT.priorityDrillText),
    challengeText: String(value?.challengeText || COACH_PRIORITIES_INIT.challengeText),
    weeklyMakesTarget: Number.isFinite(weeklyMakesTarget) ? weeklyMakesTarget : COACH_PRIORITIES_INIT.weeklyMakesTarget,
    weeklyCheckinsTarget: Number.isFinite(weeklyCheckinsTarget) ? weeklyCheckinsTarget : COACH_PRIORITIES_INIT.weeklyCheckinsTarget,
  };
};

