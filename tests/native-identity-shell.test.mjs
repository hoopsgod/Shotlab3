import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const coach = fs.readFileSync("src/components/CoachDashboardHeader.jsx", "utf8");
const player = fs.readFileSync("src/components/PlayerDashboardHeader.jsx", "utf8");
const stage = fs.readFileSync("src/components/TeamIdentityTitleStage.jsx", "utf8");
const brandingContext = fs.readFileSync("src/context/TeamBrandingContext.jsx", "utf8");
const miniHeader = fs.readFileSync("src/components/CoachMiniHeader.jsx", "utf8");

const forbiddenRuntimeBehavior = /supabase|auth\.|fetch\(|create table|alter table/i;
const legacyCondensedFont = /'Bebas Neue'|'Barlow Condensed'/;

test("coach and player identity headers share one team-owned title architecture", () => {
  assert.match(coach, /import TeamIdentityTitleStage/);
  assert.match(player, /import TeamIdentityTitleStage/);
  assert.match(coach, /variant="hero"/);
  assert.match(player, /variant="hero"/);
  assert.match(coach, /surface="dark"/);
  assert.match(player, /surface="dark"/);
  assert.match(stage, /font:[^\n]*SF Pro Display/);
  assert.match(stage, /linear-gradient\(126deg,#061923/);
  assert.doesNotMatch(stage, legacyCondensedFont);
});

test("both roles preserve actual team identity and materially prominent custom crests", () => {
  assert.match(coach, /data-testid="coach-dashboard-identity-header"/);
  assert.match(player, /data-testid="player-dashboard-identity-header"/);
  assert.match(stage, /branding\?\.teamName \|\| branding\?\.name/);
  assert.match(stage, /alt=\{`\$\{teamName\} team crest`\}/);
  assert.match(stage, /--team-stage-crest:96px/);
  assert.match(stage, /teamIdentityStage--hero\{--team-stage-crest:112px/);
  assert.match(stage, /object-fit:contain/);
  assert.match(stage, /teamIdentityStage__fallback/);
  assert.match(stage, /teamIdentityStage__tonal/);
  assert.match(brandingContext, /inferPersistedTeamName/);
});

test("coach branding access remains visible and keyboard accessible", () => {
  assert.match(coach, /label: "Team Branding"/);
  assert.match(coach, /onClick: onOpenTeamBranding/);
  assert.match(stage, /aria-label=\{action\.ariaLabel \|\| action\.label\}/);
  assert.match(stage, /teamIdentityStage__action:focus-visible/);
  assert.match(stage, /outline:3px solid/);
  assert.match(stage, /min-height:46px/);
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

test("identity shell changes remain presentation-scoped", () => {
  for (const source of [coach, player, stage, miniHeader]) {
    assert.doesNotMatch(source, forbiddenRuntimeBehavior);
  }
});
