import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const coachStage = fs.readFileSync(new URL("../src/components/CoachRoutePerformanceStage.jsx", import.meta.url), "utf8");
const performanceMark = fs.readFileSync(new URL("../src/components/ShotLabPerformanceMark.jsx", import.meta.url), "utf8");
const playerProgress = fs.readFileSync(new URL("../src/components/PlayerProgressStory.jsx", import.meta.url), "utf8");
const leaderboard = fs.readFileSync(new URL("../src/components/CompactLeaderboardPreviewCard.jsx", import.meta.url), "utf8");

test("Phase 4 uses the existing ShotLab performance primitive across Player surfaces", () => {
  assert.match(playerProgress, /ShotLabPerformanceMark/);
  assert.match(leaderboard, /ShotLabPerformanceMark/);
  assert.doesNotMatch(coachStage, /NewPerformanceMark|Phase4PerformanceMark|PremiumMetricMark/);
});

test("Coach route stages preserve truthful accessible metric behavior", () => {
  assert.match(coachStage, /readableMetricValue\(metric\)/);
  assert.match(coachStage, /onClick: \(\) => onSelect\(metric\.key\)/);
  assert.match(coachStage, /"aria-pressed": active/);
  assert.match(coachStage, /data-route-stage-metric-value/);
  assert.doesNotMatch(coachStage, /increase|decrease|improved|declined/i);
});

test("performance marks can be decorative without duplicating accessible announcements", () => {
  assert.match(performanceMark, /decorative = false/);
  assert.match(performanceMark, /aria-hidden=\{decorative \? "true" : undefined\}/);
  assert.match(performanceMark, /aria-label=\{decorative \? undefined : \(aria \|\| "Performance mark"\)\}/);
});

test("Phase 4 Player performance surfaces use semantic ShotLab arrows instead of text glyphs", () => {
  assert.match(playerProgress, /import ShotLabIcon from "\.\/ShotLabIcon\.jsx"/);
  assert.match(playerProgress, /<ShotLabIcon name="arrow" size=\{15\} aria-hidden="true"/);
  assert.match(leaderboard, /import ShotLabIcon from "\.\/ShotLabIcon\.jsx"/);
  assert.match(leaderboard, /<ShotLabIcon name="arrow" size=\{14\} aria-hidden="true"/);
  assert.doesNotMatch(playerProgress, /→/);
  assert.doesNotMatch(leaderboard, /→/);
});
