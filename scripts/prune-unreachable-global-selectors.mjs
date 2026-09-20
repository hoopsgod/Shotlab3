import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { minify } from "csso";

const ROOT_DIR = process.cwd();
const DIST_DIR = path.resolve(ROOT_DIR, "dist");
const SOURCE_DIR = path.resolve(ROOT_DIR, "src");
const SOURCE_EXTENSIONS = new Set([".js", ".jsx", ".ts", ".tsx", ".html"]);
const DYNAMIC_CLASS = /^(?:is|has|tone|status|state|role|mode|rank|theme|size|variant)(?:-|_|$)|^(?:active|selected|disabled|open|closed|expanded|collapsed|loading|success|error|warning|danger)$/i;
const COMPLEX_PSEUDO = /:(?:not|is|where|has)\s*\(/i;
const GENERATED_CSS_MODULE_CLASS = /^s_[A-Za-z0-9_-]+$/;
const FINAL_MOBILE_AUTHORITY_ASSET = /^MobileViewportAxisAuthority2026-.*\.css$/;
const COACH_WORKSPACE_ASSET = /^CoachWorkspaces-.*\.css$/;
const COACH_MOBILE_MEDIA = /@media\s*\(\s*(?:max-width\s*:\s*700px|width\s*<=\s*700px)\s*\)\s*\{/g;
const COACH_AUTHORITY_MARKERS = [
  "coach-mission-control",
  "mission-control-team-header",
  "--coach-hero-crest:clamp(104px,29vw,120px)",
  "min-height:334px",
  "min-height:48px",
  "min-height:50px",
];

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
  // Vite generates CSS-module classes with the stable `s_` prefix configured in
  // vite.config.js. Those names only exist after compilation, so source-text
  // reachability can never prove them. Treating them as dead stripped the
  // Player workspace stylesheet from production while dev remained correct.
  if (GENERATED_CSS_MODULE_CLASS.test(name)) return true;
  if (DYNAMIC_CLASS.test(name)) return true;
  return corpus.includes(name);
}

function armIsReachable(selector, corpus) {
  if (COMPLEX_PSEUDO.test(selector)) return true;
  const classes = classNames(selector);
  if (!classes.length) return true;
  return classes.every((name) => classIsReachable(name, corpus));
}

function findOpeningBrace(css, start) {
  let quote = "";
  let comment = false;
  for (let index = start; index < css.length; index += 1) {
    const char = css[index];
    const next = css[index + 1];
    if (comment) {
      if (char === "*" && next === "/") {
        comment = false;
        index += 1;
      }
      continue;
    }
    if (quote) {
      if (char === "\\") index += 1;
      else if (char === quote) quote = "";
      continue;
    }
    if (char === "/" && next === "*") {
      comment = true;
      index += 1;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (char === "{") return index;
  }
  return -1;
}

function findClosingBrace(css, openingBrace) {
  let depth = 1;
  let quote = "";
  let comment = false;
  for (let index = openingBrace + 1; index < css.length; index += 1) {
    const char = css[index];
    const next = css[index + 1];
    if (comment) {
      if (char === "*" && next === "/") {
        comment = false;
        index += 1;
      }
      continue;
    }
    if (quote) {
      if (char === "\\") index += 1;
      else if (char === quote) quote = "";
      continue;
    }
    if (char === "/" && next === "*") {
      comment = true;
      index += 1;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (char === "{") depth += 1;
    else if (char === "}" && --depth === 0) return index;
  }
  return -1;
}

function extractCanonicalCoachMobileAuthority(css) {
  COACH_MOBILE_MEDIA.lastIndex = 0;
  for (const match of css.matchAll(COACH_MOBILE_MEDIA)) {
    const openingBrace = findOpeningBrace(css, match.index);
    const closingBrace = openingBrace >= 0 ? findClosingBrace(css, openingBrace) : -1;
    if (closingBrace < 0) throw new Error("Unbalanced Coach mobile media block during global selector pruning.");
    const block = css.slice(match.index, closingBrace + 1);
    if (COACH_AUTHORITY_MARKERS.every((marker) => block.includes(marker))) {
      return { start: match.index, end: closingBrace + 1, block };
    }
  }
  throw new Error("Canonical Coach <=700px authority block was not found during global selector pruning.");
}

function pruneRules(css, corpus) {
  let removedArms = 0;
  let removedRules = 0;

  // CSS contains nested at-rules such as @media and @supports. A flat
  // /[^{}]+\{[^{}]*\}/ pass treats the outer at-rule as a selector and then
  // consumes only its first child, which silently deletes responsive rules.
  // Walk balanced blocks instead so selector reachability is applied inside
  // nested at-rules without changing their cascade boundaries.
  function walk(source) {
    let output = "";
    let cursor = 0;
    let scan = 0;

    while (scan < source.length) {
      const openingBrace = findOpeningBrace(source, scan);
      if (openingBrace < 0) {
        output += source.slice(cursor);
        break;
      }

      const closingBrace = findClosingBrace(source, openingBrace);
      if (closingBrace < 0) {
        output += source.slice(cursor);
        break;
      }

      const prelude = source.slice(cursor, openingBrace);
      const normalizedPrelude = prelude.replace(/\/\*[\s\S]*?\*\//g, "").trim();
      const body = source.slice(openingBrace + 1, closingBrace);

      if (!normalizedPrelude || normalizedPrelude.startsWith("@")) {
        output += `${prelude}{${normalizedPrelude.startsWith("@") ? walk(body) : body}}`;
      } else {
        const arms = splitSelectorList(normalizedPrelude);
        if (!arms.length) {
          output += `${prelude}{${body}}`;
        } else {
          const kept = arms.filter((arm) => armIsReachable(arm, corpus));
          removedArms += arms.length - kept.length;
          if (!kept.length) {
            removedRules += 1;
          } else if (kept.length === arms.length) {
            output += `${prelude}{${body}}`;
          } else {
            const leadingWhitespace = prelude.match(/^\s*/)?.[0] || "";
            output += `${leadingWhitespace}${kept.join(",")}{${body}}`;
          }
        }
      }

      scan = closingBrace + 1;
      cursor = scan;
    }

    return output;
  }

  return { css: walk(css), removedArms, removedRules };
}

async function main() {
  const corpus = await buildRuntimeCorpus();
  const files = await listFiles(DIST_DIR, (file) => file.endsWith(".css"));
  let removedArms = 0;
  let removedRules = 0;
  let bytesSaved = 0;
  let changedFiles = 0;
  let protectedFiles = 0;

  for (const file of files) {
    // This sheet is intentionally loaded last and contains the final mobile
    // geometry/contrast authority. Source-text reachability is not a safe proof
    // for a whole late authority layer: previous pruning reduced the emitted
    // asset to zero bytes even though its selectors matched live Coach DOM.
    if (FINAL_MOBILE_AUTHORITY_ASSET.test(path.basename(file))) {
      protectedFiles += 1;
      continue;
    }
    const source = await readFile(file, "utf8");
    const pruned = pruneRules(source, corpus);
    if (pruned.css === source) continue;
    let optimizationInput = pruned.css;
    let canonicalAuthority = "";
    if (COACH_WORKSPACE_ASSET.test(path.basename(file))) {
      const authority = extractCanonicalCoachMobileAuthority(pruned.css);
      optimizationInput = `${pruned.css.slice(0, authority.start)}${pruned.css.slice(authority.end)}`;
      canonicalAuthority = authority.block;
    }
    const output = `${minify(optimizationInput, {
      restructure: true,
      comments: false,
      forceMediaMerge: false,
    }).css}${canonicalAuthority}`;
    await writeFile(file, output);
    removedArms += pruned.removedArms;
    removedRules += pruned.removedRules;
    bytesSaved += Buffer.byteLength(source) - Buffer.byteLength(output);
    changedFiles += 1;
  }

  console.log(`Pruned global selectors: ${removedArms} unreachable selector arms across ${removedRules} rules in ${changedFiles} files; saved ${(bytesSaved / 1024).toFixed(1)} KiB raw; protected ${protectedFiles} final mobile authority asset(s).`);
}

await main();
