import { readdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { minify } from "csso";
import { transform as transformCss } from "lightningcss";

const DIST_DIR = path.resolve(process.cwd(), "dist");
const COACH_WORKSPACE_ASSET = /^CoachWorkspaces-.*\.css$/;
const FINAL_MOBILE_AUTHORITY_ASSET = /^MobileViewportAxisAuthority2026-.*\.css$/;
const FINAL_COACH_MODE = process.argv.includes("--final-coach");

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

function isCoachWorkspace(file) {
  return COACH_WORKSPACE_ASSET.test(path.basename(file));
}

function restructureCss(css, filename) {
  // CoachWorkspaces contains the source-owned responsive cascade. Structural
  // optimizers may split canonical component rules from their declarations or
  // change narrow-vs-broad media precedence. Keep that cascade source-ordered;
  // the dedicated pruning/dedupe passes provide safe size recovery instead.
  if (isCoachWorkspace(filename)) return minify(css, { filename, restructure: false, comments: false }).css;
  return minify(css, { filename, restructure: true, comments: false, forceMediaMerge: false }).css;
}

function isProtectedFinalAuthority(file) {
  return FINAL_MOBILE_AUTHORITY_ASSET.test(path.basename(file));
}

async function finalizeProductionCss(files) {
  let sourceBytes = 0, outputBytes = 0, changedFiles = 0, protectedFiles = 0;
  for (const file of files) {
    const source = await readFile(file, "utf8");
    const relative = path.relative(DIST_DIR, file);
    if (isProtectedFinalAuthority(file)) { sourceBytes += Buffer.byteLength(source); outputBytes += Buffer.byteLength(source); protectedFiles += 1; continue; }
    const restructured = restructureCss(source, relative);
    // Lightning CSS also performs structural optimization when minifying. Do not
    // run it over CoachWorkspaces after the source-order safety pass.
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
