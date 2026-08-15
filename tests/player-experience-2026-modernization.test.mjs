import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const header = fs.readFileSync("src/components/PlayerDashboardHeader.jsx", "utf8");
const headerCss = fs.readFileSync("src/components/DashboardIdentityHeader.module.css", "utf8");
const dailyCss = fs.readFileSync("src/components/PlayerDailyCommandCenter.module.css", "utf8");
const workspaceCss = fs.readFileSync("src/components/PlayerOperationalWorkspace.module.css", "utf8");

const systemFont = /-apple-system,\s*BlinkMacSystemFont,\s*'SF Pro (?:Display|Text)'/;
const legacyCondensedFont = /'Bebas Neue'|'Barlow Condensed'/;

test("player identity uses an unboxed editorial shell with authoritative team branding", () => {
  assert.match(header, /DashboardIdentityHeader\.module\.css/);
  assert.match(header, /branding\?\.teamName \|\| branding\?\.name/);
  assert.match(header, /data-testid="player-dashboard-identity-header"/);
  assert.match(header, /<img className=\{styles\.brandMark\}/);
  assert.match(headerCss, /\.header\.player\{[\s\S]*?border:0;[\s\S]*?border-radius:0;[\s\S]*?background:transparent;[\s\S]*?box-shadow:none;/);
  assert.match(headerCss, /\.player \.brandPanel\{[\s\S]*?background:transparent/);
  assert.match(headerCss, /\.player \.brandMark\{width:118px;height:112px/);
  assert.doesNotMatch(headerCss, /backdrop-filter:blur\(26px\)/);
  assert.doesNotMatch(headerCss, /linear-gradient\(150deg,rgba\(28,30,32/);
  assert.match(headerCss, systemFont);
  assert.doesNotMatch(headerCss, legacyCondensedFont);
});

test("Daily Command Center matches the modern player hierarchy without changing its actions", () => {
  assert.match(dailyCss, /\.root\s*\{[\s\S]*?border-radius:\s*0;[\s\S]*?background:\s*transparent/);
  assert.match(dailyCss, /\.hero\s*\{[\s\S]*?border-radius:\s*var\(--radius-xl,24px\)/);
  assert.match(dailyCss, /\.progressCard\s*\{[\s\S]*?border:\s*0;[\s\S]*?background:\s*transparent/);
  assert.match(dailyCss, /min-height:\s*48px/);
  assert.match(dailyCss, /\.coachSignal/);
  assert.match(dailyCss, /\.progressGrid/);
  assert.match(dailyCss, /scroll-snap-type:\s*x proximity/);
  assert.match(dailyCss, /@media \(prefers-reduced-motion: reduce\)/);
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
  for (const source of [header, headerCss, dailyCss, workspaceCss]) {
    assert.doesNotMatch(source, /supabase|auth\.|fetch\(|localStorage|sessionStorage|create table|alter table/i);
  }
});
