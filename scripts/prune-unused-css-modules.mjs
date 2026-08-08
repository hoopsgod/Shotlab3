import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { minify } from "csso";

const ROOT_DIR = process.cwd();
const DIST_DIR = path.resolve(ROOT_DIR, "dist");
const SOURCE_DIR = path.resolve(ROOT_DIR, "src");
const SOURCE_EXTENSIONS = new Set([".js", ".jsx", ".ts", ".tsx", ".html"]);
const MODULE_CLASS = /^_([A-Za-z][A-Za-z0-9_-]*?)_[A-Za-z0-9]{5,}_(?:\d+)$/;
const DYNAMIC_LOCAL = /^(?:root|active|selected|disabled|open|closed|expanded|collapsed|loading|success|error|warning|danger|compact|daily|header|panel|command|tone|status|state|role|mode|rank|theme|size|variant)$/i;

async function listFiles(directory, predicate) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(full, predicate));
    else if (entry.isFile() && predicate(full)) files.push(full);
  }
  return files;
}

async function buildRuntimeCorpus() {
  const files = await listFiles(SOURCE_DIR, (file) => SOURCE_EXTENSIONS.has(path.extname(file)));
  files.push(path.resolve(ROOT_DIR, "index.html"));
  return (await Promise.all(files.map((file) => readFile(file, "utf8").catch(() => "")))).join("\n");
}

function splitSelectorList(selectorText) {
  const parts = [];
  let start = 0;
  let paren = 0;
  let bracket = 0;
  let quote = "";
  for (let index = 0; index <= selectorText.length; index += 1) {
    const char = selectorText[index] || ",";
    if (quote) {
      if (char === "\\") index += 1;
      else if (char === quote) quote = "";
      continue;
    }
    if (char === '"' || char === "'") { quote = char; continue; }
    if (char === "(") paren += 1;
    else if (char === ")") paren = Math.max(0, paren - 1);
    else if (char === "[") bracket += 1;
    else if (char === "]") bracket = Math.max(0, bracket - 1);
    else if (char === "," && paren === 0 && bracket === 0) {
      const part = selectorText.slice(start, index).trim();
      if (part) parts.push(part);
      start = index + 1;
    }
  }
  return parts;
}

function generatedModuleLocals(selector) {
  const locals = [];
  for (const match of selector.matchAll(/\.(-?[_A-Za-z][_A-Za-z0-9-]*)/g)) {
    const generated = match[1];
    const moduleMatch = generated.match(MODULE_CLASS);
    if (moduleMatch) locals.push(moduleMatch[1]);
  }
  return locals;
}

function localIsReferenced(local, corpus) {
  if (!local || DYNAMIC_LOCAL.test(local)) return true;
  const probes = [
    `.${local}`,
    `["${local}"]`,
    `['${local}']`,
    `"${local}"`,
    `'${local}'`,
  ];
  return probes.some((probe) => corpus.includes(probe));
}

function selectorArmIsReachable(selector, corpus) {
  const locals = generatedModuleLocals(selector);
  if (!locals.length) return true;
  return locals.every((local) => localIsReferenced(local, corpus));
}

function pruneFlatRules(css, corpus) {
  let removedSelectors = 0;
  let removedRules = 0;
  const output = css.replace(/([^{}]+)\{([^{}]*)\}/g, (whole, selectorText, declarations) => {
    const selector = selectorText.trim();
    if (!selector || selector.startsWith("@") || !selector.includes("._")) return whole;
    const arms = splitSelectorList(selector);
    if (!arms.length) return whole;
    const kept = arms.filter((arm) => selectorArmIsReachable(arm, corpus));
    removedSelectors += arms.length - kept.length;
    if (!kept.length) {
      removedRules += 1;
      return "";
    }
    if (kept.length === arms.length) return whole;
    return `${kept.join(",")}{${declarations}}`;
  });
  return { css: output, removedSelectors, removedRules };
}

async function main() {
  const corpus = await buildRuntimeCorpus();
  const cssFiles = await listFiles(DIST_DIR, (file) => file.endsWith(".css"));
  let removedSelectors = 0;
  let removedRules = 0;
  let rawSaved = 0;
  let changed = 0;

  for (const file of cssFiles) {
    const source = await readFile(file, "utf8");
    const pruned = pruneFlatRules(source, corpus);
    if (pruned.css === source) continue;
    const compressed = minify(pruned.css, { restructure: true, comments: false, forceMediaMerge: false }).css;
    await writeFile(file, compressed);
    changed += 1;
    removedSelectors += pruned.removedSelectors;
    removedRules += pruned.removedRules;
    rawSaved += Buffer.byteLength(source) - Buffer.byteLength(compressed);
  }

  console.log(`Pruned CSS Modules: ${removedSelectors} unreachable selector arms across ${removedRules} rules in ${changed} files; saved ${(rawSaved / 1024).toFixed(1)} KiB raw.`);
}

await main();
