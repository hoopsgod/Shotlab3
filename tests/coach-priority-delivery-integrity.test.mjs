import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createAppPersistenceService, installCoachPrioritySaveBridge } from "../src/lib/appPersistenceService.js";
import { sanitizeTeamPriorities } from "../functions/v1/team-priorities/index.js";

const makeResponse = (status, body) => ({
  ok: status >= 200 && status < 300,
  status,
  async json() { return body; },
  headers: { get() { return "application/json"; } },
});

const makeDb = (seed = {}) => {
  const values = new Map(Object.entries(seed));
  const writes = [];
  return {
    values,
    writes,
    async get(key) { return values.has(key) ? values.get(key) : null; },
    async set(key, value, options = {}) {
      values.set(key, value);
      writes.push({ key, value, options });
    },
  };
};

const LOCAL_PRIORITY = {
  todayFocusText: "Local focus",
  focusEmphasis: "Technique",
  priorityDrillText: "Local drill",
  challengeText: "Local challenge",
  weeklyMakesTarget: 400,
  weeklyCheckinsTarget: 2,
};

const REMOTE_PRIORITY = {
  todayFocusText: "Remote team focus",
  focusEmphasis: "Consistency",
  priorityDrillText: "Remote drill",
  challengeText: "Remote challenge",
  weeklyMakesTarget: 650,
  weeklyCheckinsTarget: 3,
};

const SERVER_UPDATED_AT = "2026-07-29T03:10:00.000Z";

test("team priorities hydrate from the remote team source and override stale local values", async () => {
  const db = makeDb({
    "sl:session": { email: "player@example.com" },
    "sl:coach-priorities": { "team-a": LOCAL_PRIORITY },
  });
  const calls = [];
  const service = createAppPersistenceService({
    db,
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return makeResponse(200, {
        ok: true,
        storage_mode: "team_remote",
        priorities_by_team: { "team-a": REMOTE_PRIORITY },
        metadata_by_team: { "team-a": { updatedAt: SERVER_UPDATED_AT, updatedBy: "coach@example.com" } },
      });
    },
  });

  const result = await service.getPlayerPriorities();
  assert.equal(result["team-a"].todayFocusText, "Remote team focus");
  assert.equal(result["team-a"].weeklyMakesTarget, 650);
  assert.equal(result["team-a"].updatedAt, SERVER_UPDATED_AT);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].options.headers["x-user-id"], "player@example.com");
  assert.deepEqual(db.values.get("sl:coach-priorities"), result);
  assert.equal(db.writes.at(-1).options.strictLocal, true);
});

test("coach priority publishing writes local fallback and posts team-scoped guidance", async () => {
  const db = makeDb({ "sl:session": { email: "coach@example.com" } });
  const calls = [];
  const service = createAppPersistenceService({
    db,
    fetchImpl: async (url, options) => {
      calls.push({ url, options, body: JSON.parse(options.body) });
      return makeResponse(200, { ok: true, storage_mode: "team_remote", priorities: REMOTE_PRIORITY, updated_at: SERVER_UPDATED_AT });
    },
  });

  const result = await service.savePlayerPriorities({ "team-a": REMOTE_PRIORITY });
  assert.equal(result.ok, true);
  assert.equal(result.storageMode, "team_remote");
  assert.deepEqual(result.deliveredTeamIds, ["team-a"]);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "/v1/team-priorities");
  assert.equal(calls[0].options.method, "POST");
  assert.equal(calls[0].options.headers["x-user-id"], "coach@example.com");
  assert.equal(calls[0].body.team_id, "team-a");
  assert.equal(calls[0].body.priorities.priorityDrillText, "Remote drill");
  assert.equal(db.values.get("sl:coach-priorities")["team-a"].todayFocusText, "Remote team focus");
  assert.equal(db.values.get("sl:coach-priorities")["team-a"].updatedAt, SERVER_UPDATED_AT);
  assert.equal(db.writes.at(-1).options.strictLocal, true);
});

test("failed remote delivery preserves the local draft and rejects the publish attempt", async () => {
  const db = makeDb({ "sl:session": { email: "coach@example.com" } });
  const service = createAppPersistenceService({
    db,
    fetchImpl: async () => makeResponse(500, { error: "priority_write_failed" }),
  });

  await assert.rejects(
    () => service.savePlayerPriorities({ "team-a": REMOTE_PRIORITY }),
    (error) => error?.code === "priority_write_failed",
  );
  assert.equal(db.values.get("sl:coach-priorities")["team-a"].todayFocusText, "Remote team focus");
});

test("the compatibility bridge stamps the existing coach save flow and reports delivery truthfully", async () => {
  const target = {};
  const bridge = installCoachPrioritySaveBridge(target);
  assert.equal(typeof bridge, "function");
  assert.equal(target.savePlayerPriorities.__shotlabPriorityBridge, true);

  let deliveredDraft = null;
  const success = await target.savePlayerPriorities({
    teamId: "team-a",
    draft: REMOTE_PRIORITY,
    onSaveCoachPriorities: async (teamId, draft) => {
      deliveredDraft = draft;
      return { ok: teamId === "team-a" && draft.priorityDrillText === REMOTE_PRIORITY.priorityDrillText };
    },
  });
  assert.equal(success.ok, true);
  assert.equal(deliveredDraft.todayFocusText, REMOTE_PRIORITY.todayFocusText);
  assert.equal(Number.isNaN(Date.parse(deliveredDraft.updatedAt)), false);
  assert.equal(success.publishedAt, deliveredDraft.updatedAt);

  const failure = await target.savePlayerPriorities({
    teamId: "team-a",
    draft: REMOTE_PRIORITY,
    onSaveCoachPriorities: async () => { throw new Error("network_down"); },
  });
  assert.equal(failure.ok, false);
  assert.match(failure.message, /saved on this device/i);
  assert.match(failure.message, /could not be delivered/i);
  assert.equal(Number.isNaN(Date.parse(failure.publishedAt)), false);
});

test("server sanitization bounds coach-controlled content and numeric targets", () => {
  const result = sanitizeTeamPriorities({
    todayFocusText: "x".repeat(500),
    focusEmphasis: "y".repeat(100),
    priorityDrillText: "z".repeat(300),
    challengeText: "c".repeat(900),
    weeklyMakesTarget: 9_000_000,
    weeklyCheckinsTarget: -4,
  });
  assert.equal(result.todayFocusText.length, 240);
  assert.equal(result.focusEmphasis.length, 60);
  assert.equal(result.priorityDrillText.length, 180);
  assert.equal(result.challengeText.length, 600);
  assert.equal(result.weeklyMakesTarget, 1_000_000);
  assert.equal(result.weeklyCheckinsTarget, 0);
});

test("team priority storage is private and validated by the server identity boundary", () => {
  const migration = fs.readFileSync(new URL("../migrations/036_team_priorities.sql", import.meta.url), "utf8");
  const endpoint = fs.readFileSync(new URL("../functions/v1/team-priorities/index.js", import.meta.url), "utf8");
  assert.match(migration, /enable row level security/i);
  assert.match(migration, /revoke all on table public\.team_priorities from public, anon, authenticated/i);
  assert.doesNotMatch(migration, /grant\s+(select|insert|update|delete)/i);
  assert.match(endpoint, /writableTeamIds\.has\(teamId\)/);
  assert.match(endpoint, /readableTeamIds/);
  assert.match(endpoint, /readAuthenticatedIdentity/);
  assert.doesNotMatch(endpoint, /readUserId/);
  assert.match(endpoint, /metadata_by_team/);
  assert.match(endpoint, /updated_at/);
});
