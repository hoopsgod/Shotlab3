import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source=fs.readFileSync(new URL("../src/components/CoachCommandCenter.jsx",import.meta.url),"utf8");
const css=fs.readFileSync(new URL("../src/components/CoachMissionControlV2.css",import.meta.url),"utf8");
const polishCss=fs.readFileSync(new URL("../src/components/CoachMissionControlHeader.css",import.meta.url),"utf8");

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

test("dynamic branding controls a free-standing editable hero logo",()=>{
  assert.match(source,/useTeamBranding/);
  assert.match(source,/branding\?\.logoUrl/);
  assert.match(source,/branding\?\.logoMarkUrl/);
  assert.match(source,/logoUrl=\{logoUrl\}/);
  assert.match(source,/--mc/);
  assert.match(source,/mcCourtFloor/);
  assert.match(source,/openBrandingSettings/);
  assert.match(source,/mcHeroTeamMark/);
  assert.match(source,/aria-label=\{`Customize \$\{teamName\} team identity`\}/);
  assert.match(source,/data-testid="mission-control-team-header"/);
  assert.doesNotMatch(source,/>Customize team identity</);
  assert.match(polishCss,/\.mcHeroTeamMark\{/);
  assert.match(polishCss,/border:0;/);
  assert.match(polishCss,/@media\(max-width:700px\)/);
  assert.match(polishCss,/min-height:318px/);
});

test("quick actions, navigation, headshots, and team code remain available",()=>{
  ["Add Player","Create Practice","Build Mission","Log Score","Message Team","View Analytics","Team code","New code"].forEach(label=>assert.match(source,new RegExp(label)));
  assert.match(source,/mcActionSheet/);
  assert.match(source,/mcMobileDrawer/);
  assert.match(source,/aria-expanded=\{toolsOpen\}/);
  assert.match(source,/data-testid="coach-secondary-tools"/);
  assert.match(source,/data-testid="coach-team-code-bar"/);
  assert.match(source,/avatarUrl/);
  assert.match(source,/headshot placeholder/);
});

test("responsive CSS creates a compact mobile coach operating system",()=>{
  assert.match(css,/grid-template-columns:112px minmax\(0,1fr\)/);
  assert.match(css,/grid-template-columns:1\.25fr \.75fr/);
  assert.match(css,/@media\(max-width:980px\)/);
  assert.match(css,/@media\(max-width:700px\)/);
  assert.match(css,/\.mcFocusGrid,\.mcLowerGrid\{grid-template-columns:1fr/);
  assert.match(css,/mission-control-active/);
  assert.match(css,/env\(safe-area-inset-bottom\)/);
  assert.match(polishCss,/min-height:62px/);
  assert.match(polishCss,/border-radius:0;/);
  assert.match(polishCss,/background:transparent;/);
});
