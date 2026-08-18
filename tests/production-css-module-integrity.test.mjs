import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();

async function listBuiltFiles(directory, extension) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await listBuiltFiles(fullPath, extension));
    else if (entry.isFile() && entry.name.endsWith(extension)) files.push(fullPath);
  }
  return files;
}

async function builtText(extension) {
  const files = await listBuiltFiles(path.join(root, "dist"), extension);
  return (await Promise.all(files.map((file) => readFile(file, "utf8")))).join("\n");
}

async function builtCss() {
  return builtText(".css");
}

async function builtJs() {
  return builtText(".js");
}

function hasRule(css, predicate) {
  for (const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const [, selector, declarations] = match;
    if (predicate(selector, declarations)) return true;
  }
  return false;
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

test("built production assets retain rendered team identity variants and their styled modifiers", async () => {
  const [css, js] = await Promise.all([builtCss(), builtJs()]);

  for (const selector of [
    ".teamIdentityTitleStage--hero",
    ".teamIdentityTitleStage--dark",
  ]) {
    assert.ok(css.includes(selector), `Production CSS lost styled runtime title selector ${selector}`);
  }

  for (const runtimeClass of [
    "teamIdentityTitleStage--standard",
    "teamIdentityTitleStage--light",
  ]) {
    assert.ok(js.includes(runtimeClass), `Production JS lost rendered title class ${runtimeClass}`);
  }
});

test("built production CSS keeps the final mobile title authority and standard crest floor", async () => {
  const css = await builtCss();
  const standardSelector = (selector) => selector.includes(".teamIdentityTitleStage--standard") && selector.includes("data-team-identity-stage");
  const standardInnerSelector = (selector) => selector.includes(".teamIdentityTitleStage--standard") && selector.includes(".teamIdentityTitleStage__inner");

  assert.ok(
    hasRule(css, (selector, declarations) => standardSelector(selector) && declarations.includes("--identity-crest:clamp(96px,25vw,108px)!important")),
    "Production CSS lost the canonical 96px standard team-title crest authority",
  );
  assert.ok(
    hasRule(css, (selector, declarations) => standardSelector(selector) && declarations.includes("display:block!important")),
    "Production CSS lost final standard title display ownership",
  );
  assert.ok(
    hasRule(css, (selector, declarations) => standardInnerSelector(selector) && declarations.includes("grid-template-columns:minmax(0,1fr) var(--identity-crest)!important")),
    "Production CSS lost final title two-column identity geometry",
  );
  assert.ok(
    hasRule(css, (selector, declarations) => standardInnerSelector(selector) && declarations.includes("min-height:var(--identity-crest)!important")),
    "Production CSS lost final title crest-height ownership",
  );
  assert.match(
    css,
    /--identity-crest:\s*clamp\(\s*96px\s*,\s*25vw\s*,\s*108px\s*\)/,
    "Production CSS lost the 96px standard team-crest floor",
  );
});

test("optimized production CSS keeps the Player Home identity hero off secondary routes", async () => {
  const css = await builtCss();
  assert.match(
    css,
    /\.performance-shell--player\.is-mobile:not\(\[data-workspace-tab=(?:home|"home")\]\) \[data-testid=(?:player-dashboard-identity-header|"player-dashboard-identity-header")\]\[data-team-identity-stage=(?:true|"true")\]\{[^}]*display:none!important/,
    "Production optimization lost the home-only Player identity boundary",
  );
});
