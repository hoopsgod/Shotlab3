import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const enhancer = readFileSync("scripts/apply-phase3n-player-commitments.mjs", "utf8");
const component = readFileSync("src/components/PlayerCommitmentCenter.jsx", "utf8");
const css = readFileSync("src/components/PlayerCommitmentCenter.module.css", "utf8");
const authority = readFileSync("public/shotlab-phase3n-player-commitments.css", "utf8");
const primitives = readFileSync("src/components/EventsMobilePrimitives.jsx", "utf8");
const html = readFileSync("index.html", "utf8");
const screenshots = readFileSync("tests/e2e/phase-3n-player-commitments-screenshots.spec.mjs", "utf8");
const screenshotConfig = readFileSync("playwright.screenshots.config.mjs", "utf8");
const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const routeEnhancers = readFileSync("scripts/run-route-enhancers.mjs", "utf8");

test("Phase 3N runs after accepted Phase 3M with a guarded idempotent route transform", () => {
  assert.match(pkg.scripts.dev, /run-route-enhancers\.mjs dev/);
  assert.match(pkg.scripts["prepare:route-enhancers"], /run-route-enhancers\.mjs build/);
  assert.match(routeEnhancers, /apply-phase3m-player-team-store-retail\.mjs[\s\S]*apply-phase3n-player-commitments\.mjs/);
  assert.match(enhancer, /expected exactly one anchor/);
  assert.match(enhancer, /const marker = 'PlayerCommitmentCenter mode="events"'/);
  assert.match(enhancer, /source\.includes\(marker\)/);
  assert.match(enhancer, /Player Commitments hierarchy already applied/);
});

test("Events and S&C keep one specialized player commitment integration instead of duplicate generic command bars", () => {
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

test("Player Events now exposes a personal schedule hierarchy and keeps S&C commitment disclosure", () => {
  for (const seam of [
    'data-testid="player-events-next-up"',
    'data-testid="player-events-upcoming-list"',
    'data-testid="player-commitment-details-events"',
    'data-testid="player-commitment-route-header-strength"',
    'data-testid="player-commitment-hero-strength"',
    'data-testid="player-commitment-details-strength"',
    "RSVP REQUIRED",
    "✓ GOING",
    "NEXT DEVELOPMENT BLOCK",
  ]) assert.ok(component.includes(seam), `missing player commitment UI seam: ${seam}`);
  assert.match(component, /<EventsTitleStage role="player"/);
  assert.match(component, /<EventsWeekRail/);
  assert.match(component, /<EventsMonthPanel/);
  assert.match(component, /<details/);
});

test("Player Events prioritizes the next chronological obligation and makes its personal response state explicit", () => {
  assert.match(component, /const focus = state\.upcoming\[0\] \|\| null/);
  assert.match(component, /const focusConfirmed = Boolean/);
  assert.match(component, /const focusNeedsResponse = Boolean/);
  assert.match(component, /focusNeedsResponse \? "RSVP REQUIRED" : "✓ GOING"/);
  assert.match(component, /focusNeedsResponse \? "Respond" : "Change response"/);
});

test("Player RSVP derivation remains identity and team scoped", () => {
  assert.match(component, /identityMatches\(row, userEmail\)/);
  assert.match(component, /teamMatches\(row, teamId\)/);
  assert.match(component, /const responseIds = new Set/);
  assert.doesNotMatch(component, /RSVP GAP|TEAM RESPONSE COMPLETE|Manage event/);
});

test("Events visual system is week-first, editorial, safe-area aware, and not card stacked", () => {
  assert.match(primitives, /data-testid="events-week-rail"/);
  assert.match(primitives, /<details className="eventsMonthPanel"/);
  assert.match(css, /\.eventsHero[\s\S]*linear-gradient/s);
  assert.match(css, /\.eventRow\s*\{[\s\S]*border-radius:\s*0/s);
  assert.match(css, /safe-area-inset-bottom/);
  assert.match(css, /@media \(max-width: 390px\)/);
  assert.match(css, /prefers-reduced-motion: reduce/);
});

test("legacy late authority remains constrained to the old commitment hero seam and cannot repaint the new Events hero", () => {
  assert.match(html, /shotlab-phase3m-player-team-store-retail\.css[\s\S]*shotlab-phase3n-player-commitments\.css/);
  assert.match(authority, /player-commitment-hero-strength/);
  assert.doesNotMatch(authority, /player-events-next-up/);
});

test("fresh iPhone evidence configuration still covers both commitment routes", () => {
  assert.match(screenshotConfig, /phase-3n-player-commitments-screenshots\.spec\.mjs/);
  assert.match(screenshots, /04n-player-events-commitment/);
  assert.match(screenshots, /04o-player-strength-commitment/);
  assert.match(screenshots, /scrollWidth - window\.innerWidth/);
  assert.match(screenshots, /player-events-operational-list/);
  assert.match(screenshots, /player-strength-operational-panel/);
});
