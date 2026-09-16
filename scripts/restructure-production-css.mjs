import { readdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { minify } from "csso";
import { transform as transformCss } from "lightningcss";

const DIST_DIR = path.resolve(process.cwd(), "dist");
const COACH_WORKSPACE_ASSET = /^CoachWorkspaces-.*\.css$/;
const FINAL_MOBILE_AUTHORITY_ASSET = /^MobileViewportAxisAuthority2026-.*\.css$/;
const FINAL_COACH_MODE = process.argv.includes("--final-coach");
const COACH_MOBILE_MEDIA = "@media(max-width:700px){";
const COACH_AUTHORITY_MARKERS = ["data-team-identity-stage=coach-mission-control", "--coach-hero-crest:clamp(104px,29vw,120px)", "min-height:334px", "min-height:48px", "min-height:50px"];

async function removeBundledAuthorityDuplicates() {
  const indexPath = path.join(DIST_DIR, "index.html");
  const html = await readFile(indexPath, "utf8");
  if (!html.includes("data-shotlab-authority-bundle")) return 0;
  const referenced = new Set([...html.matchAll(/href=["'](?:\.\/|\/)?([^"'?]+\.css)(?:\?[^"']*)?["']/gi)].map((match) => path.basename(match[1])));
  const rootEntries = await readdir(DIST_DIR, { withFileTypes: true });
  const staleAuthorities = rootEntries.filter((entry) => entry.isFile() && /^shotlab-.*\.css$/i.test(entry.name) && !referenced.has(entry.name)).map((entry) => entry.name);
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
  return transformCss({ filename, code: Buffer.from(css), minify: true, sourceMap: false, errorRecovery: false }).code.toString("utf8");
}

function isCoachWorkspace(file) { return COACH_WORKSPACE_ASSET.test(path.basename(file)); }
function structurallyMinify(css, filename) { return minify(css, { filename, restructure: true, comments: false, forceMediaMerge: false }).css; }

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

function protectCanonicalCoachMobileAuthority(css, filename) {
  let cursor = 0;
  while (true) {
    const start = css.indexOf(COACH_MOBILE_MEDIA, cursor);
    if (start < 0) break;
    const end = findBalancedBlockEnd(css, start);
    if (end < 0) throw new Error("Unbalanced Coach mobile media block during production CSS optimization.");
    const block = css.slice(start, end);
    if (COACH_AUTHORITY_MARKERS.every((marker) => block.includes(marker))) {
      // Preserve the emitted source-owned block byte-for-byte and optimize only
      // the CSS around it. This is protection, not reconstruction: no declarations
      // are generated, copied from another layer, or appended after optimization.
      const before = structurallyMinify(css.slice(0, start), `${filename}:before-coach-mobile`);
      const after = structurallyMinify(css.slice(end), `${filename}:after-coach-mobile`);
      return `${before}${block}${after}`;
    }
    cursor = end;
  }
  throw new Error("Canonical Coach <=700px authority block was not found before production CSS optimization.");
}

function restructureCss(css, filename) {
  if (isCoachWorkspace(filename)) return protectCanonicalCoachMobileAuthority(css, filename);
  return structurallyMinify(css, filename);
}

function isProtectedFinalAuthority(file) { return FINAL_MOBILE_AUTHORITY_ASSET.test(path.basename(file)); }

async function finalizeProductionCss(files) {
  let sourceBytes = 0, outputBytes = 0, changedFiles = 0, protectedFiles = 0;
  for (const file of files) {
    const source = await readFile(file, "utf8");
    const relative = path.relative(DIST_DIR, file);
    if (isProtectedFinalAuthority(file)) { sourceBytes += Buffer.byteLength(source); outputBytes += Buffer.byteLength(source); protectedFiles += 1; continue; }
    const restructured = restructureCss(source, relative);
    // The Coach authority block has already been preserved exactly; do not pass
    // the recomposed Coach asset through a second structural minifier.
    const output = isCoachWorkspace(file) ? restructured : compactProductionCss(restructured, path.basename(file));
    sourceBytes += Buffer.byteLength(source); outputBytes += Buffer.byteLength(output);
    if (output !== source) { await writeFile(file, output); changedFiles += 1; }
  }
  console.log(`Final production CSS restructure changed ${changedFiles}/${files.length} files; saved ${((sourceBytes - outputBytes) / 1024).toFixed(1)} KiB raw after selector/dedupe passes; protected ${protectedFiles} final mobile authority asset(s).`);
}

async function main() {
  await stat(DIST_DIR);
  if (FINAL_COACH_MODE) { const files = await listCssFiles(DIST_DIR); await finalizeProductionCss(files); return; }
  const removedAuthorityCopies = await removeBundledAuthorityDuplicates();
  const files = await listCssFiles(DIST_DIR);
  let sourceBytes = 0, outputBytes = 0, changedFiles = 0, protectedFiles = 0;
  for (const file of files) {
    const source = await readFile(file, "utf8");
    if (isProtectedFinalAuthority(file)) { sourceBytes += Buffer.byteLength(source); outputBytes += Buffer.byteLength(source); protectedFiles += 1; continue; }
    const output = restructureCss(source, path.relative(DIST_DIR, file));
    sourceBytes += Buffer.byteLength(source); outputBytes += Buffer.byteLength(output);
    if (output !== source) { await writeFile(file, output); changedFiles += 1; }
  }
  console.log(`Removed ${removedAuthorityCopies} unreferenced visual-authority CSS copies.`);
  console.log(`Restructured ${changedFiles}/${files.length} production CSS files; saved ${((sourceBytes - outputBytes) / 1024).toFixed(1)} KiB raw; protected ${protectedFiles} final mobile authority asset(s).`);
}

await main();
