import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { applyPhase2CoachHomeHardening, applyPhase2DesktopWorkspaceHardening } from "../scripts/apply-phase2-desktop-workspace-hardening.mjs";

const app = await readFile("src/App.jsx", "utf8");
const coachHome = await readFile("src/components/CoachCommandCenter.jsx", "utf8");
const chrome = await readFile("src/components/DesktopWorkspaceChrome.jsx", "utf8");
const css = await readFile("src/styles/DesktopHudlWorkspace2026.css", "utf8");
const shippingApp = applyPhase2DesktopWorkspaceHardening(app);
const shippingCoachHome = applyPhase2CoachHomeHardening(coachHome);

test("desktop workspace shell has one 1024px authority boundary", () => {
  assert.match(app, /window\.innerWidth>=1024/);
  assert.match(shippingCoachHome, /const DESKTOP_RAIL_MIN_WIDTH = 1024;/);
  assert.match(css, /@media\s*\(min-width:\s*1024px\)/);
  assert.doesNotMatch(css, /@media\s*\(min-width:\s*981px\)/);
  assert.doesNotMatch(css, /@media\s*\(max-width:\s*980px\)/);
});

test("shipping Coach and Player desktop navigation exposes the active route semantically", () => {
  assert.match(shippingApp, /<DesktopWorkspaceNavigation role="Coach"/);
  assert.match(shippingApp, /<DesktopWorkspaceNavigation role="Player"/);
  assert.match(chrome, /aria-current=\{activeKey === item.k \? "page" : undefined\}/);
  assert.match(shippingCoachHome, /aria-current=\{item\.active\?"page":undefined\}/);
});

test("Phase 2 keeps native History API ownership rather than introducing a competing router", () => {
  assert.match(app, /window\.history\.pushState/);
  assert.match(app, /addEventListener\("popstate"/);
  assert.doesNotMatch(app, /BrowserRouter|createBrowserRouter|HashRouter|RouterProvider/);
});
