import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const coach = fs.readFileSync("src/components/CoachCommandCenter.jsx", "utf8");
const coachCss = fs.readFileSync("src/components/CoachMissionControlTitleStage.css", "utf8");
const playerCss = fs.readFileSync("src/components/PlayerDailyCommandCenter.module.css", "utf8");
const compact = (value) => value.replace(/\s+/g, "");

test("Coach mobile home retires the tactical-court first impression for the clean shared identity grammar", () => {
  assert.match(coach, /data-team-identity-stage="coach-mission-control"/);
  assert.match(coachCss, /\.mcCourtArtwork,[\s\S]*?\.mcHeroScrim\s*\{\s*display:\s*none;/);
  assert.match(coachCss, /\.mcHeroIdentity::after\s*\{[\s\S]*?content:\s*"Mission Control"/);
  assert.match(coachCss, /--coach-hero-crest:\s*clamp\(104px,\s*27vw,\s*112px\)/);
  assert.match(coachCss, /linear-gradient\(132deg,\s*#061923 0%,\s*#082630 58%,\s*#0a2e38 100%\)/);
  assert.doesNotMatch(coachCss, /Bebas Neue|Barlow Condensed|Arial Narrow/);
});

test("Coach primary decision uses the same premium dark material and lime action rhythm as Player Home", () => {
  const player = compact(playerCss);
  const coachHome = compact(coachCss);
  assert.ok(player.includes("linear-gradient(145deg,#0b2633,#07182072%)"));
  assert.ok(coachHome.includes("linear-gradient(145deg,#0b2633,#07182072%)"));
  assert.match(coachCss, /h1\s*\{[\s\S]*?font-size:\s*clamp\(32px,\s*7\.9vw,\s*34px\)/);
  assert.match(coachCss, /\.mcPrimary\s*\{[\s\S]*?min-height:\s*54px/);
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
