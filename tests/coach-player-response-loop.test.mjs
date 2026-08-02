import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  buildCoachResponseContext,
  buildNextAssignmentSuggestion,
  getCoachResponseContext,
  parseCoachResponseNote,
  serializeCoachResponseNote,
  setCoachResponseContext,
} from "../src/lib/coachPlayerResponseLoop.js";

test("live result context captures player, result, and makes without inventing extra data", () => {
  const context = buildCoachResponseContext({
    playerName: "Ari Cross",
    detail: "Home shots · 33 makes",
    meta: "Aug 2",
  });
  assert.equal(context.playerName, "Ari Cross");
  assert.equal(context.resultDetail, "Home shots · 33 makes");
  assert.equal(context.resultMeta, "Aug 2");
  assert.equal(context.made, 33);
  assert.match(buildNextAssignmentSuggestion(context), /match or improve 33 makes/i);
});

test("response context round-trips exact evidence, scopes to the player, and expires", () => {
  const target = {};
  const openedAt = "2026-08-02T18:00:00.000Z";
  setCoachResponseContext({
    playerName: "Ari Cross",
    detail: "Home shots · 33 makes",
    meta: "Aug 2",
    openedAt,
  }, target);
  const retrieved = getCoachResponseContext({ target, playerName: "Ari Cross", now: Date.parse(openedAt) + 60_000 });
  assert.ok(retrieved);
  assert.equal(retrieved.resultDetail, "Home shots · 33 makes");
  assert.equal(retrieved.resultMeta, "Aug 2");
  assert.equal(retrieved.made, 33);
  assert.equal(getCoachResponseContext({ target, playerName: "Other Player", now: Date.parse(openedAt) + 60_000 }), null);
  assert.equal(getCoachResponseContext({ target, playerName: "Ari Cross", now: Date.parse(openedAt) + 11 * 60_000 }), null);
});

test("structured assignment notes preserve private coach notes and legacy notes", () => {
  assert.deepEqual(parseCoachResponseNote("Legacy private note"), {
    assignment: "",
    privateNote: "Legacy private note",
    structured: false,
  });
  const encoded = serializeCoachResponseNote({
    assignment: "Repeat the form shooting block.",
    privateNote: "Watch balance on the left foot.",
  });
  assert.deepEqual(parseCoachResponseNote(encoded), {
    assignment: "Repeat the form shooting block.",
    privateNote: "Watch balance on the left foot.",
    structured: true,
  });
});

test("response-loop source contracts keep the workflow one-tap and honest", () => {
  const enhancer = fs.readFileSync(new URL("../src/lib/coachResponseLoopEnhancer.js", import.meta.url), "utf8");
  const followUp = fs.readFileSync(new URL("../src/lib/coachFollowUpEnhancer.js", import.meta.url), "utf8");
  const activation = fs.readFileSync(new URL("../src/lib/coachActivationPath.js", import.meta.url), "utf8");

  assert.match(enhancer, /coach-live-activity/);
  assert.match(enhancer, /Review .* result and record next assignment/);
  assert.match(enhancer, /openExactPlayerFollowUp/);
  assert.match(followUp, /coach-result-response-context/);
  assert.match(followUp, /Next assignment to deliver/);
  assert.match(followUp, /Record next assignment/);
  assert.match(followUp, /ShotLab does not send a message or notify the player/);
  assert.match(activation, /installCoachResponseLoopEnhancer\(\)/);
  assert.doesNotMatch(followUp, /message sent|notification delivered|player was notified/i);
});
