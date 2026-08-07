import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

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
});

test("App Store evidence requires a populated Coach schedule", () => {
  assert.match(screenshotSpec, /Calendar is open/);
  assert.match(expertReview, /tests\/e2e\/app-store-screenshots\.spec\.mjs/);
  assert.match(expertReview, /Team Practice/);
});
