import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const coach = readFileSync(new URL("../src/components/CoachInteractiveDashboards.jsx", import.meta.url), "utf8");
const player = readFileSync(new URL("../src/components/PlayerCommitmentCenter.jsx", import.meta.url), "utf8");
const primitives = readFileSync(new URL("../src/components/EventsMobilePrimitives.jsx", import.meta.url), "utf8");
const playerCss = readFileSync(new URL("../src/components/PlayerCommitmentCenter.module.css", import.meta.url), "utf8");
const coachCss = readFileSync(new URL("../src/components/CoachEventsPremiumV2.css", import.meta.url), "utf8");
const app = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");

test("Coach and Player use one Events design grammar with role-specific title behavior", () => {
  assert.match(coach, /<EventsTitleStage role="coach"/);
  assert.match(coach, /onCreate=\{onCreateEvent\}/);
  assert.match(player, /<EventsTitleStage role="player"/);
  assert.doesNotMatch(player, /onCreate=\{onCreateEvent\}/);
  assert.match(coach, /<EventsWeekRail/);
  assert.match(player, /<EventsWeekRail/);
  assert.match(coach, /<EventsMonthPanel/);
  assert.match(player, /<EventsMonthPanel/);
});

test("Player Events makes personal RSVP state first-class without exposing Coach response intelligence", () => {
  assert.match(player, /RSVP REQUIRED/);
  assert.match(player, /✓ GOING/);
  assert.match(player, /RSVP NEEDED →/);
  assert.match(player, /identityMatches\(row, userEmail\)/);
  assert.match(player, /teamMatches\(row, teamId\)/);
  assert.doesNotMatch(player, /RSVP GAP/);
  assert.doesNotMatch(player, /TEAM RESPONSE COMPLETE/);
  assert.doesNotMatch(player, /Manage event/);
});

test("Coach Events keeps management intelligence Coach-only and preserves the existing open-event action path", () => {
  assert.match(coach, /RSVP GAP/);
  assert.match(coach, /TEAM RESPONSE COMPLETE/);
  assert.match(coach, /onOpenEvent\?\.\(nextEvent\.id\)/);
  assert.match(coach, /onOpenEvent\?\.\(id\)/);
});

test("the stable RSVP persistence path remains in App instead of being reimplemented in presentation components", () => {
  assert.match(app, /deleteEventRsvp/);
  assert.match(app, /saveEventRsvp/);
  assert.match(app, /onToggleRSVP=\{toggleRsvp\}/);
  assert.doesNotMatch(player, /saveEventRsvp/);
  assert.doesNotMatch(player, /deleteEventRsvp/);
});

test("mobile density and safe-area rules explicitly cover both roles", () => {
  assert.match(playerCss, /\.eventRow\s*\{[\s\S]*min-height:\s*78px[\s\S]*border-radius:\s*0/s);
  assert.match(playerCss, /safe-area-inset-bottom/);
  assert.match(coachCss, /coach-events-mobile-page[\s\S]*safe-area-inset-bottom/s);
  assert.match(primitives, /grid-template-columns/); // JSX imports the shared CSS that owns the seven-column rail.
});
