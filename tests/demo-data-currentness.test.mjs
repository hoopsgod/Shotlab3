import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { buildDemoDataBundle, localDateKey, mergeDemoCollection, unwrapManagedStorageValue } from "../src/lib/demoData.js";

const demoData = fs.readFileSync("src/lib/demoData.js", "utf8");
const expertReview = fs.readFileSync("scripts/apply-expert-app-review-v2.mjs", "utf8");
const screenshotSpec = fs.readFileSync("tests/e2e/app-store-screenshots.spec.mjs", "utf8");

const relativeLocalDate = (days) => {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return localDateKey(date);
};

test("demo content uses rolling local-calendar dates instead of expiring or UTC-shifted fixtures", () => {
  assert.match(demoData, /const\s+relativeDate\s*=\s*\(days\s*=\s*0\)/);
  assert.match(demoData, /date\.setHours\(12\s*,\s*0\s*,\s*0\s*,\s*0\)/);
  assert.match(demoData, /date\.setDate\(date\.getDate\(\)\s*\+\s*days\)/);
  assert.doesNotMatch(demoData, /setUTCHours|setUTCDate|toISOString\(\)\.slice\(0, 10\)/);
  assert.equal(localDateKey(new Date(2026, 7, 10, 23, 45)), "2026-08-10");

  const bundle = buildDemoDataBundle();
  const dates = new Set(bundle.events.map((event) => event.date));
  assert.equal(bundle.events.find((event) => event.id === "evt-upcoming-1")?.date, relativeLocalDate(1));
  for (const days of [3, 5, 8]) assert.ok(dates.has(relativeLocalDate(days)), `demo schedule must include a rolling +${days} day event`);
  assert.equal(bundle.events.length, 9, "public demo keeps a meaningfully populated schedule");
  assert.doesNotMatch(demoData, /date\s*:\s*"2026-0[34]-/);
});

test("managed storage wrappers preserve null so localStorage can remain the fallback", () => {
  assert.equal(unwrapManagedStorageValue({ value: null }), null);
  assert.equal(unwrapManagedStorageValue({ value: "[]" }), "[]");
  assert.equal(unwrapManagedStorageValue("[]"), "[]");
  assert.match(demoData, /Object\.prototype\.hasOwnProperty\.call\(result\s*,\s*"value"\)/);
  assert.doesNotMatch(demoData, /result\?\.value\s*\?\?\s*result/);
});

test("demo bundle preserves both role identities", () => {
  assert.match(demoData, /coachRow\s*=\s*coachEmail\s*\?/);
  assert.match(demoData, /name\s*:\s*"Demo Coach"/);
  assert.match(demoData, /role\s*:\s*"coach"/);
  assert.match(demoData, /players\s*:\s*coachRow\s*\?\s*\[coachRow,\s*\.\.\.playerRows\]\s*:\s*playerRows/);
  const bundle = buildDemoDataBundle({ coachEmail: "coach.demo@shotlab.app" });
  assert.equal(bundle.players.filter((row) => row.role === "player").length, 12);
  assert.equal(bundle.players.find((row) => row.email === "demo@shotlab.app")?.name, "Demo Player");
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
  assert.match(demoData, /mergeDemoCollection\(existing\s*,\s*incoming/);
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
  assert.match(screenshotSpec, /openNavigation\(page, "Schedule"\)/);
  assert.match(screenshotSpec, /getByRole\("heading", \{ name: "Events", exact: true \}\)/);
  assert.match(screenshotSpec, /getByText\("Team Practice", \{ exact: true \}\)/);
  assert.match(expertReview, /tests\/e2e\/app-store-screenshots\.spec\.mjs/);
  assert.match(expertReview, /Team Practice/);
});