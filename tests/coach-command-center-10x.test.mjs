import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { mediaBlock, ruleBlock } from "./helpers/css-contract.mjs";

const read=(path)=>fs.readFileSync(new URL(path,import.meta.url),"utf8");
const source=read("../src/components/CoachCommandCenter.jsx");
const appSource=read("../src/App.jsx");
const interactionsCss=read("../src/components/CoachMissionControlInteractions.css");
const shellCss=read("../src/components/CoachMissionControlShell.css");
const finalCss=read("../src/components/CoachMissionControlFinal.css");
const titleCss=read("../src/components/CoachMissionControlTitleStage.css");
const activationCss=read("../src/components/CoachActivationPath.css");
const navigationCss=read("../src/components/MobileNavigation.module.css");
const v2Css=read("../src/components/CoachMissionControlV2.css");
const headerCss=read("../src/components/CoachMissionControlHeader.css");
const polishCss=read("../src/components/CoachMissionControlPolish.css");
const legacy2026Css=read("../src/components/CoachMissionControl2026.css");
const hierarchyCss=read("../src/styles/MissionControlHierarchy2026.css");
const cascadeLockCss=read("../src/styles/MissionControlCascadeLock2026.css");
const logoSource=read("../src/components/useCleanTeamLogo.js");
const brandingForm=read("../src/components/team/TeamBrandingForm.jsx");
const viteConfig=read("../vite.phase5b.config.js");
const authorityVerifier=read("../scripts/enforce-coach-mobile-identity-authority.mjs");
const viewportSpec=read("./e2e/viewport-debug.spec.mjs");
const viewportWorkflow=read("../.github/workflows/viewport-debug-preflight.yml");
const stripComments=(value)=>value.replace(/\/\*[\s\S]*?\*\//g,"");

const mobileTitle=mediaBlock(titleCss,"(max-width:700px)");
const desktopTitle=mediaBlock(titleCss,"(min-width:981px)");

test("Coach Home keeps the production decision model and truthful signals",()=>{
  ["Mission Control","Today at a glance","Needs attention","Program Pulse","Recent Activity","Upcoming Event"].forEach((label)=>assert.match(source,new RegExp(label)));
  ["coach-primary-objective","coach-primary-metrics","coach-program-pulse","coach-athlete-attention","coach-upcoming-event"].forEach((id)=>assert.match(source,new RegExp(`data-testid="${id}"`)));
  assert.match(source,/primaryCommand/);
  assert.match(source,/attentionCount > 0/);
  assert.match(source,/hasScheduledSession/);
  assert.match(source,/CourtArtwork/);
  assert.match(source,/programPulse = null/);
  assert.match(source,/available \? `\$\{value\}%` : "—"/);
  assert.match(source,/No weekly goal data/);
  assert.match(source,/role="progressbar"/);
  assert.doesNotMatch(source,/Team pulse|92%|85%|Game Speed Shooting/);
});

test("Coach Home runtime imports only the consolidated CSS responsibilities",()=>{
  const imports=[...source.matchAll(/import "\.\/(CoachMissionControl[^";]+\.css)";/g)].map((match)=>match[1]);
  assert.deepEqual(imports,[
    "CoachMissionControlInteractions.css",
    "CoachMissionControlShell.css",
    "CoachMissionControlFinal.css",
    "CoachMissionControlTitleStage.css",
  ]);
  ["CoachMissionControlV2.css","CoachMissionControlHeader.css","CoachMissionControlPolish.css","CoachMissionControl2026.css"].forEach((name)=>assert.doesNotMatch(source,new RegExp(name.replaceAll(".","\\."))));
});

test("retired historical Coach CSS layers no longer own presentation",()=>{
  assert.match(v2Css,/CoachMissionControlInteractions\.css/);
  assert.doesNotMatch(v2Css,/\.mcHero\s*\{|\.missionControl\s*\{|\.mcSection\s*\{/);
  [headerCss,polishCss,legacy2026Css].forEach((legacy)=>{
    assert.doesNotMatch(legacy,/\.mcShellV3|\.missionControl|\.mcHero|\.mcSection/);
    assert.doesNotMatch(legacy,/\{[^}]*:[^}]*\}/s);
  });
});

test("component responsibilities are separated instead of layered by override",()=>{
  assert.match(titleCss,/Canonical Coach Home prototype-composition authority/);
  assert.match(titleCss,/\.mcShellV3\{/);
  assert.match(titleCss,/\.mcHero\[data-team-identity-stage="coach-mission-control"\]/);
  assert.match(titleCss,/\.mcTeamHealth/);
  assert.doesNotMatch(titleCss,/!important/);

  assert.match(interactionsCss,/interaction-only authority/i);
  assert.match(interactionsCss,/\.mcActionLayer/);
  assert.match(interactionsCss,/\.mcInboxLayer/);
  assert.match(interactionsCss,/\.mcMobileDrawer/);
  assert.doesNotMatch(interactionsCss,/\.mcHero\s*\{|\.missionControl\s*\{|\.mcTeamHealth\s*\{/);

  assert.match(shellCss,/legacy app-shell bridge and desktop rail containment/i);
  assert.match(shellCss,/body\.mission-control-active \.app-shell/);
  assert.match(shellCss,/\.mcShellV3>\.mcRail\{display:flex!important;flex-direction:column/);
  assert.doesNotMatch(shellCss,/(?:^|\n)\s*\.(?:mcHeroTeamMark|mcProgramIdentity|mcTeamHealth)\s*\{/m);

  assert.match(finalCss,/support/i);
  assert.doesNotMatch(finalCss,/\.missionControl\s*\{|\.mcHero\[data-team-identity-stage|\.mcHeroTeamMark\s*\{/);
});

test("late shared styles cannot reclaim Coach Home visual authority",()=>{
  const hierarchyRules=stripComments(hierarchyCss);
  const cascadeRules=stripComments(cascadeLockCss);
  assert.doesNotMatch(hierarchyRules,/\.mcShellV3|\.missionControl|\.mcHero|\.mcTeamHealth|\.mcActivity|\.mcAttention|\.mcNextSession/);
  assert.doesNotMatch(cascadeRules,/\.mcShellV3|\.missionControl|\.mcHero|\.mcTeamHealth|\.mcActivity|\.mcAttention|\.mcNextSession/);
  assert.match(hierarchyRules,/coach-assignment-accountability/);
  assert.match(hierarchyRules,/coach-follow-up-queue/);
  assert.match(cascadeRules,/performance-workspace--coach/);
});

test("desktop Coach Home follows the prototype command-stage anatomy",()=>{
  assert.match(desktopTitle,/grid-template-columns:208px minmax\(0,1fr\)/);
  assert.match(desktopTitle,/grid-template-columns:repeat\(12,minmax\(0,1fr\)\)/);
  assert.match(desktopTitle,/\.mcHero\[data-team-identity-stage="coach-mission-control"\][^{]*\{[^}]*grid-column:1\/10/);
  assert.match(desktopTitle,/\.mcTeamHealth\{[^}]*grid-column:10\/-1/);
  assert.match(desktopTitle,/\.mcActivity\{grid-column:1\/6/);
  assert.match(desktopTitle,/\.mcAttention\{grid-column:6\/10/);
  assert.match(desktopTitle,/\.mcNextSession\{grid-column:10\/-1/);
  assert.match(titleCss,/\.mcRailBrand::before\{content:"SHOTLAB"/);
  assert.match(desktopTitle,/\.mcProgramIdentity\{[^}]*Barlow Condensed/);
});

test("mobile Coach Home remains brand-first, Pulse-first and touch-safe",()=>{
  assert.match(mobileTitle,/\.mcHero\[data-team-identity-stage="coach-mission-control"\]/);
  assert.match(mobileTitle,/\.mcProgramIdentity/);
  assert.match(mobileTitle,/\.mcHeroTeamMark/);
  assert.match(mobileTitle,/\.mcTeamHealth/);
  assert.match(mobileTitle,/safe-area-inset-top/);
  assert.ok(source.indexOf("{pulsePanel}{attentionPanel}") > -1,"Program Pulse must precede Athlete Attention in source order");
  assert.match(navigationCss,/--mobile-tab-bar-height:\s*56px/);
  assert.match(navigationCss,/\.dockItem\s*\{[\s\S]*?min-height:\s*48px/);
  assert.match(shellCss,/padding-bottom:\s*calc\(78px \+ env\(safe-area-inset-bottom\)\)\s*!important/);
  mediaBlock(titleCss,"(prefers-reduced-motion:reduce)");
  mediaBlock(interactionsCss,"(prefers-reduced-motion:reduce)");
  mediaBlock(activationCss,"(prefers-reduced-motion:reduce)");
});

test("custom team identity stays dynamic and user-controlled",()=>{
  assert.match(source,/useTeamBranding/);
  assert.match(source,/useCleanTeamLogo/);
  assert.match(source,/const heroTeamLogoUrl = fullTeamLogoUrl/);
  assert.match(source,/aria-label=\{`Customize \$\{teamName\} team identity`\}/);
  assert.match(source,/data-team-identity-stage="coach-mission-control"/);
  assert.match(logoSource,/export const cleanTeamLogoSource/);
  assert.match(logoSource,/sampleCornerBackground/);
  assert.match(logoSource,/sampledCorners/);
  assert.match(logoSource,/trimTransparentEdges/);
  assert.match(brandingForm,/cleanTeamLogoSource/);
  assert.match(brandingForm,/transparent PNG or SVG/);
  const heroImageRule=ruleBlock(titleCss,'.mcHero[data-team-identity-stage="coach-mission-control"] .mcHeroTeamMark img');
  assert.match(heroImageRule,/object-fit:contain/);
});

test("Coach utilities remain available without becoming permanent dashboard chrome",()=>{
  ["Add Player","Create Practice","Build Mission","Record Result","Review Players","Team Code","New code","Coach Tools"].forEach((label)=>assert.match(source,new RegExp(label)));
  assert.match(source,/mcActionSheet/);
  assert.match(source,/mcMobileDrawer/);
  assert.match(source,/data-testid="coach-secondary-tools"/);
  assert.match(source,/data-testid="coach-team-code-bar"/);
  assert.doesNotMatch(source,/Message Team|mcUtilityBar|className="mcFab"/);
  assert.match(source,/onAnalyticsClick/);
  assert.match(source,/label: "Players", icon: "users", onClick: onPlayersClick/);
  assert.match(source,/label: "Analytics", icon: "chart", onClick: onAnalyticsClick/);
  assert.match(appSource,/onAnalyticsClick=\{openCoachLeaderboards\}/);
});

test("production build no longer rewrites Coach Home visual CSS",()=>{
  assert.doesNotMatch(viteConfig,/retireSupersededMissionControlCss|CoachMissionControlHeader\.css.*virtual|CoachMissionControlPolish\.css.*virtual|CoachMissionControl2026\.css.*virtual/s);
  assert.doesNotMatch(authorityVerifier,/writeFile/);
  assert.match(authorityVerifier,/verification failed/);
  assert.match(authorityVerifier,/Fix the source authority instead of rewriting dist/);
});

test("rendered 390px and 1440px evidence is a hard Coach Home migration gate",()=>{
  assert.match(viewportSpec,/page\.screenshot\(/);
  assert.match(viewportSpec,/fullPage:\s*true/);
  assert.match(viewportSpec,/\.png/);
  assert.match(viewportWorkflow,/--role=coach --widths=390,1440/);
  assert.match(viewportWorkflow,/coach-home-rendered-gate/);
  assert.match(viewportWorkflow,/artifacts\/viewport-debug\//);
  assert.match(viewportWorkflow,/if-no-files-found:\s*error/);
});
