import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const coach = fs.readFileSync("src/components/CoachCommandCenter.jsx", "utf8");
const coachCss = fs.readFileSync("src/components/CoachMissionControlTitleStage.css", "utf8");
const playerCss = fs.readFileSync("src/components/PlayerDailyCommandCenter.module.css", "utf8");
const compact = (value) => value.replace(/\s+/g, "");

test("Coach mobile home restores the tactical-court first impression with shared brand tokens", () => {
  assert.match(coach, /data-team-identity-stage="coach-mission-control"/);
  assert.doesNotMatch(coachCss, /\.mcCourtArtwork,[\s\S]*?\.mcHeroScrim\s*\{\s*display:\s*none;/);
  assert.doesNotMatch(coachCss, /\.mcHeroIdentity::after\s*\{[\s\S]*?content:\s*"Mission Control"/);
  assert.match(coachCss, /--coach-hero-crest:\s*clamp\(96px,\s*26vw,\s*108px\)/);
  assert.match(coachCss, /--team-brand-surface-deep/);
  assert.match(coachCss, /--team-brand-surface-elevated/);
  assert.doesNotMatch(coachCss, /Bebas Neue|Barlow Condensed|Arial Narrow/);
});

test("Coach primary decision uses the same brand-driven dark material and primary action rhythm as Player Home", () => {
  const player = compact(playerCss);
  const coachHome = compact(coachCss);
  assert.ok(player.includes("--team-brand-surface-elevated"));
  assert.ok(coachHome.includes("--team-brand-surface-elevated"));
  assert.match(coachCss, /h1\s*\{[\s\S]*?clamp\(39px,\s*10\.5vw,\s*45px\)/);
  assert.match(coachCss, /\.mcPrimary\s*\{[\s\S]*?min-height:\s*50px/);
  assert.match(coachCss, /\.mcRealityStrip\s*\{[\s\S]*?grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/);
});

test("Coach parity repair remains presentation-only and preserves operational controls", () => {
  assert.match(coach, /data-testid="coach-primary-objective"/);
  assert.match(coach, /data-testid="coach-primary-metrics"/);
  assert.match(coach, /className="mcPrimary" onClick=\{primaryCommand\.onClick\}/);
  assert.match(coach, /onClick=\{onActiveTodayClick\}/);
  assert.match(coach, /onClick=\{onPlayersClick\}/);
  assert.match(coach, /onClick=\{onNextEventClick\}/);
  assert.doesNotMatch(coachCss, /!important/);
});
