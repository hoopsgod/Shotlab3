import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const primitivesSource = fs.readFileSync("src/components/ExperiencePrimitives.jsx", "utf8");
const primitivesCss = fs.readFileSync("src/components/ExperiencePrimitives.module.css", "utf8");
const coachSource = fs.readFileSync("src/components/CoachInteractiveDashboards.jsx", "utf8");
const briefingSource = fs.readFileSync("src/lib/coachActionBriefings.js", "utf8");
const playerSource = fs.readFileSync("src/components/PlayerDailyCommandCenter.jsx", "utf8");
const playerCss = fs.readFileSync("src/components/PlayerDailyCommandCenter.module.css", "utf8");

test("Phase 3 exposes one reusable progress, trend, signal, and status vocabulary", () => {
  for (const component of [
    "ExperienceSparkline",
    "ExperienceProgressRing",
    "ExperienceSignal",
    "ExperiencePill",
  ]) {
    assert.match(primitivesSource, new RegExp(`export function ${component}`));
  }
  assert.match(primitivesCss, /\.sparkline/);
  assert.match(primitivesCss, /\.progressRing/);
  assert.match(primitivesCss, /\.signal/);
  assert.match(primitivesCss, /@media \(prefers-reduced-motion: reduce\)/);
});

test("Coach Players converts metrics into a decision brief with specific causes", () => {
  assert.match(coachSource, /buildCoachPlayerActionBriefing/);
  assert.match(coachSource, /coach-players-decision-brief/);
  assert.match(coachSource, /coach-players-engagement-sparkline/);
  assert.match(coachSource, /briefing\.attentionRows/);
  assert.match(coachSource, /briefing\.noActivityRows/);
  assert.match(briefingSource, /const followUpRows/);
  assert.match(briefingSource, /Open attention queue/);
  assert.match(briefingSource, /Protect the standard|individual blockers still need direct follow-up/);
});

test("Player Home prioritizes one action, progress meaning, and visible feedback", () => {
  assert.match(playerSource, /player-daily-momentum-signal/);
  assert.match(playerSource, /player-daily-progress-ring/);
  assert.match(playerSource, /Daily target complete/);
  assert.match(playerSource, /Opening…/);
  assert.match(playerSource, /Your next moves/);
  assert.match(playerCss, /\.heroComplete/);
  assert.match(playerCss, /\.momentumSignal/);
  assert.match(playerCss, /\[data-state="working"\]/);
});

test("Phase 3 foundation remains presentation-only and preserves data boundaries", () => {
  for (const source of [primitivesSource, primitivesCss, coachSource, briefingSource, playerSource, playerCss]) {
    assert.doesNotMatch(source, /supabase|auth\.|fetch\(|XMLHttpRequest|create table|alter table/i);
  }
});
