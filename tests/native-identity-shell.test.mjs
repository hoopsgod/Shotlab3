import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const coach = fs.readFileSync("src/components/CoachDashboardHeader.jsx", "utf8");
const player = fs.readFileSync("src/components/PlayerDashboardHeader.jsx", "utf8");
const identityCss = fs.readFileSync("src/components/DashboardIdentityHeader.module.css", "utf8");
const miniHeader = fs.readFileSync("src/components/CoachMiniHeader.jsx", "utf8");

const forbiddenRuntimeBehavior = /supabase|auth\.|fetch\(|localStorage|sessionStorage|create table|alter table/i;
const legacyCondensedFont = /'Bebas Neue'|'Barlow Condensed'/;

test("coach and player identity headers share one light native surface language", () => {
  assert.match(coach, /DashboardIdentityHeader\.module\.css/);
  assert.match(player, /DashboardIdentityHeader\.module\.css/);
  assert.match(identityCss, /border-radius:22px/);
  assert.match(identityCss, /background:var\(--surface-1,#fff\)/);
  assert.match(identityCss, /box-shadow:var\(--shadow-1/);
  assert.match(identityCss, /min-height:142px/);
  assert.match(identityCss, /font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display'/);
  assert.doesNotMatch(identityCss, /backdrop-filter/);
  assert.doesNotMatch(identityCss, legacyCondensedFont);
});

test("both roles preserve team identity and prominent custom logos", () => {
  assert.match(coach, /branding\?\.teamName \|\| branding\?\.name/);
  assert.match(player, /branding\?\.teamName \|\| branding\?\.name/);
  assert.match(coach, /data-testid="coach-dashboard-identity-header"/);
  assert.match(player, /data-testid="player-dashboard-identity-header"/);
  assert.match(coach, /alt=\{`\$\{teamName\} logo`\}/);
  assert.match(player, /<img className=\{styles\.brandMark\}/);
  assert.match(identityCss, /\.brandMark\{[^}]*width:96px/);
});

test("coach branding access remains visible and keyboard accessible", () => {
  assert.match(coach, /Team Branding Settings/);
  assert.match(coach, /onClick=\{onOpenTeamBranding\}/);
  assert.match(coach, /<ShotLabIcon name="settings" size=\{17\} \/>/);
  assert.match(identityCss, /\.brandBtn:focus-visible/);
  assert.match(identityCss, /outline:3px solid/);
});

test("scroll-state coach chrome uses restrained navigation glass rather than legacy dark styling", () => {
  assert.match(miniHeader, /data-testid="coach-mini-header"/);
  assert.match(miniHeader, /background: "rgba\(250,249,245,\.88\)"/);
  assert.match(miniHeader, /blur\(24px\) saturate\(145%\)/);
  assert.match(miniHeader, /pointerEvents: "none"/);
  assert.match(miniHeader, /pointerEvents: "auto"/);
  assert.match(miniHeader, /aria-label="Log out"/);
  assert.match(miniHeader, /<ShotLabIcon name="logout" size=\{17\} \/>/);
  assert.doesNotMatch(miniHeader, /rgba\(10, 10, 10/);
  assert.doesNotMatch(miniHeader, legacyCondensedFont);
});

test("identity shell changes remain presentation-only", () => {
  for (const source of [coach, player, identityCss, miniHeader]) {
    assert.doesNotMatch(source, forbiddenRuntimeBehavior);
  }
});
