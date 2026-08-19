import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

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

test("cinematic hero preserves a visible source-owned coach logo and integrates it into the gym",()=>{
  assert.match(source,/useTeamBranding/);
  assert.match(source,/useCleanTeamLogo/);
  assert.match(source,/cleanFullLogoUrl/);
  assert.match(source,/cleanMarkLogoUrl/);
  assert.match(source,/branding\?\.logoMarkUrl && branding\.logoMarkUrl !== DEFAULT_MARK/);
  assert.match(source,/mcTacticalWash/);
  assert.match(source,/mcTacticalGlow/);
  assert.match(source,/mcCourtArtwork/);
  assert.match(source,/openBrandingSettings/);
  assert.match(source,/mcHeroTeamMark/);
  assert.match(source,/aria-label=\{`Customize \$\{teamName\} team identity`\}/);
  assert.match(source,/data-testid="mission-control-team-header"/);
  assert.match(source,/data-team-identity-stage="coach-mission-control"/);
  assert.match(source,/CoachMissionControlTitleStage\.css/);
  assert.doesNotMatch(source,/MOBILE_PRODUCT_RESET_CSS|<style>/);
  assert.match(titleCss,/--coach-hero-crest:\s*clamp\(104px,\s*27vw,\s*112px\)/);
  assert.match(titleCss,/\.mcHeroTeamMark\s*\{[\s\S]*width:\s*var\(--coach-hero-crest\);[\s\S]*height:\s*var\(--coach-hero-crest\)/);
  assert.match(titleCss,/\.mcHeroTeamMark img\s*\{[\s\S]*object-fit:\s*contain/);
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
  assert.match(activationCss,/@media\(max-width:700px\)/);
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

test("responsive CSS creates a native-feeling mobile operating system with premium owned hero geometry",()=>{
  assert.match(css,/grid-template-columns:112px minmax\(0,1fr\)/);
  assert.match(css,/@media\(max-width:980px\)/);
  assert.match(css,/@media\(max-width:700px\)/);
  assert.match(css,/mission-control-active/);
  assert.match(css,/env\(safe-area-inset-bottom\)/);
  assert.match(headerCss,/min-height:62px/);
  assert.match(polishCss,/\.mcSectionHead\{/);
  assert.match(titleCss,/\.mcHero\[data-team-identity-stage="coach-mission-control"\]\s*\{[\s\S]*min-height:\s*428px/);
  assert.match(titleCss,/\.mcHero\[data-team-identity-stage="coach-mission-control"\]\s+h1\s*\{[\s\S]*font-size:\s*clamp\(44px,\s*11\.3vw,\s*48px\)/);
  assert.match(titleCss,/--coach-hero-crest:\s*clamp\(104px,\s*27vw,\s*112px\)/);
  assert.match(titleCss,/\.mcHeroContent\s*\{[\s\S]*width:\s*100%/);
  assert.doesNotMatch(titleCss,/!important/);
  assert.match(shellCss,/padding-bottom:\s*calc\(78px \+ env\(safe-area-inset-bottom\)\)\s*!important/);
  assert.match(premiumCss,/mobile-navigation-dock/);
  assert.match(navigationCss,/--mobile-tab-bar-height:\s*56px/);
  assert.match(navigationCss,/\.dock\s*\{[\s\S]*?bottom:\s*0;/);
  assert.match(navigationCss,/\.dock\s*\{[\s\S]*?background:\s*rgba\(7, 26, 34, \.975\)/);
  assert.match(navigationCss,/\.dock\s*\{[\s\S]*?backdrop-filter:\s*blur\((?:18|20)px\) saturate\(118%\)/);
  assert.match(navigationCss,/\.dock\s*\{[\s\S]*?width:\s*100%/);
  assert.match(navigationCss,/\.dockItem\s*\{[\s\S]*?min-height:\s*48px/);
  assert.match(navigationCss,/\.dockLabelText\s*\{[\s\S]*?font-size:\s*var\(--type-micro, 11px\)/);
  assert.doesNotMatch(navigationCss,/\.dock\s*\{[^}]*translateX\(-50%\)/s);
  assert.match(finalCss,/\.mcPrimary:active/);
  assert.match(finalCss,/@media \(prefers-reduced-motion: reduce\)/);
  assert.match(activationCss,/@media\(prefers-reduced-motion:reduce\)/);
});

test("Mission Control uses the modern native support system while title geometry remains component-owned",()=>{
  assert.match(finalCss,/--mc-native:/);
  assert.match(finalCss,/--mc-radius-card:/);
  assert.match(finalCss,/font-family:\s*var\(--mc-native\)/);
  assert.match(finalCss,/\.mcSectionHead h2\s*\{[\s\S]*font-family:\s*var\(--mc-native\)/);
  assert.doesNotMatch(finalCss,/--mc-title-size|--mc-radius-hero/);
  assert.doesNotMatch(finalCss,/\.mcHero\s+h1\s*\{|\.mcHeroTeamMark\s*\{|\.mcHeroContent\s*>\s*p\s*\{/);
  assert.match(headerCss,/@media\(max-width:700px\)[\s\S]*\.mcHeader\{[\s\S]*grid-template-columns:44px minmax\(0,1fr\) 44px/);
  assert.match(titleCss,/font-size:\s*clamp\(44px,\s*11\.3vw,\s*48px\)/);
  assert.match(titleCss,/\.mcHeroContent\s*>\s*p\s*\{[\s\S]*font-size:\s*12\.5px/);
  assert.match(finalCss,/\.mcSection\s*\{[\s\S]*border-radius:\s*var\(--mc-radius-card\)/);
});
