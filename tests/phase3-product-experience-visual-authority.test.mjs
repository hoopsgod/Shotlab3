import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const coachCss = readFileSync("src/components/CoachMissionControlTitleStage.css", "utf8");
const playerCss = readFileSync("src/components/PlayerDailyCommandCenter.module.css", "utf8");
const trainSource = readFileSync("src/components/PlayerTrainingSessionHeader.jsx", "utf8");

test("Coach Home keeps the decision and player-attention surfaces in the first desktop band", () => {
  assert.match(coachCss, /\.mcHero\[data-team-identity-stage="coach-mission-control"\]\{grid-column:1\/8;grid-row:2;min-height:300px\}/);
  assert.match(coachCss, /\.mcAttention\{[^}]*grid-column:8\/-1;grid-row:2;min-height:300px/);
  assert.match(coachCss, /\.mcTeamHealth\{[^}]*grid-column:1\/4;grid-row:3;min-height:210px/);
  assert.match(coachCss, /\.mcActivity,\.mcShellV3 \.mcNextSession\{[^}]*grid-row:3;min-height:210px/);
  assert.match(coachCss, /\.mcActivity\{grid-column:4\/9/);
  assert.match(coachCss, /\.mcNextSession\{grid-column:9\/-1/);
});

test("Coach Home desktop stage uses operational rather than marketing scale", () => {
  assert.match(coachCss, /\.mcHeroContent\{[^}]*min-height:300px;padding:28px 32px 24px 40px/);
  assert.match(coachCss, /\.mcHeroTitle\{[^}]*font:800 clamp\(32px,2\.8vw,42px\)/);
  assert.match(coachCss, /\.mcHeroTeamMark\{width:clamp\(104px,10vw,132px\);height:clamp\(104px,10vw,132px\)/);
});

test("Player Home desktop keeps today and coach context dense enough for one operational viewport", () => {
  assert.match(playerCss, /@media \(min-width:981px\)[\s\S]*?\.root \{ display:grid; grid-template-columns:minmax\(0,1\.35fr\) minmax\(300px,\.75fr\); gap:12px 16px/);
  assert.match(playerCss, /\.hero \{ grid-column:1; grid-row:1 \/ span 2; min-height:360px; padding:23px 26px; border-radius:13px; \}/);
  assert.match(playerCss, /\.coachSignal \{ grid-column:2; grid-row:1; margin:0 !important; padding:18px !important;/);
});

test("Train retains the certified current-work, session-path, and target hierarchy", () => {
  assert.match(trainSource, /data-testid="player-training-session-header"/);
  assert.match(trainSource, />CURRENT WORK</);
  assert.match(trainSource, />SESSION PATH</);
  assert.match(trainSource, />DRILL TARGET</);
  assert.match(trainSource, /testId="player-training-live-target"/);
});
