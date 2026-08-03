import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const index = fs.readFileSync("index.html", "utf8");
const css = fs.readFileSync("public/mission-control-canonical.css", "utf8");
const component = fs.readFileSync("src/components/CoachCommandCenter.jsx", "utf8");

test("Mission Control loads one explicit canonical presentation", () => {
  assert.match(index, /mission-control-canonical\.css/);
  assert.match(css, /body\.mission-control-active \.mcShellV3 \.mcHero/);
  assert.match(css, /body\.mission-control-active \.mcShellV3 \.mcRealityStrip/);
  assert.match(css, /body\.mission-control-active \.mcShellV3 \.mcPrimary/);
  assert.match(css, /coach-assignment-accountability/);
});

test("canonical Mission Control preserves stable interaction seams", () => {
  for (const seam of ["coach-primary-objective", "coach-primary-metrics", "coach-command-center-full", "coach-assignment-accountability"]) {
    assert.match(component, new RegExp(seam));
  }
  assert.match(css, /min-height:44px/);
  assert.match(css, /@media\(max-width:700px\)/);
  assert.match(css, /prefers-reduced-motion:reduce/);
});

test("presentation adds no data or persistence behavior", () => {
  assert.doesNotMatch(css, /supabase|fetch\(|localStorage|sessionStorage|XMLHttpRequest|create table|alter table/i);
});
