import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const primitivesCss = fs.readFileSync("src/components/CoachDashboardPrimitives.module.css", "utf8");
const integrationCss = fs.readFileSync("src/styles/CoachInteractiveDashboard.css", "utf8");

const systemFontPattern = /-apple-system,\s*BlinkMacSystemFont,\s*'SF Pro (?:Display|Text)'/;

test("secondary coach workspaces use the Mission Control typography and material language", () => {
  assert.match(primitivesCss, systemFontPattern);
  assert.doesNotMatch(primitivesCss, /'Bebas Neue'|'Barlow Condensed'/);
  assert.match(primitivesCss, /border-radius:\s*28px/);
  assert.match(primitivesCss, /backdrop-filter:\s*blur\(28px\)/);
  assert.match(primitivesCss, /rgba\(255, 255, 255, \.0(?:6|7)5\)/);
  assert.match(integrationCss, systemFontPattern);
});

test("iPhone dashboards keep actions prominent and metrics compact", () => {
  assert.match(primitivesCss, /@media \(max-width: 820px\)[\s\S]*?\.metricStrip\s*\{[\s\S]*?display:\s*flex/);
  assert.match(primitivesCss, /scroll-snap-type:\s*x proximity/);
  assert.match(primitivesCss, /\.metric\s*\{[\s\S]*?flex:\s*0 0 min\(76vw, 250px\)/);
  assert.match(primitivesCss, /@media \(max-width: 480px\)[\s\S]*?\.commandActions\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2/);
  assert.match(primitivesCss, /min-height:\s*44px/);
});

test("modernized coach workspaces preserve accessibility and reduced-motion behavior", () => {
  assert.match(primitivesCss, /:focus-visible/);
  assert.match(primitivesCss, /outline-offset:\s*2px/);
  assert.match(primitivesCss, /env\(safe-area-inset-bottom/);
  assert.match(primitivesCss, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(integrationCss, /@media \(prefers-reduced-motion: reduce\)/);
});
