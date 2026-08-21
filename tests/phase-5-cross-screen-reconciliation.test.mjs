import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const titleStage = fs.readFileSync("src/components/TeamIdentityTitleStage.jsx", "utf8");
const titleStageCss = fs.readFileSync("src/components/TeamIdentityTitleStage.css", "utf8");
const brandHierarchyCss = fs.readFileSync("src/components/TeamIdentityBrandHierarchy.css", "utf8");
const playerWorkspace = fs.readFileSync("src/components/PlayerOperationalWorkspace.jsx", "utf8");
const playerCommitment = fs.readFileSync("src/components/PlayerCommitmentCenter.jsx", "utf8");
const metricCss = fs.readFileSync("src/components/PlayerMetricHierarchy.module.css", "utf8");
const visualAudit = fs.readFileSync("tests/e2e/phase-3a-cross-screen-visual-audit.spec.mjs", "utf8");
const feedback = fs.readFileSync("src/components/AppFeedbackLayer.jsx", "utf8");

test("Phase 5 keeps mobile Player secondary identity source-owned, subordinate, converged, and inside the viewport", () => {
  assert.match(playerWorkspace, /<TeamIdentityTitleStage/);
  assert.match(playerWorkspace, /variant="standard"/);
  assert.match(playerWorkspace, /dataMobileStage="editorial"/);
  assert.match(playerWorkspace, /brandTreatment="compact"/);
  assert.doesNotMatch(playerWorkspace, /PLAYER_BRAND_TREATMENT|resolveWorkspaceBrandTreatment|signature|watermark|brandTreatment="none"/);
  assert.match(playerCommitment, /<TeamIdentityTitleStage/);
  assert.match(playerCommitment, /variant="standard"/);
  assert.match(titleStage, /data-team-identity-stage="true"/);
  assert.match(titleStage, /data-identity-role="page-title"/);
  assert.match(titleStage, /data-brand-treatment=\{resolvedBrandTreatment\}/);
  assert.match(titleStageCss, /--identity-crest:\s*clamp\(96px, 25vw, 108px\)/);
  assert.match(titleStageCss, /--identity-title:\s*clamp\(42px, 10\.2vw, 44px\)/);
  assert.match(titleStageCss, /object-fit:\s*contain/);
  assert.match(titleStageCss, /@media \(max-width: 390px\)/);
  assert.match(brandHierarchyCss, /data-title-stage-family="editorial"/);
  assert.match(brandHierarchyCss, /grid-template-columns:\s*minmax\(0, 1fr\) var\(--identity-crest\)/);
  assert.match(brandHierarchyCss, /--identity-crest:\s*clamp\(96px,\s*25vw,\s*108px\)/);
  assert.match(brandHierarchyCss, /@media \(max-width: 390px\)[\s\S]*--identity-crest:\s*84px/);
  assert.doesNotMatch(brandHierarchyCss, /teamIdentityTitleStage__microBrand|teamIdentityTitleStage__signatureRule|teamIdentityTitleStage__watermarkBrand|data-brand-treatment="none"/);
  assert.doesNotMatch(titleStageCss, /html\s+body\s+#root/);
});

test("Phase 5 gives dark Player metric surfaces explicit readable foreground ownership", () => {
  assert.match(metricCss, /--text-1:#f7f9f5/);
  assert.match(metricCss, /--text-3:#929e94/);
  assert.match(metricCss, /\.metricPrimary,\.metricSupporting/);
});

test("Phase 5 visual audit measures geometry and semantic foreground contrast rather than relying on page width alone", () => {
  assert.match(visualAudit, /expectPlayerIdentityInsideViewport/);
  assert.match(visualAudit, /expectReadablePlayerMetrics/);
  assert.match(visualAudit, /player-at-home-workspace/);
  assert.match(visualAudit, /player-leaderboards-workspace/);
  assert.match(visualAudit, /contrastRatios\.length/);
  assert.match(visualAudit, /toBeGreaterThanOrEqual\(4\.5\)/);
});

test("Phase 5 restores persistent connectivity feedback after transient notifications settle", () => {
  assert.match(feedback, /persistentFeedbackRef/);
  assert.match(feedback, /activeFeedbackRef/);
  assert.match(feedback, /const fallback = persistentFeedback\?\.id === dismissedFeedback\?\.id \? null : persistentFeedback/);
  assert.match(visualAudit, /expectPersistentFeedbackRestored/);
  assert.match(visualAudit, /Team identity saved/);
  assert.match(visualAudit, /Working offline/);
});
