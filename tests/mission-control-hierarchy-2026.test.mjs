import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const main = fs.readFileSync(new URL("../src/main.jsx", import.meta.url), "utf8");
const authenticatedAuthority = fs.readFileSync(new URL("../src/styles/AuthenticatedVisualAuthority2026.css", import.meta.url), "utf8");
const index = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../src/styles/MissionControlHierarchy2026.css", import.meta.url), "utf8");
const criticalCss = fs.readFileSync(new URL("../public/shotlab-phase2-critical.css", import.meta.url), "utf8");
const commandCenter = fs.readFileSync(new URL("../src/components/CoachCommandCenter.jsx", import.meta.url), "utf8");

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
  assert.match(commandCenter, /Source-owned mobile title\/identity composition/);
  assert.match(commandCenter, /\.mcHero\{margin:0 -12px!important;min-height:clamp\(420px,112vw,468px\)!important;max-height:none!important/);
  assert.match(commandCenter, /\.mcHeroContent\{display:grid!important;grid-template-columns:minmax\(0,1fr\)!important/);
  assert.match(commandCenter, /\.mcHeroIdentity\{display:grid!important;grid-template-columns:minmax\(0,1fr\) var\(--coach-hero-crest\)!important/);
  assert.match(commandCenter, /--coach-hero-crest:clamp\(108px,30vw,124px\)/);
  assert.match(commandCenter, /\.mcHeroTeamMark\{position:static!important;display:grid!important;width:var\(--coach-hero-crest\)!important;height:var\(--coach-hero-crest\)!important/);
  assert.match(commandCenter, /\.mcHeroTeamMark img\{[\s\S]*?object-fit:contain!important/);
  assert.match(commandCenter, /\.mcHero h1\{[\s\S]*?font-size:clamp\(46px,12vw,58px\)!important/);
  assert.match(css, /\.mcRealityStrip\s*\{/);
  assert.match(css, /grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(css, /\.mcPrimary\s*\{/);
  assert.match(css, /\.mcSection,/);
});

test("critical cascade uses explicit longhands and removes legacy clipping", () => {
  assert.match(criticalCss, /background-color:\s*#0d171e !important/);
  assert.match(criticalCss, /background-image:\s*linear-gradient\(145deg, #0d171e 0%, #13222b 100%\) !important/);
  assert.match(criticalCss, /\[data-testid="coach-primary-objective"\]/);
  assert.match(criticalCss, /max-height:\s*none !important/);
  assert.match(criticalCss, /\.mcPrimary\s*\{[\s\S]*display:\s*inline-flex !important/s);
  assert.match(criticalCss, /\.mcAttentionRow/);
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
  assert.match(commandCenter, /@media\(max-width:700px\)/);
  assert.match(css, /min-height:\s*44px !important/);
  assert.match(commandCenter, /\.mcHeader\{grid-template-columns:44px minmax\(0,1fr\) 44px!important/);
  assert.match(commandCenter, /\.mcHeroContent\{display:grid!important;grid-template-columns:minmax\(0,1fr\)!important/);
  assert.match(commandCenter, /\.mcHeroIdentity\{display:grid!important;grid-template-columns:minmax\(0,1fr\) var\(--coach-hero-crest\)!important/);
  assert.match(commandCenter, /\.mcHero\{[^}]*max-height:none!important/);
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
