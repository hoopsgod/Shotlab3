import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/components/CoachCommandCenter.jsx", import.meta.url), "utf8");
const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");

test("Mission Control keeps the coach logo prominent, tappable, and visible for dark or light marks", () => {
  assert.match(source, /className="mcHeroTeamMark"/);
  assert.match(source, /onClick=\{openBrandingSettings\}/);
  assert.match(source, /src=\{cleanMarkLogoUrl\}/);
  assert.match(html, /button\.mcHeroTeamMark::after\{content:none!important;display:none!important\}/);
  assert.match(html, /button\.mcHeroTeamMark>span\{display:none!important\}/);
  assert.match(html, /button\.mcHeroTeamMark\{display:grid!important;visibility:visible!important;opacity:1!important;z-index:20!important;width:132px!important;height:132px!important/);
  assert.match(html, /button\.mcHeroTeamMark img\{[\s\S]*mix-blend-mode:normal!important/);
  assert.match(html, /@media\(max-width:700px\)\{[\s\S]*button\.mcHeroTeamMark\{width:112px!important;height:112px!important/);
});
