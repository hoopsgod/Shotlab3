import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const enhancer = readFileSync("scripts/apply-phase3n-player-commitments.mjs", "utf8");
const component = readFileSync("src/components/PlayerCommitmentCenter.jsx", "utf8");
const css = readFileSync("src/components/PlayerCommitmentCenter.module.css", "utf8");
const screenshots = readFileSync("tests/e2e/phase-3n-player-commitments-screenshots.spec.mjs", "utf8");
const screenshotConfig = readFileSync("playwright.screenshots.config.mjs", "utf8");
const pkg = JSON.parse(readFileSync("package.json", "utf8"));

test("Phase 3N runs after accepted Phase 3M with a guarded idempotent route transform", () => {
  assert.match(pkg.scripts.dev, /apply-phase3m-player-team-store-retail\.mjs[\s\S]*apply-phase3n-player-commitments\.mjs/);
  assert.match(pkg.scripts["prepare:route-enhancers"], /apply-phase3m-player-team-store-retail\.mjs[\s\S]*apply-phase3n-player-commitments\.mjs/);
  assert.match(enhancer, /expected exactly one anchor/);
  assert.match(enhancer, /const marker = 'PlayerCommitmentCenter mode="events"'/);
  assert.match(enhancer, /source\.includes\(marker\)/);
  assert.match(enhancer, /Player Commitments hierarchy already applied/);
});

test("Events and S&C use one specialized player commitment hierarchy instead of duplicate generic command bars", () => {
  for (const seam of [
    'PlayerCommitmentCenter mode="events"',
    'PlayerCommitmentCenter mode="strength"',
    'data-testid="player-events-operational-list"',
    'data-testid="player-strength-operational-panel"',
  ]) assert.ok(enhancer.includes(seam), `missing specialized commitment seam: ${seam}`);
  assert.match(enhancer, /specialized commitment route still contains retired generic command bar/);
});

test("Phase 3N preserves RSVP, S&C RSVP, logging, and completion capabilities", () => {
  for (const preserved of [
    "toggleRsvp={toggleRsvp}",
    "toggleScRsvp={toggleScRsvp}",
    "addScLog={addScLog}",
    "onCompletionCue={pushCompletionCue}",
    "<EventsPanel events={events}",
    "<SCPanel sessions={scSessions}",
  ]) assert.ok(enhancer.includes(preserved), `missing preserved player commitment capability: ${preserved}`);
});

test("PlayerCommitmentCenter exposes route identity, next action, runway, and progressive disclosure", () => {
  for (const seam of [
    "player-commitment-route-header-",
    "player-commitment-hero-",
    "player-commitment-queue-",
    "player-commitment-details-",
    "NEXT TEAM COMMITMENT",
    "NEXT DEVELOPMENT BLOCK",
    "FULL WORKSPACE",
  ]) assert.ok(component.includes(seam), `missing player commitment UI seam: ${seam}`);
  assert.match(component, /<details/);
  assert.match(component, /onAction\?\.\(model\.primaryAction\)/);
});

test("Phase 3N visual system keeps route-first hierarchy and iPhone containment", () => {
  assert.match(css, /\.routeTitleRow h1[\s\S]*clamp\(/);
  assert.match(css, /\.hero[\s\S]*linear-gradient/);
  assert.match(css, /\.signalStrip[\s\S]*grid-template-columns: repeat\(3/);
  assert.match(css, /\.queue[\s\S]*background: rgba\(255, 255, 255, \.94\)/);
  assert.match(css, /\.details\[open\]/);
  assert.match(css, /@media \(max-width: 759px\)/);
  assert.match(css, /prefers-reduced-motion: reduce/);
});

test("fresh iPhone evidence covers both commitment routes and verifies legacy controls on demand", () => {
  assert.match(screenshotConfig, /phase-3n-player-commitments-screenshots\.spec\.mjs/);
  assert.match(screenshots, /04n-player-events-commitment/);
  assert.match(screenshots, /04o-player-strength-commitment/);
  assert.match(screenshots, /scrollWidth - window\.innerWidth/);
  assert.match(screenshots, /player-events-operational-list/);
  assert.match(screenshots, /player-strength-operational-panel/);
  assert.match(screenshots, /toBeHidden/);
  assert.match(screenshots, /toBeVisible/);
});
