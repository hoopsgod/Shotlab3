import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const secondary = fs.readFileSync(new URL("../src/components/SecondaryPageSystem.jsx", import.meta.url), "utf8");

test("Phase 4 reuses the existing ShotLab signature primitive on meaningful decision surfaces", () => {
  assert.match(secondary, /import ShotLabSignatureField from "\.\/ShotLabSignatureField\.jsx"/);
  assert.match(secondary, /<ShotLabSignatureField variant="court" className="secondaryPageDecision__signature"/);
  assert.match(secondary, /data-visual-role="primary-decision"/);
  assert.doesNotMatch(secondary, /data-shotlab-signature-field-new|Phase4SignatureField|NewSignatureField/);
});

test("decision signature remains decorative and below interactive content", () => {
  assert.match(secondary, /style=\{\{zIndex:0,opacity:mobile\?\.28:\.24\}\}/);
  assert.match(secondary, /secondaryPageDecision__icon" style=\{\{position:"relative",zIndex:1\}\}/);
  assert.match(secondary, /copyStyle=mobile\?\{[^}]*position:"relative",zIndex:1/);
  assert.match(secondary, /visualStyle=mobile\?\{[^}]*position:"relative",zIndex:1/);
});

test("Phase 4 preserves the existing decision behavior contract", () => {
  assert.match(secondary, /action\?<button type="button" onClick=\{action\.onClick\} disabled=\{action\.disabled\}/);
  assert.match(secondary, /children\?<div className="secondaryPageDecision__visual"/);
  assert.match(secondary, /data-surface="dark" data-visual-role="primary-decision"/);
});
