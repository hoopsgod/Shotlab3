import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const coach = fs.readFileSync("src/components/CoachDashboardHeader.jsx", "utf8");
const player = fs.readFileSync("src/components/PlayerDashboardHeader.jsx", "utf8");
const stage = fs.readFileSync("src/components/TeamIdentityTitleStage.jsx", "utf8");
const stageCss = fs.readFileSync("src/components/TeamIdentityTitleStage.css", "utf8");
const miniHeader = fs.readFileSync("src/components/CoachMiniHeader.jsx", "utf8");

const forbiddenRuntimeBehavior = /supabase|auth\.|fetch\(|localStorage|sessionStorage|create table|alter table/i;
const legacyCondensedFont = /'Bebas Neue'|'Barlow Condensed'/;

test("coach and player identity headers delegate to one semantic title authority", () => {
  assert.match(coach, /import TeamIdentityTitleStage from "\.\/TeamIdentityTitleStage\.jsx"/);
  assert.match(player, /import TeamIdentityTitleStage from "\.\/TeamIdentityTitleStage\.jsx"/);
  assert.match(coach, /<TeamIdentityTitleStage/);
  assert.match(player, /<TeamIdentityTitleStage/);
  assert.match(coach, /role="Coach Mode"/);
  assert.match(player, /role="Player Mode"/);
  assert.match(coach, /testId="coach-dashboard-identity-header"/);
  assert.match(player, /testId="player-dashboard-identity-header"/);
  assert.doesNotMatch(coach, /DashboardIdentityHeader\.module\.css/);
  assert.doesNotMatch(player, /DashboardIdentityHeader\.module\.css/);
});

test("shared title authority owns team identity, prominent uncropped logos, and intentional fallback", () => {
  assert.match(stage, /useTeamBranding/);
  assert.match(stage, /data-team-identity-stage="true"/);
  assert.match(stage, /data-identity-role="team-name"/);
  assert.match(stage, /data-identity-role="page-title"/);
  assert.match(stage, /data-identity-role="brand-mark"/);
  assert.match(stage, /data-identity-role="brand-fallback"/);
  assert.match(stageCss, /\.teamIdentityTitleStage__crest\s*\{[\s\S]*?object-fit:\s*contain/);
  assert.match(stageCss, /--identity-crest:\s*clamp\(96px,\s*25vw,\s*108px\)/);
  assert.match(stageCss, /\.teamIdentityTitleStage--hero\s*\{[\s\S]*?--identity-crest:\s*clamp\(104px,\s*29vw,\s*120px\)/);
  assert.doesNotMatch(stageCss, /\.teamIdentityTitleStage__crest\s*\{[^}]*border-radius:\s*50%/s);
  assert.doesNotMatch(stageCss, legacyCondensedFont);
});

test("coach branding access remains visible and keyboard accessible", () => {
  assert.match(coach, /label: "Team Branding"/);
  assert.match(coach, /onClick: onOpenTeamBranding/);
  assert.match(coach, /ariaLabel: "Team Branding Settings"/);
  assert.match(stage, /aria-label=\{action\.ariaLabel \|\| action\.label\}/);
  assert.match(stageCss, /\.teamIdentityTitleStage__action:focus-visible/);
  assert.match(stageCss, /outline:\s*3px solid/);
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
  for (const source of [coach, player, stage, stageCss, miniHeader]) {
    assert.doesNotMatch(source, forbiddenRuntimeBehavior);
  }
});
