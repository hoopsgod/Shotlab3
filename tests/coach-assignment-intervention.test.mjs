import "./coach-intervention-outcome.test.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { interventionSuggestions } from "../src/lib/coachAssignmentInterventionEnhancer.js";

test("intervention starting points are bounded, editable assignment text by prompt type", () => {
  const deadline = interventionSuggestions("deadline");
  const response = interventionSuggestions("response");
  const scope = interventionSuggestions("scope");
  assert.equal(deadline.length, 2);
  assert.equal(response.length, 2);
  assert.equal(scope.length, 2);
  assert.ok(deadline.every((value) => typeof value === "string" && value.length > 20));
  assert.notDeepEqual(deadline, response);
  assert.notDeepEqual(response, scope);
});

test("intervention workflow requires explicit delivery and reuses preserved-history assignment boundary", () => {
  const source = fs.readFileSync(new URL("../src/lib/coachAssignmentInterventionEnhancer.js", import.meta.url), "utf8");
  const bootstrap = fs.readFileSync(new URL("../src/lib/coachActivationPath.js", import.meta.url), "utf8");
  assert.match(source, /saveNextPlayerAssignment/);
  assert.match(source, /Confirm and deliver/);
  assert.match(source, /Nothing is sent until you confirm delivery/i);
  assert.match(source, /openExactPlayerFollowUp/);
  assert.match(source, /data-testid=\"coach-assignment-action-prompt\"/);
  assert.match(bootstrap, /installCoachAssignmentInterventionEnhancer\(\)/);
  assert.doesNotMatch(source, /private_note|coach_note/i);
  assert.doesNotMatch(source, /savePlayerAssignment\(/);
});
