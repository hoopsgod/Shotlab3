import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/lib/visualSystemReboot.js", import.meta.url), "utf8");
const releaseFixes = fs.readFileSync(new URL("../src/lib/visualSystemRebootReleaseFixes.js", import.meta.url), "utf8");
const bootstrap = fs.readFileSync(new URL("../src/lib/coachActivationPath.js", import.meta.url), "utf8");
const playerBootstrap = fs.readFileSync(new URL("../src/components/PlayerDailyCommandCenter.jsx", import.meta.url), "utf8");

test("visual reboot owns one restrained Mission Control support language", () => {
  assert.match(source, /product-light-v3-mission-control/);
  assert.match(source, /--sl-canvas/);
  assert.match(source, /body\.mission-control-active/);
  assert.match(source, /coach-assignment-accountability/);
});

test("runtime reboot layers cannot compete with source-owned Coach Hero or secondary-page authorities", () => {
  assert.doesNotMatch(source, /\.mcHero\b|\.mcHeroContent\b|\.mcHeroLogo\b|\.mcEyebrow\b/);
  assert.doesNotMatch(releaseFixes, /\.mcHero\b|\.mcHeroContent\b|\.mcHeroLogo\b|\.mcEyebrow\b/);
  assert.match(source, /mcAssignmentStateFacts[\s\S]*repeat\(5/);
  assert.doesNotMatch(source, /\.secondaryPageShell|\.secondaryPageDecision|\.secondaryPageEvidence/);
  assert.doesNotMatch(source, /\[class\s*\*=|\[data-testid\s*\*=/i);
  assert.doesNotMatch(source, /EmptyState|emptyState|coachDashboardNoResults/);
  assert.doesNotMatch(source, /secondaryStart|secondaryEnd|CSS\.slice/);
});

test("reboot uses restrained typography controls and responsive behavior", () => {
  assert.match(source, /SF Pro Display/);
  assert.match(source, /SF Pro Text/);
  assert.match(source, /@media \(max-width: 760px\)/);
  assert.match(source, /prefers-reduced-motion/);
  assert.match(source, /min-height: 50px/);
});

test("visual reboot installs after coach interaction enhancers without crossing into player bootstrap or adding product writes", () => {
  const coachInteractionIndex = bootstrap.indexOf("installCoachResponseLoopEnhancer();");
  const rebootIndex = bootstrap.indexOf("installVisualSystemReboot();");
  assert.ok(coachInteractionIndex >= 0 && rebootIndex > coachInteractionIndex);
  assert.doesNotMatch(bootstrap, /installPlayerAssignmentEnhancer/);
  assert.match(playerBootstrap, /installPlayerAssignmentEnhancer\(\)/);
  assert.doesNotMatch(source, /fetch\(|localStorage|sessionStorage|supabase|XMLHttpRequest|\.insert\(|\.update\(/);
});
