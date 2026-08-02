import test from "node:test";
import assert from "node:assert/strict";
import { deriveCoachActivationPath, isCoachIdentityConfigured } from "../src/lib/coachActivationPath.js";

const model = (overrides = {}) => deriveCoachActivationPath({
  teamCode: "TEAM01",
  teamName: "Demo Team",
  logoUrl: "/branding/titans-exact-logo.png.PNG",
  fallbackLogo: "/branding/titans-exact-logo.png.PNG",
  rosterSize: 0,
  hasScheduledSession: false,
  activeTodayCount: 0,
  hasLiveActivity: false,
  ...overrides,
});

test("coach activation exposes one truthful next milestone at a time", () => {
  const activation = model();
  assert.equal(activation.completed, 2);
  assert.equal(activation.total, 5);
  assert.equal(activation.remaining, 3);
  assert.equal(activation.next.id, "first-player");
  assert.equal(activation.next.action, "add-player");
});

test("placeholder team identity blocks roster activation until branding is confirmed", () => {
  const activation = model({ teamName: "Thomas Titans", rosterSize: 1 });
  assert.equal(activation.completed, 2);
  assert.equal(activation.next.id, "team-identity");
  assert.equal(activation.next.action, "branding");
  assert.equal(activation.identityConfigured, false);
});

test("a custom logo confirms identity even when the default team name remains", () => {
  assert.equal(isCoachIdentityConfigured({
    teamName: "Thomas Titans",
    logoUrl: "https://cdn.example.com/custom-team-mark.png?version=2",
    fallbackLogo: "/branding/titans-exact-logo.png.PNG",
  }), true);
});

test("the first player advances activation to the first team session", () => {
  const activation = model({ rosterSize: 1 });
  assert.equal(activation.completed, 3);
  assert.equal(activation.next.id, "first-session");
  assert.equal(activation.next.label, "Create session");
});

test("a player and scheduled session advance to first engagement", () => {
  const activation = model({ rosterSize: 1, hasScheduledSession: true });
  assert.equal(activation.completed, 4);
  assert.equal(activation.next.id, "first-engagement");
  assert.equal(activation.progress, 80);
});

test("live activity completes activation even when active-today count is zero", () => {
  const activation = model({ rosterSize: 1, hasScheduledSession: true, hasLiveActivity: true });
  assert.equal(activation.complete, true);
  assert.equal(activation.completed, 5);
  assert.equal(activation.remaining, 0);
  assert.equal(activation.next, null);
});

test("roster size alone never fabricates session or engagement completion", () => {
  const activation = model({ rosterSize: 12, hasScheduledSession: false, activeTodayCount: 0, hasLiveActivity: false });
  assert.equal(activation.complete, false);
  assert.equal(activation.completed, 3);
  assert.equal(activation.next.id, "first-session");
});

test("missing team access remains the first blocking milestone", () => {
  const activation = model({ teamCode: "", rosterSize: 12, hasScheduledSession: true, activeTodayCount: 3 });
  assert.equal(activation.next.id, "team-access");
  assert.equal(activation.next.action, "team-tools");
});
