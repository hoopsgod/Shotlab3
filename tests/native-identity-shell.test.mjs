import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const coach = fs.readFileSync("src/components/CoachDashboardHeader.jsx", "utf8");
const coachCss = fs.readFileSync("src/components/CoachDashboardHeader.module.css", "utf8");
const player = fs.readFileSync("src/components/PlayerDashboardHeader.jsx", "utf8");
const playerCss = fs.readFileSync("src/components/PlayerDashboardHeader.module.css", "utf8");
const miniHeader = fs.readFileSync("src/components/CoachMiniHeader.jsx", "utf8");

const forbiddenRuntimeBehavior = /supabase|auth\.|fetch\(|localStorage|sessionStorage|create table|alter table/i;
const legacyCondensedFont = /'Bebas Neue'|'Barlow Condensed'/;

test("coach and player identity headers share one light native surface language", () => {
  for (const source of [coachCss, playerCss]) {
    assert.match(source, /border-radius:\s*22px/);
    assert.match(source, /background:\s*var\(--surface-1, #ffffff\)/);
    assert.match(source, /box-shadow:\s*var\(--shadow-1/);
    assert.match(source, /min-height:\s*142px/);
    assert.match(source, /font-family:\s*-apple-system, BlinkMacSystemFont, 'SF Pro Display'/);
    assert.doesNotMatch(source, /backdrop-filter/);
    assert.doesNotMatch(source, legacyCondensedFont);
  }
});

test("both roles preserve team identity and prominent custom logos", () => {
  assert.match(coach, /branding\?\.teamName \|\| branding\?\.name/);
  assert.match(player, /branding\?\.teamName \|\| branding\?\.name/);
  assert.match(coach, /data-testid="coach-dashboard-identity-header"/);
  assert.match(player, /data-testid="player-dashboard-identity-header"/);
  assert.match(coach, /alt=\{`\$\{teamName\} logo`\}/);
  assert.match(player, /<img className=\{styles\.brandMark\}/);
  assert.match(coachCss, /\.brandMark[\s\S]*?width:\s*96px/);
  assert.match(playerCss, /\.brandMark[\s\S]*?width:\s*96px/);
});

test("coach branding access remains visible and keyboard accessible", () => {
  assert.match(coach, /Team Branding Settings/);
  assert.match(coach, /onClick=\{onOpenTeamBranding\}/);
  assert.match(coach, /<SettingsIcon \/>/);
  assert.match(coachCss, /\.brandBtn:focus-visible/);
  assert.match(coachCss, /outline:\s*3px solid/);
});

test("scroll-state coach chrome uses restrained navigation glass rather than legacy dark styling", () => {
  assert.match(miniHeader, /data-testid="coach-mini-header"/);
  assert.match(miniHeader, /background: "rgba\(250,249,245,\.88\)"/);
  assert.match(miniHeader, /blur\(24px\) saturate\(145%\)/);
  assert.match(miniHeader, /pointerEvents: "none"/);
  assert.match(miniHeader, /pointerEvents: "auto"/);
  assert.match(miniHeader, /aria-label="Log out"/);
  assert.doesNotMatch(miniHeader, /rgba\(10, 10, 10/);
  assert.doesNotMatch(miniHeader, legacyCondensedFont);
});

test("identity shell changes remain presentation-only", () => {
  for (const source of [coach, coachCss, player, playerCss, miniHeader]) {
    assert.doesNotMatch(source, forbiddenRuntimeBehavior);
  }
});
