import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const component = fs.readFileSync(new URL("../src/components/PlayerCareerHistory.jsx", import.meta.url), "utf8");
const styles = fs.readFileSync(new URL("../src/components/PlayerCareerHistory.module.css", import.meta.url), "utf8");

test("career milestone story uses verified makes without invented rankings", () => {
  assert.match(component, /CAREER_MILESTONES = \[100, 500, 1000, 2500, 5000, 10000\]/);
  assert.match(component, /history\.career\.totalShootingMakes/);
  assert.match(component, /career-milestone-story/);
  assert.match(component, /role="progressbar"/);
  assert.match(component, /aria-valuenow/);
  assert.doesNotMatch(component, /top \d+%|percentile|better than/i);
});

test("career milestone presentation remains premium and motion-safe", () => {
  assert.match(styles, /\.milestoneCard\{/);
  assert.match(styles, /\.milestoneTrack span\{/);
  assert.match(styles, /prefers-reduced-motion:reduce/);
  assert.match(styles, /\.milestoneTrack span\{transition:none\}/);
});
