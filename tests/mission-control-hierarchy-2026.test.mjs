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

test("Phase 2 preserves the existing Mission Control interaction contract", () => {
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

test("Phase 2 source owns one shared-grammar Coach identity chapter plus a dominant decision surface", () => {
  assert.match(commandCenter, /import "\.\/CoachMissionControlTitleStage\.css"/);
  assert.match(commandCenter, /data-team-identity-stage="coach-mission-control"/);
  assert.match(commandCenter, /mcHeroIdentity/);
  assert.doesNotMatch(commandCenter, /MOBILE_PRODUCT_RESET_CSS|<style>/);
  assert.match(titleCss, /Phase 4 Coach Home title-stage authority/);
  assert.match(titleCss, /\.mcHero\[data-team-identity-stage="coach-mission-control"\][\s\S]*min-height:\s*382px/);
  assert.match(titleCss, /\.mcHeroContent[\s\S]*width:\s*100%[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  assert.match(titleCss, /\.mcHeroIdentity[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\) var\(--coach-hero-crest\)/);
  assert.match(titleCss, /--coach-hero-crest:\s*clamp\(96px,\s*26vw,\s*108px\)/);
  assert.match(titleCss, /\.mcHeroTeamMark[\s\S]*width:\s*var\(--coach-hero-crest\)[\s\S]*height:\s*var\(--coach-hero-crest\)/);
  assert.match(titleCss, /\.mcHeroTeamMark img[\s\S]*object-fit:\s*contain/);
  assert.doesNotMatch(titleCss, /\.mcHeroIdentity::after[\s\S]*content:\s*"Mission Control"/);
  assert.match(titleCss, /\sh1[\s\S]*clamp\(39px,\s*10\.5vw,\s*45px\)/);
  assert.doesNotMatch(titleCss, /!important|html\s+body\s+#root/);
  assert.match(titleCss, /\.mcRealityStrip\s*\{/);
  assert.match(titleCss, /grid-template-columns:\s*repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(titleCss, /\.mcPrimary\s*\{/);
  assert.doesNotMatch(css, /\.mcRealityStrip\b|\.mcPrimary\b/);
  assert.match(css, /\.mcSection,/);
});

test("late hierarchy and compatibility layers cannot redesign Coach Home identity or decision surfaces", () => {
  for (const lateAuthority of [css, cascadeLock, criticalCss]) {
    assert.doesNotMatch(lateAuthority, /\.mcHeroTeamMark\s*\{[^}]*display:\s*none/s);
    assert.doesNotMatch(lateAuthority, /\.mcHeroTeamMark\s*\{[^}]*width\s*:/s);
    assert.doesNotMatch(lateAuthority, /\.mcHero\s+h1\s*\{[^}]*font-size\s*:/s);
    assert.doesNotMatch(lateAuthority, /\.mcHeroContent\s*\{[^}]*grid-template-columns\s*:/s);
    assert.doesNotMatch(lateAuthority, /\.mcHeroContent\s*>\s*p\s*\{[^}]*max-width\s*:/s);
    assert.doesNotMatch(lateAuthority, /\.mcHeader\s*\{[^}]*grid-template-columns\s*:/s);
    assert.doesNotMatch(lateAuthority, /\.mcRealityStrip\b|\.mcPrimary\b/);
  }
  for (const compatibilityLayer of [foundationCss, mobileCorrectionsCss]) {
    assert.doesNotMatch(compatibilityLayer, /\.mcRealityStrip\b/);
    assert.doesNotMatch(compatibilityLayer, /\.mcPrimary\b/);
  }
  assert.doesNotMatch(criticalCss, /\[data-testid="coach-primary-objective"\]/);
  assert.doesNotMatch(criticalCss, /\.mcHero\s*,|\.mcHeroContent\s*\{/);
  assert.match(criticalCss, /Coach Home identity, decision, metrics and CTA are intentionally excluded[\s\S]*source-owned by CoachMissionControlTitleStage\.css/);
  assert.match(cascadeLock, /Coach mobile header,[\s\S]*identity,[\s\S]*decision,[\s\S]*metrics,[\s\S]*CTA and Athlete Attention are component-owned/);
});

test("critical cascade remains narrowly scoped to support rows", () => {
  assert.doesNotMatch(criticalCss, /\.mcRealityStrip\b|\.mcPrimary\b|\.mcAttentionRow\b/);
  assert.match(criticalCss, /\.mcAssignmentAccountabilityRow/);
  assert.match(criticalCss, /mobile-navigation-sheet/);
});

test("light support tokens cannot inherit legacy dark shell variables", () => {
  assert.match(css, /--mc-surface:\s*#ffffff/);
  assert.match(css, /--mc-surface-quiet:\s*#f5f4ef/);
  assert.match(css, /--mc-ink:\s*#111a21/);
  assert.match(css, /--mc-muted:\s*#44515b/);
  assert.doesNotMatch(css, /--mc-surface:\s*var\(--surface-1/);
  assert.doesNotMatch(css, /--mc-surface-quiet:\s*var\(--surface-3/);
});

test("mobile hierarchy preserves safe controls while Coach title composition stays source-owned", () => {
  assert.match(titleCss, /@media \(max-width:\s*700px\)/);
  assert.match(titleCss, /\.mcMobileMenu,[\s\S]*\.mcBell\s*\{[\s\S]*width:\s*44px;[\s\S]*height:\s*44px;/);
  assert.match(titleCss, /\.mcHeader\[data-testid="mission-control-team-header"\][\s\S]*grid-template-columns:\s*44px minmax\(0,1fr\) 44px/);
  assert.match(titleCss, /\.mcHeroContent[\s\S]*grid-template-columns:\s*minmax\(0,1fr\)/);
  assert.match(titleCss, /\.mcHeroIdentity[\s\S]*grid-template-columns:\s*minmax\(0,1fr\) var\(--coach-hero-crest\)/);
  assert.match(titleCss, /\.mcHero\[data-team-identity-stage="coach-mission-control"\][\s\S]*max-height:\s*none/);
  assert.match(titleCss, /\.mcHeaderTeamMark\s*\{[\s\S]*display:\s*grid/);
  assert.match(titleCss, /\.mcTeamSelect\s*\{\s*display:\s*none/);
  assert.doesNotMatch(css, /\.mcHeader\s*\{/);
});

test("Phase 2 keeps reduced motion and avoids transparency-dependent Coach identity chrome", () => {
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /animation:\s*none !important/);
  assert.match(titleCss, /backdrop-filter:\s*none/);
  assert.match(titleCss, /-webkit-backdrop-filter:\s*none/);
});
