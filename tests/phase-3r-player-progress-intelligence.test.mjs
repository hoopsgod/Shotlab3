import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { derivePlayerProgressStory } from "../src/lib/playerProgressStory.js";

const enhancer = readFileSync("scripts/apply-phase3r-player-progress-intelligence.mjs", "utf8");
const component = readFileSync("src/components/PlayerProgressStory.jsx", "utf8");
const css = readFileSync("src/components/PlayerProgressStory.module.css", "utf8");
const authority = readFileSync("public/shotlab-phase3r-player-progress-story.css", "utf8");
const html = readFileSync("index.html", "utf8");
const screenshotConfig = readFileSync("playwright.screenshots.config.mjs", "utf8");
const screenshotSpec = readFileSync("tests/e2e/phase-3r-player-progress-story-screenshots.spec.mjs", "utf8");
const workflow = readFileSync(".github/workflows/phase-3r-player-progress-intelligence.yml", "utf8");
const pkg = JSON.parse(readFileSync("package.json", "utf8"));

test("Phase 3R runs after Phase 3Q and requires the accepted Profile intelligence boundary", () => {
  assert.match(pkg.scripts.dev, /apply-phase3q-player-session-closeout\.mjs[\s\S]*apply-phase3r-player-progress-intelligence\.mjs/);
  assert.match(pkg.scripts["prepare:route-enhancers"], /apply-phase3q-player-session-closeout\.mjs[\s\S]*apply-phase3r-player-progress-intelligence\.mjs/);
  assert.match(pkg.scripts["verify:phase3r"], /phase-3r-player-progress-intelligence\.test\.mjs/);
  assert.match(enhancer, /Phase 3F Profile intelligence must be applied before Phase 3R/);
  assert.match(enhancer, /already applied/);
  assert.match(enhancer, /expected exactly one anchor/);
});

test("Phase 3R promotes the development story while preserving and directly revealing the complete legacy profile", () => {
  assert.match(enhancer, /PlayerProgressStory/);
  assert.match(enhancer, /data-testid=\"player-profile-workspace\"/);
  assert.match(enhancer, /testId=\"player-progress-full-profile\"/);
  assert.match(enhancer, /details instanceof HTMLDetailsElement/);
  assert.match(enhancer, /details\.open=true/);
  assert.match(enhancer, /<ProfilePage u=\{u\}/);
  assert.match(enhancer, /Strength: \{\[\.\.\.drills,\.\.\.programDrills\]\.find/);
  assert.match(enhancer, /\?\.name\|\|interpretedTrends\.strongestDrill/);
  assert.match(enhancer, /player-profile-readout/);
  assert.match(enhancer, /player-profile-performance-intelligence/);
  assert.match(enhancer, /player-profile-drill-development/);
  assert.match(enhancer, /onToggleLeaderboardVisibility=\{toggleLeaderboardVisibility\}/);
});

test("development story uses factual signals and does not synthesize an overall player rating", () => {
  const story = derivePlayerProgressStory({
    userEmail: "player@example.com",
    teamId: "team-1",
    today: "2026-08-07",
    streak: 4,
    drills: [{ id: "form", name: "Form Ladder", max: 25 }, { id: "free", name: "Free Throws", max: 20 }],
    shotLogs: [
      { email: "player@example.com", teamId: "team-1", date: "2026-07-28", made: 20 },
      { email: "player@example.com", teamId: "team-1", date: "2026-08-01", made: 30 },
      { email: "player@example.com", teamId: "team-1", date: "2026-08-04", made: 60 },
      { email: "player@example.com", teamId: "team-1", date: "2026-08-07", made: 70 },
    ],
    scores: [
      { email: "player@example.com", teamId: "team-1", drillId: "form", drillName: "Form Ladder", date: "2026-07-20", score: 16 },
      { email: "player@example.com", teamId: "team-1", drillId: "form", drillName: "Form Ladder", date: "2026-08-04", score: 20 },
      { email: "player@example.com", teamId: "team-1", drillId: "free", drillName: "Free Throws", date: "2026-08-06", score: 15 },
    ],
    coachPriorities: { todayFocusText: "Finish through contact", priorityDrillText: "Free Throws", challengeText: "Own the final five reps." },
  });
  assert.equal(story.currentStreak, 4);
  assert.equal(story.recent7Makes, 160);
  assert.equal(story.activeDays7, 4);
  assert.equal(story.pbCount30, 1);
  assert.equal(story.strongest.title, "Free Throws");
  assert.equal(story.strongest.kind, "quality");
  assert.equal(story.strongest.eyebrow, "STRONGEST SIGNAL");
  assert.match(story.strongest.detail, /75% average/);
  assert.equal(story.opportunity.eyebrow, "BIGGEST OPPORTUNITY");
  assert.equal(story.nextFocus.label, "COACH FOCUS");
  assert.equal(story.nextFocus.title, "Finish through contact");
  assert.doesNotMatch(JSON.stringify(story), /overall rating|performance score|player grade/i);
});

test("Phase 3R treats a zero prior-volume window as a new baseline instead of inventing a percentage gain", () => {
  const story = derivePlayerProgressStory({
    userEmail: "player@example.com",
    today: "2026-08-07",
    shotLogs: [
      { email: "player@example.com", date: "2026-08-04", made: 45 },
      { email: "player@example.com", date: "2026-08-07", made: 55 },
    ],
  });
  assert.equal(story.recent7Makes, 100);
  assert.equal(story.trend, "rising");
  assert.equal(story.deltaPct, null);
  assert.equal(story.headline, "Your work is rising.");
  assert.match(story.trendDetail, /new volume after a quiet prior window/i);
  assert.doesNotMatch(story.trendDetail, /% above/i);
});

test("Phase 3R labels practice frequency honestly when drill maxima are unavailable", () => {
  const story = derivePlayerProgressStory({
    userEmail: "player@example.com",
    today: "2026-08-07",
    scores: [
      { email: "player@example.com", drillId: "unknown", drillName: "Custom Drill", date: "2026-08-01", score: 8 },
      { email: "player@example.com", drillId: "unknown", drillName: "Custom Drill", date: "2026-08-03", score: 11 },
    ],
  });
  assert.equal(story.strongest.kind, "frequency");
  assert.equal(story.strongest.eyebrow, "MOST REPEATED");
  assert.match(story.strongest.detail, /practice frequency—not a strength claim/);
});

test("Progress Story presents a premium decision-first hierarchy with explicit dark-hero seams", () => {
  for (const seam of [
    "player-progress-story",
    "DEVELOPMENT STORY",
    "DEVELOPMENT READOUT",
    "player-progress-story-topline",
    "player-progress-story-hero-grid",
    "player-progress-story-copy",
    "player-progress-trend-summary",
    "player-progress-strongest-signal",
    "player-progress-opportunity",
    "player-progress-next-focus",
    "Start next focus",
    "Open full progress profile",
  ]) assert.ok(component.includes(seam), `missing Progress Story seam: ${seam}`);
  assert.match(component, /fake overall rating/);
  assert.match(css, /linear-gradient\(150deg, #0f1412/);
  assert.match(css, /border-radius: 30px/);
  assert.match(css, /\.signalGrid[\s\S]*repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(css, /\.nextFocus[\s\S]*background: #f7f8f4/);
  assert.match(css, /\.nextFocus button[\s\S]*background: #c8ff1a/);
  assert.match(css, /prefers-reduced-motion: reduce/);
});

test("Phase 3R owns late visual authority after Phase 3Q and prevents demo washout", () => {
  assert.match(html, /shotlab-phase3q-player-session-closeout\.css[\s\S]*shotlab-phase3r-player-progress-story\.css/);
  assert.match(authority, /body #root \[data-testid=\"player-progress-story-hero\"\]/);
  assert.match(authority, /background-color: #0f1412 !important/);
  assert.match(authority, /player-progress-story-topline/);
  assert.match(authority, /player-progress-story-copy/);
  assert.match(authority, /player-progress-trend-summary/);
  assert.match(authority, /background-color: transparent !important/);
  assert.match(authority, /player-progress-start-focus/);
  assert.match(authority, /player-progress-open-profile/);
});

test("Phase 3R iPhone evidence verifies first-viewport story, washout guards, readable drill names, and preserved full profile", () => {
  assert.match(screenshotConfig, /phase-3r-player-progress-story-screenshots\.spec\.mjs/);
  assert.match(screenshotSpec, /mobile-navigation-more/);
  assert.match(screenshotSpec, /data-nav-key=\"profile\"/);
  assert.match(screenshotSpec, /player-progress-story/);
  assert.match(screenshotSpec, /transparentHeroSeams/);
  assert.match(screenshotSpec, /must stay transparent inside dark hero/);
  assert.match(screenshotSpec, /player-progress-trend-summary/);
  assert.match(screenshotSpec, /player-progress-strongest-signal/);
  assert.match(screenshotSpec, /player-progress-opportunity/);
  assert.match(screenshotSpec, /player-progress-next-focus/);
  assert.match(screenshotSpec, /player-progress-open-profile/);
  assert.match(screenshotSpec, /player-profile-readout/);
  assert.match(screenshotSpec, /not\.toContainText\(\/demo-/);
  assert.match(screenshotSpec, /04v-player-progress-story\.png/);
  assert.match(screenshotSpec, /04w-player-progress-full-profile\.png/);
  assert.match(screenshotSpec, /scrollWidth - window\.innerWidth/);
  assert.match(workflow, /04v-player-progress-story\.png/);
  assert.match(workflow, /04w-player-progress-full-profile\.png/);
});
