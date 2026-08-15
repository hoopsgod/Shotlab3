import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const source=fs.readFileSync("src/components/CoachMissionControl2026.jsx","utf8");
const css=fs.readFileSync("src/components/CoachMissionControl2026.css","utf8");
const appSource=fs.readFileSync("src/App.jsx","utf8");
const headerCss=fs.readFileSync("src/components/DashboardIdentityHeader.module.css","utf8");
const polishCss=fs.readFileSync("src/components/CoachMissionControlPolish.css","utf8");
const finalCss=fs.readFileSync("public/shotlab-v3-mobile-corrections.css","utf8");
const shellCss=fs.readFileSync("src/styles/AppStoreMobileShell.css","utf8");
const premiumCss=fs.readFileSync("src/styles/PremiumWorkspace.css","utf8");
const navigationCss=fs.readFileSync("src/components/MobileNavigation.module.css","utf8");
const activationCss=fs.readFileSync("src/components/CoachActivationLayer.css","utf8");

test("Mission Control surface contains the coach decision system",()=>{
  assert.match(source,/data-testid="coach-mission-control"/);
  assert.match(source,/data-testid="coach-primary-objective"/);
  assert.match(source,/data-testid="coach-assignment-accountability"/);
  assert.match(source,/data-testid="coach-live-activity"/);
  assert.match(source,/data-testid="coach-mission-reality-strip"/);
});

test("Mission Control keeps one dominant first decision and supporting evidence",()=>{
  assert.match(source,/mcHero/);
  assert.match(source,/mcPrimary/);
  assert.match(source,/mcRealityStrip/);
  assert.match(source,/mcAttention/);
});

test("Mission Control exposes practical Coach routes",()=>{
  assert.match(source,/label: "Players"/);
  assert.match(source,/label: "Schedule"/);
  assert.match(source,/label: "Drills"/);
  assert.match(source,/label: "Analytics"/);
});

test("Mission Control keeps Players and Analytics as distinct destinations",()=>{
  assert.match(source,/onAnalyticsClick/);
  assert.match(source,/label: "Players", icon: "users", onClick: onPlayersClick/);
  assert.match(source,/label: "Analytics", icon: "chart", onClick: onAnalyticsClick/);
  assert.match(appSource,/onAnalyticsClick=\{openCoachLeaderboards\}/);
  assert.match(appSource,/const openCoachLeaderboards=\(\)=>handleNavChange\("leaderboards"\)/);
  assert.doesNotMatch(source,/label: "Analytics", icon: "chart", onClick: onActiveTodayClick/);
});

test("responsive CSS creates a compact native-feeling mobile operating system",()=>{
  assert.match(css,/grid-template-columns:112px minmax\(0,1fr\)/);
  assert.match(css,/@media\(max-width:980px\)/);
  assert.match(css,/@media\(max-width:700px\)/);
  assert.match(css,/mission-control-active/);
  assert.match(css,/env\(safe-area-inset-bottom\)/);
  assert.match(headerCss,/min-height:62px/);
  assert.match(polishCss,/\.mcSectionHead\{/);
  assert.match(finalCss,/min-height:\s*286px\s*!important/);
  assert.match(shellCss,/padding-bottom:\s*calc\(78px \+ env\(safe-area-inset-bottom\)\)\s*!important/);
  assert.match(premiumCss,/mobile-navigation-dock/);
  assert.match(navigationCss,/--mobile-tab-bar-height:\s*56px/);
  assert.match(navigationCss,/bottom:\s*0/);
  assert.match(navigationCss,/backdrop-filter:\s*blur\(18px\) saturate\(118%\)/);
  assert.match(navigationCss,/width:\s*100%/);
  assert.match(navigationCss,/min-height:\s*48px/);
  assert.doesNotMatch(navigationCss,/translateX\(-50%\)/);
  assert.match(finalCss,/\.mcPrimary:active/);
  assert.match(finalCss,/@media \(prefers-reduced-motion: reduce\)/);
  assert.match(activationCss,/@media\(prefers-reduced-motion:reduce\)/);
});

test("Mission Control uses the modern native visual system instead of tiny condensed dashboard UI",()=>{
  assert.match(finalCss,/--mc-native:/);
  assert.match(finalCss,/--mc-title-size:/);
  assert.match(finalCss,/--mc-radius-hero:/);
  assert.match(finalCss,/font-family:\s*var\(--mc-native\)/);
});
