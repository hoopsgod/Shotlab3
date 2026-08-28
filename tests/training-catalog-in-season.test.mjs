import test from "node:test";
import assert from "node:assert/strict";
import { sanitizeTrainingDrill } from "../functions/v1/training-catalog/index.js";

test("training catalog preserves in-season drill metadata", () => {
  const row = sanitizeTrainingDrill({
    id: "closeout-5",
    team_id: "team-1",
    mode: "program",
    name: "5-Minute Closeout Shooting",
    drill_scope: "team",
    score_unit: "makes",
    score_direction: "higher",
    in_season: true,
    max_score: 50,
  });
  assert.equal(row.drillScope, "team");
  assert.equal(row.scoreUnit, "makes");
  assert.equal(row.scoreDirection, "higher");
  assert.equal(row.inSeason, true);
  assert.equal(row.maxScore, 50);
});

test("program drills can explicitly opt out of the In Season surface", () => {
  const row = sanitizeTrainingDrill({ id: "offseason-only", team_id: "team-1", mode: "program", name: "Offseason Volume", in_season: false });
  assert.equal(row.inSeason, false);
});
