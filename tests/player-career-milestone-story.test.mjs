import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  CAREER_MILESTONES,
  buildPlayerCareerMilestoneStory,
  formatCareerMilestone,
} from "../src/lib/playerCareerMilestones.js";

const component = fs.readFileSync(new URL("../src/components/PlayerCareerHistory.jsx", import.meta.url), "utf8");
const cardStyles = fs.readFileSync(new URL("../src/components/PlayerCareerHistory.module.css", import.meta.url), "utf8");
const ladderStyles = fs.readFileSync(new URL("../src/components/PlayerCareerMilestoneLadder.module.css", import.meta.url), "utf8");

test("career milestone model uses the verified six-step ladder", () => {
  assert.deepEqual(CAREER_MILESTONES, [100, 500, 1000, 2500, 5000, 10000]);
  assert.equal(formatCareerMilestone(100), "100");
  assert.equal(formatCareerMilestone(1000), "1K");
  assert.equal(formatCareerMilestone(2500), "2.5K");
  assert.equal(formatCareerMilestone(10000), "10K");
});

test("career milestone boundaries remain truthful and monotonic within each tier", () => {
  const empty = buildPlayerCareerMilestoneStory(-20);
  assert.equal(empty.total, 0);
  assert.equal(empty.next, 100);
  assert.equal(empty.progress, 0);
  assert.equal(empty.remaining, 100);
  assert.equal(empty.ladder.filter((step) => step.state === "current")[0].value, 100);

  const almostFirst = buildPlayerCareerMilestoneStory(99);
  assert.equal(almostFirst.next, 100);
  assert.equal(almostFirst.progress, 99);
  assert.equal(almostFirst.remaining, 1);

  const firstComplete = buildPlayerCareerMilestoneStory(100);
  assert.equal(firstComplete.previous, 100);
  assert.equal(firstComplete.next, 500);
  assert.equal(firstComplete.progress, 0);
  assert.equal(firstComplete.status, "100 milestone secured");
  assert.equal(firstComplete.ladder[0].state, "complete");
  assert.equal(firstComplete.ladder[1].state, "current");

  const midTier = buildPlayerCareerMilestoneStory(300);
  assert.equal(midTier.previous, 100);
  assert.equal(midTier.next, 500);
  assert.equal(midTier.progress, 50);
  assert.equal(midTier.remaining, 200);

  const highest = buildPlayerCareerMilestoneStory(10000);
  assert.equal(highest.complete, true);
  assert.equal(highest.progress, 100);
  assert.equal(highest.remaining, 0);
  assert.equal(highest.status, "Milestone complete");
  assert.ok(highest.ladder.every((step) => step.state === "complete"));
});

test("career milestone presentation is accessible, evidence-based, and motion-safe", () => {
  assert.match(component, /buildPlayerCareerMilestoneStory\(history\.career\.totalShootingMakes\)/);
  assert.match(component, /data-testid="career-milestone-story"/);
  assert.match(component, /data-testid="career-milestone-ladder"/);
  assert.match(component, /role="progressbar"/);
  assert.match(component, /aria-valuenow/);
  assert.match(component, /aria-current=\{step\.state === "current" \? "step"/);
  assert.match(component, /ShotLabIcon name="trophy"/);
  assert.doesNotMatch(component, /top \d+%|percentile|better than/i);
  assert.match(cardStyles, /\.milestoneTrack span\{[^}]*transition:/);
  assert.match(cardStyles, /prefers-reduced-motion:reduce/);
  assert.match(ladderStyles, /prefers-reduced-motion: reduce/);
  assert.match(ladderStyles, /\.dot\s*\{\s*transition: none/);
});
