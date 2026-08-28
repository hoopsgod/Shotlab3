import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const signature = fs.readFileSync(new URL("../src/components/ShotLabSignatureField.jsx", import.meta.url), "utf8");
const signatureCss = fs.readFileSync(new URL("../src/components/ShotLabSignatureField.module.css", import.meta.url), "utf8");
const identityCss = fs.readFileSync(new URL("../public/shotlab-phase4a-signature-identity.css", import.meta.url), "utf8");
const script = fs.readFileSync(new URL("../scripts/apply-phase4a-signature-visual-identity.mjs", import.meta.url), "utf8");
const pkg = JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const routeEnhancers = fs.readFileSync(new URL("../scripts/run-route-enhancers.mjs", import.meta.url), "utf8");

test("Phase 4A introduces one reusable basketball signature asset system", () => {
  assert.match(signature, /data-shotlab-signature=\{variant\}/);
  assert.match(signature, /className=\{styles\.court\}/);
  assert.match(signature, /className=\{styles\.ball\}/);
  assert.match(signature, /className=\{styles\.trajectory\}/);
  assert.match(signature, /className=\{styles\.wordmark\}>SL</);
  assert.match(signatureCss, /\.court\s*\{/);
  assert.match(signatureCss, /\.ball\s*\{/);
  assert.match(signatureCss, /\.trajectory\s*\{/);
  assert.match(signatureCss, /\.identity\s+\.court/);
});

test("Phase 4A applies the existing signature to entry, Player Home, and Player Progress only", () => {
  assert.match(script, /auth-signature-field/);
  assert.match(script, /player-home-signature-field/);
  assert.match(script, /player-progress-signature-field/);
  assert.match(script, /variant=\"identity\"/);
  assert.match(script, /variant=\"court\"/);
  assert.match(script, /variant=\"trajectoryVariant\"/);
  assert.doesNotMatch(script, /CoachCommandCenter/);
  assert.doesNotMatch(script, /mcCourtArtwork/);
});

test("Phase 4A signature imports remain idempotent across repeated production enhancer passes", () => {
  assert.match(script, /const ensureImportAfter =/);
  assert.match(script, /if \(source\.includes\(importStatement\)\) return source/);
  for (const target of ["PlayerDaily signature import", "PlayerProgress signature import", "Auth signature import"]) {
    assert.match(script, new RegExp(target));
  }
});

test("Phase 4A anchors Player Home by the stable command-center root, not a retired child layout", () => {
  assert.match(script, /const insertAfterOne =/);
  assert.match(script, /data-testid=\"player-daily-command-center\"/);
  assert.doesNotMatch(script, /data-layout-role=\"editorial-header\"/);
  assert.doesNotMatch(script, /data-page-hierarchy=\"activation-loop\" aria-label/);
});

test("Phase 4A keeps Liquid Glass out of the content identity layer", () => {
  assert.doesNotMatch(identityCss, /backdrop-filter/i);
  assert.doesNotMatch(identityCss, /-webkit-backdrop-filter/i);
  assert.match(identityCss, /auth-signature-field/);
  assert.match(identityCss, /player-home-signature-field/);
  assert.match(identityCss, /player-progress-signature-field/);
  assert.match(identityCss, /premium-leaderboards-hub/);
  assert.doesNotMatch(identityCss, /coach-primary-objective/);
});

test("Phase 4A remains ordered after Phase 3 closure and before later Phase 4 authorities", () => {
  assert.match(pkg.scripts.dev, /run-route-enhancers\.mjs dev/);
  assert.match(pkg.scripts["prepare:route-enhancers"], /run-route-enhancers\.mjs build/);
  assert.match(routeEnhancers, /apply-phase3v-final-reconciliation\.mjs'[\s\S]*apply-phase4a-signature-visual-identity\.mjs'[\s\S]*apply-phase4b-premium-performance-marks\.mjs'[\s\S]*apply-phase4c-premium-interaction-material-motion\.mjs'[\s\S]*minify-visual-authority-css\.mjs'/);
});
