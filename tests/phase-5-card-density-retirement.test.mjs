import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const playerComponent = read("src/components/PlayerOperationalWorkspace.jsx");
const playerCss = read("src/components/PlayerOperationalWorkspace.module.css");
const secondaryComponent = read("src/components/SecondaryPageSystem.jsx");
const secondaryCss = read("src/components/SecondaryPageSystem.css");
const titleStageCss = read("src/components/TeamIdentityTitleStage.css");
const coachDashboards = read("src/components/CoachInteractiveDashboards.jsx");

test("Player workspaces encode an editorial opening and a single evidence ledger", () => {
  assert.match(playerComponent, /data-page-hierarchy="editorial"/);
  assert.match(playerComponent, /<TeamIdentityTitleStage/);
  assert.match(playerComponent, /dataLayoutRole="editorial-header"/);
  assert.match(playerComponent, /data-layout-role="supporting-evidence"/);

  const commandBarRule = playerCss.match(/\.commandBar\{([^}]*)\}/)?.[1] || "";
  const metricRule = playerCss.match(/\.metric\{([^}]*)\}/)?.[1] || "";
  assert.match(commandBarRule, /border-bottom:1px solid/);
  assert.doesNotMatch(commandBarRule, /background:|box-shadow:|border-radius:/);
  assert.match(playerCss, /\.metrics\s*\{[\s\S]*?gap:0;[\s\S]*?border-block:1px solid/);
  assert.match(metricRule, /border:0;/);
  assert.match(metricRule, /background:transparent;/);
  assert.doesNotMatch(metricRule, /border-radius:|box-shadow:/);
  assert.match(playerCss, /\.metric \+ \.metric\s*\{border-left:1px solid/);
  assert.match(playerCss, /@media\(max-width:700px\)[\s\S]*?\.metrics\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
});

test("Coach secondary pages expose the shared editorial and decision hierarchy without duplicating title authority", () => {
  assert.match(secondaryComponent, /data-page-hierarchy="editorial"/);
  assert.match(secondaryComponent, /dataLayoutRole="editorial-header"/);
  assert.match(secondaryComponent, /data-layout-role="primary-decision"/);
  assert.match(secondaryComponent, /data-layout-role="evidence-tools"/);
  assert.match(secondaryComponent, /data-layout-role="supporting-evidence"/);

  const start = coachDashboards.indexOf("export function CoachPageDashboardHeader");
  const component = coachDashboards.slice(start);
  const introIndex = component.indexOf("<SecondaryPageIntro");
  const decisionIndex = component.indexOf("<CoachRoutePerformanceStage");
  assert.ok(start >= 0 && introIndex >= 0 && decisionIndex > introIndex);
  assert.match(coachDashboards, /<SecondaryPageToolbar/);
  assert.match(coachDashboards, /<SecondaryPageEvidence/);
});

test("Coach hierarchy uses shared title typography and semantic branded decision surfaces", () => {
  assert.match(secondaryComponent, /<TeamIdentityTitleStage/);
  assert.match(titleStageCss, /--identity-crest:\s*clamp\(96px, 25vw, 108px\)/);
  assert.match(titleStageCss, /--identity-title:\s*clamp\(42px, 10\.2vw, 44px\)/);
  assert.doesNotMatch(secondaryCss, /\.secondaryPageIntro\b/);
  assert.match(secondaryCss, /\.secondaryPageToolbar \[data-visual-role="metric-strip"\]\s*\{[\s\S]*?border-block: 1px solid[\s\S]*?border-radius: 0 !important;[\s\S]*?background: transparent !important;/);
  assert.match(secondaryCss, /\.secondaryPageDecision\s*\{[\s\S]*?linear-gradient\(145deg,\s*var\(--team-brand-surface-elevated,\s*#171b18\),\s*var\(--team-brand-surface-deep,\s*#0c0f0d\) 72%\)/);
  assert.match(secondaryCss, /\.secondaryPageEvidence\s*\{[\s\S]*?gap: 0;[\s\S]*?border-block: 1px solid/);
});

test("Retired authority files no longer recreate card-heavy shared primitives", () => {
  const legacy = [
    "public/shotlab-v3-foundation.css",
    "public/shotlab-v3-mobile-corrections.css",
    "public/shotlab-v5-coach-integrity.css",
    "public/shotlab-v11-decision-first.css",
    "public/shotlab-phase3-secondary-cohesion.css",
    "public/shotlab-phase3-secondary-acceptance.css",
  ].map(read).join("\n");

  assert.doesNotMatch(legacy, /secondaryPageToolbar \[class\*="metricStrip"\]/);
  assert.doesNotMatch(legacy, /secondaryPageIntro\s*\{/);
  assert.doesNotMatch(legacy, /\[class\*="commandBar"\]/);
  assert.doesNotMatch(legacy, /\[data-metric-priority\]/);
});

test("Leaderboard mobile CSS keeps the primary decision and shared title context visible", () => {
  const leaderboardCss = read("public/shotlab-phase3l-coach-leaderboard-hierarchy.css");
  assert.doesNotMatch(leaderboardCss, /\[data-testid="coach-page-dashboard-leaderboards-decision-brief"\]\s*\{\s*display:\s*none/i);
  assert.doesNotMatch(leaderboardCss, /teamIdentityTitleStage[^\{]*\{\s*display:\s*none/i);
  assert.doesNotMatch(leaderboardCss, /\[data-identity-role="page-title"\][^\{]*\{[\s\S]*?font-size:\s*9px/i);
});
