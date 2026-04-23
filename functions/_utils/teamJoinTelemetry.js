const EVENT_BUFFER = globalThis.__teamJoinEventBuffer || [];
const MAX_EVENTS = 250;
if (!globalThis.__teamJoinEventBuffer) {
  globalThis.__teamJoinEventBuffer = EVENT_BUFFER;
}

export const TEAM_JOIN_EVENTS = Object.freeze({
  COACH_INVITE_CREATED: "team_join.coach_signup.invite_created",
  PLAYER_JOIN_ATTEMPT: "team_join.player.join_attempt",
  CODE_INVALID_FORMAT: "team_join.player.code_invalid_format",
  CODE_NOT_FOUND: "team_join.player.code_not_found",
  CODE_EXPIRED: "team_join.player.code_expired",
  CODE_REVOKED: "team_join.player.code_revoked",
  CODE_MAX_USES: "team_join.player.code_max_uses",
  ENV_CONFIG_MISMATCH: "team_join.env.config_mismatch",
  MEMBERSHIP_EXISTS: "team_join.player.membership_exists",
  MEMBERSHIP_CREATED: "team_join.player.membership_created",
  MEMBERSHIP_INSERT_FAILED: "team_join.player.membership_insert_failed",
});

export function recordTeamJoinEvent(event, metadata = {}) {
  const payload = {
    event,
    ts: new Date().toISOString(),
    ...metadata,
  };

  EVENT_BUFFER.push(payload);
  if (EVENT_BUFFER.length > MAX_EVENTS) EVENT_BUFFER.splice(0, EVENT_BUFFER.length - MAX_EVENTS);

  console.log(JSON.stringify(payload));
}

export function readTeamJoinEvents(limit = 100) {
  const size = Math.max(1, Math.min(limit, MAX_EVENTS));
  return EVENT_BUFFER.slice(-size);
}

export function classifyValidationError(errorCode) {
  switch (errorCode) {
    case "invalid_format":
      return TEAM_JOIN_EVENTS.CODE_INVALID_FORMAT;
    case "invalid_code":
      return TEAM_JOIN_EVENTS.CODE_NOT_FOUND;
    case "expired_code":
      return TEAM_JOIN_EVENTS.CODE_EXPIRED;
    case "revoked_code":
      return TEAM_JOIN_EVENTS.CODE_REVOKED;
    case "invite_max_uses_reached":
      return TEAM_JOIN_EVENTS.CODE_MAX_USES;
    case "env_config_mismatch":
      return TEAM_JOIN_EVENTS.ENV_CONFIG_MISMATCH;
    default:
      return TEAM_JOIN_EVENTS.MEMBERSHIP_INSERT_FAILED;
  }
}
