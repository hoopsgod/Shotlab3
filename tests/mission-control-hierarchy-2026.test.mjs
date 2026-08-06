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
  assert.match(css, /background:\s*transparent !important/);
  assert.match(css, /\.mcRealityStrip\s*\{/);
  assert.match(css, /grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(css, /\.mcPrimary\s*\{/);
  assert.match(css, /background:\s*#c8ff1a !important/);
  assert.match(css, /\.mcSection,/);
  assert.match(css, /background:\s*var\(--mc-surface\) !important/);
});

test("mobile hierarchy clears legacy clipping and preserves accessible control sizing", () => {
  assert.match(css, /@media \(max-width: 700px\)/);
  assert.match(css, /min-height:\s*44px !important/);
  assert.match(css, /\.mcHeroContent[\s\S]*grid-template-columns:\s*minmax\(0, 1fr\) 68px !important/);
  assert.match(css, /\.mcHero\s*\{[^}]*max-height:\s*none !important/s);
  assert.equal(/\.mcHero\s*\{[^}]*max-height:\s*(?!none)/s.test(css), false, "hero must explicitly reject clipping height caps");
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
