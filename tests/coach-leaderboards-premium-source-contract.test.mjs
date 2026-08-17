import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const previewSource = readFileSync(new URL("../src/components/CompactLeaderboardPreviewCard.jsx", import.meta.url), "utf8");
const hubSource = readFileSync(new URL("../src/components/PremiumLeaderboardsHub.jsx", import.meta.url), "utf8");
const dashboardSource = readFileSync(new URL("../src/components/CoachInteractiveDashboards.jsx", import.meta.url), "utf8");
const enhancerSource = readFileSync(new URL("../scripts/apply-phase3l-coach-leaderboard-hierarchy.mjs", import.meta.url), "utf8");
const hierarchyCss = readFileSync(new URL("../public/shotlab-phase3l-coach-leaderboard-hierarchy.css", import.meta.url), "utf8");

test("coach leaderboard previews never fabricate open ranking slots", () => {
  assert.match(previewSource, /const reservedRows = isCoachMode\s*\? previewRows\.length/);
  assert.match(previewSource, /const openRowCount = isCoachMode\s*\? 0/);
  assert.match(previewSource, /data-viewer-role=\{mode\}/);
});

test("coach leaderboards do not render a duplicate Competition Hub masthead", () => {
  assert.match(hubSource, /const isCoachView = viewerRole === 'coach'/);
  assert.match(hubSource, /data-viewer-role=\{viewerRole\}/);
  assert.match(hubSource, /\{!isCoachView \? <header/);
  assert.match(hubSource, />COMPETITION HUB<\/div>/);
});

test("coach leaderboards use one competitive title stage and three decision metrics", () => {
  assert.match(dashboardSource, /"coach-page-dashboard-leaderboards": \{\s*eyebrow: "COMPETE",\s*decisionEyebrow: "TEAM STANDARD"/s);
  assert.match(dashboardSource, /\["ranked", "leader", "archives"\]\.includes\(metric\.key\)/);
  assert.match(dashboardSource, /const displayTitle = model\.isLeaderboardsPage \? "Leaderboards" : title/);
  assert.match(dashboardSource, /Recognize the standard\. See who is leading and who is rising\./);
  assert.match(dashboardSource, /\? \(hasLeader \? `\$\{leaderMetric\.detail\} sets the standard` : config\.emptyTitle\)/);
});

test("production Coach leaderboard pulse is weekly-specific, truthful, and never padded with fake ranks", () => {
  assert.match(enhancerSource, /const weeklyLeader =/);
  assert.match(enhancerSource, />This week<\/span>/);
  assert.match(enhancerSource, /The weekly race is open/);
  assert.match(enhancerSource, /rows\.slice\(0,3\)\.map/);
  assert.doesNotMatch(enhancerSource, /Open rank/);
  assert.doesNotMatch(enhancerSource, /data-leaderboard-placeholder/);
});

test("mobile Coach Leaderboards fits three signals in-view and flattens the lower pulse hierarchy", () => {
  assert.match(hierarchyCss, /coach-page-dashboard-leaderboards-decision-brief[^}]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)[^}]*overflow:\s*hidden/s);
  assert.match(hierarchyCss, /coachLeaderboardPulse\s*\{[^}]*background:\s*transparent[^}]*border-top:[^}]*border-bottom:/s);
  assert.match(hierarchyCss, /coachLeaderboardPulseMetrics\s*>\s*div\s*\{[^}]*background:\s*transparent/s);
  assert.match(hierarchyCss, /coachLeaderboardRow\s*\{[^}]*border-radius:\s*0[^}]*background:\s*transparent[^}]*box-shadow:\s*none/s);
  assert.match(hierarchyCss, /premium-leaderboards-hub[^}]*data-viewer-role="coach"/s);
});
