import { readdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { minify } from "csso";
import { transform as transformCss } from "lightningcss";

const DIST_DIR = path.resolve(process.cwd(), "dist");
const COACH_WORKSPACE_ASSET = /^CoachWorkspaces-.*\.css$/;
const FINAL_MOBILE_AUTHORITY_ASSET = /^MobileViewportAxisAuthority2026-.*\.css$/;
const FINAL_COACH_MODE = process.argv.includes("--final-coach");
const POST_AUTH_FONTS_MODE = process.argv.includes("--post-auth-fonts");
const COACH_MOBILE_MEDIA = /@media\s*\(\s*max-width\s*:\s*700px\s*\)\s*\{/g;
const COACH_AUTHORITY_MARKERS = [
  "coach-mission-control",
  "mission-control-team-header",
  "--coach-hero-crest:clamp(104px,29vw,120px)",
  "min-height:334px",
  "min-height:48px",
  "min-height:50px",
];

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

function isCoachWorkspace(file) {
  return COACH_WORKSPACE_ASSET.test(path.basename(file));
}

function restructureCss(css, filename, { coach = false } = {}) {
  return minify(css, {
    filename,
    restructure: true,
    comments: false,
    forceMediaMerge: coach,
  }).css;
}

function findBalancedBlockEnd(css, start) {
  const open = css.indexOf("{", start);
  if (open < 0) return -1;
  let depth = 0;
  for (let i = open; i < css.length; i += 1) {
    if (css[i] === "{") depth += 1;
    else if (css[i] === "}" && --depth === 0) return i + 1;
  }
  return -1;
}

function extractCanonicalCoachMobileAuthority(css) {
  COACH_MOBILE_MEDIA.lastIndex = 0;
  for (const match of css.matchAll(COACH_MOBILE_MEDIA)) {
    const start = match.index;
    const end = findBalancedBlockEnd(css, start);
    if (end < 0) throw new Error("Unbalanced Coach mobile media block during production CSS optimization.");
    const block = css.slice(start, end);
    if (!COACH_AUTHORITY_MARKERS.every((marker) => block.includes(marker))) continue;
    return { start, end, block };
  }
  throw new Error("Canonical Coach <=700px authority block was not found before production CSS optimization.");
}

function compactCoachCssPreservingAuthority(css, filename) {
  const { start, end, block } = extractCanonicalCoachMobileAuthority(css);
  const remainder = `${css.slice(0, start)}${css.slice(end)}`;

  // The historical Coach bundle needs whole-bundle CSSO restructuring to stay
  // inside the locked performance budget. Running that optimization over the
  // canonical <=700px title-stage block can legally merge its media rules into
  // other rules and change the rendered cascade. Remove only that one
  // source-owned block, aggressively compact everything else, then append the
  // same block as the final Coach mobile authority.
  const compactRemainder = compactProductionCss(
    restructureCss(remainder, `${filename}:without-coach-mobile-authority`, { coach: true }),
    path.basename(filename),
  );
  const compactAuthority = minify(block, {
    filename: `${filename}:coach-mobile-authority`,
    restructure: false,
    comments: false,
    forceMediaMerge: false,
  }).css;
  return `${compactRemainder}${compactAuthority}`;
}

function isProtectedFinalAuthority(file) {
  return FINAL_MOBILE_AUTHORITY_ASSET.test(path.basename(file));
}

function optimizeCss(source, relative) {
  if (isCoachWorkspace(relative)) return compactCoachCssPreservingAuthority(source, relative);
  return compactProductionCss(restructureCss(source, relative), path.basename(relative));
}

async function finalizeProductionCss(files, mode) {
  let sourceBytes = 0;
  let outputBytes = 0;
  let changedFiles = 0;
  let protectedFiles = 0;
  for (const file of files) {
    const source = await readFile(file, "utf8");
    const relative = path.relative(DIST_DIR, file);
    if (isProtectedFinalAuthority(file)) {
      sourceBytes += Buffer.byteLength(source);
      outputBytes += Buffer.byteLength(source);
      protectedFiles += 1;
      continue;
    }

    const output = optimizeCss(source, relative);
    sourceBytes += Buffer.byteLength(source);
    outputBytes += Buffer.byteLength(output);
    if (output !== source) {
      await writeFile(file, output);
      changedFiles += 1;
    }
  }
  console.log(
    `${mode === "post-auth-fonts" ? "Post-font" : "Final"} production CSS restructure changed ${changedFiles}/${files.length} files; saved ${((sourceBytes - outputBytes) / 1024).toFixed(1)} KiB raw after selector/dedupe passes; protected ${protectedFiles} final mobile authority asset(s).`,
  );
}

async function main() {
  await stat(DIST_DIR);
  if (FINAL_COACH_MODE || POST_AUTH_FONTS_MODE) {
    const files = await listCssFiles(DIST_DIR);
    await finalizeProductionCss(files, POST_AUTH_FONTS_MODE ? "post-auth-fonts" : "final-coach");
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
    const relative = path.relative(DIST_DIR, file);
    if (isProtectedFinalAuthority(file)) {
      sourceBytes += Buffer.byteLength(source);
      outputBytes += Buffer.byteLength(source);
      protectedFiles += 1;
      continue;
    }

    const output = isCoachWorkspace(file)
      ? compactCoachCssPreservingAuthority(source, relative)
      : restructureCss(source, relative);
    sourceBytes += Buffer.byteLength(source);
    outputBytes += Buffer.byteLength(output);
    if (output !== source) {
      await writeFile(file, output);
      changedFiles += 1;
    }
  }

  console.log(`Removed ${removedAuthorityCopies} unreferenced visual-authority CSS copies.`);
  console.log(
    `Restructured ${changedFiles}/${files.length} production CSS files; saved ${((sourceBytes - outputBytes) / 1024).toFixed(1)} KiB raw; protected ${protectedFiles} final mobile authority asset(s).`,
  );
}

await main();
