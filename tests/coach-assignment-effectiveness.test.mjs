import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  buildCoachAssignmentEffectiveness,
  loadCoachAssignmentEffectiveness,
} from "../src/lib/coachAssignmentEffectiveness.js";
import { formatEffectivenessDuration } from "../src/lib/coachAssignmentEffectivenessEnhancer.js";

const TEAM_ID = "team-effectiveness";
const COACH = "coach@example.com";
const PLAYER_A = "alpha@example.com";
const PLAYER_B = "beta@example.com";
const hour = 60 * 60 * 1000;

function completed({
  player = PLAYER_A,
  name = "Alpha Player",
  text = "Complete the form shooting ladder.",
  createdAt,
  acknowledgedAt,
  startedAt,
  completedAt,
  dueDate = "",
} = {}) {
  return {
    team_id: TEAM_ID,
    player_identity: player,
    player_name: name,
    assignment_text: text,
    result_detail: "",
    due_date: dueDate || null,
    state: "completed",
    assigned_by: COACH,
    created_at: createdAt,
    updated_at: completedAt,
    acknowledged_at: acknowledgedAt,
    started_at: startedAt,
    completed_at: completedAt,
  };
}

function memoryStorage(session = { email: COACH, role: "coach", teamId: TEAM_ID }) {
  const values = new Map([["sl:session", JSON.stringify(session)]]);
  return {
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, String(value)),
  };
}

test("effectiveness model deduplicates current completions and computes truthful deadline and pace metrics", () => {
  const alphaOnTime = completed({
    createdAt: "2026-08-01T12:00:00.000Z",
    acknowledgedAt: "2026-08-01T13:00:00.000Z",
    startedAt: "2026-08-01T14:00:00.000Z",
    completedAt: "2026-08-02T16:00:00.000Z",
    dueDate: "2026-08-02",
  });
  const alphaLate = completed({
    text: "Complete five-spot shooting.",
    createdAt: "2026-08-03T12:00:00.000Z",
    acknowledgedAt: "2026-08-03T18:00:00.000Z",
    startedAt: "2026-08-04T12:00:00.000Z",
    completedAt: "2026-08-06T12:00:00.000Z",
    dueDate: "2026-08-05",
  });
  const betaFast = completed({
    player: PLAYER_B,
    name: "Beta Player",
    text: "Complete the free-throw ladder.",
    createdAt: "2026-08-01T08:00:00.000Z",
    acknowledgedAt: "2026-08-01T10:00:00.000Z",
    startedAt: "2026-08-01T11:00:00.000Z",
    completedAt: "2026-08-01T20:00:00.000Z",
  });
  const betaCurrent = completed({
    player: PLAYER_B,
    name: "Beta Player",
    text: "Complete corner threes.",
    createdAt: "2026-08-02T12:00:00.000Z",
    acknowledgedAt: "2026-08-02T13:00:00.000Z",
    startedAt: "2026-08-02T14:00:00.000Z",
    completedAt: "2026-08-03T13:00:00.000Z",
    dueDate: "2026-08-03",
  });

  const model = buildCoachAssignmentEffectiveness({
    teamId: TEAM_ID,
    history: [alphaOnTime, alphaLate, betaFast],
    assignments: [alphaOnTime, betaCurrent],
  });

  assert.equal(model.total, 4);
  assert.equal(model.playerCount, 2);
  assert.equal(model.deadlineCount, 3);
  assert.equal(model.onTimeCount, 2);
  assert.equal(model.lateCount, 1);
  assert.equal(model.onTimeRate, 67);
  assert.equal(model.medianResponseMs, 1.5 * hour);
  assert.equal(model.medianCompletionMs, 26.5 * hour);
  assert.equal(model.attentionCount, 1);
  assert.equal(model.sampleLabel, "Developing");
  assert.equal(model.players[0].playerIdentity, PLAYER_A);
  assert.equal(model.players[0].lateCount, 1);
  assert.equal(model.players[0].lateDays, 1);
  assert.equal(model.players[1].playerIdentity, PLAYER_B);
});

test("invalid timestamp intervals remain visible as evidence but never enter pace or deadline rates", () => {
  const invalid = completed({
    createdAt: "2026-08-04T12:00:00.000Z",
    acknowledgedAt: "2026-08-04T11:00:00.000Z",
    startedAt: "not-a-date",
    completedAt: "2026-08-04T10:00:00.000Z",
    dueDate: "2026-08-04",
  });
  const model = buildCoachAssignmentEffectiveness({ teamId: TEAM_ID, history: [invalid], assignments: [] });
  assert.equal(model.total, 1);
  assert.equal(model.deadlineCount, 0);
  assert.equal(model.onTimeRate, null);
  assert.equal(model.responseSampleCount, 0);
  assert.equal(model.completionSampleCount, 0);
  assert.equal(model.medianResponseMs, null);
  assert.equal(model.medianCompletionMs, null);
});

test("coach loader requests only the exact team and combines current plus preserved evidence", async () => {
  const storage = memoryStorage();
  const requests = [];
  const archived = completed({
    createdAt: "2026-08-01T12:00:00.000Z",
    acknowledgedAt: "2026-08-01T13:00:00.000Z",
    startedAt: "2026-08-01T14:00:00.000Z",
    completedAt: "2026-08-02T12:00:00.000Z",
    dueDate: "2026-08-02",
  });
  const current = completed({
    player: PLAYER_B,
    name: "Beta Player",
    createdAt: "2026-08-02T12:00:00.000Z",
    acknowledgedAt: "2026-08-02T13:00:00.000Z",
    startedAt: "2026-08-02T14:00:00.000Z",
    completedAt: "2026-08-03T12:00:00.000Z",
  });
  const result = await loadCoachAssignmentEffectiveness({
    teamId: TEAM_ID,
    storage,
    fetchImpl: async (url) => {
      requests.push(String(url));
      if (String(url).startsWith("/v1/player-assignment-history")) {
        return { ok: true, json: async () => ({ ok: true, storage_mode: "team_remote", history: [archived] }) };
      }
      return { ok: true, json: async () => ({ ok: true, storage_mode: "team_remote", assignments: [current] }) };
    },
  });
  assert.equal(result.ok, true);
  assert.equal(result.storageMode, "team_remote");
  assert.equal(result.model.total, 2);
  assert.equal(requests.length, 2);
  assert.ok(requests.every((url) => url.includes(`team_id=${TEAM_ID}`)));
});

test("player sessions cannot load team effectiveness evidence", async () => {
  const storage = memoryStorage({ email: PLAYER_A, role: "player", teamId: TEAM_ID });
  let fetchCount = 0;
  const result = await loadCoachAssignmentEffectiveness({
    teamId: TEAM_ID,
    storage,
    fetchImpl: async () => { fetchCount += 1; throw new Error("must not fetch"); },
  });
  assert.equal(result.ok, false);
  assert.equal(result.storageMode, "forbidden");
  assert.equal(result.model.total, 0);
  assert.equal(fetchCount, 0);
});

test("duration presentation is compact and source contracts remain read-only and private", () => {
  assert.equal(formatEffectivenessDuration(30 * 60 * 1000), "30m");
  assert.equal(formatEffectivenessDuration(6 * hour), "6h");
  assert.equal(formatEffectivenessDuration(27 * hour), "1d 3h");
  assert.equal(formatEffectivenessDuration(null), "—");

  const modelSource = fs.readFileSync(new URL("../src/lib/coachAssignmentEffectiveness.js", import.meta.url), "utf8");
  const enhancerSource = fs.readFileSync(new URL("../src/lib/coachAssignmentEffectivenessEnhancer.js", import.meta.url), "utf8");
  const bootstrapSource = fs.readFileSync(new URL("../src/lib/coachActivationPath.js", import.meta.url), "utf8");
  assert.match(enhancerSource, /Assignment effectiveness/);
  assert.match(enhancerSource, /openExactPlayerFollowUp/);
  assert.match(enhancerSource, /private coach notes excluded/i);
  assert.match(bootstrapSource, /installCoachAssignmentEffectivenessEnhancer\(\)/);
  assert.doesNotMatch(modelSource, /savePlayerAssignment|updatePlayerAssignmentState|fetch\([^)]*POST/i);
  assert.doesNotMatch(modelSource, /private_note|coach_note/i);
  assert.doesNotMatch(enhancerSource, /private_note|coach_note/i);
});
