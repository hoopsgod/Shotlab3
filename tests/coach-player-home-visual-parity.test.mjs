import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { mediaBlock } from "./helpers/css-contract.mjs";

const coach = fs.readFileSync("src/components/CoachCommandCenter.jsx", "utf8");
const coachCss = fs.readFileSync("src/components/CoachMissionControlTitleStage.css", "utf8");
const playerCss = fs.readFileSync("src/components/PlayerDailyCommandCenter.module.css", "utf8");
const compact = (value) => value.replace(/\s+/g, "");
const coachMobile = mediaBlock(coachCss, "(max-width:700px)");

test("Coach mobile home restores the tactical-court first impression with branded program identity", () => {
  assert.match(coach, /data-team-identity-stage="coach-mission-control"/);
  assert.doesNotMatch(coachCss, /\.mcCourtArtwork,[\s\S]*?\.mcHeroScrim\s*\{\s*display:\s*none;/);
  assert.doesNotMatch(coachCss, /\.mcHeroIdentity::after\s*\{[\s\S]*?content:\s*"Mission Control"/);
  assert.match(coachMobile, /--coach-hero-crest:\s*clamp\(104px,\s*29vw,\s*120px\)/);
  assert.match(coachCss, /--team-brand-surface-deep/);
  assert.match(coachCss, /--team-brand-surface-elevated/);
  assert.match(coachMobile, /\.mcProgramIdentity\s*\{[^}]*font:\s*780 11px\/1\.2 -apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",sans-serif/);
});

test("Coach mobile hierarchy makes the daily decision dominant and program identity a compact brand label", () => {
  const player = compact(playerCss);
  const coachHome = compact(coachCss);
  assert.ok(player.includes("--team-brand-surface-elevated"));
  assert.ok(coachHome.includes("--team-brand-surface-elevated"));
  assert.match(coachMobile, /\.mcProgramIdentity\s*\{[^}]*font:\s*780 11px\/1\.2 -apple-system/);
  assert.match(coachMobile, /h1\s*\{[^}]*font-family:"Barlow Condensed","Arial Narrow","Helvetica Neue",sans-serif[^}]*font-size:clamp\(36px,9\.4vw,40px\)[^}]*font-weight:800[^}]*line-height:\.94/);
  assert.match(coachMobile, /\.mcPrimary\s*\{[^}]*min-height:\s*46px[^}]*margin-top:\s*11px/);
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
