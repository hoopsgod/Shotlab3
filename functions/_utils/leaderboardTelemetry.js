const LEADERBOARD_EVENTS = Object.freeze({
  AUTH_FAILURE: "leaderboard.home_shots.auth_failure",
  QUERY_START: "leaderboard.home_shots.query_start",
  QUERY_SUCCESS: "leaderboard.home_shots.query_success",
  QUERY_EMPTY: "leaderboard.home_shots.query_empty",
  QUERY_FAILURE: "leaderboard.home_shots.query_failure",
});

export function recordLeaderboardEvent(event, metadata = {}) {
  console.log(
    JSON.stringify({
      event,
      ts: new Date().toISOString(),
      ...metadata,
    }),
  );
}

export { LEADERBOARD_EVENTS };
