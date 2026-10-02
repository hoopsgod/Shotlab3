import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const app = await readFile("src/App.jsx", "utf8");
const css = await readFile("src/styles/DesktopHudlWorkspace2026.css", "utf8");

test("desktop workspace shell has one 1024px authority boundary", () => {
  assert.match(app, /window\.innerWidth>=1024/);
  assert.match(css, /@media\s*\(min-width:\s*1024px\)/);
  assert.doesNotMatch(css, /@media\s*\(min-width:\s*981px\)/);
  assert.doesNotMatch(css, /@media\s*\(max-width:\s*980px\)/);
});

test("persistent Coach and Player desktop navigation exposes the active route semantically", () => {
  const activeRouteSemantics = app.match(/aria-current=\{[^}]*\?\s*"page"\s*:\s*undefined\}/g) || [];
  assert.ok(activeRouteSemantics.length >= 2, `expected Coach and Player aria-current semantics; found ${activeRouteSemantics.length}`);
});

test("Phase 2 keeps native History API ownership rather than introducing a competing router", () => {
  assert.match(app, /window\.history\.pushState/);
  assert.match(app, /addEventListener\("popstate"/);
  assert.doesNotMatch(app, /BrowserRouter|createBrowserRouter|HashRouter|RouterProvider/);
});
