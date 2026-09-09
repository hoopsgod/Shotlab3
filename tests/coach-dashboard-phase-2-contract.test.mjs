import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { requestLegacySignedCollection } from "../src/lib/legacySignedCollectionPersistence.js";

const appSource = fs.readFileSync("src/App.jsx", "utf8");
const componentSource = fs.readFileSync("src/components/CoachDashboardPhase2.jsx", "utf8");
const selectorSource = fs.readFileSync("src/lib/coachOperationalIntelligence.js", "utf8");
const signedCollectionSource = fs.readFileSync("src/lib/legacySignedCollectionPersistence.js", "utf8");

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

test("registered Coach player intelligence reads shot logs through the signed API boundary", () => {
  assert.match(appSource, /requestLegacySignedCollection\(\{table,fetchImpl:/);
  assert.match(signedCollectionSource, /table==="shot_logs"\)return\["\/v1\/shot-logs","shot_logs"\]/);
});

test("registered Coach shot-log adapter resolves the signed endpoint and requester identity", async () => {
  const coachEmail = "workflow.coach@shotlab.app";
  const values = new Map([["sl:session", JSON.stringify({ email: coachEmail })]]);
  const storage = {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
  };
  const calls = [];
  const result = await requestLegacySignedCollection({
    table: "shot_logs",
    storage,
    fetchImpl: async (path, options = {}) => {
      calls.push({ path: String(path), headers: new Headers(options.headers || {}) });
      return Response.json({
        ok: true,
        storage_mode: "signed_api",
        shot_logs: [{
          id: "workflow-shot-ari",
          email: "ari.workflow@example.com",
          player_id: "workflow-ari",
          team_id: "team-coach-player-workflow",
          made: 33,
          date: "2026-09-09",
        }],
      });
    },
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].path, "/v1/shot-logs");
  assert.equal(calls[0].headers.get("x-user-id"), coachEmail);
  assert.equal(result.error, null);
  assert.equal(result.data[0].made, 33);
  assert.equal(result.data[0].email, "ari.workflow@example.com");
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
