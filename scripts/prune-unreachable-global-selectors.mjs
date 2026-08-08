import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { minify } from "csso";

const ROOT_DIR = process.cwd();
const DIST_DIR = path.resolve(ROOT_DIR, "dist");
const SOURCE_DIR = path.resolve(ROOT_DIR, "src");
const SOURCE_EXTENSIONS = new Set([".js", ".jsx", ".ts", ".tsx", ".html"]);
const DYNAMIC_CLASS = /^(?:is|has|tone|status|state|role|mode|rank|theme|size|variant)(?:-|_|$)|^(?:active|selected|disabled|open|closed|expanded|collapsed|loading|success|error|warning|danger)$/i;
const COMPLEX_PSEUDO = /:(?:not|is|where|has)\s*\(/i;

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

function classNames(selector) {
  return [...selector.matchAll(/\.(-?[_A-Za-z][_A-Za-z0-9-]*)/g)].map((match) => match[1]);
}

function classIsReachable(name, corpus) {
  if (!name || name.startsWith("_")) return true;
  if (DYNAMIC_CLASS.test(name)) return true;
  return corpus.includes(name);
}

function armIsReachable(selector, corpus) {
  if (COMPLEX_PSEUDO.test(selector)) return true;
  const classes = classNames(selector);
  if (!classes.length) return true;
  return classes.every((name) => classIsReachable(name, corpus));
}

function pruneRules(css, corpus) {
  let removedArms = 0;
  let removedRules = 0;
  const output = css.replace(/([^{}]+)\{([^{}]*)\}/g, (whole, selectorText, declarations) => {
    const selector = selectorText.trim();
    if (!selector || selector.startsWith("@")) return whole;
    const arms = splitSelectorList(selector);
    if (!arms.length) return whole;
    const kept = arms.filter((arm) => armIsReachable(arm, corpus));
    removedArms += arms.length - kept.length;
    if (!kept.length) {
      removedRules += 1;
      return "";
    }
    if (kept.length === arms.length) return whole;
    return `${kept.join(",")}{${declarations}}`;
  });
  return { css: output, removedArms, removedRules };
}

async function main() {
  const corpus = await buildRuntimeCorpus();
  const files = await listFiles(DIST_DIR, (file) => file.endsWith(".css"));
  let removedArms = 0;
  let removedRules = 0;
  let bytesSaved = 0;
  let changedFiles = 0;

  for (const file of files) {
    const source = await readFile(file, "utf8");
    const pruned = pruneRules(source, corpus);
    if (pruned.css === source) continue;
    const output = minify(pruned.css, { restructure: true, comments: false, forceMediaMerge: false }).css;
    await writeFile(file, output);
    removedArms += pruned.removedArms;
    removedRules += pruned.removedRules;
    bytesSaved += Buffer.byteLength(source) - Buffer.byteLength(output);
    changedFiles += 1;
  }

  console.log(`Pruned global selectors: ${removedArms} unreachable selector arms across ${removedRules} rules in ${changedFiles} files; saved ${(bytesSaved / 1024).toFixed(1)} KiB raw.`);
}

await main();
