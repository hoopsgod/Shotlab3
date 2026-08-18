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

function compact(value) {
  return value.replace(/\s+/g, "");
}

function hasRule(css, predicate) {
  for (const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const [, selector, declarations] = match;
    if (predicate(compact(selector), compact(declarations))) return true;
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

test("built production CSS keeps canonical mobile title geometry after authority deduplication", async () => {
  const css = await builtCss();

  assert.ok(
    hasRule(css, (selector, declarations) => selector.includes(".teamIdentityTitleStage")
      && declarations.includes("--identity-crest:clamp(96px,25vw,108px)")),
    "Production CSS lost the canonical 96px standard team-crest floor",
  );
  assert.ok(
    hasRule(css, (selector, declarations) => selector.includes(".teamIdentityTitleStage__inner")
      && declarations.includes("grid-template-columns:minmax(0,1fr)var(--identity-crest)!important")
      && declarations.includes("min-height:var(--identity-crest)")),
    "Production CSS lost the shared two-column title geometry",
  );
  assert.ok(
    hasRule(css, (selector, declarations) => selector.includes(".teamIdentityTitleStage__crestSlot")
      && declarations.includes("width:var(--identity-crest)!important")
      && declarations.includes("height:var(--identity-crest)!important")),
    "Production CSS lost crest-slot ownership",
  );
  assert.ok(
    hasRule(css, (selector, declarations) => selector.includes(".teamIdentityTitleStage")
      && selector.includes(".teamIdentityTitleStage__crest")
      && declarations.includes("width:100%!important")
      && declarations.includes("height:100%!important")
      && declarations.includes("max-width:none!important")
      && declarations.includes("max-height:none!important")
      && declarations.includes("object-fit:contain")),
    "Production CSS lost full-size contained crest rendering or legacy-cap protection",
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
