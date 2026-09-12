import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const secondary = fs.readFileSync(new URL("../src/components/SecondaryPageSystem.jsx", import.meta.url), "utf8");
const coachStage = fs.readFileSync(new URL("../src/components/CoachRoutePerformanceStage.jsx", import.meta.url), "utf8");

test("Phase 4 keeps signature treatment scoped to dedicated identity surfaces", () => {
  assert.match(secondary, /data-visual-role="primary-decision"/);
  assert.match(coachStage, /className=\{styles\.watermark\} aria-hidden="true"/);
  assert.doesNotMatch(secondary, /BRAND_TREATMENT_BY_ICON|brandTreatmentFor|signature|watermark|brandTreatment="none"/);
});

test("Phase 4 preserves the existing decision behavior contract", () => {
  assert.match(secondary, /action\?<button type="button" onClick=\{runAction\} disabled=\{action\.disabled \|\| actionWorking\} aria-busy=\{actionWorking \|\| undefined\} data-working=/);
  assert.match(secondary, /children\?<div className="secondaryPageDecision__visual"/);
  assert.match(secondary, /data-surface="dark" data-visual-role="primary-decision"/);
});
