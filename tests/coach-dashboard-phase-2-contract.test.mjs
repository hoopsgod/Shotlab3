import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const appSource = fs.readFileSync("src/App.jsx", "utf8");
const componentSource = fs.readFileSync("src/components/CoachDashboardPhase2.jsx", "utf8");
const selectorSource = fs.readFileSync("src/lib/coachOperationalIntelligence.js", "utf8");

test("phase two imports the reusable operational layer into the coach shell", () => {
  assert.match(appSource, /CoachPlayerIntelligenceDrawer/);
  assert.match(appSource, /CoachEventIntelligenceDrawer/);
  assert.match(appSource, /CoachDrillsOperationalPanel/);
  assert.match(appSource, /CoachStrengthOperationalPanel/);
  assert.match(appSource, /CoachLeaderboardOperationalPanel/);
  assert.match(appSource, /CoachActivityIntelligencePanel/);
  assert.match(appSource, /CoachSeasonComparisonPanel/);
});

test("player and event drawers preserve full profile and attendance workflows", () => {
  assert.match(appSource, /selectedPlayerIntelligence/);
  assert.match(appSource, /onOpenFullProfile/);
  assert.match(appSource, /selectedEventIntelligence/);
  assert.match(appSource, /onManageAttendance/);
  assert.match(componentSource, /coach-player-intelligence-drawer/);
  assert.match(componentSource, /coach-event-intelligence-drawer/);
});

test("remaining coach pages receive actionable operational controls", () => {
  assert.match(appSource, /coachDrillIntelligenceRows/);
  assert.match(appSource, /visibleHomeDrills/);
  assert.match(appSource, /filteredCoachStrengthRows/);
  assert.match(appSource, /filteredCoachLeaderboardIntelligenceRows/);
  assert.match(appSource, /filteredCoachActivityIntelligenceRows/);
  assert.match(appSource, /coachSeasonComparisonModel/);
});

test("intelligence selectors remain pure and do not write data", () => {
  assert.doesNotMatch(selectorSource, /localStorage|sessionStorage|supabase|fetch\(|\.insert\(|\.update\(|\.delete\(/i);
  assert.match(selectorSource, /buildPlayerIntelligenceModel/);
  assert.match(selectorSource, /buildEventIntelligenceModel/);
  assert.match(selectorSource, /buildSeasonComparisonModel/);
});

test("phase two does not add schema or authentication behavior", () => {
  assert.doesNotMatch(componentSource, /supabase|auth\.|createUser|signUp|ALTER TABLE|CREATE TABLE/i);
  assert.doesNotMatch(selectorSource, /ALTER TABLE|CREATE TABLE|policy|rls/i);
});

test("Player and Coach drill filters remain isolated in their own function scopes", () => {
  const playerBlock = appSource.match(/function Player\([\s\S]*?function Coach\(/)?.[0] || "";
  const coachBlock = appSource.match(/function Coach\([\s\S]*/)?.[0] || "";
  assert.match(playerBlock, /const visibleHomeDrills=useMemo\(\(\)=>filterAtHomeDrills/);
  assert.match(playerBlock, /\{visibleHomeDrills\.map\(d=>/);
  assert.doesNotMatch(playerBlock, /visibleProgramDrills|filteredCoachStrengthRows|filteredCoachLeaderboardIntelligenceRows/);
  assert.match(coachBlock, /const visibleHomeDrills=useMemo/);
  assert.match(coachBlock, /\{visibleHomeDrills\.map\(d=>/);
});

test("activity intelligence is a reachable coach workspace", () => {
  assert.match(appSource, /k:"activity",l:"Activity"/);
  assert.match(appSource, /testId="coach-page-dashboard-activity"/);
  assert.match(appSource, /tab==="activity"/);
  assert.match(appSource, /setTab\("activity"\)/);
});
