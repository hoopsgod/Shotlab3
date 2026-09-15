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

function restructureCss(css, filename, { coach = false } = {}) {
  return minify(css, {
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

async function loadCanonicalCoachMobileAuthority() {
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
    'mission-control-team-header',
  ];
  const missing = required.filter((contract) => !authority.includes(contract));
  if (missing.length) {
    throw new Error(`Canonical Coach mobile source authority is incomplete: ${missing.join(", ")}`);
  }

  return compactProductionCss(authority, path.basename(COACH_TITLE_SOURCE));
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
  if (selector === `${COACH_STAGE} .mcPrimary`) return ["min-height", "margin-top"];
  if (selector === '.mcShellV3 .mcFocusGrid') return ["margin"];
  if (selector === '.mcShellV3 .mcActivationChapter') return ["margin"];
  if (selector === '.mcShellV3 .mcLowerGrid') return ["margin"];
  return null;
}

function pruneSupersededLegacyCoachMobile(css) {
  let cursor = 0;
  let output = "";
  let removedHeaderArms = 0;
  let prunedDeclarations = 0;
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

      // Declaration pruning is only applied to a single surviving selector so a
      // grouped rule cannot accidentally lose a declaration needed by another arm.
      if (keptArms.length === 1) {
        const normalized = normalizeSelector(keptArms[0]);
        const properties = supersededMobileProperties(normalized);
        if (properties) {
          const nextDeclarations = removeDeclarations(declarations, properties);
          if (nextDeclarations !== declarations.trim()) {
            const beforeCount = declarations.split(";").filter(Boolean).length;
            const afterCount = nextDeclarations.split(";").filter(Boolean).length;
            prunedDeclarations += Math.max(0, beforeCount - afterCount);
          }
          if (!nextDeclarations) return "";
          return `${keptArms[0]}{${nextDeclarations}}`;
        }
      }

      if (keptArms.length !== arms.length) return `${keptArms.join(",")}{${declarations}}`;
      return whole;
    });

    output += css.slice(cursor, open + 1) + transformed + "}";
    cursor = close + 1;
    MOBILE_700_MEDIA.lastIndex = cursor;
  }

  if (cursor === 0) return { css, removedHeaderArms: 0, prunedDeclarations: 0, rawBytesSaved: 0 };
  output += css.slice(cursor);
  return {
    css: output,
    removedHeaderArms,
    prunedDeclarations,
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
  let prunedLegacyDeclarations = 0;
  let prunedLegacyBytes = 0;
  const canonicalCoachMobileAuthority = await loadCanonicalCoachMobileAuthority();

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

      // Once the canonical runtime-gated block has been isolated, remove only the
      // legacy <=700px declarations it supersedes. This preserves the accepted
      // computed rendering while avoiding a second paid copy of the same mobile
      // geometry and removing unreachable utility-header chrome.
      const pruned = pruneSupersededLegacyCoachMobile(workingSource);
      workingSource = pruned.css;
      removedLegacyHeaderArms += pruned.removedHeaderArms;
      prunedLegacyDeclarations += pruned.prunedDeclarations;
      prunedLegacyBytes += pruned.rawBytesSaved;
    }

    // Keep the proven pre-Phase-6E optimizer behavior for the legacy remainder.
    // The accepted production baseline depended on CSSO eliminating superseded
    // Coach declarations. Phase 6E's source-owned mobile authority is isolated
    // from that legacy compaction and restored afterward as one deterministic block.
    const restructured = restructureCss(workingSource, relative, { coach: isCoachWorkspace });
    let output = compactProductionCss(restructured, path.basename(file));
    if (isCoachWorkspace) output += canonicalCoachMobileAuthority;

    sourceBytes += Buffer.byteLength(source);
    outputBytes += Buffer.byteLength(output);
    if (output !== source) {
      await writeFile(file, output);
      changedFiles += 1;
    }
  }

  console.log(`Final production CSS restructure changed ${changedFiles}/${files.length} files; saved ${((sourceBytes - outputBytes) / 1024).toFixed(1)} KiB raw after selector/dedupe passes; protected ${protectedFiles} final mobile authority asset(s); removed ${removedCompiledAuthorityRules} compiled Phase 6E rule(s); pruned ${removedLegacyHeaderArms} unreachable mobile header selector arm(s) and ${prunedLegacyDeclarations} superseded legacy declaration(s) (${(prunedLegacyBytes / 1024).toFixed(1)} KiB raw) before restoring the canonical source block.`);
}

async function main() {
  await stat(DIST_DIR);

  if (FINAL_COACH_MODE) {
    const files = await listCssFiles(DIST_DIR);
    await finalizeProductionCss(files);
    return;
  }

  // Remove unreferenced authority copies before enumerating the files that will be
  // restructured. A retired stylesheet can be present in dist after Vite copies
  // public assets but intentionally absent from index.html; listing first leaves a
  // stale pathname that is unlinked moments later and then crashes the optimizer.
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
