import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const previewSource = readFileSync(new URL("../src/components/CompactLeaderboardPreviewCard.jsx", import.meta.url), "utf8");
const hubSource = readFileSync(new URL("../src/components/PremiumLeaderboardsHub.jsx", import.meta.url), "utf8");
const dashboardSource = readFileSync(new URL("../src/components/CoachInteractiveDashboards.jsx", import.meta.url), "utf8");

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
