import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { minify } from "csso";
import { transform as transformCss } from "lightningcss";

const DIST_DIR = path.resolve(process.cwd(), "dist");
const COACH_TITLE_SOURCE = path.resolve(process.cwd(), "src/components/CoachMissionControlTitleStage.css");
const COACH_WORKSPACE_ASSET = /^CoachWorkspaces-.*\.css$/;
const AUTHORITY_BUNDLE_ASSET = /^shotlab-authority-\d+\.css$/;
const FINAL_MOBILE_AUTHORITY_ASSET = /^MobileViewportAxisAuthority2026-.*\.css$/;
const PHASE_6E_MARKER = "/* Phase 6E mobile Coach Home composition authority";
const MOBILE_700_MEDIA = /@media\s*\(\s*(?:max-width\s*:\s*700px|width\s*<=\s*700px)\s*\)\s*\{/gi;
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
  if (selector === COACH_STAGE) return ["min-height", "margin", "margin-inline"];
  if (selector === `${COACH_STAGE} .mcHeroContent`) return ["min-height", "padding"];
  if (selector === `${COACH_STAGE} .mcHeroIdentity`) return ["--coach-hero-crest", "grid-template-columns", "gap"];
  if (selector === `${COACH_STAGE} .mcHeroTeamMark`) return ["width", "height", "min-width", "min-height", "max-width", "max-height"];
  if (selector === `${COACH_STAGE} .mcProgramIdentity`) return ["max-width", "color", "font", "letter-spacing", "text-transform", "text-wrap", "overflow-wrap"];
  if (selector === `${COACH_STAGE} .mcEyebrow`) return ["grid-row", "font", "letter-spacing", "text-transform"];
  if (selector === `${COACH_STAGE} h1`) return ["max-width", "margin", "font", "font-family", "font-size", "font-weight", "line-height", "letter-spacing", "text-wrap"];
  if (selector === `${COACH_STAGE} .mcHeroContent>p`) return ["max-width", "margin", "font"];
  if (selector === `${COACH_STAGE} .mcRealityStrip`) return ["margin", "margin-top"];
  if (selector === `${COACH_STAGE} .mcRealityStrip button`) return ["min-height", "padding"];
  if (selector === `${COACH_STAGE} .mcRealityStrip strong`) return ["font-size"];
  if (selector === `${COACH_STAGE} .mcPrimary`) return ["min-height", "margin-top"];
  if (selector === ".mcShellV3 .mcFocusGrid" || selector === ".mcShellV3 .mcActivationChapter" || selector === ".mcShellV3 .mcLowerGrid") return ["margin", "margin-inline"];
  return null;
}

function rewriteMediaBlocks(css, mediaPattern, ruleRewriter) {
  let cursor = 0;
  let output = "";
  mediaPattern.lastIndex = 0;
  let match;
  while ((match = mediaPattern.exec(css))) {
    const open = css.indexOf("{", match.index);
    const close = findBalancedClose(css, open);
    if (open < 0 || close < 0) break;
    const body = css.slice(open + 1, close);
    const transformed = body.replace(/([^{}]+)\{([^{}]*)\}/g, ruleRewriter);
    output += css.slice(cursor, open + 1) + transformed + "}";
    cursor = close + 1;
    mediaPattern.lastIndex = cursor;
  }
  if (cursor === 0) return css;
  output += css.slice(cursor);
  return output;
}

function pruneSupersededCoachMobile(css) {
  let removedHeaderArms = 0;
  let prunedRules = 0;

  const output = rewriteMediaBlocks(css, MOBILE_700_MEDIA, (whole, selector, declarations) => {
    if (selector.trim().startsWith("@")) return whole;
    const arms = selector.split(",").map((arm) => arm.trim()).filter(Boolean);
    if (!arms.length) return whole;
    const kept = arms.filter((arm) => !RETIRED_MOBILE_HEADER_CHROME.test(normalizeSelector(arm)));
    removedHeaderArms += arms.length - kept.length;
    if (!kept.length) return "";
    if (kept.length === 1) {
      const properties = supersededMobileProperties(normalizeSelector(kept[0]));
      if (properties) {
        const next = removeDeclarations(declarations, properties);
        if (next !== declarations.trim()) prunedRules += 1;
        if (!next) return "";
        return `${kept[0]}{${next}}`;
      }
    }
    if (kept.length !== arms.length) return `${kept.join(",")}{${declarations}}`;
    return whole;
  });

  return { css: output, removedHeaderArms, prunedRules };
}

async function main() {
  const canonical = await loadCanonicalCoachMobileAuthority();
  const files = await listCssFiles(DIST_DIR);
  let sourceBytes = 0;
  let outputBytes = 0;
  let changedFiles = 0;
  let removedHeaderArms = 0;
  let prunedRules = 0;
  let authorityBundles = 0;

  for (const file of files) {
    const source = await readFile(file, "utf8");
    sourceBytes += Buffer.byteLength(source);
    if (FINAL_MOBILE_AUTHORITY_ASSET.test(path.basename(file))) {
      outputBytes += Buffer.byteLength(source);
      continue;
    }

    const isCoachWorkspace = COACH_WORKSPACE_ASSET.test(path.basename(file));
    const isAuthorityBundle = AUTHORITY_BUNDLE_ASSET.test(path.basename(file));
    let working = source;
    if (isCoachWorkspace) {
      const pruned = pruneSupersededCoachMobile(working);
      working = pruned.css;
      removedHeaderArms += pruned.removedHeaderArms;
      prunedRules += pruned.prunedRules;
    }

    const restructured = restructureCss(working, path.relative(DIST_DIR, file), { coach: isCoachWorkspace });
    let output = compactProductionCss(restructured, path.basename(file));
    if (isAuthorityBundle) {
      output += canonical;
      authorityBundles += 1;
    }

    outputBytes += Buffer.byteLength(output);
    if (output !== source) {
      await writeFile(file, output);
      changedFiles += 1;
    }
  }

  if (authorityBundles !== 1) {
    throw new Error(`Expected exactly one production authority bundle for Phase 6E canonical co-compression; found ${authorityBundles}.`);
  }

  console.log(`Phase 6E final production compaction changed ${changedFiles}/${files.length} CSS files; saved ${((sourceBytes - outputBytes) / 1024).toFixed(1)} KiB raw; removed ${removedHeaderArms} unreachable mobile header selector arm(s); pruned ${prunedRules} superseded Coach mobile rule(s); preserved canonical Coach mobile authority in ${authorityBundles} production authority bundle.`);
}

await main();
