import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source=fs.readFileSync(new URL("../src/components/CoachCommandCenter.jsx",import.meta.url),"utf8");
const css=fs.readFileSync(new URL("../src/components/CoachMissionControlV2.css",import.meta.url),"utf8");
const headerCss=fs.readFileSync(new URL("../src/components/CoachMissionControlHeader.css",import.meta.url),"utf8");
const polishCss=fs.readFileSync(new URL("../src/components/CoachMissionControlPolish.css",import.meta.url),"utf8");
const premiumCss=fs.readFileSync(new URL("../src/components/CoachMissionControl2026.css",import.meta.url),"utf8");
const shellCss=fs.readFileSync(new URL("../src/components/CoachMissionControlShell.css",import.meta.url),"utf8");
const finalCss=fs.readFileSync(new URL("../src/components/CoachMissionControlFinal.css",import.meta.url),"utf8");
const activationCss=fs.readFileSync(new URL("../src/components/CoachActivationPath.css",import.meta.url),"utf8");
const logoSource=fs.readFileSync(new URL("../src/components/useCleanTeamLogo.js",import.meta.url),"utf8");
const brandingForm=fs.readFileSync(new URL("../src/components/team/TeamBrandingForm.jsx",import.meta.url),"utf8");


test("coach dashboard answers the 30-second workflow questions without repeating the attention headline",()=>{
  ["Mission Control","Today at a glance","Needs attention","Activity today","Recent activity","Next session"].forEach(label=>assert.match(source,new RegExp(label)));
  assert.match(source,/data-testid="coach-primary-objective"/);
  assert.match(source,/data-testid="coach-primary-metrics"/);
  assert.match(source,/primaryCommand/);
  assert.match(source,/attentionCount > 0/);
  assert.match(source,/hasScheduledSession/);
  assert.match(source,/CourtArtwork/);
  assert.match(source,/decision\$\{attentionCount === 1 \? "" : "s"\} before practice/);
  assert.doesNotMatch(source,/title: `\$\{attentionCount\} player/);
});


test("Mission Control uses real roster and schedule signals instead of placeholder analytics",()=>{
  assert.match(source,/activeTodayCount/);
  assert.match(source,/totalPlayers/);
  assert.match(source,/nextEventDateFormatted/);
  assert.match(source,/activeRate/);
  assert.match(source,/<small>Active<\/small>/);
  assert.match(source,/<small>Follow-up<\/small>/);
  assert.match(source,/<small>Next<\/small>/);
  assert.match(source,/hasScheduledSession \? "Set" : "—"/);
  assert.doesNotMatch(source,/92%/);
  assert.doesNotMatch(source,/85%/);
  assert.doesNotMatch(source,/Game Speed Shooting/);
});


test("attention rows explain the issue instead of using unresolved placeholder copy",()=>{
  assert.match(source,/Roster activity gap/);
  assert.match(source,/No training activity has been logged this week/);
  assert.match(source,/Review training status and account connection/);
  assert.match(source,/mcAttentionMeta/);
  assert.doesNotMatch(source,/Inactive or unresolved player items/);
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
  assert.match(finalCss,/width:\s*84px\s*!important/);
  assert.match(finalCss,/@keyframes mcFinalArenaPulse/);
  assert.match(finalCss,/\.mcRealityStrip\s*\{[\s\S]*border:\s*0/);
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


test("one truthful activation path replaces generic onboarding and exposes only the next milestone",()=>{
  assert.match(source,/deriveCoachActivationPath/);
  assert.match(source,/data-testid="coach-onboarding-state"/);
  assert.match(source,/function TodayPlan/);
  assert.match(source,/Coach activation/);
  assert.match(source,/activation\.completed/);
  assert.match(source,/activation\.next/);
  assert.match(source,/runActivationAction/);
  assert.match(source,/!activationPath\.complete/);
  assert.doesNotMatch(source,/No practice scheduled/);
  assert.doesNotMatch(source,/Build your roster/);
  assert.doesNotMatch(source,/Set the team in motion/);
  assert.doesNotMatch(source,/Players connected/);
  assert.doesNotMatch(source,/Practice plan/);
  assert.match(activationCss,/\.mcActivationPlan/);
  assert.match(activationCss,/\.mcActivationProgressTrack/);
  assert.match(activationCss,/@media\(max-width:700px\)/);
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
  assert.match(finalCss,/min-height:\s*286px\s*!important/);
  assert.match(shellCss,/padding-bottom:\s*calc\(78px \+ env\(safe-area-inset-bottom\)\)\s*!important/);
  assert.match(premiumCss,/mobile-navigation-dock/);
  assert.match(premiumCss,/backdrop-filter:blur\(24px\)/);
  assert.match(finalCss,/\.mcPrimary:active/);
  assert.match(finalCss,/@media \(prefers-reduced-motion: reduce\)/);
  assert.match(activationCss,/@media\(prefers-reduced-motion:reduce\)/);
});
