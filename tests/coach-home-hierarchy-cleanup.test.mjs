import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  COACH_HOME_HIERARCHY_CSS,
  COACH_HOME_HIERARCHY_STYLE_ID,
  installCoachHomeHierarchyEnhancer,
} from "../src/lib/coachHomeHierarchyEnhancer.js";

test("coach home cleanup is scoped to Mission Control and the obsolete setup checklist", () => {
  assert.equal(COACH_HOME_HIERARCHY_STYLE_ID, "shotlab-coach-home-hierarchy-cleanup");
  assert.match(COACH_HOME_HIERARCHY_CSS, /body\.mission-control-active\s+\[data-testid="coach-setup-checklist"\]/);
  assert.match(COACH_HOME_HIERARCHY_CSS, /display:\s*none\s*!important/);
  assert.doesNotMatch(COACH_HOME_HIERARCHY_CSS, /coach-team-standings|coach-today-practice|coach-next-seven-days|coach-assignment-outcome/);
});

test("the enhancer remains inert outside a browser", () => {
  assert.equal(installCoachHomeHierarchyEnhancer(), false);
});

test("the legacy checklist still exists only as a targeted compatibility surface", () => {
  const app = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
  const activation = fs.readFileSync(new URL("../src/lib/coachActivationPath.js", import.meta.url), "utf8");
  assert.match(app, /testId="coach-setup-checklist"/);
  assert.match(activation, /installCoachHomeHierarchyEnhancer\(\)/);
  assert.match(app, /testId="coach-team-standings"/);
  assert.match(app, /testId="coach-today-practice"/);
});
