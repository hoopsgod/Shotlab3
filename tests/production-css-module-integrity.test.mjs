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

test("optimized production CSS preserves Coach Home Program Pulse material authority", async () => {
  const assetsDir = path.join(root, "dist", "assets");
  const names = (await readdir(assetsDir)).filter((name) => name.endsWith(".css"));
  const matches = [];

  for (const name of names) {
    const css = await readFile(path.join(assetsDir, name), "utf8");
    for (const rule of css.matchAll(/([^{}]*\.mcTeamHealth[^{}]*)\{([^{}]*)\}/g)) {
      matches.push({ file: name, selector: rule[1].trim(), declarations: rule[2].trim() });
    }
  }

  assert.ok(matches.length > 0, "Expected optimized CSS to retain Program Pulse rules");
  const diagnostic = JSON.stringify(matches, null, 2);
  const darkOwner = matches.find(({ selector, declarations }) =>
    selector.includes(".mcShellV3 .mcTeamHealth") &&
    /background(?:-image)?\s*:[^;]*(?:gradient|#0[0-9a-f]{5}|var\(--team-brand-surface-deep)/i.test(declarations) &&
    /color\s*:\s*#f[0-9a-f]{5}/i.test(declarations)
  );
  assert.ok(darkOwner, `Expected optimized Program Pulse to retain a dark material owner. Found:\n${diagnostic}`);

  const flatteningOwner = matches.find(({ declarations }) =>
    /background(?:-color)?\s*:\s*(?:#fff(?:fff)?|white|transparent|rgba\(0,0,0,0\))/i.test(declarations)
  );
  assert.equal(flatteningOwner, undefined, `Unexpected Program Pulse flattening rule survived optimization:\n${diagnostic}`);
});
