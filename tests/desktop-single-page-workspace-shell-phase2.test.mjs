import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { applyPhase2DesktopWorkspaceHardening } from "../scripts/apply-phase2-desktop-workspace-hardening.mjs";

const app = await readFile("src/App.jsx", "utf8");
const coachHome = await readFile("src/components/CoachCommandCenter.jsx", "utf8");
const css = await readFile("src/styles/DesktopHudlWorkspace2026.css", "utf8");
const shippingApp = applyPhase2DesktopWorkspaceHardening(app);

test("desktop workspace shell has one 1024px authority boundary", () => {
  assert.match(app, /window\.innerWidth>=1024/);
  assert.match(coachHome, /const DESKTOP_RAIL_MIN_WIDTH = 1024;/);
  assert.match(css, /@media\s*\(min-width:\s*1024px\)/);
  assert.doesNotMatch(css, /@media\s*\(min-width:\s*981px\)/);
  assert.doesNotMatch(css, /@media\s*\(max-width:\s*980px\)/);
});

test("shipping Coach and Player desktop navigation exposes the active route semantically", () => {
  const activeRouteSemantics = shippingApp.match(/aria-current=\{[^}]*\?\s*"page"\s*:\s*undefined\}/g) || [];
  assert.ok(activeRouteSemantics.length >= 2, `expected Coach and Player aria-current semantics after the shipping Phase 2 enhancer; found ${activeRouteSemantics.length}`);
  assert.match(coachHome, /aria-current=\{item\.active\?"page":undefined\}/);
});

test("Phase 2 keeps native History API ownership rather than introducing a competing router", () => {
  assert.match(app, /window\.history\.pushState/);
  assert.match(app, /addEventListener\("popstate"/);
  assert.doesNotMatch(app, /BrowserRouter|createBrowserRouter|HashRouter|RouterProvider/);
});
