import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const main = fs.readFileSync(new URL("../src/main.jsx", import.meta.url), "utf8");
const authenticatedAuthority = fs.readFileSync(new URL("../src/styles/AuthenticatedVisualAuthority2026.css", import.meta.url), "utf8");
const index = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../src/styles/MissionControlHierarchy2026.css", import.meta.url), "utf8");
const cascadeLock = fs.readFileSync(new URL("../src/styles/MissionControlCascadeLock2026.css", import.meta.url), "utf8");
const criticalCss = fs.readFileSync(new URL("../public/shotlab-phase2-critical.css", import.meta.url), "utf8");
const commandCenter = fs.readFileSync(new URL("../src/components/CoachCommandCenter.jsx", import.meta.url), "utf8");
const titleCss = fs.readFileSync(new URL("../src/components/CoachMissionControlTitleStage.css", import.meta.url), "utf8");
const headerCss = fs.readFileSync(new URL("../src/components/CoachMissionControlHeader.css", import.meta.url), "utf8");

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

test("Phase 2 source owns one dominant premium Coach hero and its team identity geometry", () => {
  assert.match(commandCenter, /import "\.\/CoachMissionControlTitleStage\.css"/);
  assert.match(commandCenter, /data-team-identity-stage="coach-mission-control"/);
  assert.match(commandCenter, /mcHeroIdentity/);
  assert.doesNotMatch(commandCenter, /MOBILE_PRODUCT_RESET_CSS|<style>/);
  assert.match(titleCss, /Coach Home title authority/);
  assert.match(titleCss, /\.mcHero\[data-team-identity-stage="coach-mission-control"\][\s\S]*min-height:\s*clamp\(420px,\s*112vw,\s*468px\)/);
  assert.match(titleCss, /\.mcHeroContent[\s\S]*width:\s*100%[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  assert.match(titleCss, /\.mcHeroIdentity[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\) var\(--coach-hero-crest\)/);
  assert.match(titleCss, /--coach-hero-crest:\s*clamp\(108px,\s*30vw,\s*124px\)/);
  assert.match(titleCss, /\.mcHeroTeamMark[\s\S]*width:\s*var\(--coach-hero-crest\)[\s\S]*height:\s*var\(--coach-hero-crest\)/);
  assert.match(titleCss, /\.mcHeroTeamMark img[\s\S]*object-fit:\s*contain/);
  assert.match(titleCss, /\sh1[\s\S]*font-size:\s*clamp\(46px,\s*12vw,\s*58px\)/);
  assert.doesNotMatch(titleCss, /!important|html\s+body\s+#root/);
  assert.match(css, /\.mcRealityStrip\s*\{/);
  assert.match(css, /grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(css, /\.mcPrimary\s*\{/);
  assert.match(css, /\.mcSection,/);
});

test("late hierarchy and critical layers cannot redesign or hide Coach title identity", () => {
  for (const lateAuthority of [css, cascadeLock, criticalCss]) {
    assert.doesNotMatch(lateAuthority, /\.mcHeroTeamMark\s*\{[^}]*display:\s*none/s);
    assert.doesNotMatch(lateAuthority, /\.mcHeroTeamMark\s*\{[^}]*width\s*:/s);
    assert.doesNotMatch(lateAuthority, /\.mcHero\s+h1\s*\{[^}]*font-size\s*:/s);
    assert.doesNotMatch(lateAuthority, /\.mcHeroContent\s*\{[^}]*grid-template-columns\s*:/s);
    assert.doesNotMatch(lateAuthority, /\.mcHeroContent\s*>\s*p\s*\{[^}]*max-width\s*:/s);
  }
  assert.doesNotMatch(criticalCss, /\[data-testid="coach-primary-objective"\]/);
  assert.doesNotMatch(criticalCss, /\.mcHero\s*,|\.mcHeroContent\s*\{/);
  assert.match(criticalCss, /Title\/Hero composition is intentionally excluded and source-owned/);
  assert.match(cascadeLock, /Coach Hero identity, crest, title, summary and Hero geometry are source-owned/);
});

test("critical cascade remains narrowly scoped to commands and support rows", () => {
  assert.match(criticalCss, /\.mcPrimary\s*\{[\s\S]*display:\s*inline-flex !important/s);
  assert.match(criticalCss, /\.mcAttentionRow/);
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
  assert.match(css, /min-height:\s*44px !important/);
  assert.match(headerCss, /@media\(max-width:700px\)[\s\S]*\.mcHeader\{[\s\S]*grid-template-columns:44px minmax\(0,1fr\) 44px/);
  assert.match(titleCss, /\.mcHeroContent[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  assert.match(titleCss, /\.mcHeroIdentity[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\) var\(--coach-hero-crest\)/);
  assert.match(titleCss, /\.mcHero\[data-team-identity-stage="coach-mission-control"\][\s\S]*max-height:\s*none/);
  assert.equal(/\.mcTeamSelect[^}]*display:\s*none/s.test(css), false);
  assert.equal(/\.mcBell[^}]*display:\s*none/s.test(css), false);
  assert.equal(/\.mcMobileMenu[^}]*display:\s*none/s.test(css), false);
});

test("Phase 2 includes reduced motion and reduced transparency handling", () => {
  assert.match(css, /prefers-reduced-transparency: reduce/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /backdrop-filter:\s*none !important/);
  assert.match(css, /animation:\s*none !important/);
});
