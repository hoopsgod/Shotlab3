import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Phase 6D keeps Progress editorial and gives next focus one dominant action treatment", async () => {
  const css = await read("src/components/PlayerProgressStory.module.css");
  const progress = await read("src/components/PlayerProgressStory.jsx");

  assert.match(progress, /data-testid="player-progress-strongest-signal"/);
  assert.match(progress, /data-testid="player-progress-opportunity"/);
  assert.match(css, /\.signalCard\{[\s\S]*?border:0;[\s\S]*?border-block:1px solid[\s\S]*?border-radius:0;[\s\S]*?background:transparent;[\s\S]*?box-shadow:none/);
  assert.match(css, /\.nextFocus\{[\s\S]*?border-left:3px solid[\s\S]*?border-radius:0;[\s\S]*?box-shadow:none/);
  assert.match(css, /\.signalGrid\{grid-template-columns:1fr!important;gap:0\}/);
});

test("Phase 6D uses a premium integrated Player masthead instead of white header cards", async () => {
  const homeCss = await read("src/components/PlayerDailyCommandCenter.module.css");
  const workspaceCss = await read("src/components/PlayerOperationalWorkspace.module.css");

  assert.match(homeCss, /\[data-visual-role="player-home-identity"\][\s\S]*?linear-gradient\(132deg/);
  assert.match(homeCss, /\[data-identity-role="page-title"\][\s\S]*?Barlow Condensed/);
  assert.match(workspaceCss, /player-team-workspace-title[\s\S]*?border:0!important;[\s\S]*?border-radius:0!important;[\s\S]*?box-shadow:none!important/);
  assert.match(workspaceCss, /teamIdentityTitleStage__action[\s\S]*?team-brand-primary/);
});

test("Phase 6D replaces equal KPI tiles with a Player performance scoreboard hierarchy", async () => {
  const metricCss = await read("src/components/PlayerMetricHierarchy.module.css");
  const homeCss = await read("src/components/PlayerDailyCommandCenter.module.css");
  const progressCss = await read("src/components/PlayerProgressStory.module.css");

  assert.match(metricCss, /\.metricPrimary\{[\s\S]*?linear-gradient\(132deg[\s\S]*?box-shadow:none!important/);
  assert.match(metricCss, /grid-column:1\/-1!important/);
  assert.match(metricCss, /grid-template-columns:repeat\(3,minmax\(0,1fr\)\)!important/);
  assert.match(homeCss, /\.primaryButton,\.taskButton,\.activationButton\{[\s\S]*?border-radius:10px/);
  assert.match(progressCss, /\.nextFocus button\{[\s\S]*?border-radius:9px/);
});
