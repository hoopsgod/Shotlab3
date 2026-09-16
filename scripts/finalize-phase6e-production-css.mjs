import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { minify } from "csso";
import { transform as transformCss } from "lightningcss";

const DIST_DIR = path.resolve(process.cwd(), "dist");
const COACH_TITLE_SOURCE = path.resolve(process.cwd(), "src/components/CoachMissionControlTitleStage.css");
const COACH_WORKSPACE_ASSET = /^CoachWorkspaces-.*\.css$/;
const FINAL_MOBILE_AUTHORITY_ASSET = /^MobileViewportAxisAuthority2026-.*\.css$/;
const PHASE_6E_MARKER = "/* Phase 6E mobile Coach Home composition authority.";
const MOBILE_700_MEDIA = /@media\s*\(\s*(?:max-width\s*:\s*700px|width\s*<=\s*700px)\s*\)\s*\{/gi;
const MOBILE_350_MEDIA = /@media\s*\(\s*(?:max-width\s*:\s*350px|width\s*<=\s*350px)\s*\)\s*\{/gi;
const RETIRED_MOBILE_HEADER_CHROME = /\.mcShellV3\s+(?:\.mcHeader\b|\.mcBrandLockup\b|\.mcBrandCopy\b|\.mcHeaderActions\b|\.mcBell\b|\.mcMobileMenu\b|\.mcHeaderTeamMark\b|\.mcTeamSelect\b)/;
const COACH_STAGE = ".mcShellV3 .mcHero[data-team-identity-stage=coach-mission-control]";

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

async function loadCanonicalCoachMobileAuthority() {
  const source = await readFile(COACH_TITLE_SOURCE, "utf8");
  const marker = source.indexOf(PHASE_6E_MARKER);
  const mediaStart = source.indexOf("@media(max-width:700px)", marker);
  if (marker < 0 || mediaStart < 0) {
    throw new Error("Could not locate the Phase 6E canonical Coach mobile source authority.");
  }
  const authority = readBalancedBlock(source, mediaStart);
  if (!authority) throw new Error("Could not read the Phase 6E canonical Coach mobile source authority block.");

  for (const required of [
    "min-height:334px",
    "--coach-hero-crest:clamp(104px,29vw,120px)",
    "min-height:54px",
    "margin-inline:0",
    "mission-control-team-header",
  ]) {
    if (!authority.includes(required)) {
      throw new Error(`Canonical Coach mobile source authority is incomplete: ${required}`);
    }
  }

  return compactProductionCss(authority, path.basename(COACH_TITLE_SOURCE));
}

function normalizeSelector(selector) {
  return selector.replace(/["']/g, "").replace(/\s+/g, " ").trim();
}

function removeDeclarations(declarations, properties) {
  const remove = new Set(properties);
  return declarations
    .split(";")
    .map((declaration) => declaration.trim())
    .filter(Boolean)
    .filter((declaration) => {
      const property = declaration.match(/^([\w-]+)\s*:/)?.[1];
      return !property || !remove.has(property);
    })
    .join(";");
}

function supersededMobileProperties(selector) {
  if (selector === COACH_STAGE) return ["min-height", "margin"];
  if (selector === `${COACH_STAGE} .mcHeroContent`) return ["min-height", "padding"];
  if (selector === `${COACH_STAGE} .mcHeroIdentity`) return ["--coach-hero-crest", "grid-template-columns", "gap"];
  if (selector === `${COACH_STAGE} .mcHeroTeamMark`) return ["width", "height", "min-width", "min-height", "max-width", "max-height"];
  if (selector === `${COACH_STAGE} .mcProgramIdentity`) return ["max-width", "color", "font", "letter-spacing", "text-transform", "text-wrap", "overflow-wrap"];
  if (selector === `${COACH_STAGE} .mcEyebrow`) return ["grid-row", "font", "letter-spacing", "text-transform"];
  if (selector === `${COACH_STAGE} h1`) return ["max-width", "margin", "font", "font-family", "font-size", "font-weight", "line-height", "letter-spacing", "text-wrap"];
  if (selector === `${COACH_STAGE} .mcHeroContent>p`) return ["max-width", "margin", "font"];
  if (selector === `${COACH_STAGE} .mcRealityStrip`) return ["margin"];
  if (selector === `${COACH_STAGE} .mcRealityStrip button`) return ["min-height", "padding"];
  if (selector === `${COACH_STAGE} .mcRealityStrip strong`) return ["font", "font-size"];
  if (selector === `${COACH_STAGE} .mcPrimary`) return ["min-height", "margin-top"];
  if (selector === ".mcShellV3 .mcFocusGrid") return ["margin"];
  if (selector === ".mcShellV3 .mcActivationChapter") return ["margin"];
  if (selector === ".mcShellV3 .mcLowerGrid") return ["margin"];
  return null;
}

function supersededNarrowProperties(selector) {
  if (selector === `${COACH_STAGE} .mcHeroContent`) return ["padding-inline", "padding-left", "padding-right"];
  if (selector === `${COACH_STAGE} .mcHeroIdentity`) return ["grid-template-columns"];
  if (selector === `${COACH_STAGE} .mcHeroTeamMark`) return ["width", "height", "min-width", "min-height", "max-width", "max-height"];
  if (selector === `${COACH_STAGE} h1`) return ["font-size"];
  return null;
}

function rewriteMediaBlocks(css, mediaPattern, ruleRewriter) {
  let cursor = 0;
  let output = "";
  let changed = 0;
  mediaPattern.lastIndex = 0;
  let match;

  while ((match = mediaPattern.exec(css))) {
    const open = css.indexOf("{", match.index);
    const close = findBalancedClose(css, open);
    if (open < 0 || close < 0) break;
    const body = css.slice(open + 1, close);
    const transformed = body.replace(/([^{}]+)\{([^{}]*)\}/g, (whole, selector, declarations) => {
      const result = ruleRewriter(selector, declarations, whole);
      if (result !== whole) changed += 1;
      return result;
    });
    output += css.slice(cursor, open + 1) + transformed + "}";
    cursor = close + 1;
    mediaPattern.lastIndex = cursor;
  }

  if (cursor === 0) return { css, changed: 0 };
  output += css.slice(cursor);
  return { css: output, changed };
}

function pruneSupersededCoachMobile(css) {
  let removedHeaderArms = 0;
  let prunedRules = 0;

  const mobile = rewriteMediaBlocks(css, MOBILE_700_MEDIA, (wholeSelector, declarations, whole) => {
    if (wholeSelector.trim().startsWith("@")) return whole;
    const arms = wholeSelector.split(",").map((arm) => arm.trim()).filter(Boolean);
    if (!arms.length) return whole;
    const keptArms = arms.filter((arm) => !RETIRED_MOBILE_HEADER_CHROME.test(normalizeSelector(arm)));
    removedHeaderArms += arms.length - keptArms.length;
    if (!keptArms.length) return "";
    if (keptArms.length === 1) {
      const properties = supersededMobileProperties(normalizeSelector(keptArms[0]));
      if (properties) {
        const next = removeDeclarations(declarations, properties);
        if (next !== declarations.trim()) prunedRules += 1;
        if (!next) return "";
        return `${keptArms[0]}{${next}}`;
      }
    }
    if (keptArms.length !== arms.length) return `${keptArms.join(",")}{${declarations}}`;
    return whole;
  });

  const narrow = rewriteMediaBlocks(mobile.css, MOBILE_350_MEDIA, (selector, declarations, whole) => {
    if (selector.trim().startsWith("@")) return whole;
    const arms = selector.split(",").map((arm) => arm.trim()).filter(Boolean);
    if (arms.length !== 1) return whole;
    const properties = supersededNarrowProperties(normalizeSelector(arms[0]));
    if (!properties) return whole;
    const next = removeDeclarations(declarations, properties);
    if (next !== declarations.trim()) prunedRules += 1;
    if (!next) return "";
    return `${arms[0]}{${next}}`;
  });

  return { css: narrow.css, removedHeaderArms, prunedRules };
}

function stripRuntimeGatedCoachAuthority(css) {
  let removed = 0;
  const stripped = css.replace(/([^{}]+)\{([^{}]*)\}/g, (whole, selector) => {
    if (!normalizeSelector(selector).includes("body.mission-control-active .mcShellV3.is-mobile-shell")) return whole;
    removed += 1;
    return "";
  });
  return { css: stripped, removed };
}

async function main() {
  const files = await listCssFiles(DIST_DIR);
  const canonical = await loadCanonicalCoachMobileAuthority();
  let sourceBytes = 0;
  let outputBytes = 0;
  let changedFiles = 0;
  let strippedRules = 0;
  let removedHeaderArms = 0;
  let prunedRules = 0;

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
      const stripped = stripRuntimeGatedCoachAuthority(working);
      working = stripped.css;
      strippedRules += stripped.removed;
      const pruned = pruneSupersededCoachMobile(working);
      working = pruned.css;
      removedHeaderArms += pruned.removedHeaderArms;
      prunedRules += pruned.prunedRules;
    }

    // Restore the pre-Phase-6E final compaction behavior for the legacy bundle.
    // The canonical Coach mobile authority is isolated from this pass and restored
    // afterward so existing app-wide visual baselines and CSS budgets remain stable.
    const restructured = restructureCss(working, path.relative(DIST_DIR, file), { coach: isCoachWorkspace });
    let output = compactProductionCss(restructured, path.basename(file));
    if (isCoachWorkspace) output += canonical;

    outputBytes += Buffer.byteLength(output);
    if (output !== source) {
      await writeFile(file, output);
      changedFiles += 1;
    }
  }

  console.log(`Phase 6E final production compaction changed ${changedFiles}/${files.length} CSS files; saved ${((sourceBytes - outputBytes) / 1024).toFixed(1)} KiB raw; stripped ${strippedRules} runtime-gated compiled rule(s); removed ${removedHeaderArms} unreachable mobile header selector arm(s); pruned ${prunedRules} superseded Coach mobile rule(s); restored canonical Coach mobile authority after compaction.`);
}

await main();
