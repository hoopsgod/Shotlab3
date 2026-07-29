import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  COACH_FOLLOW_UP_STORAGE_KEY,
  getCoachFollowUpFromStore,
  loadCoachFollowUp,
  sanitizeCoachFollowUp,
  saveCoachFollowUp,
} from "../src/lib/coachFollowUpService.js";
import { sanitizeCoachFollowUp as sanitizeApiFollowUp } from "../functions/v1/coach-follow-ups/index.js";

function memoryStorage(seed = {}) {
  const values = new Map(Object.entries(seed).map(([key, value]) => [key, typeof value === "string" ? value : JSON.stringify(value)]));
  return {
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, String(value)),
    snapshot: () => Object.fromEntries(values),
  };
}

test("follow-up sanitizers enforce bounded coach-only task states", () => {
  const input = {
    team_id: " team-a ",
    player_identity: " PLAYER@EXAMPLE.COM ",
    player_name: " Player One ",
    state: "COMPLETED",
    note: " Private coaching note ",
  };
  assert.deepEqual(sanitizeCoachFollowUp(input), {
    teamId: "team-a",
    playerIdentity: "player@example.com",
    playerName: "Player One",
    state: "completed",
    note: "Private coaching note",
    createdAt: "",
    updatedAt: "",
    completedAt: "",
    updatedBy: "",
  });
  assert.equal(sanitizeApiFollowUp({ ...input, state: "sent" }).state, "planned");
});

test("local-only save is honest and survives a new service read", async () => {
  const storage = memoryStorage();
  const result = await saveCoachFollowUp({
    teamId: "team-a",
    playerIdentity: "player@example.com",
    playerName: "Player One",
    state: "planned",
    note: "Check in after practice.",
    storage,
    fetchImpl: null,
  });

  assert.equal(result.ok, true);
  assert.equal(result.storageMode, "local_only");
  assert.match(result.message, /this device only/i);
  const persisted = getCoachFollowUpFromStore({ storage, teamId: "team-a", playerIdentity: "player@example.com" });
  assert.equal(persisted.state, "planned");
  assert.equal(persisted.note, "Check in after practice.");
  assert.ok(storage.snapshot()[COACH_FOLLOW_UP_STORAGE_KEY]);
});

test("remote save uses exact team and player identity without claiming delivery to the player", async () => {
  const storage = memoryStorage({ "sl:session": { email: "coach@example.com", teamId: "team-a" } });
  let requestBody = null;
  const result = await saveCoachFollowUp({
    teamId: "team-a",
    playerIdentity: "player@example.com",
    playerName: "Player One",
    state: "completed",
    note: "Spoke after practice.",
    storage,
    fetchImpl: async (_url, options) => {
      requestBody = JSON.parse(options.body);
      return {
        ok: true,
        json: async () => ({
          ok: true,
          storage_mode: "team_remote",
          follow_up: {
            ...requestBody,
            updated_at: "2026-07-29T16:00:00.000Z",
            completed_at: "2026-07-29T16:00:00.000Z",
            updated_by: "coach@example.com",
          },
        }),
      };
    },
  });

  assert.equal(result.ok, true);
  assert.equal(result.storageMode, "team_remote");
  assert.equal(requestBody.team_id, "team-a");
  assert.equal(requestBody.player_identity, "player@example.com");
  assert.equal(requestBody.state, "completed");
  assert.equal(result.record.updatedBy, "coach@example.com");
  assert.doesNotMatch(result.message, /message sent|player notified|delivered to player/i);
});

test("remote load replaces an older local record", async () => {
  const storage = memoryStorage({
    "sl:session": { email: "coach@example.com", teamId: "team-a" },
    [COACH_FOLLOW_UP_STORAGE_KEY]: {
      "team-a::player@example.com": {
        teamId: "team-a",
        playerIdentity: "player@example.com",
        playerName: "Player One",
        state: "planned",
        note: "Old note",
        updatedAt: "2026-07-28T12:00:00.000Z",
      },
    },
  });
  const result = await loadCoachFollowUp({
    teamId: "team-a",
    playerIdentity: "player@example.com",
    storage,
    fetchImpl: async () => ({
      ok: true,
      json: async () => ({
        ok: true,
        storage_mode: "team_remote",
        follow_ups: [{
          team_id: "team-a",
          player_identity: "player@example.com",
          player_name: "Player One",
          state: "completed",
          note: "Current note",
          updated_at: "2026-07-29T16:00:00.000Z",
          completed_at: "2026-07-29T16:00:00.000Z",
          updated_by: "coach@example.com",
        }],
      }),
    }),
  });

  assert.equal(result.ok, true);
  assert.equal(result.record.state, "completed");
  assert.equal(result.record.note, "Current note");
  assert.equal(getCoachFollowUpFromStore({ storage, teamId: "team-a", playerIdentity: "player@example.com" }).state, "completed");
});

test("database and API contracts keep follow-up notes behind the coach API", () => {
  const migration = fs.readFileSync(new URL("../migrations/037_coach_follow_ups.sql", import.meta.url), "utf8");
  const api = fs.readFileSync(new URL("../functions/v1/coach-follow-ups/index.js", import.meta.url), "utf8");
  const enhancer = fs.readFileSync(new URL("../src/lib/coachFollowUpEnhancer.js", import.meta.url), "utf8");

  assert.match(migration, /create table if not exists public\.coach_follow_ups/i);
  assert.match(migration, /enable row level security/i);
  assert.match(migration, /revoke all on table public\.coach_follow_ups from public, anon, authenticated/i);
  assert.match(migration, /do(?:es)? not imply that a message was sent or a player was notified/i);
  assert.match(api, /writableTeamIds/);
  assert.match(api, /coach_follow_ups_post/);
  assert.match(api, /team_id,player_identity/);
  assert.match(enhancer, /coach-follow-up-ledger/);
  assert.match(enhancer, /ShotLab does not send a message or notify the player/i);
  assert.match(enhancer, /shotlabLegacyNudgeRetired/);
  assert.match(enhancer, /min-height:44px/);
  assert.doesNotMatch(enhancer, /message sent|notification delivered|player was notified/i);
});
