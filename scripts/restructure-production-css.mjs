import { readdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { minify } from "csso";
import { transform as transformCss } from "lightningcss";

const DIST_DIR = path.resolve(process.cwd(), "dist");
const COACH_WORKSPACE_ASSET = /^CoachWorkspaces-.*\.css$/;
const AUTHORITY_BUNDLE_ASSET = /^shotlab-authority-(\d+)\.css$/;
const MAX_AUTHORITY_BUNDLE_BYTES = 118_000;
const FINAL_COACH_MODE = process.argv.includes("--final-coach");

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

function topLevelCssBoundaries(source) {
  const boundaries = [];
  let braceDepth = 0;
  let parenDepth = 0;
  let bracketDepth = 0;
  let quote = "";
  let comment = false;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];
    if (comment) {
      if (char === "*" && next === "/") { comment = false; index += 1; }
      continue;
    }
    if (quote) {
      if (char === "\\") index += 1;
      else if (char === quote) quote = "";
      continue;
    }
    if (char === "/" && next === "*") { comment = true; index += 1; continue; }
    if (char === '"' || char === "'") { quote = char; continue; }
    if (char === "(") parenDepth += 1;
    else if (char === ")") parenDepth = Math.max(0, parenDepth - 1);
    else if (char === "[") bracketDepth += 1;
    else if (char === "]") bracketDepth = Math.max(0, bracketDepth - 1);
    else if (char === "{") braceDepth += 1;
    else if (char === "}") {
      braceDepth = Math.max(0, braceDepth - 1);
      if (braceDepth === 0 && parenDepth === 0 && bracketDepth === 0) boundaries.push(index + 1);
    } else if (char === ";" && braceDepth === 0 && parenDepth === 0 && bracketDepth === 0) {
      boundaries.push(index + 1);
    }
  }
  return boundaries;
}

function splitOptimizedAuthorityCss(source, count) {
  if (count <= 1) return [source];
  const boundaries = topLevelCssBoundaries(source);
  if (!boundaries.length || boundaries.at(-1) !== source.length) boundaries.push(source.length);
  const chunks = [];
  let start = 0;

  for (let chunkIndex = 0; chunkIndex < count - 1; chunkIndex += 1) {
    const remainingChunks = count - chunkIndex - 1;
    const remainingBytes = Buffer.byteLength(source.slice(start));
    const idealBytes = Math.ceil(remainingBytes / (remainingChunks + 1));
    const candidates = boundaries
      .filter((boundary) => boundary > start && boundary < source.length)
      .map((boundary) => ({
        boundary,
        chunkBytes: Buffer.byteLength(source.slice(start, boundary)),
        restBytes: Buffer.byteLength(source.slice(boundary)),
      }))
      .filter(({ chunkBytes, restBytes }) => chunkBytes <= MAX_AUTHORITY_BUNDLE_BYTES && restBytes <= remainingChunks * MAX_AUTHORITY_BUNDLE_BYTES)
      .sort((left, right) => Math.abs(left.chunkBytes - idealBytes) - Math.abs(right.chunkBytes - idealBytes));
    const selected = candidates[0];
    if (!selected) {
      throw new Error(`Unable to split optimized visual authority CSS into ${count} ordered bundles under ${MAX_AUTHORITY_BUNDLE_BYTES} bytes each.`);
    }
    chunks.push(source.slice(start, selected.boundary));
    start = selected.boundary;
  }
  chunks.push(source.slice(start));
  if (chunks.some((chunk) => !chunk || Buffer.byteLength(chunk) > MAX_AUTHORITY_BUNDLE_BYTES)) {
    throw new Error(`Optimized visual authority CSS exceeded the ${MAX_AUTHORITY_BUNDLE_BYTES}-byte bundle safety target.`);
  }
  return chunks;
}

async function restructureAuthorityBundles() {
  const entries = await readdir(DIST_DIR, { withFileTypes: true });
  const bundles = entries
    .filter((entry) => entry.isFile() && AUTHORITY_BUNDLE_ASSET.test(entry.name))
    .map((entry) => ({ name: entry.name, order: Number(entry.name.match(AUTHORITY_BUNDLE_ASSET)?.[1] || 0) }))
    .sort((left, right) => left.order - right.order);
  if (bundles.length < 2) return { bundles: bundles.length, rawBytesSaved: 0 };

  const sources = await Promise.all(bundles.map(({ name }) => readFile(path.join(DIST_DIR, name), "utf8")));
  const combined = sources.join("\n");
  const optimized = minify(combined, {
    filename: "shotlab-authority-combined.css",
    restructure: true,
    comments: false,
    forceMediaMerge: false,
  }).css;
  const chunks = splitOptimizedAuthorityCss(optimized, bundles.length);
  await Promise.all(bundles.map(({ name }, index) => writeFile(path.join(DIST_DIR, name), chunks[index])));
  return {
    bundles: bundles.length,
    rawBytesSaved: Buffer.byteLength(combined) - Buffer.byteLength(optimized),
  };
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

async function finalizeProductionCss(files) {
  let sourceBytes = 0;
  let outputBytes = 0;
  let changedFiles = 0;

  for (const file of files) {
    const source = await readFile(file, "utf8");
    const output = compactProductionCss(source, path.basename(file));
    sourceBytes += Buffer.byteLength(source);
    outputBytes += Buffer.byteLength(output);
    if (output !== source) {
      await writeFile(file, output);
      changedFiles += 1;
    }
  }

  console.log(`Final production CSS compaction changed ${changedFiles}/${files.length} files; saved ${((sourceBytes - outputBytes) / 1024).toFixed(1)} KiB raw after selector reachability pruning.`);
}

async function main() {
  await stat(DIST_DIR);
  const files = await listCssFiles(DIST_DIR);

  if (FINAL_COACH_MODE) {
    await finalizeProductionCss(files);
    return;
  }

  const removedAuthorityCopies = await removeBundledAuthorityDuplicates();
  const authorityResult = await restructureAuthorityBundles();
  let sourceBytes = 0;
  let outputBytes = 0;
  let changedFiles = 0;

  for (const file of files) {
    const source = await readFile(file, "utf8");
    const isCoachWorkspace = COACH_WORKSPACE_ASSET.test(path.basename(file));
    const result = minify(source, {
      filename: path.relative(DIST_DIR, file),
      restructure: true,
      comments: false,
      forceMediaMerge: isCoachWorkspace,
    });
    const output = result.css;
    sourceBytes += Buffer.byteLength(source);
    outputBytes += Buffer.byteLength(output);
    if (output !== source) {
      await writeFile(file, output);
      changedFiles += 1;
    }
  }

  console.log(`Removed ${removedAuthorityCopies} unreferenced visual-authority CSS copies.`);
  console.log(`Jointly restructured ${authorityResult.bundles} ordered visual-authority bundles; saved ${(authorityResult.rawBytesSaved / 1024).toFixed(1)} KiB raw before final per-file compaction.`);
  console.log(`Restructured ${changedFiles}/${files.length} production CSS files; saved ${((sourceBytes - outputBytes) / 1024).toFixed(1)} KiB raw.`);
}

await main();
