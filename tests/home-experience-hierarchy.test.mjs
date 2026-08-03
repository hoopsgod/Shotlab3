import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/lib/homeExperienceHierarchy.js", import.meta.url), "utf8");
const bootstrap = fs.readFileSync(new URL("../src/lib/coachActivationPath.js", import.meta.url), "utf8");

test("home hierarchy establishes one dominant coach and player action", () => {
  assert.match(source, /coach-command-center-full/);
  assert.match(source, /player-daily-primary-action/);
  assert.match(source, /single-primary-objective/);
  assert.match(source, /single-primary-action/);
  assert.match(source, /mcHeroContent h1/);
  assert.match(source, /mcPrimary/);
});

test("supporting coach panels are visually flattened instead of removed", () => {
  assert.match(source, /mcLowerGrid/);
  assert.match(source, /background: transparent !important/);
  assert.match(source, /border-top: 1px solid/);
  assert.doesNotMatch(source, /\.mcLowerGrid[^}]*display:\s*none/s);
  assert.doesNotMatch(source, /visibility:\s*hidden/);
});

test("player metrics become an integrated evidence strip and remain available", () => {
  assert.match(source, /Player momentum metrics/);
  assert.match(source, /grid-template-columns: repeat\(3/);
  assert.match(source, /player-daily-task-queue/);
  assert.doesNotMatch(source, /player-daily-task-queue[^}]*display:\s*none/s);
});

test("home hierarchy preserves accessibility and reduced motion", () => {
  assert.match(source, /prefers-reduced-motion: reduce/);
  assert.match(source, /min-height: 54px/);
  assert.match(source, /min-height: 56px/);
  assert.match(source, /MutationObserver/);
});

test("home hierarchy installs through the shared bootstrap without data writes", () => {
  assert.match(bootstrap, /installHomeExperienceHierarchy\(\)/);
  assert.doesNotMatch(source, /fetch\(|supabase|localStorage|sessionStorage|\.insert\(|\.update\(/);
});
