import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source=fs.readFileSync(new URL("../src/components/CoachCommandCenter.jsx",import.meta.url),"utf8");
const css=fs.readFileSync(new URL("../src/components/CoachMissionControlV2.css",import.meta.url),"utf8");
const headerCss=fs.readFileSync(new URL("../src/components/CoachMissionControlHeader.css",import.meta.url),"utf8");
const polishCss=fs.readFileSync(new URL("../src/components/CoachMissionControlPolish.css",import.meta.url),"utf8");
const logoSource=fs.readFileSync(new URL("../src/components/useCleanTeamLogo.js",import.meta.url),"utf8");
const brandingForm=fs.readFileSync(new URL("../src/components/team/TeamBrandingForm.jsx",import.meta.url),"utf8");

test("coach dashboard answers the 30-second workflow questions",()=>{
  ["Mission Control","Priority action","Who needs you","Needs attention","Is the team moving","Team activity","What happened today","Live activity","What is next","Next session"].forEach(label=>assert.match(source,new RegExp(label)));
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

test("cinematic hero uses dynamic branding and a free-standing editable logo",()=>{
  assert.match(source,/useTeamBranding/);
  assert.match(source,/useCleanTeamLogo/);
  assert.match(source,/cleanLogoUrl/);
  assert.match(source,/mcArenaGlow/);
  assert.match(source,/mcRafters/);
  assert.match(source,/mcCourtFloor/);
  assert.match(source,/openBrandingSettings/);
  assert.match(source,/mcHeroTeamMark/);
  assert.match(source,/aria-label=\{`Customize \$\{teamName\} team identity`\}/);
  assert.match(source,/data-testid="mission-control-team-header"/);
  assert.doesNotMatch(source,/>Customize team identity</);
  assert.match(polishCss,/\.mcHero\{/);
  assert.match(polishCss,/\.mcArenaGlow/);
  assert.match(polishCss,/\.mcRafters/);
  assert.match(polishCss,/min-height:304px/);
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

test("purpose-built empty states replace meaningless zero analytics",()=>{
  assert.match(source,/IntentionalEmpty/);
  assert.match(source,/No team activity yet/);
  assert.match(source,/The live feed starts with the first rep/);
  assert.match(source,/No session scheduled/);
  assert.match(source,/Your roster is clear/);
  assert.match(source,/hasTeamActivity/);
  assert.match(polishCss,/\.mcIntentionalEmpty/);
});

test("quick actions remain available without a floating action button",()=>{
  ["Add Player","Create Practice","Build Mission","Log Score","Message Team","View Analytics","Team code","New code"].forEach(label=>assert.match(source,new RegExp(label)));
  assert.match(source,/mcActionSheet/);
  assert.match(source,/mcUtilityBar/);
  assert.doesNotMatch(source,/className="mcFab"/);
  assert.match(source,/mcMobileDrawer/);
  assert.match(source,/aria-expanded=\{toolsOpen\}/);
  assert.match(source,/data-testid="coach-secondary-tools"/);
  assert.match(source,/data-testid="coach-team-code-bar"/);
  assert.match(source,/avatarUrl/);
  assert.match(source,/headshot placeholder/);
  assert.match(polishCss,/\.mcFab\{display:none!important\}/);
});

test("responsive CSS creates a compact continuous mobile operating system",()=>{
  assert.match(css,/grid-template-columns:112px minmax\(0,1fr\)/);
  assert.match(css,/grid-template-columns:1\.25fr \.75fr/);
  assert.match(css,/@media\(max-width:980px\)/);
  assert.match(css,/@media\(max-width:700px\)/);
  assert.match(css,/mission-control-active/);
  assert.match(css,/env\(safe-area-inset-bottom\)/);
  assert.match(headerCss,/min-height:62px/);
  assert.match(polishCss,/\.mcSectionHead\{/);
  assert.match(polishCss,/background:transparent!important/);
  assert.match(polishCss,/min-height:auto!important/);
  assert.match(polishCss,/padding-bottom:calc\(102px \+ env\(safe-area-inset-bottom\)\)/);
});
