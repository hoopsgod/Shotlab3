import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { minifyVisualAuthorityCss } from "../scripts/minify-visual-authority-css.mjs";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");

const parity = read("../public/shotlab-v8-demo-parity.css");
const sessionIntegrity = read("../public/shotlab-v15-session-integrity.css");
const legacy = read("../src/styles/appLegacyStyles.js");
const secondary = read("../src/components/SecondaryPageSystem.css");
const titleStage = read("../src/components/TeamIdentityTitleStage.css");

test("light-canvas parity targets structural shells without erasing component surfaces", () => {
  assert.match(parity, /:is\(\.page,\.pageShell,\.performance-shell,\.performance-workspace,\.secondaryPageShell\)/);
  assert.doesNotMatch(parity, /\[class\*="page" i\]/);
  assert.doesNotMatch(parity, /\[class\*="dashboard" i\]/);
});

test("production CSS minification preserves descendant combinators before pseudo-classes", () => {
  const output = minifyVisualAuthorityCss(`
    html :is(.page, .pageShell) { background-color: transparent !important; }
    .secondaryPageDecision :is(h2, p) { color: white; }
  `);

  assert.match(output, /html :is\(\.page,\.pageShell\)/);
  assert.match(output, /\.secondaryPageDecision :is\(h2,p\)/);
  assert.doesNotMatch(output, /html:is/);
  assert.doesNotMatch(output, /secondaryPageDecision:is/);
});

test("legacy hero authority no longer repaints modern semantic hero components", () => {
  assert.doesNotMatch(legacy, /\[class\*="Hero"\]/);
  assert.doesNotMatch(legacy, /\[class\*="hero"\]/);
  assert.doesNotMatch(legacy, /\[class\*="Session"\]/);
  assert.doesNotMatch(legacy, /\[class\*="session"\]/);
});

test("dark title authority uses explicit surface contracts instead of test-id heuristics", () => {
  assert.match(sessionIntegrity, /\[data-home-role="primary"\]/);
  assert.match(sessionIntegrity, /\[data-command-role="primary"\]/);
  assert.match(sessionIntegrity, /\.secondaryPageDecision/);
  assert.match(sessionIntegrity, /\.coachPlayerProfileHero/);
  assert.doesNotMatch(sessionIntegrity, /\[data-testid\*="signal"\]/);
  assert.doesNotMatch(sessionIntegrity, /\[data-testid\*="insight"\]/);
});

test("Coach Players preserves dark surfaces wherever light foreground copy is intentional", () => {
  assert.match(titleStage, /\.teamIdentityTitleStage__action--primary\s*\{[^}]*background:\s*#202522;[^}]*color:\s*#f9faf6;/);
  assert.match(secondary, /\.secondaryPageDecision\s*\{[\s\S]*linear-gradient\(145deg,\s*#171b18,\s*#0c0f0d 72%\);[\s\S]*color:\s*#f5f7f4;/);
  assert.match(secondary, /\.coachPlayerProfileHero\s*\{[\s\S]*linear-gradient\(145deg,\s*#171b18,\s*#0c0f0d 72%\);[\s\S]*color:\s*#f5f7f4;/);
});
