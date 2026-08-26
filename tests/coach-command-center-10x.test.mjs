import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { assertDeclaration, declaration, mediaBlock, ruleBlock } from "./helpers/css-contract.mjs";

const source=fs.readFileSync(new URL("../src/components/CoachCommandCenter.jsx",import.meta.url),"utf8");
const appSource=fs.readFileSync(new URL("../src/App.jsx",import.meta.url),"utf8");
const css=fs.readFileSync(new URL("../src/components/CoachMissionControlV2.css",import.meta.url),"utf8");
const headerCss=fs.readFileSync(new URL("../src/components/CoachMissionControlHeader.css",import.meta.url),"utf8");
const polishCss=fs.readFileSync(new URL("../src/components/CoachMissionControlPolish.css",import.meta.url),"utf8");
const premiumCss=fs.readFileSync(new URL("../src/components/CoachMissionControl2026.css",import.meta.url),"utf8");
const titleCss=fs.readFileSync(new URL("../src/components/CoachMissionControlTitleStage.css",import.meta.url),"utf8");
const navigationCss=fs.readFileSync(new URL("../src/components/MobileNavigation.module.css",import.meta.url),"utf8");
const shellCss=fs.readFileSync(new URL("../src/components/CoachMissionControlShell.css",import.meta.url),"utf8");
const finalCss=fs.readFileSync(new URL("../src/components/CoachMissionControlFinal.css",import.meta.url),"utf8");
const activationCss=fs.readFileSync(new URL("../src/components/CoachActivationPath.css",import.meta.url),"utf8");
const cascadeLockCss=fs.readFileSync(new URL("../src/styles/MissionControlCascadeLock2026.css",import.meta.url),"utf8");
const logoSource=fs.readFileSync(new URL("../src/components/useCleanTeamLogo.js",import.meta.url),"utf8");
const brandingForm=fs.readFileSync(new URL("../src/components/team/TeamBrandingForm.jsx",import.meta.url),"utf8");

const mobileTitle=mediaBlock(titleCss,"(max-width:700px)");
const mobileHero=ruleBlock(mobileTitle,'.mcHero[data-team-identity-stage="coach-mission-control"]');
const mobileHeroContent=ruleBlock(mobileTitle,".mcHeroContent");
const mobileHeroIdentity=ruleBlock(mobileTitle,".mcHeroIdentity");
const mobileHeroMark=ruleBlock(mobileTitle,".mcHeroTeamMark");
const baseHeroMarkImage=ruleBlock(titleCss,'.mcHero[data-team-identity-stage="coach-mission-control"] .mcHeroTeamMark img');
const mobileTitleHeading=ruleBlock(mobileTitle," h1");

test("coach dashboard answers the 30-second workflow questions with the Phase 3 evidence hierarchy",()=>{
  ["Mission Control","Today at a glance","Needs attention","Program Pulse","Recent Activity","Upcoming Event"].forEach(label=>assert.match(source,new RegExp(label)));
  assert.match(source,/data-testid="coach-primary-objective"/);
  assert.match(source,/data-testid="coach-primary-metrics"/);
  assert.match(source,/data-testid="coach-program-pulse"/);
  assert.match(source,/data-testid="coach-athlete-attention"/);
  assert.match(source,/data-testid="coach-upcoming-event"/);
  assert.match(source,/primaryCommand/);
  assert.match(source,/attentionCount > 0/);
  assert.match(source,/hasScheduledSession/);
  assert.match(source,/CourtArtwork/);
  assert.match(source,/decision\$\{attentionCount === 1 \? "" : "s"\} before practice/);
  assert.doesNotMatch(source,/title: `\$\{attentionCount\} player/);
});

test("Mission Control keeps activity, Program Pulse, attention, and schedule as distinct truthful signals",()=>{
  assert.match(source,/activeTodayCount/);
  assert.match(source,/totalPlayers/);
  assert.match(source,/nextEventDateFormatted/);
  assert.match(source,/programPulse = null/);
  assert.match(source,/available \? `\$\{value\}%` : "—"/);
  assert.match(source,/role="progressbar"/);
  assert.match(source,/data-pulse-state=\{state\}/);
  assert.match(source,/No weekly goal data/);
  assert.match(source,/<small>Active<\/small>/);
  assert.match(source,/<small>Follow-up<\/small>/);
  assert.match(source,/<small>Next<\/small>/);
  assert.match(source,/hasScheduledSession \? "Set" : "—"/);
  assert.doesNotMatch(source,/Team pulse/);
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

test("Coach identity chapter and tactical court use one visible source-owned full custom logo",()=>{
  assert.match(source,/useTeamBranding/);
  assert.match(source,/useCleanTeamLogo/);
  assert.match(source,/cleanFullLogoUrl/);
  assert.match(source,/const heroTeamLogoUrl = fullTeamLogoUrl/);
  assert.doesNotMatch(source,/cleanMarkLogoUrl|configuredMarkSource/);
  assert.match(source,/mcCourtLines/);
  assert.match(source,/mcCourtRoute/);
  assert.match(source,/mcCourtArtwork/);
  assert.match(source,/openBrandingSettings/);
  assert.match(source,/mcHeroTeamMark/);
  assert.match(source,/aria-label=\{`Customize \$\{teamName\} team identity`\}/);
  assert.match(source,/data-testid="mission-control-team-header"/);
  assert.match(source,/data-team-identity-stage="coach-mission-control"/);
  assert.match(source,/CoachMissionControlTitleStage\.css/);
  assert.doesNotMatch(source,/MOBILE_PRODUCT_RESET_CSS|<style>/);

  assertDeclaration(mobileHeroIdentity,"--coach-hero-crest",/^clamp\(96px,\s*26vw,\s*108px\)$/);
  for (const property of ["width","height","min-width","min-height","max-width","max-height"]) {
    assertDeclaration(mobileHeroMark,property,"var(--coach-hero-crest)");
  }
  assertDeclaration(baseHeroMarkImage,"object-fit","contain");
  assertDeclaration(baseHeroMarkImage,"width","100%");
  assertDeclaration(baseHeroMarkImage,"height","100%");
  assert.ok(mobileTitle.includes(".mcCourtArtwork"),"mobile title stage must retain court artwork ownership");
  assert.doesNotMatch(titleCss,/!important/);
  assert.match(premiumCss,/mix-blend-mode:screen/);
  assert.match(premiumCss,/@keyframes mcArenaBreath/);
  assert.doesNotMatch(shellCss,/\.mcHeroTeamMark\s*\{/);
  assert.doesNotMatch(finalCss,/\.mcHeroTeamMark\s*\{/);
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
  assert.match(source,/activationPath\.next/);
  assert.match(source,/runActivationAction/);
  assert.match(source,/!activationPath\.complete/);
  assert.doesNotMatch(source,/No practice scheduled/);
  assert.doesNotMatch(source,/Build your roster/);
  assert.doesNotMatch(source,/Set the team in motion/);
  assert.doesNotMatch(source,/Players connected/);
  assert.doesNotMatch(source,/Practice plan/);
  assert.match(activationCss,/\.mcActivationPlan/);
  assert.match(activationCss,/\.mcActivationProgressTrack/);
  mediaBlock(activationCss,"(max-width:700px)");
});

test("coach tools remain available without permanent dashboard clutter",()=>{
  ["Add Player","Create Practice","Build Mission","Record Result","Review Players","Team Code","New code","Coach Tools"].forEach(label=>assert.match(source,new RegExp(label)));
  assert.doesNotMatch(source,/Message Team/);
  assert.match(source,/mcActionSheet/);
  assert.doesNotMatch(source,/mcUtilityBar/);
  assert.doesNotMatch(source,/className="mcFab"/);
  assert.match(source,/mcMobileDrawer/);
  assert.match(source,/data-testid="coach-secondary-tools"/);
  assert.match(source,/data-testid="coach-team-code-bar"/);
  assert.match(source,/avatarUrl/);
  assert.match(source,/headshot placeholder/);
  assert.match(cascadeLockCss,/\.performance-workspace--coach\.page\s*\{[\s\S]*?animation-fill-mode:\s*none\s*!important/);
  assert.match(cascadeLockCss,/\.mcFocusGrid\.is-onboarding-grid \.mcActivationPlan\s*\{[\s\S]*?grid-template-columns:\s*48px minmax\(0, 1fr\)\s*!important/);
  assert.match(cascadeLockCss,/\.mcFocusGrid\.is-onboarding-grid \.mcActivationPlan > button\s*\{[\s\S]*?grid-column:\s*1 \/ -1\s*!important/);
});

test("Mission Control keeps Players and Analytics as distinct destinations",()=>{
  assert.match(source,/onAnalyticsClick/);
  assert.match(source,/label: "Players", icon: "users", onClick: onPlayersClick/);
  assert.match(source,/label: "Analytics", icon: "chart", onClick: onAnalyticsClick/);
  assert.match(appSource,/onAnalyticsClick=\{openCoachLeaderboards\}/);
  assert.match(appSource,/const openCoachLeaderboards=\(\)=>handleNavChange\("leaderboards"\)/);
  assert.doesNotMatch(source,/label: "Analytics", icon: "chart", onClick: onActiveTodayClick/);
});

test("responsive CSS creates a native-feeling mobile operating system with Player-level identity and decision geometry",()=>{
  assert.match(css,/grid-template-columns:112px minmax\(0,1fr\)/);
  assert.match(css,/\.mcHeroContent\{[^}]*color:#f4f7f8/);
  assert.match(css,/\.mcEyebrow\{[^}]*color:var\(--mc\)/);
  mediaBlock(css,"(max-width:980px)");
  mediaBlock(css,"(max-width:700px)");
  assert.match(css,/mission-control-active/);
  assert.match(css,/env\(safe-area-inset-bottom\)/);
  assert.match(headerCss,/min-height:62px/);
  assert.match(polishCss,/\.mcSectionHead\{/);
  assertDeclaration(mobileHero,"min-height","382px");
  assert.doesNotMatch(titleCss,/\.mcHeroIdentity::after\s*\{[\s\S]*content:\s*"Mission Control"/);
  assert.match(declaration(mobileTitleHeading,"font") ?? "",/clamp\(39px,\s*10\.5vw,\s*45px\)/);
  assertDeclaration(mobileHeroIdentity,"--coach-hero-crest",/^clamp\(96px,\s*26vw,\s*108px\)$/);
  assertDeclaration(mobileHeroContent,"width","100%");
  assert.doesNotMatch(titleCss,/!important/);
  assert.match(shellCss,/padding-bottom:\s*calc\(78px \+ env\(safe-area-inset-bottom\)\)\s*!important/);
  assert.match(premiumCss,/mobile-navigation-dock/);
  assert.match(navigationCss,/--mobile-tab-bar-height:\s*56px/);
  assert.match(navigationCss,/\.dock\s*\{[\s\S]*?bottom:\s*0;/);
  assert.match(navigationCss,/\.dock\s*\{[\s\S]*?background:\s*color-mix\(in srgb, var\(--team-brand-surface-deep/);
  assert.match(navigationCss,/\.dock\s*\{[\s\S]*?backdrop-filter:\s*blur\((?:18|20)px\) saturate\(118%\)/);
  assert.match(navigationCss,/\.dock\s*\{[\s\S]*?width:\s*100%/);
  assert.match(navigationCss,/\.dockItem\s*\{[\s\S]*?min-height:\s*48px/);
  assert.match(navigationCss,/\.dockLabelText\s*\{[\s\S]*?font-size:\s*var\(--type-micro, 11px\)/);
  assert.doesNotMatch(navigationCss,/\.dock\s*\{[^}]*translateX\(-50%\)/s);
  assert.ok(mobileTitle.includes(".mcPrimary:active"),"mobile primary action must retain pressed feedback");

  const reducedMotion=mediaBlock(titleCss,"(prefers-reduced-motion:reduce)");
  const reducedAction=ruleBlock(reducedMotion,".mcRealityStrip button");
  assertDeclaration(reducedAction,"transition","none");
  mediaBlock(activationCss,"(prefers-reduced-motion:reduce)");
});

test("Mission Control uses the modern native support system while title and decision geometry remain component-owned",()=>{
  assert.match(finalCss,/--mc-native:/);
  assert.match(finalCss,/--mc-light:/);
  assert.match(finalCss,/font-family:\s*var\(--mc-native\)/);
  assert.match(finalCss,/\.mcSectionHead h2,[\s\S]*font:\s*760 25px\/1\.04 var\(--mc-native\)/);
  assert.doesNotMatch(finalCss,/--mc-title-size|--mc-radius-hero/);
  assert.doesNotMatch(finalCss,/\.mcHero\s+h1\s*\{|\.mcHeroTeamMark\s*\{|\.mcHeroContent\s*>\s*p\s*\{/);

  const compactHeader=mediaBlock(titleCss,"(max-width:700px)");
  const header=ruleBlock(compactHeader,'.mcHeader[data-testid="mission-control-team-header"]');
  assertDeclaration(header,"grid-template-columns","44px minmax(0,1fr) 44px");
  assertDeclaration(header,"min-height","56px");
  assert.doesNotMatch(titleCss,/\.mcHeroIdentity::after\s*\{/);
  const bodyCopy=ruleBlock(compactHeader,".mcHeroContent>p");
  assert.match(declaration(bodyCopy,"font") ?? "",/12px/);
  assert.match(finalCss,/\.mcSection\{[\s\S]*border-radius:0[\s\S]*box-shadow:none/);
});
