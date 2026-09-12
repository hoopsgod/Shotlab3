import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const coachStage = fs.readFileSync(new URL("../src/components/CoachRoutePerformanceStage.jsx", import.meta.url), "utf8");
const performanceMark = fs.readFileSync(new URL("../src/components/ShotLabPerformanceMark.jsx", import.meta.url), "utf8");
const playerProgress = fs.readFileSync(new URL("../src/components/PlayerProgressStory.jsx", import.meta.url), "utf8");
const leaderboard = fs.readFileSync(new URL("../src/components/CompactLeaderboardPreviewCard.jsx", import.meta.url), "utf8");

test("Phase 4 uses the existing ShotLab performance primitive across Coach and Player", () => {
  assert.match(coachStage, /import ShotLabPerformanceMark from "\.\/ShotLabPerformanceMark\.jsx"/);
  assert.match(playerProgress, /ShotLabPerformanceMark/);
  assert.match(leaderboard, /ShotLabPerformanceMark/);
  assert.doesNotMatch(coachStage, /NewPerformanceMark|Phase4PerformanceMark|PremiumMetricMark/);
});

test("Coach route stages reuse the existing ShotLab basketball signature", () => {
  assert.match(coachStage, /import ShotLabSignatureField from "\.\/ShotLabSignatureField\.jsx"/);
  assert.match(coachStage, /signatureVariant = routeKind === "leaderboards" \? "trajectoryVariant" : "court"/);
  assert.match(coachStage, /<ShotLabSignatureField variant=\{signatureVariant\}/);
  assert.doesNotMatch(coachStage, /NewSignatureField|Phase4SignatureField/);
});

test("Coach metrics keep real values and behavior while gaining premium mark semantics", () => {
  assert.match(coachStage, /const value = readableMetricValue\(metric\)/);
  assert.match(coachStage, /value=\{value\}[\s\S]*compact[\s\S]*surface="dark"[\s\S]*decorative/);
  assert.match(coachStage, /onClick: \(\) => onSelect\(metric\.key\)/);
  assert.match(coachStage, /"aria-pressed": active/);
  assert.match(coachStage, /data-route-stage-metric-value/);
  assert.doesNotMatch(coachStage, /increase|decrease|improved|declined/i);
});

test("performance marks can be decorative without duplicating accessible announcements", () => {
  assert.match(performanceMark, /decorative = false/);
  assert.match(performanceMark, /aria-hidden=\{decorative \? "true" : undefined\}/);
  assert.match(performanceMark, /aria-label=\{decorative \? undefined : \(aria \|\| "Performance mark"\)\}/);
});
