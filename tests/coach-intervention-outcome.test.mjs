import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { buildInterventionOutcome, recordInterventionBaseline } from "../src/lib/coachInterventionOutcomeEnhancer.js";

const player = { playerIdentity: "player@example.com", playerName: "Player", cycles: 4, lateCount: 1, medianResponseMs: 6 * 3600000, medianCompletionMs: 24 * 3600000 };

test("outcome tracking waits for later completed evidence and labels small samples honestly", () => {
  const awaiting = buildInterventionOutcome({ baseline: player, player });
  assert.equal(awaiting.status, "awaiting");
  const observed = buildInterventionOutcome({ baseline: { ...player, cycles: 3, lateCount: 1, medianResponseMs: 12 * 3600000, medianCompletionMs: 30 * 3600000 }, player });
  assert.equal(observed.status, "observed");
  assert.equal(observed.postCycles, 1);
  assert.equal(observed.sampleLabel, "Early signal");
  assert.ok(observed.changes.some((row) => row.id === "response" && row.direction === "favorable"));
});

test("baseline storage is bounded and contains no private notes", () => {
  const values = new Map();
  const storage = { getItem: (key) => values.get(key) || null, setItem: (key, value) => values.set(key, String(value)) };
  globalThis.window = { dispatchEvent() {} };
  assert.equal(recordInterventionBaseline({ teamId: "team", player, promptType: "deadline", storage }), true);
  const saved = [...values.values()].join("");
  assert.match(saved, /player@example.com/);
  assert.doesNotMatch(saved, /private_note|coach_note/i);
});

test("source labels comparison as association and installs from coach activation", () => {
  const source = fs.readFileSync(new URL("../src/lib/coachInterventionOutcomeEnhancer.js", import.meta.url), "utf8");
  const bootstrap = fs.readFileSync(new URL("../src/lib/coachActivationPath.js", import.meta.url), "utf8");
  assert.match(source, /not proof that an intervention caused/i);
  assert.match(source, /Device-local baselines/i);
  assert.match(source, /data-state="delivered"/);
  assert.match(bootstrap, /installCoachInterventionOutcomeEnhancer\(\)/);
  assert.doesNotMatch(source, /private_note|coach_note/i);
});
