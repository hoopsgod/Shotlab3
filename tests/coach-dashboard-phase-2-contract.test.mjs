import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const appSource = fs.readFileSync("src/App.jsx", "utf8");
const componentSource = fs.readFileSync("src/components/CoachDashboardPhase2.jsx", "utf8");
const selectorSource = fs.readFileSync("src/lib/coachOperationalIntelligence.js", "utf8");
const emptyStateCss = fs.readFileSync("src/components/Phase2PremiumEmptyStateLanguage.css", "utf8");
const leaderboardCss = fs.readFileSync("src/components/Phase3CoachLeaderboardHierarchy.css", "utf8");
const activationCss = fs.readFileSync("src/components/CoachActivationPath.css", "utf8");
const titleCss = fs.readFileSync("src/components/CoachMissionControlTitleStage.css", "utf8");
const mobileAxisCss = fs.readFileSync("src/styles/MobileViewportAxisAuthority2026.css", "utf8");

test("phase two imports the reusable operational layer into the coach shell", () => {
  assert.match(appSource, /CoachPlayerIntelligenceDrawer/);
  assert.match(appSource, /CoachEventIntelligenceDrawer/);
  assert.match(appSource, /CoachDrillsOperationalPanel/);
  assert.match(appSource, /CoachStrengthOperationalPanel/);
  assert.match(appSource, /CoachActivityIntelligencePanel/);
  assert.match(appSource, /CoachSeasonComparisonPanel/);
});

test('leaderboards route uses the shared competition surface instead of the legacy wrapper', () => {
  assert.match(appSource, /<PremiumLeaderboardsHub viewerRole="coach"/);
  assert.equal((appSource.match(/CoachLeaderboardOperationalPanel/g) || []).length, 0);
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
  assert.match(appSource, /(?:k:"activity",l:"Activity"|\["activity","Activity","activity"\])/);
  assert.match(appSource, /testId="coach-page-dashboard-activity"/);
  assert.match(appSource, /tab==="activity"/);
  assert.match(appSource, /setTab\("activity"\)/);
});

test("Coach CSS responsibilities are consolidated without reopening the desktop shell", () => {
  assert.match(emptyStateCss, /--phase2-empty-icon:/);
  assert.match(emptyStateCss, /-webkit-mask:\s*var\(--phase2-empty-icon\)/);
  assert.match(emptyStateCss, /mask:\s*var\(--phase2-empty-icon\)/);
  assert.doesNotMatch(emptyStateCss, /coach-page-dashboard-leaderboards-evidence/);
  assert.match(leaderboardCss, /coach-page-dashboard-leaderboards-evidence/);

  const activationMobile = activationCss.match(/@media\(max-width:700px\)\{([\s\S]*?)\n\}/)?.[1] || "";
  assert.doesNotMatch(activationMobile, /\.mcActivationPlan\s*\{[\s\S]*grid-template-columns/);
  assert.doesNotMatch(activationMobile, /\.mcActivationPlan>button\s*\{[\s\S]*width:100%/);
  assert.match(mobileAxisCss, /\.mcActivationPlan\s*\{[\s\S]*grid-template-columns:\s*auto minmax\(0, 1fr\)/);
  assert.match(mobileAxisCss, /\.mcActivationPlan > button\s*\{[\s\S]*width:\s*100% !important/);
});

test("390px Coach hero uses the existing hierarchy inside its certified vertical budget", () => {
  const mobile = titleCss.match(/@media\(max-width:700px\)\{([\s\S]*?)\n\}/)?.[1] || "";
  assert.match(mobile, /\.mcHeroContent\{[^}]*padding:14px 18px 18px/);
  assert.match(mobile, /\.mcRealityStrip\{[^}]*margin:9px 0 0/);
  assert.match(mobile, /\.mcPrimary\{[^}]*min-height:50px[^}]*margin-top:6px/);
  assert.match(mobile, /--coach-hero-crest:clamp\(104px,29vw,120px\)/);
  assert.match(mobile, /font-size:clamp\(36px,9\.4vw,40px\)/);
});
