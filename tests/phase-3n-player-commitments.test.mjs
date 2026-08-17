import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const enhancer = readFileSync("scripts/apply-phase3n-player-commitments.mjs", "utf8");
const component = readFileSync("src/components/PlayerCommitmentCenter.jsx", "utf8");
const css = readFileSync("src/components/PlayerCommitmentCenter.module.css", "utf8");
const sharedCss = readFileSync("src/components/EventsMobileSystem.css", "utf8");
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
  assert.match(enhancer, /promoteSourceOwnedEvents/);
});

test("retired Player Events markup is removed by owned section boundary rather than brittle JSX character parsing", () => {
  assert.match(enhancer, /const SECTION_RULE = '\/\/ ═+/);
  assert.match(enhancer, /stripSectionContainingFunction/);
  assert.match(enhancer, /input\.indexOf\(SECTION_RULE, functionStart \+ signature\.length\)/);
  assert.match(enhancer, /section boundary did not contain/);
  assert.doesNotMatch(enhancer, /let quote = null|lineComment = false|blockComment = false/);
});

test("Events and S&C keep intentional role-specific commitment integrations without duplicate Player Events presentation", () => {
  for (const seam of [
    'PlayerCommitmentCenter mode="events"',
    'PlayerCommitmentCenter mode="strength"',
    'data-testid="player-strength-operational-panel"',
    'premium Player Events now owns schedule, detail, and RSVP presentation',
  ]) assert.ok(enhancer.includes(seam), `missing specialized commitment seam: ${seam}`);
  assert.match(enhancer, /retired duplicate Player Events presentation remains/);
});

test("Phase 3N preserves RSVP, S&C RSVP, logging, and completion capabilities", () => {
  for (const preserved of [
    "toggleRsvp={toggleRsvp}",
    "onCompletionCue={pushCompletionCue}",
    "toggleScRsvp={toggleScRsvp}",
    "addScLog={addScLog}",
    "<SCPanel sessions={scSessions}",
  ]) assert.ok(enhancer.includes(preserved), `missing preserved player commitment capability: ${preserved}`);
  assert.match(enhancer, /function EventsPanel\(/);
  assert.match(enhancer, /player-events-operational-list/);
});

test("Player Events exposes a personal schedule hierarchy and keeps S&C commitment disclosure", () => {
  for (const seam of [
    'testId="player-events-next-up"',
    'data-testid="player-events-upcoming-list"',
    'data-testid="player-commitment-details-events"',
    'data-testid="player-event-detail"',
    'data-testid="player-commitment-hero-strength"',
    'data-testid="player-commitment-details-strength"',
    "RSVP REQUIRED",
    "✓ GOING",
    "NEXT DEVELOPMENT BLOCK",
  ]) assert.ok(component.includes(seam), `missing player commitment UI seam: ${seam}`);
  assert.match(component, /data-testid=\{`player-commitment-route-header-\$\{mode\}`\}/);
  assert.match(component, /<EventsTitleStage role="player"/);
  assert.match(component, /<EventsWeekRail/);
  assert.match(component, /<EventsMonthPanel/);
  assert.match(component, /<details/);
});

test("Player Events prioritizes the next chronological obligation and keeps response action personal", () => {
  assert.match(component, /const focus = state\.upcoming\[0\] \|\| null/);
  assert.match(component, /const focusConfirmed = Boolean/);
  assert.match(component, /status=\{focusConfirmed \? "✓ GOING" : "RSVP REQUIRED"\}/);
  assert.match(component, /action=\{focusConfirmed \? "View response" : "Respond"\}/);
  assert.match(component, /selectedId/);
  assert.match(component, /Confirm going/);
  assert.match(component, /Remove RSVP/);
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
  assert.match(sharedCss, /\.eventsNext[\s\S]*linear-gradient/s);
  assert.match(css, /\.eventRow\s*\{[\s\S]*border-radius:\s*0/s);
  assert.match(css, /safe-area-inset-bottom/);
  assert.match(css, /@media\(max-width:390px\)/);
  assert.match(css, /prefers-reduced-motion:reduce/);
});

test("legacy late authority remains constrained to the S&C commitment hero and cannot repaint the new Events hero", () => {
  assert.match(html, /shotlab-phase3m-player-team-store-retail\.css[\s\S]*shotlab-phase3n-player-commitments\.css/);
  assert.match(authority, /player-commitment-hero-strength/);
  assert.doesNotMatch(authority, /player-events-next-up/);
});

test("fresh iPhone evidence configuration covers the source-owned Events route and S&C route", () => {
  assert.match(screenshotConfig, /phase-3n-player-commitments-screenshots\.spec\.mjs/);
  assert.match(screenshots, /04n-player-events-commitment/);
  assert.match(screenshots, /04o-player-strength-commitment/);
  assert.match(screenshots, /scrollWidth - window\.innerWidth/);
  assert.match(screenshots, /player-event-detail/);
  assert.match(screenshots, /player-strength-operational-panel/);
});