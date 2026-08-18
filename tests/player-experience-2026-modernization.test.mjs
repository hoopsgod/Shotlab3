import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const header = fs.readFileSync("src/components/PlayerDashboardHeader.jsx", "utf8");
const identityStage = fs.readFileSync("src/components/TeamIdentityTitleStage.jsx", "utf8");
const identityCss = fs.readFileSync("src/components/TeamIdentityTitleStage.css", "utf8");
const daily = fs.readFileSync("src/components/PlayerDailyCommandCenter.jsx", "utf8");
const dailyCss = fs.readFileSync("src/components/PlayerDailyCommandCenter.module.css", "utf8");
const workspaceCss = fs.readFileSync("src/components/PlayerOperationalWorkspace.module.css", "utf8");

const systemFont = /-apple-system,\s*BlinkMacSystemFont,\s*["']SF Pro (?:Display|Text)["']/;
const legacyCondensedFont = /'Bebas Neue'|'Barlow Condensed'/;

test("player identity uses the shared unboxed team-owned editorial stage", () => {
  assert.match(header, /import TeamIdentityTitleStage from "\.\/TeamIdentityTitleStage"/);
  assert.match(header, /variant="hero"/);
  assert.match(header, /surface="dark"/);
  assert.match(header, /role="Player"/);
  assert.match(header, /testId="player-dashboard-identity-header"/);
  assert.match(identityStage, /branding\?\.teamName \|\| branding\?\.name \|\| "Your Team"/);
  assert.match(identityStage, /data-testid=\{testId\}/);
  assert.match(identityStage, /className="teamIdentityTitleStage__crest"/);
  assert.match(identityStage, /className="teamIdentityTitleStage__fallbackCrest"/);
  assert.match(identityCss, /\.teamIdentityTitleStage \{[\s\S]*?border: 0 !important;[\s\S]*?border-radius: 0 !important;[\s\S]*?background: transparent !important;[\s\S]*?box-shadow: none !important;/);
  assert.match(identityCss, /\.teamIdentityTitleStage--hero \{[\s\S]*?--identity-crest: clamp\(104px, 29vw, 120px\);[\s\S]*?--identity-title: clamp\(45px, 12\.2vw, 58px\);/);
  assert.match(identityCss, /\.teamIdentityTitleStage--dark \{[\s\S]*?linear-gradient\(126deg, #061923 0%, #082430 58%, #0a2933 100%\) !important;/);
  assert.match(identityCss, /\.teamIdentityTitleStage__crest \{[\s\S]*?object-fit: contain;/);
  assert.doesNotMatch(identityCss, /backdrop-filter:blur\(26px\)/);
  assert.doesNotMatch(identityCss, /linear-gradient\(150deg,rgba\(28,30,32/);
  assert.match(identityCss, systemFont);
  assert.doesNotMatch(identityCss, legacyCondensedFont);
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
  for (const source of [header, identityStage, identityCss, daily, dailyCss, workspaceCss]) {
    assert.doesNotMatch(source, /supabase|auth\.|fetch\(|localStorage|sessionStorage|create table|alter table/i);
  }
});
