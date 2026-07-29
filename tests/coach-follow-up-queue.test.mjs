import test from "node:test";
import assert from "node:assert/strict";
import {
  deriveCoachFollowUpQueue,
  loadCoachFollowUpQueue,
  readCoachFollowUpQueueContext,
} from "../src/lib/coachFollowUpQueue.js";

function memoryStorage(seed = {}) {
  const values = new Map(Object.entries(seed).map(([key, value]) => [key, typeof value === "string" ? value : JSON.stringify(value)]));
  return {
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, String(value)),
    snapshot: () => Object.fromEntries(values),
  };
}

const roster = [
  { id: "one", email: "one@example.test", name: "One", teamId: "team-a" },
  { id: "two", email: "two@example.test", name: "Two", teamId: "team-a" },
];

const records = [
  { teamId: "team-a", playerIdentity: "one@example.test", playerName: "One", state: "planned", updatedAt: "2026-07-29T12:00:00Z" },
  { teamId: "team-a", playerIdentity: "two@example.test", playerName: "Two", state: "completed", updatedAt: "2026-07-29T10:00:00Z", completedAt: "2026-07-29T11:00:00Z" },
  { teamId: "team-a", playerIdentity: "removed@example.test", playerName: "Removed", state: "planned", updatedAt: "2026-07-29T13:00:00Z" },
  { teamId: "team-a", playerIdentity: "one@example.test", playerName: "One", state: "dismissed", updatedAt: "2026-07-29T14:00:00Z" },
  { teamId: "team-b", playerIdentity: "other@example.test", playerName: "Other", state: "planned", updatedAt: "2026-07-29T15:00:00Z" },
];

test("queue includes only active-team roster records and separates open from completed", () => {
  const queue = deriveCoachFollowUpQueue({ records, roster, teamId: "team-a" });
  assert.equal(queue.openCount, 1);
  assert.equal(queue.completedCount, 1);
  assert.equal(queue.totalCount, 2);
  assert.equal(queue.planned[0].playerIdentity, "one@example.test");
  assert.equal(queue.completed[0].playerIdentity, "two@example.test");
  assert.equal(queue.planned.some((row) => row.playerIdentity === "removed@example.test"), false);
  assert.equal(queue.planned.some((row) => row.state === "dismissed"), false);
});

test("queue context uses canonical roster rules and active coach team", () => {
  const storage = memoryStorage({
    "sl:session": { email: "coach@example.test", teamId: "team-a" },
    "sl:players": [
      { email: "coach@example.test", role: "coach", teamId: "team-a" },
      { email: "one@example.test", name: "One", role: "player", teamId: "team-a" },
      { email: "removed@example.test", name: "Removed", role: "player", teamId: "team-a", rosterStatus: "removed" },
    ],
    "sl:player-profiles": [],
  });
  const context = readCoachFollowUpQueueContext(storage);
  assert.equal(context.requester, "coach@example.test");
  assert.equal(context.teamId, "team-a");
  assert.deepEqual(context.roster.map((row) => row.email), ["one@example.test"]);
});

test("remote team collection replaces stale local queue state", async () => {
  const storage = memoryStorage({
    "sl:session": { email: "coach@example.test", teamId: "team-a" },
    "sl:players": [
      { email: "coach@example.test", role: "coach", teamId: "team-a" },
      ...roster,
    ],
    "sl:player-profiles": [],
    "sl:coach-follow-ups": {
      "team-a::one@example.test": {
        teamId: "team-a",
        playerIdentity: "one@example.test",
        playerName: "One",
        state: "planned",
        updatedAt: "2026-07-28T12:00:00Z",
      },
    },
  });

  const result = await loadCoachFollowUpQueue({
    storage,
    fetchImpl: async (url, options) => {
      assert.equal(url, "/v1/coach-follow-ups?team_id=team-a");
      assert.equal(options.headers["x-user-id"], "coach@example.test");
      return {
        ok: true,
        json: async () => ({
          ok: true,
          storage_mode: "team_remote",
          follow_ups: [{
            team_id: "team-a",
            player_identity: "one@example.test",
            player_name: "One",
            state: "completed",
            updated_at: "2026-07-29T12:00:00Z",
            completed_at: "2026-07-29T12:00:00Z",
          }],
        }),
      };
    },
  });

  assert.equal(result.ok, true);
  assert.equal(result.storageMode, "team_remote");
  assert.equal(result.queue.openCount, 0);
  assert.equal(result.queue.completedCount, 1);
  assert.match(storage.snapshot()["sl:coach-follow-ups"], /completed/);
});

test("failed remote load preserves an honest local fallback queue", async () => {
  const storage = memoryStorage({
    "sl:session": { email: "coach@example.test", teamId: "team-a" },
    "sl:players": [{ email: "coach@example.test", role: "coach", teamId: "team-a" }, ...roster],
    "sl:player-profiles": [],
    "sl:coach-follow-ups": {
      "team-a::one@example.test": records[0],
    },
  });
  const result = await loadCoachFollowUpQueue({
    storage,
    fetchImpl: async () => { throw new Error("offline"); },
  });
  assert.equal(result.ok, false);
  assert.equal(result.storageMode, "local_fallback");
  assert.equal(result.queue.openCount, 1);
  assert.equal(result.error, "offline");
});
