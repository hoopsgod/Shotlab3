import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const main = fs.readFileSync(new URL("../src/main.jsx", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../src/styles/MissionControlHierarchy2026.css", import.meta.url), "utf8");
const commandCenter = fs.readFileSync(new URL("../src/components/CoachCommandCenter.jsx", import.meta.url), "utf8");

const indexOfOrFail = (source, value) => {
  const index = source.indexOf(value);
  assert.notEqual(index, -1, `Expected source to contain ${value}`);
  return index;
};

test("Mission Control hierarchy loads after the canonical visual foundation", () => {
  const foundation = indexOfOrFail(main, "./styles/VisualFoundation2026.css");
  const hierarchy = indexOfOrFail(main, "./styles/MissionControlHierarchy2026.css");
  assert.ok(hierarchy > foundation, "Mission Control hierarchy must load after the foundation");
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

test("Phase 2 establishes one dominant performance hero and calm supporting surfaces", () => {
  assert.match(css, /\.mcHero\s*\{/);
  assert.match(css, /linear-gradient\(145deg, #0d171e 0%, #13222b 100%\)/);
  assert.match(css, /\.mcHeroTeamMark\s*\{/);
  assert.match(css, /z-index:\s*4 !important/);
  assert.match(css, /\.mcHeroContent\s*\{[\s\S]*?background:\s*transparent !important/s);
  assert.match(css, /\.mcHeroContent\s*\{[\s\S]*?box-shadow:\s*none !important/s);
  assert.match(css, /\.mcRealityStrip\s*\{/);
  assert.match(css, /grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(css, /\.mcPrimary\s*\{/);
  assert.match(css, /background:\s*#c8ff1a !important/);
  assert.match(css, /\.mcSection,/);
  assert.match(css, /background:\s*var\(--mc-surface\) !important/);
});

test("light support tokens cannot inherit legacy dark shell variables", () => {
  assert.match(css, /--mc-surface:\s*#ffffff/);
  assert.match(css, /--mc-surface-quiet:\s*#f5f4ef/);
  assert.match(css, /--mc-ink:\s*#111a21/);
  assert.match(css, /--mc-muted:\s*#44515b/);
  assert.doesNotMatch(css, /--mc-surface:\s*var\(--surface-1/);
  assert.doesNotMatch(css, /--mc-surface-quiet:\s*var\(--surface-3/);
});

test("mobile hierarchy clears legacy clipping and preserves accessible control sizing", () => {
  assert.match(css, /@media \(max-width: 700px\)/);
  assert.match(css, /min-height:\s*44px !important/);
  assert.match(css, /\.mcHeader\s*\{[\s\S]*grid-template-columns:\s*40px minmax\(0, 1fr\) auto !important/s);
  assert.match(css, /\.mcTeamSelect\s*\{[\s\S]*display:\s*inline-flex !important/s);
  assert.match(css, /\.mcHeroContent[\s\S]*grid-template-columns:\s*minmax\(0, 1fr\) 68px !important/);
  assert.match(css, /\.mcHero\s*\{[^}]*max-height:\s*none !important/s);
  assert.equal(/max-height:\s*(?:\d|clamp\(|calc\(|min\(|max\()/i.test(css), false, "hero must not include a numeric or calculated height cap");
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
