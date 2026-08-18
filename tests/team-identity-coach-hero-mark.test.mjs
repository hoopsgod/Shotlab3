import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { keepCoachHeroMarkVisible } from "../scripts/apply-team-identity-coach-hero-mark.mjs";

const hidden = 'body.mission-control-active [data-mobile-product-reset="phase-1"] .mcHeroTeamMark{display:none!important}';
const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("Coach mobile hero repair replaces the legacy hidden mark with a full-size visible crest", () => {
  const output = keepCoachHeroMarkVisible(`@media(max-width:700px){${hidden}}`);
  assert.doesNotMatch(output, /mcHeroTeamMark\{display:none!important\}/);
  assert.match(output, /mcHeroTeamMark\{display:grid!important;[^}]*width:clamp\(112px,30vw,128px\)!important;[^}]*height:clamp\(112px,30vw,128px\)!important/);
  assert.match(output, /mcHeroTeamMark \.mcTeamFallback\{display:grid!important;width:100%!important;height:100%!important/);
});

test("Coach mobile hero repair is idempotent", () => {
  const once = keepCoachHeroMarkVisible(hidden);
  assert.equal(keepCoachHeroMarkVisible(once), once);
});

test("route enhancer runs the Coach crest repair immediately after the legacy signature-stage mutation", () => {
  const routes = read("scripts/run-route-enhancers.mjs");
  const legacyAt = routes.indexOf("scripts/apply-mobile-coach-signature-stage.mjs");
  const repairAt = routes.indexOf("scripts/apply-team-identity-coach-hero-mark.mjs");
  const brandingAt = routes.indexOf("scripts/apply-team-identity-branding-boundary.mjs");
  assert.ok(legacyAt >= 0);
  assert.ok(repairAt > legacyAt);
  assert.ok(brandingAt > repairAt);
});
