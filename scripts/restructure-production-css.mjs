import { readdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { minify } from "csso";
import { transform as transformCss } from "lightningcss";

const DIST_DIR = path.resolve(process.cwd(), "dist");
const COACH_WORKSPACE_ASSET = /^CoachWorkspaces-.*\.css$/;
const FINAL_MOBILE_AUTHORITY_ASSET = /^MobileViewportAxisAuthority2026-.*\.css$/;
const FINAL_COACH_MODE = process.argv.includes("--final-coach");
const COACH_AUTHORITY_CONTRACTS = [
  ["Coach identity stage", /coach-mission-control/],
  ["104–120px crest contract", /--coach-hero-crest:clamp\(104px,29vw,120px\)/],
  ["334px Coach hero", /min-height:334px/],
  ["48px metric controls", /\.mcRealityStrip button[^{}]*\{[^}]*min-height:48px/],
  ["50px primary CTA", /\.mcPrimary[^{}]*\{[^}]*min-height:50px/],
  ["hidden mobile utility header", /mission-control-team-header[^{}]*\{[^}]*display:none/],
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

function structurallyMinify(css, filename) {
  return minify(css, {
    filename,
    restructure: true,
    comments: false,
    // Keep media-query boundaries stable while still allowing normal selector
    // and declaration restructuring inside the Coach workspace bundle.
    forceMediaMerge: false,
  }).css;
}

function assertCanonicalCoachMobileAuthority(css) {
  const missing = COACH_AUTHORITY_CONTRACTS
    .filter(([, pattern]) => !pattern.test(css))
    .map(([label]) => label);
  if (missing.length) {
    throw new Error(
      `Canonical Coach mobile authority was lost during production CSS optimization (${missing.join(", ")}). Fix the optimizer/source pipeline; do not reconstruct CSS after build.`,
    );
  }
}

function restructureCss(css, filename) {
  const restructured = structurallyMinify(css, filename);
  const output = compactProductionCss(restructured, path.basename(filename));
  if (isCoachWorkspace(filename)) assertCanonicalCoachMobileAuthority(output);
  return output;
}

function isProtectedFinalAuthority(file) {
  return FINAL_MOBILE_AUTHORITY_ASSET.test(path.basename(file));
}

async function finalizeProductionCss(files) {
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
    const output = restructureCss(source, relative);
    sourceBytes += Buffer.byteLength(source);
    outputBytes += Buffer.byteLength(output);
    if (output !== source) {
      await writeFile(file, output);
      changedFiles += 1;
    }
  }
  console.log(
    `Final production CSS restructure changed ${changedFiles}/${files.length} files; saved ${((sourceBytes - outputBytes) / 1024).toFixed(1)} KiB raw after selector/dedupe passes; protected ${protectedFiles} final mobile authority asset(s).`,
  );
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
    const output = restructureCss(source, path.relative(DIST_DIR, file));
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