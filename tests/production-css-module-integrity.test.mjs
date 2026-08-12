import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();

test("production pruning preserves generated CSS-module selectors", async () => {
  const pruneScript = await readFile(path.join(root, "scripts/prune-unreachable-global-selectors.mjs"), "utf8");
  assert.match(pruneScript, /GENERATED_CSS_MODULE_CLASS/);
  assert.match(pruneScript, /GENERATED_CSS_MODULE_CLASS\.test\(name\)/);
});

test("built Player workspace CSS remains substantive after production optimization", async () => {
  const assetsDir = path.join(root, "dist", "assets");
  const names = await readdir(assetsDir);
  const playerCss = names.find((name) => /^PlayerWorkspaces-.*\.css$/.test(name));
  assert.ok(playerCss, "Expected a PlayerWorkspaces CSS asset in dist/assets");
  const info = await stat(path.join(assetsDir, playerCss));
  assert.ok(info.size >= 20_000, `PlayerWorkspaces CSS was stripped to ${info.size} bytes`);
});
