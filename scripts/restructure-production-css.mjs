import { readdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { minify } from "csso";
import { transform as transformCss } from "lightningcss";

const DIST_DIR = path.resolve(process.cwd(), "dist");
const COACH_TITLE_SOURCE = path.resolve(process.cwd(), "src/components/CoachMissionControlTitleStage.css");
const COACH_WORKSPACE_ASSET = /^CoachWorkspaces-.*\.css$/;
const FINAL_MOBILE_AUTHORITY_ASSET = /^MobileViewportAxisAuthority2026-.*\.css$/;
const FINAL_COACH_MODE = process.argv.includes("--final-coach");
const COACH_MOBILE_TARGET = /(?:\.mcHeader\[data-testid=(?:["'])?mission-control-team-header(?:["'])?\]|\.mcHero\[data-team-identity-stage=(?:["'])?coach-mission-control(?:["'])?\])/;
const PHASE_6E_MARKER = "/* Phase 6E mobile Coach Home composition authority.";
const MOBILE_MEDIA = /@media\s*\(\s*max-width\s*:\s*700px\s*\)\s*\{/g;
const RETIRED_MOBILE_HEADER_CHROME = /\.mcShellV3\s+(?:\.mcHeader\b|\.mcBrandLockup\b|\.mcBrandCopy\b|\.mcHeaderActions\b|\.mcBell\b)/;

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

function isCanonicalCoachMobileSelector(selector) {
  const normalized = selector.replace(/\s+/g, " ").trim();
  return normalized.includes(".mcShellV3.is-mobile-shell") && COACH_MOBILE_TARGET.test(normalized);
}

function extractCoachMobileAuthority(css, filename) {
  const rules = [];
  const stripped = css.replace(/([^{}]+)\{([^{}]*)\}/g, (match, selector, body) => {
    if (!isCanonicalCoachMobileSelector(selector)) return match;
    rules.push(`${selector.trim()}{${body}}`);
    return "";
  });

  if (rules.length < 8) {
    throw new Error(`Missing canonical Coach mobile authority before final CSS restructure: ${filename} (${rules.length} rule(s) found)`);
  }
  return { css: stripped, rules };
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

function pruneRetiredHeaderRules(body) {
  let removedRules = 0;
  const css = body.replace(/([^{}]+)\{([^{}]*)\}/g, (whole, selector, declarations) => {
    const arms = selector.split(",").map((arm) => arm.trim()).filter(Boolean);
    if (!arms.length || selector.trim().startsWith("@")) return whole;
    const kept = arms.filter((arm) => !RETIRED_MOBILE_HEADER_CHROME.test(arm));
    removedRules += arms.length - kept.length;
    if (!kept.length) return "";
    if (kept.length === arms.length) return whole;
    return `${kept.join(",")}{${declarations}}`;
  });
  return { css, removedRules };
}

function pruneSupersededCoachMobileHeaderChrome(css) {
  let cursor = 0;
  let output = "";
  let removedRules = 0;
  MOBILE_MEDIA.lastIndex = 0;
  let match;
  while ((match = MOBILE_MEDIA.exec(css))) {
    const open = css.indexOf("{", match.index);
    const close = findBalancedClose(css, open);
    if (open < 0 || close < 0) break;
    const body = css.slice(open + 1, close);
    const pruned = pruneRetiredHeaderRules(body);
    output += css.slice(cursor, open + 1) + pruned.css + "}";
    removedRules += pruned.removedRules;
    cursor = close + 1;
    MOBILE_MEDIA.lastIndex = cursor;
  }
  if (!removedRules) return { css, removedRules: 0, rawBytesSaved: 0 };
  output += css.slice(cursor);
  return {
    css: output,
    removedRules,
    rawBytesSaved: Buffer.byteLength(css) - Buffer.byteLength(output),
  };
}

function readBalancedBlock(source, start) {
  const open = source.indexOf("{", start);
  if (open < 0) return "";
  const close = findBalancedClose(source, open);
  return close < 0 ? "" : source.slice(start, close + 1);
}

function assertCanonicalSourceAuthority(css, filename) {
  const required = [
    /\.mcShellV3\.is-mobile-shell\s+\.mcHeader\[data-testid=["']mission-control-team-header["']\]\{display:none\}/,
    /\.mcShellV3\.is-mobile-shell\s+\.mcHero\[data-team-identity-stage=["']coach-mission-control["']\]\{min-height:334px\}/,
    /\.mcHeroIdentity\{--coach-hero-crest:clamp\(104px,29vw,120px\);gap:12px\}/,
    /\.mcPrimary\{margin-top:11px\}/,
  ];
  if (required.some((contract) => !contract.test(css))) {
    throw new Error(`Canonical Coach mobile source authority is incomplete: ${filename}`);
  }
}

async function loadCanonicalCoachMobileAuthority() {
  const source = await readFile(COACH_TITLE_SOURCE, "utf8");
  const marker = source.indexOf(PHASE_6E_MARKER);
  const mediaStart = source.indexOf("@media(max-width:700px)", marker);
  if (marker < 0 || mediaStart < 0) {
    throw new Error("Could not locate the Phase 6E canonical Coach mobile source authority.");
  }
  const authority = readBalancedBlock(source, mediaStart);
  if (!authority) {
    throw new Error("Could not read the Phase 6E canonical Coach mobile source authority block.");
  }
  assertCanonicalSourceAuthority(authority, path.relative(process.cwd(), COACH_TITLE_SOURCE));
  return compactProductionCss(authority, path.basename(COACH_TITLE_SOURCE));
}

async function finalizeProductionCss(files) {
  let sourceBytes = 0;
  let outputBytes = 0;
  let changedFiles = 0;
  let protectedFiles = 0;
  let protectedCoachRules = 0;
  let retiredHeaderRules = 0;
  let retiredHeaderBytes = 0;
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
      const extracted = extractCoachMobileAuthority(source, relative);
      const pruned = pruneSupersededCoachMobileHeaderChrome(extracted.css);
      workingSource = pruned.css;
      protectedCoachRules += extracted.rules.length;
      retiredHeaderRules += pruned.removedRules;
      retiredHeaderBytes += pruned.rawBytesSaved;
    }

    // Re-run CSSO after selector/font dedupe to preserve the established bundle
    // budget. The source-owned Phase 6E block is removed before restructuring and
    // restored afterward, so CSSO cannot prove away or merge the certified mobile
    // cascade. The canonical <=700px rule hides the utility header; pruning only its
    // superseded mobile chrome is therefore behavior-preserving while keeping the
    // migrated authority within the existing production budget.
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

  console.log(`Final production CSS restructure changed ${changedFiles}/${files.length} files; saved ${((sourceBytes - outputBytes) / 1024).toFixed(1)} KiB raw after selector/dedupe passes; protected ${protectedFiles} final mobile authority asset(s) and ${protectedCoachRules} canonical Coach mobile rule(s); removed ${retiredHeaderRules} superseded mobile header selector arm(s) (${(retiredHeaderBytes / 1024).toFixed(1)} KiB raw).`);
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
