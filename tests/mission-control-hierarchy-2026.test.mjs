import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const main = fs.readFileSync(new URL("../src/main.jsx", import.meta.url), "utf8");
const authenticatedAuthority = fs.readFileSync(new URL("../src/styles/AuthenticatedVisualAuthority2026.css", import.meta.url), "utf8");
const index = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../src/styles/MissionControlHierarchy2026.css", import.meta.url), "utf8");
const cascadeLock = fs.readFileSync(new URL("../src/styles/MissionControlCascadeLock2026.css", import.meta.url), "utf8");
const criticalCss = fs.readFileSync(new URL("../public/shotlab-phase2-critical.css", import.meta.url), "utf8");
const foundationCss = fs.readFileSync(new URL("../public/shotlab-v3-foundation.css", import.meta.url), "utf8");
const mobileCorrectionsCss = fs.readFileSync(new URL("../public/shotlab-v3-mobile-corrections.css", import.meta.url), "utf8");
const commandCenter = fs.readFileSync(new URL("../src/components/CoachCommandCenter.jsx", import.meta.url), "utf8");
const titleCss = fs.readFileSync(new URL("../src/components/CoachMissionControlTitleStage.css", import.meta.url), "utf8");

const indexOfOrFail = (source, value) => {
  const position = source.indexOf(value);
  assert.notEqual(position, -1, `Expected source to contain ${value}`);
  return position;
};
const stripComments = (source) => source.replace(/\/\*[\s\S]*?\*\//g, "");

test("Mission Control hierarchy loads after the canonical visual foundation", () => {
  const app = indexOfOrFail(main, "await import('./App.jsx')");
  const authority = indexOfOrFail(main, "await import('./styles/AuthenticatedVisualAuthority2026.css')");
  const foundation = indexOfOrFail(authenticatedAuthority, "./VisualFoundation2026.css");
  const hierarchy = indexOfOrFail(authenticatedAuthority, "./MissionControlHierarchy2026.css");
  assert.ok(authority > app, "authenticated visual authority must load after the application module");
  assert.ok(hierarchy > foundation, "Mission Control hierarchy must load after the foundation inside the authenticated authority bundle");
  assert.match(index, /shotlab-phase2-critical\.css/);
  assert.doesNotMatch(index, /appendChild\(sheet\)/);
  assert.equal(main.includes("mission-control-canonical.css"), false);
});

test("Phase 4 preserves the existing Mission Control interaction contract", () => {
  for (const contract of [
    "mcTeamSelect",
    "mcBell",
    "mcMobileMenu",
    "mcHeroTeamMark",
    "coach-primary-objective",
    "coach-primary-metrics",
    "mcRealityStrip",
    "mcPrimary",
    "openBrandingSettings",
    "openInbox",
  ]) {
    assert.match(commandCenter, new RegExp(contract.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("Phase 4 source owns shared-scale program identity, daily decision, Program Pulse and workspace composition", () => {
  assert.match(commandCenter, /import "\.\/CoachMissionControlTitleStage\.css"/);
  assert.match(commandCenter, /data-team-identity-stage="coach-mission-control"/);
  assert.match(commandCenter, /mcHeroIdentity/);
  assert.doesNotMatch(commandCenter, /MOBILE_PRODUCT_RESET_CSS|<style>/);
  assert.match(titleCss, /Canonical Coach Home prototype-composition authority/);
  assert.match(titleCss, /\.mcHero\[data-team-identity-stage="coach-mission-control"\][\s\S]*min-height:\s*382px/);
  assert.match(titleCss, /--coach-hero-crest:\s*clamp\(96px,\s*26vw,\s*108px\)/);
  assert.match(titleCss, /\.mcProgramIdentity\s*\{[\s\S]*?font:\s*780\s+11px\/1\.2\s+var\(--mc-native\)[\s\S]*?letter-spacing:\s*\.075em/);
  assert.match(titleCss, /\sh1\s*\{[\s\S]*?clamp\(40px,\s*9\.8vw,\s*44px\)[\s\S]*?var\(--mc-native\)/);
  assert.match(titleCss, /\.mcHeroContent>p\s*\{[\s\S]*?font:\s*520\s+14px\/1\.45\s+var\(--mc-native\)/);
  assert.match(titleCss, /\.mcTeamHealth\s*\{[\s\S]*?background:\s*linear-gradient\(180deg,var\(--team-brand-surface-deep/);
  assert.match(titleCss, /\.mcRealityStrip\s*\{/);
  assert.match(titleCss, /grid-template-columns:\s*repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(titleCss, /\.mcPrimary\s*\{/);
  assert.doesNotMatch(titleCss, /!important|html\s+body\s+#root/);

  const supportCss = stripComments(css);
  assert.doesNotMatch(supportCss, /\.mcShellV3\b|\.missionControl\b|\.mcHero\b|\.mcSection\b/);
  assert.match(supportCss, /\[data-testid="coach-assignment-accountability"\]/);
  assert.match(supportCss, /\[data-testid="coach-follow-up-queue"\]/);
});

test("late hierarchy and compatibility layers cannot redesign Coach Home identity or decision surfaces", () => {
  for (const lateAuthority of [stripComments(css), cascadeLock, criticalCss]) {
    assert.doesNotMatch(lateAuthority, /\.mcHeroTeamMark\s*\{[^}]*display:\s*none/s);
    assert.doesNotMatch(lateAuthority, /\.mcHeroTeamMark\s*\{[^}]*width\s*:/s);
    assert.doesNotMatch(lateAuthority, /\.mcHero\s+h1\s*\{[^}]*font-size\s*:/s);
    assert.doesNotMatch(lateAuthority, /\.mcHeroContent\s*\{[^}]*grid-template-columns\s*:/s);
    assert.doesNotMatch(lateAuthority, /\.mcHeader\s*\{[^}]*grid-template-columns\s*:/s);
    assert.doesNotMatch(lateAuthority, /\.mcRealityStrip\b|\.mcPrimary\b/);
  }
  for (const compatibilityLayer of [foundationCss, mobileCorrectionsCss]) {
    assert.doesNotMatch(compatibilityLayer, /\.mcRealityStrip\b/);
    assert.doesNotMatch(compatibilityLayer, /\.mcPrimary\b/);
  }
  assert.doesNotMatch(foundationCss, /body\.mission-control-active\s+\.mcSection[,\{]/);
  assert.doesNotMatch(foundationCss, /body\.mission-control-active\s+\.missionControl\s*\{/);
  assert.doesNotMatch(criticalCss, /\[data-testid="coach-primary-objective"\]/);
  assert.doesNotMatch(criticalCss, /\.mcHero\b|\.mcHeroIdentity\b|\.mcRealityStrip\b|\.mcPrimary\b/);
  assert.match(cascadeLock, /Mounted Coach Home geometry and composition must not be repaired from a late[\s\S]*CoachMissionControlShell\.css owns the legacy parent-shell[\s\S]*CoachMissionControlTitleStage\.css owns the page itself/);
});

test("critical cascade remains narrowly scoped to support rows", () => {
  assert.doesNotMatch(criticalCss, /\.mcRealityStrip\b|\.mcPrimary\b|\.mcAttentionRow\b/);
  assert.match(criticalCss, /\.mcAssignmentAccountabilityRow/);
  assert.match(criticalCss, /mobile-navigation-sheet/);
});

test("shared support tokens are explicit light-surface values and cannot inherit the dark Coach shell", () => {
  assert.match(css, /--support-ink:\s*#111a21/);
  assert.match(css, /--support-muted:\s*#56636c/);
  assert.match(css, /--support-line:\s*rgba\(17,26,33,\.1\)/);
  assert.match(css, /background:\s*#fffefa/);
  assert.doesNotMatch(css, /--support-ink:\s*var\(/);
  assert.doesNotMatch(css, /--support-muted:\s*var\(/);
});

test("mobile hierarchy preserves safe controls while Coach title composition stays source-owned", () => {
  assert.match(titleCss, /@media\s*\(\s*max-width:\s*700px\s*\)/);
  assert.match(titleCss, /\.mcHeader\[data-testid="mission-control-team-header"\][\s\S]*grid-template-columns:\s*44px minmax\(0,1fr\) 44px/);
  assert.match(titleCss, /\.mcHeader\s+\.mcMobileMenu\s*\{[\s\S]*?width:\s*44px;[\s\S]*?height:\s*44px/);
  assert.match(titleCss, /\.mcBell\s*\{[\s\S]*?width:\s*44px;[\s\S]*?height:\s*44px/);
  assert.match(titleCss, /\.mcHeroIdentity[\s\S]*grid-template-columns:\s*minmax\(0,1fr\) var\(--coach-hero-crest\)/);
  assert.match(titleCss, /\.mcBrandLockup\s+\.mcHeaderTeamMark\s*\{\s*display:\s*none/);
  assert.match(titleCss, /\.mcHeaderActions\s+\.mcTeamSelect\s*\{\s*display:\s*none/);
  assert.doesNotMatch(stripComments(css), /\.mcHeader\b/);
});

test("Phase 4 keeps reduced motion and uses opaque source-owned Coach chrome", () => {
  assert.match(css, /@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)/);
  assert.match(css, /animation:\s*none/);
  assert.match(titleCss, /@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)/);
  assert.doesNotMatch(titleCss, /backdrop-filter\s*:/);
  assert.match(titleCss, /background:\s*linear-gradient\(180deg,var\(--team-brand-surface-elevated/);
});