import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const coach = fs.readFileSync("src/components/CoachDashboardHeader.jsx", "utf8");
const player = fs.readFileSync("src/components/PlayerDashboardHeader.jsx", "utf8");
const identity = fs.readFileSync("src/components/TeamIdentityTitleStage.jsx", "utf8");
const identityCss = fs.readFileSync("src/components/TeamIdentityTitleStage.css", "utf8");
const secondaryPageCss = fs.readFileSync("src/components/SecondaryPageSystem.css", "utf8");
const miniHeader = fs.readFileSync("src/components/CoachMiniHeader.jsx", "utf8");

const forbiddenRuntimeBehavior = /supabase|auth\.|fetch\(|localStorage|sessionStorage|create table|alter table/i;

test("coach and player identity headers share one team-owned premium surface language", () => {
  assert.match(coach, /TeamIdentityTitleStage/);
  assert.match(player, /TeamIdentityTitleStage/);
  assert.match(coach, /variant="hero"/);
  assert.match(player, /variant="hero"/);
  assert.match(coach, /surface="dark"/);
  assert.match(player, /surface="dark"/);
  assert.match(identityCss, /--identity-crest:\s*clamp\(104px,\s*29vw,\s*120px\)/);
  assert.match(identityCss, /font: 830 var\(--identity-title\)/);
  assert.doesNotMatch(identityCss, /backdrop-filter/);
});

test("both roles preserve team identity and prominent custom logos", () => {
  assert.match(identity, /useTeamBranding/);
  assert.match(identity, /hasCustomLogo/);
  assert.match(identity, /useCleanTeamLogo/);
  assert.match(coach, /testId="coach-dashboard-identity-header"/);
  assert.match(player, /testId="player-dashboard-identity-header"/);
  assert.match(identity, /alt=\{logoAlt \|\| `\$\{teamName\} team crest`\}/);
  assert.match(identityCss, /object-fit:\s*contain/);
  assert.match(identityCss, /teamIdentityTitleStage__tonalCrest/);
  assert.match(identity, /teamIdentityTitleStage__fallbackCrest/);
});

test("coach branding access remains visible and keyboard accessible", () => {
  assert.match(coach, /Team Branding/);
  assert.match(coach, /onClick: onOpenTeamBranding/);
  assert.match(coach, /ShotLabIcon name="settings" size=\{16\}/);
  assert.match(identity, /secondaryPageAction/);
  assert.match(secondaryPageCss, /\.secondaryPageAction:focus-visible/);
  assert.match(secondaryPageCss, /outline: 3px solid/);
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
});

test("identity shell changes remain presentation-only", () => {
  for (const source of [coach, player, identity, identityCss, secondaryPageCss, miniHeader]) {
    assert.doesNotMatch(source, forbiddenRuntimeBehavior);
  }
});
