import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { minify } from "csso";
import { transform as transformCss } from "lightningcss";

const DIST_DIR = path.resolve(process.cwd(), "dist");
const COACH_TITLE_SOURCE = path.resolve(process.cwd(), "src/components/CoachMissionControlTitleStage.css");
const COACH_WORKSPACE_ASSET = /^CoachWorkspaces-.*\.css$/;
const FINAL_MOBILE_AUTHORITY_ASSET = /^MobileViewportAxisAuthority2026-.*\.css$/;
const PHASE_6E_MARKER = "/* Phase 6E mobile Coach Home composition authority";
const CANONICAL_SIGNATURES = [
  "min-height:334px",
  "--coach-hero-crest:clamp(104px,29vw,120px)",
  "min-height:54px",
];
const RETIRED_HEADER_CLASSES = new Set([
  "mcMobileMenu",
  "mcBrandLockup",
  "mcBrandCopy",
  "mcHeaderActions",
  "mcBell",
  "mcHeaderTeamMark",
  "mcTeamSelect",
]);

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

function compactProductionCss(css, filename) {
  return transformCss({
    filename,
    code: Buffer.from(css),
    minify: true,
    sourceMap: false,
    errorRecovery: false,
  }).code.toString("utf8");
}

function restructureCss(css, filename, { coach = false } = {}) {
  return minify(css, {
    filename,
    restructure: true,
    comments: false,
    forceMediaMerge: coach,
  }).css;
}

function findBalancedClose(source, openIndex) {
  let depth = 0;
  for (let index = openIndex; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    else if (source[index] === "}") {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  return -1;
}

function readBalancedBlock(source, start) {
  const open = source.indexOf("{", start);
  if (open < 0) return "";
  const close = findBalancedClose(source, open);
  return close < 0 ? "" : source.slice(start, close + 1);
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

function normalizeSelector(selector) {
  return selector
    .replace(/["']/g, "")
    .replace(/\s*>\s*/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function isMax700MediaHeader(header) {
  return /max-width\s*:\s*700px/i.test(header) || /width\s*<=\s*700px/i.test(header);
}

function mediaBlocks(css) {
  const blocks = [];
  const pattern = /@media\b[^{}]*\{/gi;
  let match;
  while ((match = pattern.exec(css))) {
    if (!isMax700MediaHeader(match[0])) continue;
    const open = css.indexOf("{", match.index);
    const close = findBalancedClose(css, open);
    if (open < 0 || close < 0) continue;
    blocks.push({ start: match.index, open, close, header: css.slice(match.index, open + 1), body: css.slice(open + 1, close) });
    pattern.lastIndex = close + 1;
  }
  return blocks;
}

function parseRuleArms(body) {
  const rules = [];
  body.replace(/([^{}]+)\{([^{}]*)\}/g, (whole, selectorText, declarations) => {
    if (selectorText.trim().startsWith("@")) return whole;
    for (const arm of splitSelectorList(selectorText)) rules.push({ arm, normalized: normalizeSelector(arm), declarations: declarations.trim() });
    return whole;
  });
  return rules;
}

function isCanonicalMigrationArm(normalized) {
  if (normalized === ".mcShellV3 .mcHeader[data-testid=mission-control-team-header]") return true;
  if (normalized.includes("[data-team-identity-stage=coach-mission-control]")) return true;
  return normalized === ".mcShellV3 .mcFocusGrid"
    || normalized === ".mcShellV3 .mcActivationChapter"
    || normalized === ".mcShellV3 .mcLowerGrid";
}

function isRetiredHiddenHeaderArm(normalized) {
  if (normalized === ".mcShellV3 .mcHeader[data-testid=mission-control-team-header]") return false;
  return [...RETIRED_HEADER_CLASSES].some((className) => normalized.includes(`.${className}`));
}

async function loadCanonicalCoachMobileAuthority() {
  const source = await readFile(COACH_TITLE_SOURCE, "utf8");
  const marker = source.indexOf(PHASE_6E_MARKER);
  const mediaStart = source.indexOf("@media(max-width:700px)", marker);
  if (marker < 0 || mediaStart < 0) throw new Error("Could not locate the Phase 6E canonical Coach mobile source authority.");
  const authority = readBalancedBlock(source, mediaStart);
  if (!authority) throw new Error("Could not read the Phase 6E canonical Coach mobile source authority block.");
  for (const required of [...CANONICAL_SIGNATURES, "mission-control-team-header"]) {
    if (!authority.includes(required)) throw new Error(`Canonical Coach mobile source authority is incomplete: ${required}`);
  }

  const open = authority.indexOf("{");
  const body = authority.slice(open + 1, -1);
  const canonicalByArm = new Map();
  for (const rule of parseRuleArms(body)) {
    if (isCanonicalMigrationArm(rule.normalized)) canonicalByArm.set(rule.normalized, rule.declarations);
  }
  if (canonicalByArm.size < 12) throw new Error(`Canonical Coach mobile migration map is unexpectedly small: ${canonicalByArm.size} selector arm(s).`);
  return { css: compactProductionCss(authority, path.basename(COACH_TITLE_SOURCE)), canonicalByArm };
}

function reconcileCoachMobileAuthority(css, canonicalByArm) {
  const blocks = mediaBlocks(css);
  if (!blocks.length) return { css, reconciledArms: 0, removedHeaderArms: 0, missingArms: [...canonicalByArm.keys()] };

  const seen = new Set();
  let reconciledArms = 0;
  let removedHeaderArms = 0;
  let cursor = 0;
  let output = "";

  for (const block of blocks) {
    const transformed = block.body.replace(/([^{}]+)\{([^{}]*)\}/g, (whole, selectorText, declarations) => {
      if (selectorText.trim().startsWith("@")) return whole;
      const originalArms = splitSelectorList(selectorText);
      if (!originalArms.length) return whole;
      const passthrough = [];
      const canonicalRules = [];

      for (const arm of originalArms) {
        const normalized = normalizeSelector(arm);
        if (canonicalByArm.has(normalized)) {
          canonicalRules.push(`${arm}{${canonicalByArm.get(normalized)}}`);
          seen.add(normalized);
          reconciledArms += 1;
        } else if (isRetiredHiddenHeaderArm(normalized)) {
          removedHeaderArms += 1;
        } else {
          passthrough.push(arm);
        }
      }

      const pieces = [];
      if (passthrough.length) pieces.push(`${passthrough.join(",")}{${declarations}}`);
      pieces.push(...canonicalRules);
      return pieces.join("");
    });

    output += css.slice(cursor, block.open + 1) + transformed + "}";
    cursor = block.close + 1;
  }
  output += css.slice(cursor);

  const missingArms = [...canonicalByArm.keys()].filter((arm) => !seen.has(arm));
  if (missingArms.length) {
    const missingRules = missingArms.map((arm) => `${arm}{${canonicalByArm.get(arm)}}`).join("");
    output += `@media(max-width:700px){${missingRules}}`;
  }

  return { css: output, reconciledArms, removedHeaderArms, missingArms };
}

function hasCanonicalAuthority(css) {
  return CANONICAL_SIGNATURES.every((signature) => css.includes(signature));
}

async function main() {
  const canonical = await loadCanonicalCoachMobileAuthority();
  const files = await listCssFiles(DIST_DIR);
  let sourceBytes = 0;
  let outputBytes = 0;
  let changedFiles = 0;
  let removedHeaderArms = 0;
  let reconciledArms = 0;
  let missingArms = 0;
  let coachWorkspaceBundles = 0;

  for (const file of files) {
    const source = await readFile(file, "utf8");
    sourceBytes += Buffer.byteLength(source);
    if (FINAL_MOBILE_AUTHORITY_ASSET.test(path.basename(file))) {
      outputBytes += Buffer.byteLength(source);
      continue;
    }

    const isCoachWorkspace = COACH_WORKSPACE_ASSET.test(path.basename(file));
    let working = source;
    if (isCoachWorkspace) {
      coachWorkspaceBundles += 1;
      const reconciled = reconcileCoachMobileAuthority(working, canonical.canonicalByArm);
      working = reconciled.css;
      removedHeaderArms += reconciled.removedHeaderArms;
      reconciledArms += reconciled.reconciledArms;
      missingArms += reconciled.missingArms.length;
    }

    const restructured = restructureCss(working, path.relative(DIST_DIR, file), { coach: isCoachWorkspace });
    const output = compactProductionCss(restructured, path.basename(file));
    if (isCoachWorkspace && !hasCanonicalAuthority(output)) {
      throw new Error("Phase 6E canonical Coach mobile authority did not survive in-place production reconciliation.");
    }

    outputBytes += Buffer.byteLength(output);
    if (output !== source) {
      await writeFile(file, output);
      changedFiles += 1;
    }
  }

  if (coachWorkspaceBundles !== 1) throw new Error(`Expected exactly one Coach workspace CSS bundle; found ${coachWorkspaceBundles}.`);
  console.log(`Phase 6E final production compaction changed ${changedFiles}/${files.length} CSS files; saved ${((sourceBytes - outputBytes) / 1024).toFixed(1)} KiB raw; reconciled ${reconciledArms} canonical Coach mobile selector arm(s) in place; removed ${removedHeaderArms} unreachable hidden-header selector arm(s); restored ${missingArms} missing canonical selector arm(s) without duplicating the full mobile block.`);
}

await main();
