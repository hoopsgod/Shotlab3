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

test("optimized production bundle preserves the runtime-owned Coach Home Program Pulse material authority", async () => {
  const assetsDir = path.join(root, "dist", "assets");
  const names = (await readdir(assetsDir)).filter((name) => name.endsWith(".css"));
  const matches = [];

  for (const name of names) {
    const css = await readFile(path.join(assetsDir, name), "utf8");
    for (const rule of css.matchAll(/([^{}]*(?:\.mcTeamHealth|\[data-testid=coach-program-pulse\])[^{}]*)\{([^{}]*)\}/g)) {
      matches.push({ file: name, selector: rule[1].trim(), declarations: rule[2].trim() });
    }
  }

  const diagnostic = JSON.stringify(matches, null, 2);
  const flatteningOwner = matches.find(({ declarations }) =>
    /background(?:-color)?\s*:\s*(?:#fff(?:fff)?|white|transparent|rgba\(0,0,0,0\))/i.test(declarations)
  );
  assert.equal(flatteningOwner, undefined, `Unexpected Program Pulse flattening rule survived optimization:\n${diagnostic}`);

  const javaScriptNames = (await readdir(assetsDir)).filter((name) => name.endsWith(".js"));
  const runtimeOwners = [];
  for (const name of javaScriptNames) {
    const source = await readFile(path.join(assetsDir, name), "utf8");
    if (
      source.includes('coach-program-pulse') &&
      source.includes('--sl-surface') &&
      source.includes('linear-gradient(150deg,#0b2231,var(--team-brand-surface-deep,#06151d))') &&
      source.includes('--mc-surface-ink')
    ) runtimeOwners.push(name);
  }
  assert.ok(runtimeOwners.length > 0, "Expected optimized JavaScript to retain the runtime Program Pulse material owner");
});
