import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/components/CoachCommandCenter.jsx", import.meta.url), "utf8");
const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const hierarchyCss = fs.readFileSync(new URL("../src/styles/MissionControlHierarchy2026.css", import.meta.url), "utf8");
const cascadeLockCss = fs.readFileSync(new URL("../src/styles/MissionControlCascadeLock2026.css", import.meta.url), "utf8");

test("Mission Control keeps the coach logo visible, prominent, tappable, uncropped, and source-owned", () => {
  assert.match(source, /className="mcHeroTeamMark"/);
  assert.match(source, /onClick=\{openBrandingSettings\}/);
  assert.match(source, /src=\{cleanMarkLogoUrl\}/);
  assert.match(source, /--coach-hero-crest:clamp\(108px,30vw,124px\)/);
  assert.match(source, /\.mcHeroTeamMark\{position:static!important;display:grid!important;width:var\(--coach-hero-crest\)!important;height:var\(--coach-hero-crest\)!important/);
  assert.match(source, /\.mcHeroTeamMark img\{[\s\S]*?object-fit:contain!important/);
  assert.match(source, /mask-image:none!important/);
  assert.doesNotMatch(html, /mission-control-logo-lock\.css/);
  assert.doesNotMatch(hierarchyCss, /\.mcHeroTeamMark\s*\{/);
  assert.doesNotMatch(cascadeLockCss, /\.mcHeroTeamMark\s*\{[^}]*display:\s*none/s);
});
