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
const RETIRED_HEADER_CLASSES = [
  "mcMobileMenu",
  "mcBrandLockup",
  "mcBrandCopy",
  "mcHeaderActions",
  "mcBell",
  "mcHeaderTeamMark",
  "mcTeamSelect",
];

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

function parseRuleArms(body) {
  const rules = [];
  body.replace(/([^{}]+)\{([^{}]*)\}/g, (whole, selectorText, declarations) => {
    if (selectorText.trim().startsWith("@")) return whole;
    for (const arm of splitSelectorList(selectorText)) {
      rules.push({ arm, normalized: normalizeSelector(arm), declarations: declarations.trim() });
    }
    return whole;
  });
  return rules;
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

  const compact = compactProductionCss(authority, path.basename(COACH_TITLE_SOURCE));
  const open = compact.indexOf("{");
  const close = compact.lastIndexOf("}");
  if (open < 0 || close <= open) throw new Error("Could not compact canonical Coach mobile authority.");
  const body = compact.slice(open + 1, close);
  const selectorSet = new Set(parseRuleArms(body).map((rule) => rule.normalized));
  if (selectorSet.size < 20) throw new Error(`Canonical Coach mobile authority is unexpectedly small: ${selectorSet.size} selector arm(s).`);
  return { body, selectorSet };
}

function isRetiredCoachMobileArm(normalized, canonicalSelectors) {
  if (canonicalSelectors.has(normalized)) return true;
  if (normalized.includes("[data-team-identity-stage=coach-mission-control]")) return true;
  if (normalized.startsWith(".mcShellV3 .mcHeader")) return true;
  return RETIRED_HEADER_CLASSES.some((className) => normalized.includes(`.${className}`));
}

function replaceCoachMobileAuthority(css, canonical) {
  const pattern = /@media\b[^{}]*\{/gi;
  const blocks = [];
  let match;
  while ((match = pattern.exec(css))) {
    if (!isMax700MediaHeader(match[0])) continue;
    const open = css.indexOf("{", match.index);
    const close = findBalancedClose(css, open);
    if (open < 0 || close < 0) continue;
    const body = css.slice(open + 1, close);
    blocks.push({ start: match.index, open, close, body, ownsCoach: body.includes("coach-mission-control") });
    pattern.lastIndex = close + 1;
  }

  const target = blocks.find((block) => block.ownsCoach);
  if (!target) throw new Error("Could not locate optimized <=700px Coach workspace media authority.");

  let removedArms = 0;
  let cursor = 0;
  let output = "";
  for (const block of blocks) {
    const transformed = block.body.replace(/([^{}]+)\{([^{}]*)\}/g, (whole, selectorText, declarations) => {
      if (selectorText.trim().startsWith("@")) return whole;
      const arms = splitSelectorList(selectorText);
      if (!arms.length) return whole;
      const kept = arms.filter((arm) => {
        const remove = isRetiredCoachMobileArm(normalizeSelector(arm), canonical.selectorSet);
        if (remove) removedArms += 1;
        return !remove;
      });
      if (!kept.length) return "";
      if (kept.length === arms.length) return whole;
      return `${kept.join(",")}{${declarations}}`;
    });

    const replacementBody = block === target ? `${transformed}${canonical.body}` : transformed;
    output += css.slice(cursor, block.open + 1) + replacementBody + "}";
    cursor = block.close + 1;
  }
  output += css.slice(cursor);
  return { css: output, removedArms };
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
  let removedArms = 0;
  let coachWorkspaceBundles = 0;

  for (const file of files) {
    const source = await readFile(file, "utf8");
    sourceBytes += Buffer.byteLength(source);
    if (FINAL_MOBILE_AUTHORITY_ASSET.test(path.basename(file))) {
      outputBytes += Buffer.byteLength(source);
      continue;
    }

    const isCoachWorkspace = COACH_WORKSPACE_ASSET.test(path.basename(file));
    const restructured = restructureCss(source, path.relative(DIST_DIR, file), { coach: isCoachWorkspace });
    let output = compactProductionCss(restructured, path.basename(file));

    if (isCoachWorkspace) {
      coachWorkspaceBundles += 1;
      // Replace the old optimized <=700px Coach stage in situ rather than adding
      // another copy. This preserves source ownership, removes the now-hidden
      // utility-header chrome, and keeps the canonical stage ahead of the later
      // <=350px/reduced-motion refinements that still belong after it.
      const replaced = replaceCoachMobileAuthority(output, canonical);
      output = replaced.css;
      removedArms += replaced.removedArms;
      if (!hasCanonicalAuthority(output)) {
        throw new Error("Phase 6E canonical Coach mobile authority did not survive production replacement.");
      }
    }

    outputBytes += Buffer.byteLength(output);
    if (output !== source) {
      await writeFile(file, output);
      changedFiles += 1;
    }
  }

  if (coachWorkspaceBundles !== 1) throw new Error(`Expected exactly one Coach workspace CSS bundle; found ${coachWorkspaceBundles}.`);
  console.log(`Phase 6E final production compaction changed ${changedFiles}/${files.length} CSS files; saved ${((sourceBytes - outputBytes) / 1024).toFixed(1)} KiB raw; replaced ${removedArms} superseded/hidden Coach mobile selector arm(s) with the single canonical source-owned <=700px authority.`);
}

await main();
