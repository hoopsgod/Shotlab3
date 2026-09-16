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

async function validateCanonicalCoachMobileAuthority() {
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
}

function runtimeGuard() {
  return compactProductionCss(
    '@media(max-width:700px){body.mission-control-active .mcShellV3.is-mobile-shell .mcHeader[data-testid="mission-control-team-header"]{display:none}}',
    path.basename(COACH_TITLE_SOURCE),
  );
}

function normalizeSelector(selector) {
  return selector.replace(/["']/g, "").replace(/\s+/g, " ").trim();
}

function rewriteDeclarations(declarations, updates, removals = []) {
  const remove = new Set([...Object.keys(updates), ...removals]);
  const kept = declarations
    .split(";")
    .map((declaration) => declaration.trim())
    .filter(Boolean)
    .filter((declaration) => {
      const property = declaration.match(/^([\w-]+)\s*:/)?.[1];
      return !property || !remove.has(property);
    });
  for (const [property, value] of Object.entries(updates)) kept.push(`${property}:${value}`);
  return kept.join(";");
}

function canonicalMobileRewrite(selector) {
  if (selector === COACH_STAGE) {
    return { updates: { "min-height": "334px", "margin-inline": "0" } };
  }
  if (selector === `${COACH_STAGE} .mcHeroContent`) {
    return { updates: { "min-height": "334px", padding: "20px 18px 18px" } };
  }
  if (selector === `${COACH_STAGE} .mcHeroIdentity`) {
    return { updates: { "--coach-hero-crest": "clamp(104px,29vw,120px)", "grid-template-columns": "minmax(0,1fr) var(--coach-hero-crest)", gap: "12px" } };
  }
  if (selector === `${COACH_STAGE} .mcHeroTeamMark`) {
    return { updates: { width: "var(--coach-hero-crest)", height: "var(--coach-hero-crest)", "min-width": "var(--coach-hero-crest)", "min-height": "var(--coach-hero-crest)", "max-width": "var(--coach-hero-crest)", "max-height": "var(--coach-hero-crest)" } };
  }
  if (selector === `${COACH_STAGE} .mcProgramIdentity`) {
    return { updates: { "max-width": "16ch", color: "#f8f8f4", font: '780 11px/1.2 -apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",sans-serif', "letter-spacing": ".075em", "text-transform": "uppercase", "text-wrap": "balance", "overflow-wrap": "anywhere" } };
  }
  if (selector === `${COACH_STAGE} .mcEyebrow`) {
    return { updates: { "grid-row": "auto", font: '720 11px/1.2 -apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",sans-serif', "letter-spacing": ".055em", "text-transform": "uppercase" } };
  }
  if (selector === `${COACH_STAGE} h1`) {
    return { updates: { "max-width": "15ch", margin: "12px 0 0", font: '800 clamp(36px,9.4vw,40px)/.94 "Barlow Condensed","Arial Narrow","Helvetica Neue",sans-serif', "letter-spacing": "-.02em", "text-wrap": "balance" }, removals: ["font-family", "font-size", "font-weight", "line-height"] };
  }
  if (selector === `${COACH_STAGE} .mcHeroContent>p`) {
    return { updates: { "max-width": "36ch", margin: "7px 0 0", font: '520 14px/1.42 -apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",sans-serif' } };
  }
  if (selector === `${COACH_STAGE} .mcRealityStrip`) {
    return { updates: { margin: "13px 0 0" } };
  }
  if (selector === `${COACH_STAGE} .mcRealityStrip button`) {
    return { updates: { "min-height": "54px", padding: "8px 12px" } };
  }
  if (selector === `${COACH_STAGE} .mcRealityStrip strong`) {
    return { updates: { "font-size": "25px" } };
  }
  if (selector === `${COACH_STAGE} .mcPrimary`) {
    return { updates: { "min-height": "46px", "margin-top": "11px" } };
  }
  if (selector === ".mcShellV3 .mcFocusGrid" || selector === ".mcShellV3 .mcActivationChapter" || selector === ".mcShellV3 .mcLowerGrid") {
    return { updates: { "margin-inline": "0" } };
  }
  return null;
}

function supersededNarrowProperties(selector) {
  if (selector === `${COACH_STAGE} .mcHeroContent`) return ["padding-inline", "padding-left", "padding-right"];
  if (selector === `${COACH_STAGE} .mcHeroIdentity`) return ["grid-template-columns"];
  if (selector === `${COACH_STAGE} .mcHeroTeamMark`) return ["width", "height", "min-width", "min-height", "max-width", "max-height"];
  if (selector === `${COACH_STAGE} h1`) return ["font-size"];
  return null;
}

function removeDeclarations(declarations, properties) {
  return rewriteDeclarations(declarations, {}, properties);
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

function removeRetiredHeaderChrome(css) {
  let removedArms = 0;
  const result = rewriteMediaBlocks(css, MOBILE_700_MEDIA, (selector, declarations, whole) => {
    if (selector.trim().startsWith("@")) return whole;
    const arms = selector.split(",").map((arm) => arm.trim()).filter(Boolean);
    if (!arms.length) return whole;
    const kept = arms.filter((arm) => !RETIRED_MOBILE_HEADER_CHROME.test(normalizeSelector(arm)));
    removedArms += arms.length - kept.length;
    if (!kept.length) return "";
    if (kept.length !== arms.length) return `${kept.join(",")}{${declarations}}`;
    return whole;
  });
  return { css: result.css, removedArms };
}

function foldCanonicalCoachMobile(css) {
  let foldedRules = 0;
  const mobile = rewriteMediaBlocks(css, MOBILE_700_MEDIA, (selector, declarations, whole) => {
    if (selector.trim().startsWith("@")) return whole;
    const arms = selector.split(",").map((arm) => arm.trim()).filter(Boolean);
    if (!arms.length) return whole;

    const untouched = [];
    const rewritten = [];
    for (const arm of arms) {
      const rewrite = canonicalMobileRewrite(normalizeSelector(arm));
      if (!rewrite) {
        untouched.push(arm);
        continue;
      }
      foldedRules += 1;
      rewritten.push(`${arm}{${rewriteDeclarations(declarations, rewrite.updates, rewrite.removals)}}`);
    }

    if (!rewritten.length) return whole;
    const preserved = untouched.length ? `${untouched.join(",")}{${declarations}}` : "";
    return preserved + rewritten.join("");
  });

  let narrowPrunedRules = 0;
  const narrow = rewriteMediaBlocks(mobile.css, MOBILE_350_MEDIA, (selector, declarations, whole) => {
    if (selector.trim().startsWith("@")) return whole;
    const arms = selector.split(",").map((arm) => arm.trim()).filter(Boolean);
    if (!arms.length) return whole;

    const untouched = [];
    const rewritten = [];
    for (const arm of arms) {
      const properties = supersededNarrowProperties(normalizeSelector(arm));
      if (!properties) {
        untouched.push(arm);
        continue;
      }
      const next = removeDeclarations(declarations, properties);
      narrowPrunedRules += 1;
      if (next) rewritten.push(`${arm}{${next}}`);
    }

    if (!rewritten.length && untouched.length === arms.length) return whole;
    const preserved = untouched.length ? `${untouched.join(",")}{${declarations}}` : "";
    return preserved + rewritten.join("");
  });

  return { css: narrow.css, foldedRules, narrowPrunedRules };
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
  await validateCanonicalCoachMobileAuthority();
  const guard = runtimeGuard();
  const files = await listCssFiles(DIST_DIR);
  let sourceBytes = 0;
  let outputBytes = 0;
  let changedFiles = 0;
  let strippedRules = 0;
  let removedHeaderArms = 0;
  let foldedRules = 0;
  let narrowPrunedRules = 0;

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
      const headerPruned = removeRetiredHeaderChrome(working);
      working = headerPruned.css;
      removedHeaderArms += headerPruned.removedArms;
    }

    // First recover the compact production shape that existed before Phase 6E.
    // Only after that stable compaction do we fold the canonical mobile values into
    // the surviving Coach rules, avoiding a duplicate high-specificity copy.
    const restructured = restructureCss(working, path.relative(DIST_DIR, file), { coach: isCoachWorkspace });
    let outputSource = restructured;
    if (isCoachWorkspace) {
      const folded = foldCanonicalCoachMobile(outputSource);
      outputSource = folded.css;
      foldedRules += folded.foldedRules;
      narrowPrunedRules += folded.narrowPrunedRules;
    }

    let output = compactProductionCss(outputSource, path.basename(file));
    if (isCoachWorkspace) output += guard;

    outputBytes += Buffer.byteLength(output);
    if (output !== source) {
      await writeFile(file, output);
      changedFiles += 1;
    }
  }

  console.log(`Phase 6E final production compaction changed ${changedFiles}/${files.length} CSS files; saved ${((sourceBytes - outputBytes) / 1024).toFixed(1)} KiB raw; stripped ${strippedRules} runtime-gated compiled rule(s); removed ${removedHeaderArms} unreachable mobile header selector arm(s); folded ${foldedRules} canonical Coach mobile rule(s); pruned ${narrowPrunedRules} superseded <=350px rule(s); retained only the runtime header guard as separate authority.`);
}

await main();
