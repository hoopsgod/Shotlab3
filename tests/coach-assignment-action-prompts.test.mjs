import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { buildAssignmentActionPrompts } from "../src/lib/coachAssignmentActionPromptsEnhancer.js";

const player = (overrides = {}) => ({
  playerIdentity: "player@example.com",
  playerName: "Player One",
  cycles: 3,
  lateCount: 0,
  medianResponseMs: 60 * 60 * 1000,
  medianCompletionMs: 24 * 60 * 60 * 1000,
  ...overrides,
});

const model = (players, overrides = {}) => ({
  hasEvidence: true,
  medianCompletionMs: 20 * 60 * 60 * 1000,
  players,
  ...overrides,
});

test("late completed work becomes the highest-priority coach review prompt", () => {
  const prompts = buildAssignmentActionPrompts(model([
    player({ playerIdentity: "steady@example.com", playerName: "Steady Player" }),
    player({ playerIdentity: "late@example.com", playerName: "Late Player", lateCount: 2 }),
  ]));
  assert.equal(prompts.length, 1);
  assert.equal(prompts[0].playerIdentity, "late@example.com");
  assert.equal(prompts[0].title, "Review deadline fit");
  assert.match(prompts[0].detail, /2 late completed assignments/);
});

test("slow acknowledgment and materially slower completion pace create directional prompts", () => {
  const prompts = buildAssignmentActionPrompts(model([
    player({ playerIdentity: "response@example.com", playerName: "Response Player", medianResponseMs: 26 * 60 * 60 * 1000 }),
    player({ playerIdentity: "scope@example.com", playerName: "Scope Player", cycles: 2, medianCompletionMs: 40 * 60 * 60 * 1000 }),
  ]));
  assert.equal(prompts.length, 2);
  assert.equal(prompts[0].title, "Clarify acknowledgment expectation");
  assert.equal(prompts[1].title, "Review assignment scope");
  assert.match(prompts[1].evidence, /directional, not a grade/);
});

test("prompts stay bounded, read-only, and private", () => {
  const players = Array.from({ length: 6 }, (_, index) => player({
    playerIdentity: `late${index}@example.com`,
    playerName: `Late ${index}`,
    lateCount: 1,
  }));
  const prompts = buildAssignmentActionPrompts(model(players));
  assert.equal(prompts.length, 3);

  const source = fs.readFileSync(new URL("../src/lib/coachAssignmentActionPromptsEnhancer.js", import.meta.url), "utf8");
  const bootstrap = fs.readFileSync(new URL("../src/lib/coachActivationPath.js", import.meta.url), "utf8");
  assert.match(source, /does not automatically grade players or send assignments/i);
  assert.match(source, /openExactPlayerFollowUp/);
  assert.match(bootstrap, /installCoachAssignmentActionPromptsEnhancer\(\)/);
  assert.doesNotMatch(source, /savePlayerAssignment|updatePlayerAssignmentState|method:\s*["']POST["']/i);
  assert.doesNotMatch(source, /private_note|coach_note/i);
});
