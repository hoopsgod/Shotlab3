import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const header = fs.readFileSync("src/components/PlayerDashboardHeader.jsx", "utf8");
const titleStage = fs.readFileSync("src/components/TeamIdentityTitleStage.jsx", "utf8");
const titleStageCss = fs.readFileSync("src/components/TeamIdentityTitleStage.css", "utf8");
const daily = fs.readFileSync("src/components/PlayerDailyCommandCenter.jsx", "utf8");
const dailyCss = fs.readFileSync("src/components/PlayerDailyCommandCenter.module.css", "utf8");
const workspaceCss = fs.readFileSync("src/components/PlayerOperationalWorkspace.module.css", "utf8");

const systemFont = /-apple-system,\s*BlinkMacSystemFont,\s*["']SF Pro (?:Display|Text)["']/;
const legacyCondensedFont = /'Bebas Neue'|'Barlow Condensed'/;

test("player identity uses the shared immersive title stage with authoritative team branding", () => {
  assert.match(header, /import TeamIdentityTitleStage from "\.\/TeamIdentityTitleStage\.jsx"/);
  assert.match(header, /<TeamIdentityTitleStage/);
  assert.match(header, /variant="hero"/);
  assert.match(header, /surface="dark"/);
  assert.match(header, /role="Player Mode"/);
  assert.match(header, /testId="player-dashboard-identity-header"/);
  assert.match(titleStage, /useTeamBranding/);
  assert.match(titleStage, /data-identity-role="team-name"/);
  assert.match(titleStage, /data-identity-role="brand-mark"/);
  assert.match(titleStageCss, /\.teamIdentityTitleStage--hero\s*\{[\s\S]*?--identity-crest:\s*clamp\(104px,\s*29vw,\s*120px\)/);
  assert.match(titleStageCss, /\.teamIdentityTitleStage__crest\s*\{[\s\S]*?object-fit:\s*contain/);
  assert.match(titleStageCss, systemFont);
  assert.doesNotMatch(titleStageCss, legacyCondensedFont);
  assert.doesNotMatch(header, /DashboardIdentityHeader\.module\.css/);
});

test("Daily Command Center uses performance narrative hierarchy without changing its actions", () => {
  assert.match(daily, /data-page-hierarchy="performance-command-center"/);
  assert.match(daily, /data-testid="player-today-performance"/);
  assert.match(daily, /data-testid="player-target-interpretation"/);
  assert.match(daily, /data-testid="player-command-evidence"/);
  assert.equal((daily.match(/data-testid="player-daily-primary-action"/g) || []).length, 1);
  assert.match(dailyCss, /\.performanceStage\s*\{/);
  assert.match(dailyCss, /\.todayValue\s*\{[\s\S]*?font-size:clamp\(54px,15\.4vw,70px\)/);
  assert.match(dailyCss, /\.momentumRow\s*\{[\s\S]*?grid-template-columns:minmax\(0,1\.25fr\) minmax\(0,\.75fr\)/);
  assert.match(dailyCss, /\.primaryButton\s*\{[\s\S]*?min-height:54px/);
  assert.match(dailyCss, /\.coachSignal/);
  assert.doesNotMatch(dailyCss, /\.progressCard\s*\{|\.progressGrid\s*\{|scroll-snap-type:\s*x proximity/);
  assert.match(dailyCss, /@media \(prefers-reduced-motion:reduce\)/);
  assert.match(dailyCss, systemFont);
  assert.doesNotMatch(dailyCss, legacyCondensedFont);
});

test("all six player operational workspaces share the same current design system", () => {
  assert.match(workspaceCss, /\.commandBar\{[\s\S]*?border-bottom:1px solid[\s\S]*?background:transparent/);
  assert.match(workspaceCss, /\.metrics\{[\s\S]*?border-block:1px solid/);
  assert.match(workspaceCss, /\.metric\{[\s\S]*?border:0;[\s\S]*?background:transparent;[\s\S]*?cursor:default/);
  assert.doesNotMatch(workspaceCss, /\.metric\{[^}]*border-radius:/);
  assert.doesNotMatch(workspaceCss, /\.metric\{[^}]*box-shadow:/);
  assert.match(workspaceCss, /grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
  assert.match(workspaceCss, /grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(workspaceCss, /overflow-x:auto/);
  assert.match(workspaceCss, /outline:3px solid/);
  assert.match(workspaceCss, /@media\(prefers-reduced-motion:reduce\)/);
  assert.match(workspaceCss, systemFont);
  assert.doesNotMatch(workspaceCss, legacyCondensedFont);
});

test("the modernization remains presentation-only", () => {
  for (const source of [header, titleStage, titleStageCss, daily, dailyCss, workspaceCss]) {
    assert.doesNotMatch(source, /supabase|auth\.|fetch\(|localStorage|sessionStorage|create table|alter table/i);
  }
});
