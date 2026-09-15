import { readdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { minify } from "csso";
import { transform as transformCss } from "lightningcss";

const DIST_DIR = path.resolve(process.cwd(), "dist");
const COACH_TITLE_SOURCE = path.resolve(process.cwd(), "src/components/CoachMissionControlTitleStage.css");
const COACH_WORKSPACE_ASSET = /^CoachWorkspaces-.*\.css$/;
const FINAL_MOBILE_AUTHORITY_ASSET = /^MobileViewportAxisAuthority2026-.*\.css$/;
const FINAL_COACH_MODE = process.argv.includes("--final-coach");
const PHASE_6E_MARKER = "/* Phase 6E mobile Coach Home composition authority.";
const MOBILE_700_MEDIA = /@media\s*\(\s*(?:max-width\s*:\s*700px|width\s*<=\s*700px)\s*\)\s*\{/gi;
const RETIRED_MOBILE_HEADER_CHROME = /\.mcShellV3\s+(?:\.mcHeader\b|\.mcBrandLockup\b|\.mcBrandCopy\b|\.mcHeaderActions\b|\.mcBell\b|\.mcMobileMenu\b|\.mcHeaderTeamMark\b|\.mcTeamSelect\b)/;
const COACH_STAGE = '.mcShellV3 .mcHero[data-team-identity-stage=coach-mission-control]';

async function removeBundledAuthorityDuplicates() {
  const indexPath = path.join(DIST_DIR, "index.html");
  const html = await readFile(indexPath, "utf8");
  if (!html.includes("data-shotlab-authority-bundle")) return 0;

  const referenced = new Set(
    [...html.matchAll(/href=["'](?:\.\/|\/)?([^"'?]+\.css)(?:\?[^"']*)?["']/gi)]
      .map((match) => path.basename(match[1])),
  );
  const rootEntries = await readdir(DIST_DIR, { withFileTypes: true });
  const staleAuthorities = rootEntries
    .filter((entry) => entry.isFile() && /^shotlab-.*\.css$/i.test(entry.name) && !referenced.has(entry.name))
    .map((entry) => entry.name);

  await Promise.all(staleAuthorities.map((name) => unlink(path.join(DIST_DIR, name))));
  return staleAuthorities.length;
}

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

// Lightning CSS serializes legacy min/max-width queries as Media Queries Level 4
// range syntax. CSSO can drop responsive blocks when an already-compacted bundle
// is fed back through a second restructuring pass, so normalize equivalent ranges
// before every CSSO invocation. This keeps the two --final-coach passes idempotent.
function normalizeMediaRangeSyntaxForCsso(css) {
  const value = String.raw`([0-9]*\.?[0-9]+(?:px|em|rem))`;
  return css
    .replace(new RegExp(`@media\\s*\\(\\s*${value}\\s*<=\\s*width\\s*<=\\s*${value}\\s*\\)`, 'gi'), '@media(min-width:$1) and (max-width:$2)')
    .replace(new RegExp(`@media\\s*\\(\\s*width\\s*<=\\s*${value}\\s*\\)`, 'gi'), '@media(max-width:$1)')
    .replace(new RegExp(`@media\\s*\\(\\s*width\\s*>=\\s*${value}\\s*\\)`, 'gi'), '@media(min-width:$1)')
    .replace(new RegExp(`@media\\s*\\(\\s*${value}\\s*<=\\s*width\\s*\\)`, 'gi'), '@media(min-width:$1)')
    .replace(new RegExp(`@media\\s*\\(\\s*${value}\\s*>=\\s*width\\s*\\)`, 'gi'), '@media(max-width:$1)');
}

function restructureCss(css, filename, { coach = false } = {}) {
  return minify(normalizeMediaRangeSyntaxForCsso(css), {
    filename,
    restructure: true,
    comments: false,
    forceMediaMerge: coach,
  }).css;
}

function isProtectedFinalAuthority(file) {
  return FINAL_MOBILE_AUTHORITY_ASSET.test(path.basename(file));
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

async function loadCanonicalCoachMobileGuard() {
  const source = await readFile(COACH_TITLE_SOURCE, "utf8");
  const marker = source.indexOf(PHASE_6E_MARKER);
  const mediaStart = source.indexOf("@media(max-width:700px)", marker);
  if (marker < 0 || mediaStart < 0) {
    throw new Error("Could not locate the Phase 6E canonical Coach mobile source authority.");
  }
  const authority = readBalancedBlock(source, mediaStart);
  if (!authority) throw new Error("Could not read the Phase 6E canonical Coach mobile source authority block.");

  const required = [
    'min-height:334px',
    '--coach-hero-crest:clamp(104px,29vw,120px)',
    'min-height:54px',
    'margin-inline:0',
    'mission-control-team-header',
  ];
  const missing = required.filter((contract) => !authority.includes(contract));
  if (missing.length) {
    throw new Error(`Canonical Coach mobile source authority is incomplete: ${missing.join(", ")}`);
  }

  // The production bundle folds the certified values into its existing <=700px
  // component rules. Only the runtime-gated header guard must stay separate.
  return compactProductionCss(
    '@media(max-width:700px){body.mission-control-active .mcShellV3.is-mobile-shell .mcHeader[data-testid="mission-control-team-header"]{display:none}}',
    path.basename(COACH_TITLE_SOURCE),
  );
}

function stripCompiledCanonicalCoachMobileAuthority(css) {
  let removedRules = 0;
  const stripped = css.replace(/([^{}]+)\{([^{}]*)\}/g, (whole, selector) => {
    const normalized = selector.replace(/\s+/g, " ");
    if (!normalized.includes("body.mission-control-active .mcShellV3.is-mobile-shell")) return whole;
    removedRules += 1;
    return "";
  });
  return { css: stripped, removedRules };
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
  if (selector === COACH_STAGE) return { updates: { "min-height": "334px", margin: "0" } };
  if (selector === `${COACH_STAGE} .mcHeroContent`) return { updates: { "min-height": "334px", padding: "20px 18px 18px" } };
  if (selector === `${COACH_STAGE} .mcHeroIdentity`) return { updates: { "--coach-hero-crest": "clamp(104px,29vw,120px)", "grid-template-columns": "minmax(0,1fr) var(--coach-hero-crest)", gap: "12px" } };
  if (selector === `${COACH_STAGE} .mcHeroTeamMark`) return { updates: { width: "var(--coach-hero-crest)", height: "var(--coach-hero-crest)", "min-width": "var(--coach-hero-crest)", "min-height": "var(--coach-hero-crest)", "max-width": "var(--coach-hero-crest)", "max-height": "var(--coach-hero-crest)" } };
  if (selector === `${COACH_STAGE} .mcProgramIdentity`) return { updates: { "max-width": "16ch", color: "#f8f8f4", font: '780 11px/1.2 -apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",sans-serif', "letter-spacing": ".075em", "text-transform": "uppercase", "text-wrap": "balance", "overflow-wrap": "anywhere" } };
  if (selector === `${COACH_STAGE} .mcEyebrow`) return { updates: { "grid-row": "auto", font: '720 11px/1.2 -apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",sans-serif', "letter-spacing": ".055em", "text-transform": "uppercase" } };
  if (selector === `${COACH_STAGE} h1`) return { updates: { "max-width": "15ch", margin: "12px 0 0", font: '800 clamp(36px,9.4vw,40px)/.94 "Barlow Condensed","Arial Narrow","Helvetica Neue",sans-serif', "letter-spacing": "-.02em", "text-wrap": "balance" }, removals: ["font-family", "font-size", "font-weight", "line-height"] };
  if (selector === `${COACH_STAGE} .mcHeroContent>p`) return { updates: { "max-width": "36ch", margin: "7px 0 0", font: '520 14px/1.42 -apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",sans-serif' } };
  if (selector === `${COACH_STAGE} .mcRealityStrip`) return { updates: { margin: "13px 0 0" } };
  if (selector === `${COACH_STAGE} .mcRealityStrip button`) return { updates: { "min-height": "54px", padding: "8px 12px" } };
  if (selector === `${COACH_STAGE} .mcRealityStrip strong`) return { updates: { font: "800 25px/.95 var(--mc-native)" }, removals: ["font-size"] };
  if (selector === `${COACH_STAGE} .mcPrimary`) return { updates: { "min-height": "46px", "margin-top": "11px" } };
  if (selector === '.mcShellV3 .mcFocusGrid') return { updates: { margin: "0" } };
  if (selector === '.mcShellV3 .mcActivationChapter') return { updates: { margin: "0" } };
  if (selector === '.mcShellV3 .mcLowerGrid') return { updates: { margin: "0" } };
  return null;
}

function foldCanonicalCoachMobile(css) {
  let cursor = 0;
  let output = "";
  let removedHeaderArms = 0;
  let rewrittenRules = 0;
  MOBILE_700_MEDIA.lastIndex = 0;
  let match;

  while ((match = MOBILE_700_MEDIA.exec(css))) {
    const open = css.indexOf("{", match.index);
    const close = findBalancedClose(css, open);
    if (open < 0 || close < 0) break;
    const body = css.slice(open + 1, close);
    const transformed = body.replace(/([^{}]+)\{([^{}]*)\}/g, (whole, selector, declarations) => {
      if (selector.trim().startsWith("@")) return whole;
      const arms = selector.split(",").map((arm) => arm.trim()).filter(Boolean);
      if (!arms.length) return whole;

      const keptArms = arms.filter((arm) => !RETIRED_MOBILE_HEADER_CHROME.test(normalizeSelector(arm)));
      removedHeaderArms += arms.length - keptArms.length;
      if (!keptArms.length) return "";

      // A grouped rule can serve multiple surfaces, so only rewrite declarations
      // when exactly one selector remains. Header-arm removal remains safe for groups.
      if (keptArms.length === 1) {
        const rewrite = canonicalMobileRewrite(normalizeSelector(keptArms[0]));
        if (rewrite) {
          rewrittenRules += 1;
          return `${keptArms[0]}{${rewriteDeclarations(declarations, rewrite.updates, rewrite.removals)}}`;
        }
      }

      if (keptArms.length !== arms.length) return `${keptArms.join(",")}{${declarations}}`;
      return whole;
    });

    output += css.slice(cursor, open + 1) + transformed + "}";
    cursor = close + 1;
    MOBILE_700_MEDIA.lastIndex = cursor;
  }

  if (cursor === 0) return { css, removedHeaderArms: 0, rewrittenRules: 0, rawBytesSaved: 0 };
  output += css.slice(cursor);
  return {
    css: output,
    removedHeaderArms,
    rewrittenRules,
    rawBytesSaved: Buffer.byteLength(css) - Buffer.byteLength(output),
  };
}

async function finalizeProductionCss(files) {
  let sourceBytes = 0;
  let outputBytes = 0;
  let changedFiles = 0;
  let protectedFiles = 0;
  let removedCompiledAuthorityRules = 0;
  let removedLegacyHeaderArms = 0;
  let foldedCoachRules = 0;
  let foldRawDelta = 0;
  const canonicalCoachMobileGuard = await loadCanonicalCoachMobileGuard();

  for (const file of files) {
    const source = await readFile(file, "utf8");
    const relative = path.relative(DIST_DIR, file);
    if (isProtectedFinalAuthority(file)) {
      sourceBytes += Buffer.byteLength(source);
      outputBytes += Buffer.byteLength(source);
      protectedFiles += 1;
      continue;
    }

    const isCoachWorkspace = COACH_WORKSPACE_ASSET.test(path.basename(file));
    let workingSource = source;
    if (isCoachWorkspace) {
      const stripped = stripCompiledCanonicalCoachMobileAuthority(workingSource);
      workingSource = stripped.css;
      removedCompiledAuthorityRules += stripped.removedRules;

      // Fold the source-owned Phase 6E computed values into the already-existing
      // <=700px component rules. This preserves rendering without paying for a
      // second copy of the full high-specificity selector tree in production.
      const folded = foldCanonicalCoachMobile(workingSource);
      workingSource = folded.css;
      removedLegacyHeaderArms += folded.removedHeaderArms;
      foldedCoachRules += folded.rewrittenRules;
      foldRawDelta += folded.rawBytesSaved;
    }

    const restructured = restructureCss(workingSource, relative, { coach: isCoachWorkspace });
    let output = compactProductionCss(restructured, path.basename(file));
    if (isCoachWorkspace) output += canonicalCoachMobileGuard;

    sourceBytes += Buffer.byteLength(source);
    outputBytes += Buffer.byteLength(output);
    if (output !== source) {
      await writeFile(file, output);
      changedFiles += 1;
    }
  }

  console.log(`Final production CSS restructure changed ${changedFiles}/${files.length} files; saved ${((sourceBytes - outputBytes) / 1024).toFixed(1)} KiB raw after selector/dedupe passes; protected ${protectedFiles} final mobile authority asset(s); removed ${removedCompiledAuthorityRules} compiled Phase 6E rule(s); folded ${foldedCoachRules} certified Coach mobile rule(s); removed ${removedLegacyHeaderArms} unreachable mobile header selector arm(s); fold raw delta ${(foldRawDelta / 1024).toFixed(1)} KiB.`);
}

async function main() {
  await stat(DIST_DIR);

  if (FINAL_COACH_MODE) {
    const files = await listCssFiles(DIST_DIR);
    await finalizeProductionCss(files);
    return;
  }

  const removedAuthorityCopies = await removeBundledAuthorityDuplicates();
  const files = await listCssFiles(DIST_DIR);
  let sourceBytes = 0;
  let outputBytes = 0;
  let changedFiles = 0;
  let protectedFiles = 0;

  for (const file of files) {
    const source = await readFile(file, "utf8");
    if (isProtectedFinalAuthority(file)) {
      sourceBytes += Buffer.byteLength(source);
      outputBytes += Buffer.byteLength(source);
      protectedFiles += 1;
      continue;
    }
    const isCoachWorkspace = COACH_WORKSPACE_ASSET.test(path.basename(file));
    const output = restructureCss(source, path.relative(DIST_DIR, file), { coach: isCoachWorkspace });
    sourceBytes += Buffer.byteLength(source);
    outputBytes += Buffer.byteLength(output);
    if (output !== source) {
      await writeFile(file, output);
      changedFiles += 1;
    }
  }

  console.log(`Removed ${removedAuthorityCopies} unreferenced visual-authority CSS copies.`);
  console.log(`Restructured ${changedFiles}/${files.length} production CSS files; saved ${((sourceBytes - outputBytes) / 1024).toFixed(1)} KiB raw; protected ${protectedFiles} final mobile authority asset(s).`);
}

await main();