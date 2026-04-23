import test from "node:test";
import assert from "node:assert/strict";

import { mapLeaderboardError, parseLimit } from "../functions/v1/leaderboards/home-shots.js";

test("parseLimit clamps and defaults safely", () => {
  assert.equal(parseLimit(undefined), 10);
  assert.equal(parseLimit("abc"), 10);
  assert.equal(parseLimit("0"), 1);
  assert.equal(parseLimit("1"), 1);
  assert.equal(parseLimit("7"), 7);
  assert.equal(parseLimit("99"), 10);
});

test("mapLeaderboardError maps known authorization and validation errors", () => {
  assert.deepEqual(mapLeaderboardError(new Error("TEAM_ID_REQUIRED")), { status: 400, code: "team_id_required" });
  assert.deepEqual(mapLeaderboardError(new Error("REQUESTER_REQUIRED")), { status: 401, code: "unauthorized" });
  assert.deepEqual(mapLeaderboardError(new Error("NOT_AUTHORIZED_FOR_TEAM")), { status: 403, code: "forbidden" });
  assert.deepEqual(mapLeaderboardError(new Error("unexpected")), { status: 500, code: "internal_error" });
});
