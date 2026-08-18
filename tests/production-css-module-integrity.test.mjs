import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();

async function listCssFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await listCssFiles(fullPath));
    else if (entry.isFile() && entry.name.endsWith(".css")) files.push(fullPath);
  }
  return files;
}

test("production pruning preserves generated CSS-module selectors", async () => {
  const pruneScript = await readFile(path.join(root, "scripts/prune-unreachable-global-selectors.mjs"), "utf8");
  assert.match(pruneScript, /GENERATED_CSS_MODULE_CLASS/);
  assert.match(pruneScript, /GENERATED_CSS_MODULE_CLASS\.test\(name\)/);
});

test("production pruning preserves runtime BEM modifier selectors for reachable components", async () => {
  const pruneScript = await readFile(path.join(root, "scripts/prune-unreachable-global-selectors.mjs"), "utf8");
  assert.match(pruneScript, /BEM_MODIFIER_CLASS/);
  assert.match(pruneScript, /bemModifier\s*&&\s*corpus\.includes\(bemModifier\[1\]\)/);
});

test("built Player workspace CSS remains substantive after production optimization", async () => {
  const assetsDir = path.join(root, "dist", "assets");
  const names = await readdir(assetsDir);
  const playerCss = names.find((name) => /^PlayerWorkspaces-.*\.css$/.test(name));
  assert.ok(playerCss, "Expected a PlayerWorkspaces CSS asset in dist/assets");
  const info = await stat(path.join(assetsDir, playerCss));
  assert.ok(info.size >= 20_000, `PlayerWorkspaces CSS was stripped to ${info.size} bytes`);
});

test("built production CSS retains the team identity runtime title variants", async () => {
  const files = await listCssFiles(path.join(root, "dist"));
  const css = (await Promise.all(files.map((file) => readFile(file, "utf8")))).join("\n");
  for (const selector of [
    ".teamIdentityTitleStage--hero",
    ".teamIdentityTitleStage--dark",
    ".teamIdentityTitleStage--standard",
  ]) {
    assert.ok(css.includes(selector), `Production CSS lost runtime title selector ${selector}`);
  }
});
