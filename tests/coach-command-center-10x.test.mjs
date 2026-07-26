import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source=fs.readFileSync(new URL("../src/components/CoachCommandCenter.jsx",import.meta.url),"utf8");
const css=fs.readFileSync(new URL("../src/components/CoachMissionControlV2.css",import.meta.url),"utf8");
const headerCss=fs.readFileSync(new URL("../src/components/CoachMissionControlHeader.css",import.meta.url),"utf8");
const polishCss=fs.readFileSync(new URL("../src/components/CoachMissionControlPolish.css",import.meta.url),"utf8");
const premiumCss=fs.readFileSync(new URL("../src/components/CoachMissionControl2026.css",import.meta.url),"utf8");
const shellCss=fs.readFileSync(new URL("../src/components/CoachMissionControlShell.css",import.meta.url),"utf8");
const logoSource=fs.readFileSync(new URL("../src/components/useCleanTeamLogo.js",import.meta.url),"utf8");
const brandingForm=fs.readFileSync(new URL("../src/components/team/TeamBrandingForm.jsx",import.meta.url),"utf8");

test("coach dashboard answers the 30-second workflow questions",()=>{
  ["Mission Control","Priority action","Needs attention","Activity today","Recent activity","Next session"].forEach(label=>assert.match(source,new RegExp(label)));
  assert.match(source,/data-testid="coach-primary-objective"/);
  assert.match(source,/data-testid="coach-primary-metrics"/);
  assert.match(source,/primaryCommand/);
  assert.match(source,/attentionCount > 0/);
  assert.match(source,/hasScheduledSession/);
  assert.match(source,/CourtArtwork/);
});

test("Mission Control uses real roster and schedule signals instead of placeholder analytics",()=>{
  assert.match(source,/activeTodayCount/);
  assert.match(source,/totalPlayers/);
  assert.match(source,/nextEventDateFormatted/);
  assert.match(source,/activeRate/);
  assert.doesNotMatch(source,/92%/);
  assert.doesNotMatch(source,/85%/);
  assert.doesNotMatch(source,/Game Speed Shooting/);
});

test("cinematic hero preserves a visible coach-controlled logo and integrates it into the gym",()=>{
  assert.match(source,/useTeamBranding/);
  assert.match(source,/useCleanTeamLogo/);
  assert.match(source,/cleanFullLogoUrl/);
  assert.match(source,/cleanMarkLogoUrl/);
  assert.match(source,/branding\?\.logoMarkUrl && branding\.logoMarkUrl !== DEFAULT_MARK/);
  assert.match(source,/mcArenaGlow/);
  assert.match(source,/mcRafters/);
  assert.match(source,/mcCourtFloor/);
  assert.match(source,/openBrandingSettings/);
  assert.match(source,/mcHeroTeamMark/);
  assert.match(source,/aria-label=\{`Customize \$\{teamName\} team identity`\}/);
  assert.match(source,/data-testid="mission-control-team-header"/);
  assert.match(premiumCss,/mix-blend-mode:screen/);
  assert.match(premiumCss,/mask-image:radial-gradient/);
  assert.match(premiumCss,/@keyframes mcArenaBreath/);
  assert.match(shellCss,/\.mcHeroTeamMark\s*\{[\s\S]*display:\s*grid\s*!important/);
  assert.match(shellCss,/\.mcHeroTeamMark img\s*\{[\s\S]*mix-blend-mode:\s*screen\s*!important/);
  assert.doesNotMatch(shellCss,/\.mcHeroTeamMark\s*\{[\s\S]{0,220}display:\s*none\s*!important/);
});

test("custom team logos are cleaned, persisted, and previewed on light and dark surfaces",()=>{
  assert.match(logoSource,/export const cleanTeamLogoSource/);
  assert.match(logoSource,/removeLikelyRectangularFrame/);
  assert.match(logoSource,/trimTransparentEdges/);
  assert.match(brandingForm,/cleanTeamLogoSource/);
  assert.match(brandingForm,/Clean logo backgrounds/);
  assert.match(brandingForm,/transparency preview/);
  assert.match(brandingForm,/transparent PNG or SVG/);
});

test("one truthful Today panel replaces the generic onboarding stepper and repeated empty modules",()=>{
  assert.match(source,/onboardingMode/);
  assert.match(source,/data-testid="coach-onboarding-state"/);
  assert.match(source,/function TodayPlan/);
  assert.match(source,/No practice scheduled/);
  assert.match(source,/Create the focus your players should see next/);
  assert.match(source,/Build your roster/);
  assert.match(source,/Create practice/);
  assert.doesNotMatch(source,/Set the team in motion/);
  assert.doesNotMatch(source,/Players connected/);
  assert.doesNotMatch(source,/Practice plan/);
  assert.match(source,/!hasTeamActivity && !hasLiveActivity && !hasScheduledSession/);
  assert.match(shellCss,/\.mcTodayPlan/);
});

test("coach tools remain available without permanent dashboard clutter",()=>{
  ["Add Player","Create Practice","Build Mission","Log Score","Message Team","Team Code","New code","Coach Tools"].forEach(label=>assert.match(source,new RegExp(label)));
  assert.match(source,/mcActionSheet/);
  assert.doesNotMatch(source,/mcUtilityBar/);
  assert.doesNotMatch(source,/className="mcFab"/);
  assert.match(source,/mcMobileDrawer/);
  assert.match(source,/data-testid="coach-secondary-tools"/);
  assert.match(source,/data-testid="coach-team-code-bar"/);
  assert.match(source,/avatarUrl/);
  assert.match(source,/headshot placeholder/);
});

test("responsive CSS creates a compact native-feeling mobile operating system",()=>{
  assert.match(css,/grid-template-columns:112px minmax\(0,1fr\)/);
  assert.match(css,/@media\(max-width:980px\)/);
  assert.match(css,/@media\(max-width:700px\)/);
  assert.match(css,/mission-control-active/);
  assert.match(css,/env\(safe-area-inset-bottom\)/);
  assert.match(headerCss,/min-height:62px/);
  assert.match(polishCss,/\.mcSectionHead\{/);
  assert.match(shellCss,/min-height:\s*292px\s*!important/);
  assert.match(shellCss,/padding-bottom:\s*calc\(78px \+ env\(safe-area-inset-bottom\)\)\s*!important/);
  assert.match(premiumCss,/mobile-navigation-dock/);
  assert.match(premiumCss,/backdrop-filter:blur\(24px\)/);
});
