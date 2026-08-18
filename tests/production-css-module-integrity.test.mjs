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

async function builtCss() {
  const files = await listCssFiles(path.join(root, "dist"));
  return (await Promise.all(files.map((file) => readFile(file, "utf8")))).join("\n");
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
  const css = await builtCss();
  for (const selector of [
    ".teamIdentityTitleStage--hero",
    ".teamIdentityTitleStage--dark",
    ".teamIdentityTitleStage--standard",
  ]) {
    assert.ok(css.includes(selector), `Production CSS lost runtime title selector ${selector}`);
  }
});

test("built production CSS keeps the compact mobile title authority and 96px crest floor", async () => {
  const css = await builtCss();
  assert.match(
    css,
    /\.secondaryPageIntro\.appHeader\.teamIdentityTitleStage\[data-team-identity-stage=(?:true|"true")\][^{]*\{[^}]*display:block!important[^}]*min-height:var\(--identity-crest\)!important/s,
    "Production CSS lost the compact secondary team-title display override",
  );
  assert.match(
    css,
    /--identity-crest:clamp\(96px,25vw,108px\)/,
    "Production CSS lost the 96px standard team-crest floor",
  );
  assert.match(
    css,
    /\.secondaryPageIntro\.appHeader\.teamIdentityTitleStage \.teamIdentityTitleStage__copy\{[^}]*grid-area:auto!important/s,
    "Production CSS lost the legacy named-grid reset that prevents oversized title runways",
  );
});
