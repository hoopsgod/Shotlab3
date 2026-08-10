import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.cwd(), "artifacts/phase-4e-compact-control-readiness-audit");
const expectedSurfaces = [
  "coach-players",
  "coach-events",
  "coach-leaderboards",
  "player-home",
  "player-profile",
  "player-program",
];

assert.ok(fs.existsSync(root), `Missing Phase 4E evidence directory: ${root}`);

for (const surface of expectedSurfaces) {
  assert.ok(fs.existsSync(path.join(root, `${surface}.json`)), `Missing ${surface}.json`);
  assert.ok(fs.existsSync(path.join(root, `${surface}-simulated-44pt.png`)), `Missing ${surface} screenshot`);
}

const summaryPath = path.join(root, "summary.json");
assert.ok(fs.existsSync(summaryPath), "Missing Phase 4E summary.json");
const summary = JSON.parse(fs.readFileSync(summaryPath, "utf8"));

assert.equal(summary.surfaces, 6, "Phase 4E must complete all six compact-control surfaces");
assert.equal(summary.baselineSub44Count, 40, "Phase 4E baseline compact-control count changed unexpectedly");
assert.equal(summary.undersizedAfterCount, 0, "Every simulated compact control must reach 44pt");
assert.ok(summary.maxDocumentOverflowDelta <= 1, "44pt simulation must not add document overflow");
assert.ok(summary.maxBodyOverflowDelta <= 1, "44pt simulation must not add body overflow");

const safeSurfaceKeys = [
  "coach:players",
  "coach:events",
  "coach:leaderboards",
  "player:program",
];
for (const key of safeSurfaceKeys) {
  const surface = summary.bySurface?.[key];
  assert.ok(surface, `Missing summary for ${key}`);
  assert.equal(surface.newOverlapCount, 0, `${key} must not introduce a new simulated overlap`);
  assert.equal(surface.worsenedOverlapCount, 0, `${key} must not worsen an existing simulated overlap`);
  assert.ok(surface.documentOverflowDelta <= 1, `${key} must remain horizontally safe`);
  assert.ok(surface.bodyOverflowDelta <= 1, `${key} body must remain horizontally safe`);
}

const home = summary.bySurface?.["player:home"];
const profile = summary.bySurface?.["player:profile"];
assert.ok(home && profile, "Player Home/Profile simulation summaries are required");
assert.ok(home.newOverlapCount + home.worsenedOverlapCount > 0, "Player Home must retain its measured layered-action warning");
assert.ok(profile.newOverlapCount + profile.worsenedOverlapCount > 0, "Player Profile must retain its measured disclosure/account-control warning");

console.log(
  `Phase 4E evidence certified: ${summary.baselineSub44Count} compact controls simulated to 44pt across ${summary.surfaces} surfaces; `
    + `${safeSurfaceKeys.length} surfaces are clean candidates, while Player Home/Profile remain explicitly blocked from blanket resizing.`,
);
