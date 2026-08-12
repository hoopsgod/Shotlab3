import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const signature = fs.readFileSync(new URL("../src/components/ShotLabSignatureField.jsx", import.meta.url), "utf8");
const signatureCss = fs.readFileSync(new URL("../src/components/ShotLabSignatureField.module.css", import.meta.url), "utf8");
const identityCss = fs.readFileSync(new URL("../public/shotlab-phase4a-signature-identity.css", import.meta.url), "utf8");
const script = fs.readFileSync(new URL("../scripts/apply-phase4a-signature-visual-identity.mjs", import.meta.url), "utf8");
const pkg = JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"));

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

test("Phase 4A applies the signature to entry, Player Home, and Player Progress only", () => {
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

test("Phase 4A keeps Liquid Glass out of the content identity layer", () => {
  assert.doesNotMatch(identityCss, /backdrop-filter/i);
  assert.doesNotMatch(identityCss, /-webkit-backdrop-filter/i);
  assert.match(identityCss, /premium-leaderboards-hub/);
  assert.match(identityCss, /coach-primary-objective/);
  assert.match(identityCss, /player-command-evidence/);
  assert.match(identityCss, /player-progress-metrics/);
});

test("Phase 4A remains ordered after Phase 3 closure and before later Phase 4 authorities", () => {
  for (const name of ["dev", "prepare:route-enhancers"]) {
    const command = pkg.scripts[name];
    assert.match(command, /apply-phase3v-final-reconciliation\.mjs.*apply-phase4a-signature-visual-identity\.mjs.*apply-phase4b-premium-performance-marks\.mjs.*apply-phase4c-premium-interaction-material-motion\.mjs.*minify-visual-authority-css\.mjs/);
  }
});
