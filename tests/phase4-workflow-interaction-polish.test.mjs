import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const titleStage = read("src/components/TeamIdentityTitleStage.jsx");
const titleCss = read("src/components/TeamIdentityTitleStage.css");
const coachStage = read("src/components/CoachRoutePerformanceStage.jsx");
const coachCss = read("src/components/CoachRoutePerformanceStage.module.css");
const secondary = read("src/components/SecondaryPageSystem.jsx");
const secondaryCss = read("src/components/SecondaryPageSystem.css");
const coachDashboards = read("src/components/CoachInteractiveDashboards.jsx");
const playerDaily = read("src/components/PlayerDailyCommandCenter.jsx");

test("shared title actions provide one-flight feedback without changing callbacks", () => {
  assert.match(titleStage, /useRef, useState/);
  assert.match(titleStage, /action\.onClick\(\)/);
  assert.match(titleStage, /disabled=\{action\.disabled \|\| working\}/);
  assert.match(titleStage, /aria-busy=\{working \|\| undefined\}/);
  assert.match(titleStage, /data-working=\{working \? "true" : undefined\}/);
  assert.match(titleStage, /action\.pendingLabel \|\| "Opening…"/);
  assert.match(titleCss, /:disabled/);
});

test("Coach decision stages acknowledge primary-action activation and protect normal-name wrapping", () => {
  assert.match(coachStage, /const actionWorking = Boolean/);
  assert.match(coachStage, /onClick=\{runAction\}/);
  assert.match(coachStage, /disabled=\{action\.disabled \|\| actionWorking\}/);
  assert.match(coachStage, /aria-busy=\{actionWorking \|\| undefined\}/);
  assert.match(coachCss, /overflow-wrap: break-word/);
  assert.match(coachCss, /word-break: normal/);
  assert.match(coachCss, /data-working="true"/);
});

test("secondary decision surfaces share the same acknowledgement contract", () => {
  assert.match(secondary, /const actionWorking = Boolean/);
  assert.match(secondary, /onClick=\{runAction\}/);
  assert.match(secondary, /disabled=\{action\.disabled \|\| actionWorking\}/);
  assert.match(secondary, /aria-busy=\{actionWorking \|\| undefined\}/);
  assert.match(secondaryCss, /overflow-wrap:break-word;word-break:normal/);
  assert.match(secondaryCss, /button:disabled/);
});

test("Coach Players keeps the decision path ahead of supporting evidence", () => {
  const intro = coachDashboards.indexOf("<SecondaryPageIntro eyebrow=\"Roster\"");
  const decision = coachDashboards.indexOf("<CoachRoutePerformanceStage kind=\"players\"", intro);
  const evidence = coachDashboards.indexOf("<SecondaryPageEvidence", decision);
  assert.ok(intro >= 0 && decision > intro && evidence > decision);
  assert.match(coachDashboards, /Open a player to review recent training and progress/);
});

test("Player Home retains a single actionable daily command center with visible working feedback", () => {
  assert.match(playerDaily, /data-testid="player-daily-primary-action"/);
  assert.match(playerDaily, /data-state=\{primaryWorking \? "working" : "idle"\}/);
  assert.match(playerDaily, /aria-busy=\{primaryWorking \|\| undefined\}/);
  assert.match(playerDaily, /disabled=\{primaryWorking\}/);
  assert.match(playerDaily, /Opening…/);
});
