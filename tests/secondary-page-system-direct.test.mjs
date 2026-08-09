import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const component = readFileSync("src/components/SecondaryPageSystem.jsx", "utf8");
const css = readFileSync("src/components/SecondaryPageSystem.css", "utf8");

test("secondary page intro owns an editorial premium header without another card", () => {
  assert.match(component, /className="secondaryPageIntro appHeader"/);
  assert.match(component, /className="secondaryPageIntro__title appHeaderTitle"/);
  assert.match(css, /\.secondaryPageIntro\s*\{/);
  assert.match(css, /\.secondaryPageIntro\s*\{[\s\S]*?border:\s*0;/);
  assert.match(css, /\.secondaryPageIntro\s*\{[\s\S]*?background:\s*transparent;/);
  assert.match(css, /\.secondaryPageIntro\s*\{[\s\S]*?box-shadow:\s*none;/);
});

test("secondary page actions expose stable accessibility and disabled states", () => {
  assert.match(component, /aria-label=\{action\.ariaLabel\s*\|\|\s*action\.label\}/);
  assert.match(component, /disabled=\{action\.disabled\}/);
  assert.match(component, /aria-live="polite"/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /:disabled/);
});

test("secondary page layout remains compact and mobile-first", () => {
  assert.match(css, /width:\s*min\(100%,\s*1080px\)/);
  assert.match(css, /@media \(max-width:\s*760px\)/);
  assert.match(css, /grid-template-columns:\s*1fr/);
  assert.match(css, /min-height:\s*var\(--control-height, 48px\)/);
  assert.match(css, /prefers-reduced-motion/);
});
