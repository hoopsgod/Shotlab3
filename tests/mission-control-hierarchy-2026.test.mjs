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
const shellCss = fs.readFileSync(new URL("../src/components/CoachMissionControlShell.css", import.meta.url), "utf8");

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
  assert.ok(authority > app);
  assert.ok(hierarchy > foundation);
  assert.match(index, /shotlab-phase2-critical\.css/);
  assert.doesNotMatch(index, /appendChild\(sheet\)/);
  assert.equal(main.includes("mission-control-canonical.css"), false);
});

test("Mission Control preserves the interaction contract while mobile may hide duplicate utility chrome", () => {
  for (const contract of ["mcTeamSelect","mcBell","mcMobileMenu","mcHeroTeamMark","coach-primary-objective","coach-primary-metrics","mcRealityStrip","mcPrimary","openBrandingSettings","openInbox"]) {
    assert.match(commandCenter, new RegExp(contract.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(commandCenter, /is-mobile-shell/);
});

test("Coach Home base composition stays source-owned and the runtime shell bridge owns the verified iPhone parity correction", () => {
  assert.match(commandCenter, /import "\.\/CoachMissionControlTitleStage\.css"/);
  assert.match(commandCenter, /import "\.\/CoachMissionControlShell\.css"/);
  assert.match(commandCenter, /data-team-identity-stage="coach-mission-control"/);
  assert.match(commandCenter, /mcHeroIdentity/);
  assert.doesNotMatch(commandCenter, /MOBILE_PRODUCT_RESET_CSS|<style>/);
  assert.match(titleCss, /Canonical Coach Home prototype-composition authority/);
  assert.match(titleCss, /\.mcTeamHealth\s*\{[\s\S]*?background:\s*linear-gradient\(180deg,var\(--team-brand-surface-deep/);
  assert.match(titleCss, /\.mcRealityStrip\s*\{/);
  assert.match(titleCss, /grid-template-columns:\s*repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(titleCss, /\.mcPrimary\s*\{/);

  assert.match(shellCss, /\.mcShellV3\.is-mobile-shell > \.mcRail\{display:none!important\}/);
  assert.match(shellCss, /@media\(max-width:700px\)/);
  assert.match(shellCss, /\.mcHeader\[data-testid="mission-control-team-header"\]\{display:none!important\}/);
  assert.match(shellCss, /\.mcHero\[data-team-identity-stage="coach-mission-control"\]\{min-height:334px!important\}/);
  assert.match(shellCss, /\.mcProgramIdentity\{font:780 11px\/1\.2/);
  assert.match(shellCss, /h1\{[^}]*clamp\(40px,10\.2vw,44px\)[^}]*"Barlow Condensed"/);
  assert.match(shellCss, /\.mcHeroContent>p\{[^}]*font:520 14px\/1\.42/);

  const supportCss = stripComments(css);
  assert.doesNotMatch(supportCss, /\.mcShellV3\b|\.missionControl\b|\.mcHero\b|\.mcSection\b/);
  assert.match(supportCss, /\[data-testid="coach-assignment-accountability"\]/);
  assert.match(supportCss, /\[data-testid="coach-follow-up-queue"\]/);
});

test("late global hierarchy layers cannot redesign Coach Home identity or decision surfaces", () => {
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
  assert.match(cascadeLock, /CoachMissionControlShell\.css owns the legacy parent-shell[\s\S]*CoachMissionControlTitleStage\.css owns the page itself/);
});

test("critical cascade remains narrowly scoped to support rows", () => {
  assert.doesNotMatch(criticalCss, /\.mcRealityStrip\b|\.mcPrimary\b|\.mcAttentionRow\b/);
  assert.match(criticalCss, /\.mcAssignmentAccountabilityRow/);
  assert.match(criticalCss, /mobile-navigation-sheet/);
});

test("shared support tokens remain explicit light-surface values", () => {
  assert.match(css, /--support-ink:\s*#111a21/);
  assert.match(css, /--support-muted:\s*#56636c/);
  assert.match(css, /--support-line:\s*rgba\(17,26,33,\.1\)/);
  assert.match(css, /background:\s*#fffefa/);
  assert.doesNotMatch(css, /--support-ink:\s*var\(/);
  assert.doesNotMatch(css, /--support-muted:\s*var\(/);
});

test("mobile hierarchy has one visible introduction and retains safe viewport containment", () => {
  assert.match(titleCss, /@media\s*\(\s*max-width:\s*700px\s*\)/);
  assert.match(titleCss, /\.mcHeroIdentity[\s\S]*grid-template-columns:\s*minmax\(0,1fr\) var\(--coach-hero-crest\)/);
  assert.match(shellCss, /\.mcShellV3\.is-mobile-shell\{[^}]*overflow-x:clip!important/);
  assert.match(shellCss, /text-size-adjust:100%!important/);
  assert.match(shellCss, /body\.mission-control-active \.mcShellV3\.is-mobile-shell \.mcHeader\[data-testid="mission-control-team-header"\]\{display:none!important\}/);
  assert.doesNotMatch(stripComments(css), /\.mcHeader\b/);
});

test("reduced motion remains source-owned", () => {
  assert.match(css, /@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)/);
  assert.match(css, /animation:\s*none/);
  assert.match(titleCss, /@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)/);
  assert.doesNotMatch(titleCss, /backdrop-filter\s*:/);
});
