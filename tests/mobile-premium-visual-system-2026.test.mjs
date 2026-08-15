import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const systemSource = fs.readFileSync(new URL("../src/components/SecondaryPageSystem.jsx", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../src/styles/MobilePremiumVisualSystem2026.css", import.meta.url), "utf8");

test("premium mobile visual authority is loaded through the shared secondary-page system", () => {
  assert.match(systemSource, /MobilePremiumVisualSystem2026\.css/);
});

test("mobile hierarchy defines command, functional, and detail-screen density contracts", () => {
  assert.match(css, /LEVEL B — functional pages/);
  assert.match(css, /LEVEL C — detail screens/);
  assert.match(css, /LEVEL A — dashboards/);
  assert.match(css, /--type-page-mobile:/);
  assert.match(css, /--mobile-section-gap:/);
  assert.match(css, /--mobile-nav-clearance:/);
});

test("major functional page intros are compact rather than oversized title stages", () => {
  assert.match(css, /\.secondaryPageIntro\.appHeader/);
  assert.match(css, /font-size:\s*var\(--type-page-mobile\)/);
  assert.match(css, /padding:\s*3px\s+0\s+14px/);
  assert.match(css, /\.secondaryPageDecision/);
  assert.match(css, /min-height:\s*0/);
  assert.doesNotMatch(css, /font-size:\s*(?:5[0-9]|[6-9][0-9])px[^;]*!important/);
});

test("persistent player identity is compact and mobile navigation reserves safe-area clearance", () => {
  assert.match(css, /player-dashboard-identity-header/);
  assert.match(css, /min-height:\s*62px/);
  assert.match(css, /mobile-navigation-dock/);
  assert.match(css, /env\(safe-area-inset-bottom/);
  assert.match(css, /padding-bottom:\s*var\(--mobile-nav-clearance\)/);
});

test("visual system protects narrow widths, long data, accessibility, and reduced motion", () => {
  assert.match(css, /@media\s*\(max-width:\s*390px\)/);
  assert.match(css, /@media\s*\(min-width:\s*391px\)\s*and\s*\(max-width:\s*430px\)/);
  assert.match(css, /overflow-x:\s*clip/);
  assert.match(css, /overflow-wrap:\s*anywhere/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /prefers-reduced-transparency:\s*reduce/);
});
