import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const component = fs.readFileSync(new URL("../src/components/ShotLabPerformanceMark.jsx", import.meta.url), "utf8");
const componentCss = fs.readFileSync(new URL("../src/components/ShotLabPerformanceMark.module.css", import.meta.url), "utf8");
const progress = fs.readFileSync(new URL("../src/components/PlayerProgressStory.jsx", import.meta.url), "utf8");
const leaderboard = fs.readFileSync(new URL("../src/components/CompactLeaderboardPreviewCard.jsx", import.meta.url), "utf8");
const script = fs.readFileSync(new URL("../scripts/apply-phase4b-premium-performance-marks.mjs", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../public/shotlab-phase4b-performance-marks.css", import.meta.url), "utf8");
const pkg = JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"));

test("Phase 4B creates one semantic performance-mark system", () => {
  for (const kind of ["rank", "streak", "pb", "milestone", "delta"]) assert.match(component, new RegExp(`\\"${kind}\\"`));
  assert.match(component, /data-performance-kind=\{resolvedKind\}/);
  assert.match(component, /aria-label=\{aria \|\| \"Performance mark\"\}/);
  assert.match(componentCss, /\.rank \.glyph/);
  assert.match(componentCss, /\.streak \.glyph/);
  assert.match(componentCss, /\.pb \.glyph/);
  assert.match(componentCss, /\.surface_light/);
  assert.match(componentCss, /prefers-reduced-motion/);
});

test("Phase 4B upgrades progress metrics and top leaderboard ranks without changing their data sources", () => {
  assert.match(progress, /player-progress-active-days-mark/);
  assert.match(progress, /player-progress-streak-mark/);
  assert.match(progress, /player-progress-pb-mark/);
  assert.match(progress, /story\.activeDays7/);
  assert.match(progress, /story\.currentStreak/);
  assert.match(progress, /story\.pbCount30/);
  assert.match(leaderboard, /leaderboard-rank-mark-/);
  assert.match(leaderboard, /const rank = Number\(entry\.rank\) \|\| index \+ 1/);
  assert.match(leaderboard, /entry\.metricValue \?\? entry\.total_home_shots \?\? entry\.score/);
});

test("Phase 4B preserves PB and streak logic while making progression visible before unlock", () => {
  assert.match(script, /const STREAK_BADGES=/);
  assert.match(script, /const getEarnedBadges=/);
  assert.match(script, /const isPB=v>prevBest&&prevBest>0;/);
  assert.match(script, /setPbReveal\(\{drill:active\.name,score:v,prev:prevBest\}\)/);
  assert.match(script, /STREAK_BADGES\.find\(b=>oldStreak<b\.days&&ns>=b\.days\)/);
  assert.match(script, /STREAK_BADGES\.find\(b=>b\.days>streak\)/);
  assert.match(script, /player-pb-achievement-reveal/);
  assert.match(script, /player-streak-achievement-reveal/);
  assert.match(script, /player-achievement-shelf/);
  assert.match(script, /player-achievement-next/);
  assert.match(script, /days to unlock/);
  assert.match(css, /performanceRevealCard/);
  assert.match(css, /performanceBadgeShelf/);
  assert.match(css, /performanceBadgeNext/);
});

test("Phase 4B achievement sheets own their geometry and motion instead of inheriting legacy badge styling", () => {
  assert.match(script, /<div className=\"performanceRevealCard\" role=\"dialog\"/);
  assert.match(script, /<div className=\"performanceRevealCard performanceRevealCard--pb\" role=\"dialog\"/);
  assert.match(script, /\.replace\('className=\"performanceRevealCard badge-pop\"', 'className=\"performanceRevealCard\"'\)/);
  assert.match(script, /legacy badge-pop class still controls a Phase 4B achievement card/);
  assert.match(css, /\.performanceRevealOverlay \.performanceRevealCard\{/);
  assert.match(css, /border-radius:28px!important/);
  assert.match(css, /phase4bRevealIn/);
  assert.match(css, /border-radius:25px!important/);
});

test("Phase 4B is ordered after signature identity and before visual minification", () => {
  for (const name of ["dev", "prepare:route-enhancers"]) {
    const command = pkg.scripts[name];
    assert.match(command, /apply-phase4a-signature-visual-identity\.mjs.*apply-phase4b-premium-performance-marks\.mjs.*minify-visual-authority-css\.mjs/);
  }
});
