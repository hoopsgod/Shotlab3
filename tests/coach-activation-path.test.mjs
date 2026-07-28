import test from "node:test";
import assert from "node:assert/strict";
import { deriveCoachActivationPath } from "../src/lib/coachActivationPath.js";

const FALLBACK_LOGO = "/branding/titans-exact-logo.png.PNG";

const model = (overrides = {}) => deriveCoachActivationPath({
  teamCode: "TEAM01",
  teamName: "ShotLab Team",
  logoUrl: FALLBACK_LOGO,
  fallbackLogo: FALLBACK_LOGO,
  rosterSize: 0,
  hasScheduledSession: false,
  activeTodayCount: 0,
  hasLiveActivity: false,
  ...overrides,
});

test("coach activation exposes one next commercial milestone at a time", () => {
  const activation = model();
  assert.equal(activation.completed, 1);
  assert.equal(activation.total, 5);
  assert.equal(activation.next.id, "team-identity");
  assert.equal(activation.next.action, "branding");
});

test("custom team identity advances activation to the first player invite", () => {
  const activation = model({ teamName: "Webster Thomas Titans" });
  assert.equal(activation.completed, 2);
  assert.equal(activation.next.id, "first-player");
  assert.equal(activation.next.label, "Invite player");
});

test("roster and session progression advances to first engagement", () => {
  const activation = model({
    teamName: "Webster Thomas Titans",
    rosterSize: 12,
    hasScheduledSession: true,
  });
  assert.equal(activation.completed, 4);
  assert.equal(activation.next.id, "first-engagement");
  assert.equal(activation.progress, 80);
});

test("live activity completes activation even when active-today count is zero", () => {
  const activation = model({
    teamName: "Webster Thomas Titans",
    rosterSize: 12,
    hasScheduledSession: true,
    hasLiveActivity: true,
  });
  assert.equal(activation.complete, true);
  assert.equal(activation.completed, 5);
  assert.equal(activation.next, null);
});

test("missing team access remains the first blocking milestone", () => {
  const activation = model({
    teamCode: "",
    teamName: "Webster Thomas Titans",
    rosterSize: 12,
    hasScheduledSession: true,
    activeTodayCount: 3,
  });
  assert.equal(activation.next.id, "team-access");
  assert.equal(activation.next.action, "team-tools");
});
