import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { INDUSTRIAL_DESIGN_TOKENS } from "../src/lib/industrialDesignFoundation.js";

test("industrial design tokens establish a restrained editorial light system", () => {
  assert.equal(INDUSTRIAL_DESIGN_TOKENS.canvas, "#f4f3ef");
  assert.equal(INDUSTRIAL_DESIGN_TOKENS.surface, "#ffffff");
  assert.equal(INDUSTRIAL_DESIGN_TOKENS.ink, "#151719");
});

test("industrial design foundation covers coach and player premium surfaces without changing behavior", () => {
  const source = fs.readFileSync(new URL("../src/lib/industrialDesignFoundation.js", import.meta.url), "utf8");
  const bootstrap = fs.readFileSync(new URL("../src/lib/coachActivationPath.js", import.meta.url), "utf8");
  assert.match(source, /industrial-light-v1/);
  assert.match(source, /\.performance-shell/);
  assert.match(source, /\.premium-screen/);
  assert.match(source, /prefers-reduced-motion/);
  assert.match(source, /focus-visible/);
  assert.match(source, /min-height|appHeader/);
  assert.match(bootstrap, /installIndustrialDesignFoundation\(\)/);
  assert.doesNotMatch(source, /fetch\(|localStorage|supabase|save[A-Z]/);
});
