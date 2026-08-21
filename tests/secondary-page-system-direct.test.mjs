import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const component = readFileSync("src/components/SecondaryPageSystem.jsx", "utf8");
const css = readFileSync("src/components/SecondaryPageSystem.css", "utf8");
const titleStage = readFileSync("src/components/TeamIdentityTitleStage.jsx", "utf8");
const titleCss = readFileSync("src/components/TeamIdentityTitleStage.css", "utf8");
const brandCss = readFileSync("src/components/TeamIdentityBrandHierarchy.css", "utf8");

test("secondary page intro delegates editorial identity to the shared premium title stage", () => {
  assert.match(component, /function SecondaryPageIntro/);
  assert.match(component, /<TeamIdentityTitleStage/);
  assert.match(component, /variant="standard"/);
  assert.match(component, /surface="light"/);
  assert.match(component, /dataMobileStage="editorial"/);
  assert.match(component, /brandTreatment="compact"/);
  assert.doesNotMatch(component, /secondaryPageIntro appHeader|secondaryPageIntro__title appHeaderTitle/);
  assert.doesNotMatch(css, /\.secondaryPageIntro\b/);
});

test("secondary destinations converge on one supporting team-identity treatment while retaining the custom crest", () => {
  assert.doesNotMatch(component, /BRAND_TREATMENT_BY_ICON|brandTreatmentFor/);
  assert.match(component, /brandTreatment="compact"/);
  assert.match(titleStage, /BRAND_TREATMENTS = new Set\(\["hero", "compact"\]\)/);
  assert.match(titleStage, /fallbackBrandTreatment = titleFamily === "identity" \? "hero" : "compact"/);
  assert.match(titleStage, /data-brand-treatment=\{resolvedBrandTreatment\}/);
  assert.match(titleStage, /const fullCrestBrand =/);
  assert.match(brandCss, /data-title-stage-family="editorial"[\s\S]*grid-template-columns:\s*minmax\(0, 1fr\) var\(--identity-crest\)/);
  assert.doesNotMatch(brandCss, /signatureRule|data-brand-treatment="none"|watermarkBrand|microBrand/);
});

test("secondary page title actions expose stable accessibility and disabled states through the shared primitive", () => {
  assert.match(component, /actions=\{actions\}/);
  assert.match(component, /status=\{status\}/);
  assert.match(titleStage, /aria-label=\{action\.ariaLabel \|\| action\.label\}/);
  assert.match(titleStage, /disabled=\{action\.disabled\}/);
  assert.match(titleStage, /aria-live="polite"/);
  assert.match(titleCss, /:focus-visible/);
  assert.match(titleCss, /:disabled/);
});

test("secondary page layout remains compact and mobile-first after the shared title stage", () => {
  assert.match(css, /width:\s*min\(100%,\s*1080px\)/);
  assert.match(css, /@media \(max-width:\s*760px\)/);
  assert.match(css, /grid-template-columns:\s*1fr/);
  assert.match(css, /min-height:\s*var\(--control-height, 48px\)/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(titleCss, /@media \(max-width:\s*390px\)/);
});