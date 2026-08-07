import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/components/CoachCommandCenter.jsx", import.meta.url), "utf8");
const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const hierarchyCss = fs.readFileSync(new URL("../src/styles/MissionControlHierarchy2026.css", import.meta.url), "utf8");

test("Mission Control keeps the coach logo visible, prominent, tappable, and owned by the current hierarchy", () => {
  assert.match(source, /className="mcHeroTeamMark"/);
  assert.match(source, /onClick=\{openBrandingSettings\}/);
  assert.match(source, /src=\{cleanMarkLogoUrl\}/);
  assert.doesNotMatch(html, /mission-control-logo-lock\.css/);
  assert.match(hierarchyCss, /\.mcHeroTeamMark\s*\{/);
  assert.match(hierarchyCss, /width:\s*clamp\(92px, 14vw, 132px\) !important/);
  assert.match(hierarchyCss, /background:\s*transparent !important/);
  assert.match(hierarchyCss, /\.mcHeroTeamMark img[\s\S]*object-fit:\s*contain !important/);
  assert.match(hierarchyCss, /mask-image:\s*none !important/);
  assert.match(hierarchyCss, /@media \(max-width: 700px\)[\s\S]*width:\s*64px !important/);
});
