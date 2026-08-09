import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/lib/visualSystemReboot.js", import.meta.url), "utf8");
const bootstrap = fs.readFileSync(new URL("../src/lib/coachActivationPath.js", import.meta.url), "utf8");
const playerBootstrap = fs.readFileSync(new URL("../src/components/PlayerDailyCommandCenter.jsx", import.meta.url), "utf8");

test("visual reboot creates one light product language across coach surfaces", () => {
  assert.match(source, /product-light-v2/);
  assert.match(source, /--sl-canvas/);
  assert.match(source, /body\.mission-control-active/);
  assert.match(source, /\.secondaryPageShell/);
  assert.match(source, /coach-assignment-accountability/);
  assert.match(source, /\.coachDashboardNoResults/);
});

test("reboot removes legacy poster proportions and yields secondary-page ownership to the component system", () => {
  assert.match(source, /mcHero[\s\S]*min-height: 0 !important/);
  assert.match(source, /mcHeroContent[\s\S]*grid-template-columns/);
  assert.match(source, /const secondaryStart = CSS\.indexOf\("\/\* Canonical secondary pages:"\)/);
  assert.match(source, /const secondaryEnd = CSS\.indexOf\("\/\* Empty states:"/);
  assert.match(source, /CSS\.slice\(0, secondaryStart\).*CSS\.slice\(secondaryEnd\)/s);
  assert.match(source, /mcAssignmentStateFacts[\s\S]*repeat\(5/);
});

test("reboot uses restrained typography controls and responsive behavior", () => {
  assert.match(source, /SF Pro Display/);
  assert.match(source, /SF Pro Text/);
  assert.match(source, /@media \(max-width: 760px\)/);
  assert.match(source, /prefers-reduced-motion/);
  assert.match(source, /min-height: 46px/);
});

test("visual reboot installs after coach interaction enhancers without crossing into player bootstrap or adding product writes", () => {
  const coachInteractionIndex = bootstrap.indexOf("installCoachResponseLoopEnhancer();");
  const rebootIndex = bootstrap.indexOf("installVisualSystemReboot();");
  assert.ok(coachInteractionIndex >= 0 && rebootIndex > coachInteractionIndex);
  assert.doesNotMatch(bootstrap, /installPlayerAssignmentEnhancer/);
  assert.match(playerBootstrap, /installPlayerAssignmentEnhancer\(\)/);
  assert.doesNotMatch(source, /fetch\(|localStorage|sessionStorage|supabase|XMLHttpRequest|\.insert\(|\.update\(/);
});
