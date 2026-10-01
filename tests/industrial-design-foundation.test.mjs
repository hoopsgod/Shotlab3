import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { INDUSTRIAL_DESIGN_TOKENS } from "../src/lib/industrialDesignFoundation.js";

test("industrial design tokens retain the legacy compatibility palette", () => {
  assert.equal(INDUSTRIAL_DESIGN_TOKENS.canvas, "#f4f3ef");
  assert.equal(INDUSTRIAL_DESIGN_TOKENS.surface, "#ffffff");
  assert.equal(INDUSTRIAL_DESIGN_TOKENS.ink, "#151719");
});

test("industrial design foundation is a pre-mount compatibility marker, not a competing visual authority", () => {
  const source = fs.readFileSync(new URL("../src/lib/industrialDesignFoundation.js", import.meta.url), "utf8");
  const bootstrap = fs.readFileSync(new URL("../src/main.jsx", import.meta.url), "utf8");

  assert.match(source, /industrial-light-v1/);
  assert.match(source, /color-scheme:\s*light/);
  assert.doesNotMatch(source, /\.performance-shell|\.premium-screen|\.appHeader|\.sidebar-nav|\.premiumSummaryPanel|\.premiumStatTile/);
  assert.doesNotMatch(source, /input::placeholder|input:focus|button:active|focus-visible|prefers-reduced-motion/);

  assert.match(bootstrap, /installIndustrialDesignFoundation\(\)/);
  assert.ok(
    bootstrap.indexOf("installIndustrialDesignFoundation()") < bootstrap.indexOf("await import('./App.jsx')"),
    "industrial compatibility marker must install before App imports",
  );
  assert.ok(
    bootstrap.indexOf("await import('./App.jsx')") < bootstrap.indexOf("await import('./styles/AuthenticatedVisualAuthority2026.css')"),
    "canonical authenticated visual authority must load after App evaluation and before mount",
  );
  assert.ok(
    bootstrap.indexOf("await import('./styles/AuthenticatedVisualAuthority2026.css')") < bootstrap.indexOf("ReactDOM.createRoot"),
    "canonical authenticated visual authority must resolve before React mounts",
  );
  assert.doesNotMatch(source, /fetch\(|localStorage|supabase|save[A-Z]/);
});
