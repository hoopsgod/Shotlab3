import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/components/CoachCommandCenter.jsx", import.meta.url), "utf8");
const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");

test("Mission Control keeps the coach logo visible, tappable, and free of decorative badges", () => {
  assert.match(source, /className="mcHeroTeamMark"/);
  assert.match(source, /onClick=\{openBrandingSettings\}/);
  assert.match(source, /src=\{cleanMarkLogoUrl\}/);
  assert.match(html, /button\.mcHeroTeamMark::after\{content:none!important;display:none!important\}/);
  assert.match(html, /button\.mcHeroTeamMark>span\{display:none!important\}/);
});
