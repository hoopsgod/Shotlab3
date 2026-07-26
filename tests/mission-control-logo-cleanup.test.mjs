import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/components/CoachCommandCenter.jsx", import.meta.url), "utf8");
const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const logoLockCss = fs.readFileSync(new URL("../public/mission-control-logo-lock.css", import.meta.url), "utf8");

test("Mission Control keeps the coach logo visible, prominent, tappable, and free of decorative badges", () => {
  assert.match(source, /className="mcHeroTeamMark"/);
  assert.match(source, /onClick=\{openBrandingSettings\}/);
  assert.match(source, /src=\{cleanMarkLogoUrl\}/);
  assert.match(html, /href="\/mission-control-logo-lock\.css"/);
  assert.doesNotMatch(html, /mcHeroTeamMark::after/);
  assert.match(logoLockCss, /button\.mcHeroTeamMark::after\s*\{[\s\S]*content:\s*none\s*!important/);
  assert.match(logoLockCss, /button\.mcHeroTeamMark\s*\{[\s\S]*visibility:\s*visible\s*!important/);
  assert.match(logoLockCss, /width:\s*132px\s*!important/);
  assert.match(logoLockCss, /@media\s*\(max-width:\s*700px\)[\s\S]*width:\s*112px\s*!important/);
  assert.match(logoLockCss, /mix-blend-mode:\s*normal\s*!important/);
  assert.match(logoLockCss, /mask-image:\s*none\s*!important/);
});
