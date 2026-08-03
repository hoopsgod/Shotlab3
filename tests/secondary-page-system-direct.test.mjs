import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const component = readFileSync("src/components/SecondaryPageSystem.jsx", "utf8");
const css = readFileSync("src/components/SecondaryPageSystem.css", "utf8");

test("secondary page intro owns the premium app header contract directly", () => {
  assert.match(component, /className="secondaryPageIntro appHeader"/);
  assert.match(component, /className="secondaryPageIntro__title appHeaderTitle"/);
  assert.match(css, /\.secondaryPageIntro\s*\{/);
  assert.match(css, /background-image:/);
  assert.match(css, /border-radius:\s*20px/);
  assert.match(css, /box-shadow:/);
});

test("secondary page actions expose stable accessibility and disabled states", () => {
  assert.match(component, /aria-label=\{action\.ariaLabel \|\| action\.label\}/);
  assert.match(component, /disabled=\{action\.disabled\}/);
  assert.match(component, /aria-live="polite"/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /:disabled/);
});

test("secondary page layout remains compact and mobile-first", () => {
  assert.match(css, /width:\s*min\(100%,\s*1080px\)/);
  assert.match(css, /@media \(max-width:\s*760px\)/);
  assert.match(css, /grid-template-columns:\s*1fr/);
  assert.match(css, /min-height:\s*46px/);
  assert.match(css, /prefers-reduced-motion/);
});
