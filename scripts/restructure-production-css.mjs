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
const RETIRED_MOBILE_HEADER_CHROME = /\.mcShellV3\s+(?:\.mcHeader\b|\.mcBrandLockup\b|\.mcBrandCopy\b|\.mcHeaderActions\b|\.mcBell\b|\.mcMobileMenu\b|\.mcHeaderTeamMark\b|\.mcTeamSelect\b)/;
const COACH_STAGE = '.mcHero[data-team-identity-stage=coach-mission-control]';
const PHASE6_TEXT_FONT = 'var(--font-body)';

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

// Lightning CSS canonicalizes legacy min/max-width queries to Media Queries Level 4
// range syntax. CSSO's restructuring pass does not safely round-trip that syntax and
// can drop the entire responsive block when the already-compacted bundle is processed
// a second time. Normalize only equivalent width ranges before every CSSO pass so the
// optimizer remains idempotent across the two final-coach invocations.
function normalizeMediaRangeSyntaxForCsso(css) {
  const value = String.raw`([0-9]*\.?[0-9]+(?:px|em|rem))`;
  return css
    .replace(new RegExp(`@media\\s*\\(\\s*${value}\\s*<=\\s*width\\s*<=\\s*${value}\\s*\\)`, 'gi'), '@media(min-width:$1) and (max-width:$2)')
    .replace(new RegExp(`@media\\s*\\(\\s*width\\s*<=\\s*${value}\\s*\\)`, 'gi'), '@media(max-width:$1)')
    .replace(new RegExp(`@media\\s*\\(\\s*width\\s*>=\\s*${value}\\s*\\)`, 'gi'), '@media(min-width:$1)')
    .replace(new RegExp(`@media\\s*\\(\\s*${value}\\s*<=\\s*width\\s*\\)`, 'gi'), '@media(min-width:$1)')
    .replace(new RegExp(`@media\\s*\\(\\s*${value}\\s*>=\\s*width\\s*\\)`, 'gi'), '@media(max-width:$1)');
}

function hasModernMediaRangeSyntax(css) {
  return /@media\s*\([^)]*(?:width\s*[<>]=|[<>]=\s*width)/i.test(css);
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

  if (!rules.length) {
    throw new Error(`Missing canonical Coach mobile authority before final CSS restructure: ${filename}`);
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

function rewriteDeclarations(body, updates, removals = []) {
  const remove = new Set(removals);
  const pending = new Map(Object.entries(updates));
  const output = [];
  for (const raw of body.split(";")) {
    const declaration = raw.trim();
    if (!declaration) continue;
    const match = declaration.match(/^([\w-]+)\s*:\s*(.*)$/s);
    if (!match) {
      output.push(declaration);
      continue;
    }
    const property = match[1];
    if (remove.has(property)) continue;
    if (pending.has(property)) {
      output.push(`${property}:${pending.get(property)}`);
      pending.delete(property);
    } else {
      output.push(declaration);
    }
  }
  for (const [property, value] of pending) output.push(`${property}:${value}`);
  return output.join(";");
}

function foldCertifiedCoachMobileHeroRules(body) {
  let changedRules = 0;
  const css = body.replace(/([^{}]+)\{([^{}]*)\}/g, (whole, selector, declarations) => {
    const normalized = selector.replace(/["']/g, "").replace(/\s+/g, " ").trim();
    let updates = null;
    let removals = [];

    if (normalized === `.mcShellV3 ${COACH_STAGE}`) {
      updates = { "min-height": "334px" };
    } else if (normalized === `.mcShellV3 ${COACH_STAGE} .mcHeroContent`) {
      updates = { "min-height": "334px", padding: "20px 18px 18px" };
    } else if (normalized === `.mcShellV3 ${COACH_STAGE} .mcHeroIdentity`) {
      updates = { "--coach-hero-crest": "clamp(104px,29vw,120px)", gap: "12px" };
    } else if (normalized === `.mcShellV3 ${COACH_STAGE} .mcProgramIdentity`) {
      updates = { font: `780 11px/1.2 ${PHASE6_TEXT_FONT}` };
    } else if (normalized === `.mcShellV3 ${COACH_STAGE} .mcEyebrow`) {
      updates = { font: `720 11px/1.2 ${PHASE6_TEXT_FONT}`, "letter-spacing": ".055em" };
    } else if (normalized === `.mcShellV3 ${COACH_STAGE} h1`) {
      removals = ["font-family", "font-size", "font-weight", "line-height"];
      updates = {
        "max-width": "15ch",
        margin: "12px 0 0",
        font: '800 clamp(36px,9.4vw,40px)/.94 "Barlow Condensed","Arial Narrow","Helvetica Neue",sans-serif',
        "letter-spacing": "-.02em",
      };
    } else if (normalized === `.mcShellV3 ${COACH_STAGE} .mcHeroContent>p`) {
      updates = { "max-width": "36ch", margin: "7px 0 0", font: `520 14px/1.42 ${PHASE6_TEXT_FONT}` };
    } else if (normalized === `.mcShellV3 ${COACH_STAGE} .mcRealityStrip`) {
      updates = { margin: "13px 0 0" };
    } else if (normalized === `.mcShellV3 ${COACH_STAGE} .mcPrimary`) {
      updates = { "margin-top": "11px" };
    }

    if (!updates) return whole;
    changedRules += 1;
    return `${selector.trim()}{${rewriteDeclarations(declarations, updates, removals)}}`;
  });
  return { css, changedRules };
}

function transformCoachMobileMedia(css, transformBody) {
  let cursor = 0;
  let output = "";
  let changedRules = 0;
  MOBILE_MEDIA.lastIndex = 0;
  let match;
  while ((match = MOBILE_MEDIA.exec(css))) {
    const open = css.indexOf("{", match.index);
    const close = findBalancedClose(css, open);
    if (open < 0 || close < 0) break;
    const body = css.slice(open + 1, close);
    const transformed = transformBody(body);
    output += css.slice(cursor, open + 1) + transformed.css + "}";
    changedRules += transformed.changedRules || transformed.removedRules || 0;
    cursor = close + 1;
    MOBILE_MEDIA.lastIndex = cursor;
  }
  if (!changedRules) return { css, changedRules: 0, rawBytesSaved: 0 };
  output += css.slice(cursor);
  return {
    css: output,
    changedRules,
    rawBytesSaved: Buffer.byteLength(css) - Buffer.byteLength(output),
  };
}

function pruneSupersededCoachMobileHeaderChrome(css) {
  const transformed = transformCoachMobileMedia(css, (body) => {
    const pruned = pruneRetiredHeaderRules(body);
    return { css: pruned.css, removedRules: pruned.removedRules };
  });
  return { css: transformed.css, removedRules: transformed.changedRules, rawBytesSaved: transformed.rawBytesSaved };
}

function foldCertifiedCoachMobileHero(css) {
  return transformCoachMobileMedia(css, foldCertifiedCoachMobileHeroRules);
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

function assertCoachResponsiveAuthoritySurvived(css, filename) {
  const required = [
    'min-height:330px',
    'min-height:354px',
    'min-height:334px',
    '--coach-hero-crest:',
  ];
  const missing = required.filter((contract) => !css.includes(contract));
  if (missing.length) {
    throw new Error(`Final Coach CSS compaction dropped responsive authority from ${filename}: ${missing.join(', ')}`);
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

  // The compiled base <=700px rules are folded to the same certified computed
  // values before CSSO. The only runtime-gated rule that must remain separate is
  // the hidden duplicate utility header. Keeping this tiny guard avoids paying
  // for a second copy of the complete hero cascade while preserving exact output.
  return compactProductionCss(
    '@media(max-width:700px){body.mission-control-active .mcShellV3.is-mobile-shell .mcHeader[data-testid="mission-control-team-header"]{display:none}}',
    path.basename(COACH_TITLE_SOURCE),
  );
}

async function finalizeProductionCss(files) {
  let sourceBytes = 0;
  let outputBytes = 0;
  let changedFiles = 0;
  let protectedFiles = 0;
  let protectedCoachRules = 0;
  let retiredHeaderRules = 0;
  let retiredHeaderBytes = 0;
  let foldedCoachRules = 0;
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
    const isRepeatedCoachCompaction = isCoachWorkspace && hasModernMediaRangeSyntax(source);
    let workingSource = normalizeMediaRangeSyntaxForCsso(source);
    if (isCoachWorkspace) {
      const extracted = extractCoachMobileAuthority(workingSource, relative);
      const pruned = pruneSupersededCoachMobileHeaderChrome(extracted.css);
      const folded = foldCertifiedCoachMobileHero(pruned.css);
      workingSource = folded.css;
      protectedCoachRules += extracted.rules.length;
      retiredHeaderRules += pruned.removedRules;
      retiredHeaderBytes += pruned.rawBytesSaved;
      foldedCoachRules += folded.changedRules;
    }

    // Re-run CSSO after selector/font dedupe to preserve the established bundle
    // budget. Phase 6E's runtime-gated declarations are first folded into the
    // component's compiled <=700px rules at identical computed values; only the
    // hidden-header gate is restored afterward. Normalizing Lightning CSS media
    // range syntax before CSSO makes this pass safe and repeatable.
    // Never feed a Lightning-CSS-compacted Coach bundle back through CSSO. CSSO
    // is safe on the source/legacy media syntax during the first final pass, but
    // repeated restructuring of the already-compacted responsive bundle can drop
    // valid breakpoint blocks. The second final pass only needs deterministic
    // minification after font dedupe, so Lightning CSS is sufficient there.
    const restructured = isRepeatedCoachCompaction
      ? workingSource
      : restructureCss(workingSource, relative, { coach: isCoachWorkspace });
    let output = compactProductionCss(restructured, path.basename(file));
    if (isCoachWorkspace) {
      output += canonicalCoachMobileAuthority;
      assertCoachResponsiveAuthoritySurvived(output, relative);
    }

    sourceBytes += Buffer.byteLength(source);
    outputBytes += Buffer.byteLength(output);
    if (output !== source) {
      await writeFile(file, output);
      changedFiles += 1;
    }
  }

  console.log(`Final production CSS restructure changed ${changedFiles}/${files.length} files; saved ${((sourceBytes - outputBytes) / 1024).toFixed(1)} KiB raw after selector/dedupe passes; protected ${protectedFiles} final mobile authority asset(s) and ${protectedCoachRules} canonical Coach mobile rule(s); folded ${foldedCoachRules} certified Coach mobile rule(s); removed ${retiredHeaderRules} superseded mobile header selector arm(s) (${(retiredHeaderBytes / 1024).toFixed(1)} KiB raw).`);
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
