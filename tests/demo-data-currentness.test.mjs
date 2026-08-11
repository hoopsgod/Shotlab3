import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { buildDemoDataBundle, mergeDemoCollection } from "../src/lib/demoData.js";

const demoData = fs.readFileSync("src/lib/demoData.js", "utf8");
const expertReview = fs.readFileSync("scripts/apply-expert-app-review-v2.mjs", "utf8");
const screenshotSpec = fs.readFileSync("tests/e2e/app-store-screenshots.spec.mjs", "utf8");

test("demo content uses rolling dates instead of expiring calendar fixtures", () => {
  assert.match(demoData, /const relativeDate = \(days = 0\)/);
  assert.match(demoData, /title: "Team Practice", date: relativeDate\(1\)/);
  assert.match(demoData, /date: relativeDate\(3\)/);
  assert.match(demoData, /date: relativeDate\(5\)/);
  assert.match(demoData, /date: relativeDate\(8\)/);
  assert.doesNotMatch(demoData, /date: "2026-0[34]-/);
});

test("demo bundle preserves both role identities", () => {
  assert.match(demoData, /const coachRow = coachEmail \?/);
  assert.match(demoData, /name: "Demo Coach"/);
  assert.match(demoData, /role: "coach"/);
  assert.match(demoData, /const players = coachRow \? \[coachRow, \.\.\.playerRows\] : playerRows/);
});

test("demo entry refreshes managed demos without overwriting scoped custom data", () => {
  assert.match(expertReview, /const scopedRowsPresent=/);
  assert.match(expertReview, /const existingDemoMeta=await DB\.get\(\\"sl:demo-data-meta\\"\)/);
  assert.match(expertReview, /const managedDemoData=/);
  assert.match(expertReview, /const shouldHydrateDemoBundle=!scopedRowsPresent\|\|managedDemoData/);
  assert.match(expertReview, /if\(shouldHydrateDemoBundle\)/);
  assert.match(expertReview, /const demoBundle=buildDemoDataBundle/);
  assert.match(expertReview, /await applyDemoData\(demoBundle\)/);
  assert.match(expertReview, /await hydratePersistedData\(\)/);
  assert.match(expertReview, /np=demoBundle\.players/);
  assert.match(demoData, /mergeDemoCollection\(existing, incoming/);
});

test("demo collection refresh replaces only managed demo rows and preserves unrelated local data", () => {
  const bundle = buildDemoDataBundle({
    teamId: "demo-team-current",
    coachEmail: "coach.demo@shotlab.app",
    team: { id: "demo-team-current", name: "Demo Team" },
  });
  const managedIdentities = new Set(bundle.players.flatMap((row) => [row.email, row.playerId, row.userId]).filter(Boolean).map((value) => String(value).toLowerCase()));
  const existing = [
    { id: "real-1", email: "real@example.com", teamId: "real-team", name: "Real Player" },
    { id: "stale-demo", email: "demo@shotlab.app", teamId: "demo-team-current", name: "Old Demo Player" },
    { id: "unrelated-local", email: "local@example.com", teamId: "offline-team", name: "Unsynced Local Player" },
  ];

  const merged = mergeDemoCollection(existing, bundle.players, {
    teamId: bundle.demoMeta.teamId,
    managedIdentities,
  });

  assert.ok(merged.some((row) => row.id === "real-1"), "registered local player must survive demo refresh");
  assert.ok(merged.some((row) => row.id === "unrelated-local"), "unsynced local player must survive demo refresh");
  assert.equal(merged.some((row) => row.id === "stale-demo"), false, "stale managed demo row must be replaced");
  assert.equal(merged.filter((row) => row.email === "demo@shotlab.app").length, 1, "managed demo identity must not duplicate");
});

test("demo team refresh preserves unrelated teams while replacing the managed demo team", () => {
  const bundle = buildDemoDataBundle({ teamId: "demo-team-current", coachEmail: "coach.demo@shotlab.app" });
  const merged = mergeDemoCollection(
    [{ id: "real-team", name: "Real Team" }, { id: "demo-team-current", name: "Stale Demo Team" }],
    bundle.teams,
    { teamId: bundle.demoMeta.teamId, teamsOnly: true },
  );
  assert.ok(merged.some((row) => row.id === "real-team"));
  assert.equal(merged.filter((row) => row.id === "demo-team-current").length, 1);
  assert.notEqual(merged.find((row) => row.id === "demo-team-current")?.name, "Stale Demo Team");
});

test("App Store evidence requires a populated Coach schedule", () => {
  assert.match(screenshotSpec, /Calendar is open/);
  assert.match(expertReview, /tests\/e2e\/app-store-screenshots\.spec\.mjs/);
  assert.match(expertReview, /Team Practice/);
});
