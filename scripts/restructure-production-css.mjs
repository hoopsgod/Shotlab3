import { readdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { minify } from "csso";
import { transform as transformCss } from "lightningcss";

const DIST_DIR = path.resolve(process.cwd(), "dist");
const COACH_WORKSPACE_ASSET = /^CoachWorkspaces-.*\.css$/;
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

function compactCoachCss(css, filename) {
  return transformCss({
    filename,
    code: Buffer.from(css),
    minify: true,
    sourceMap: false,
    errorRecovery: false,
  }).code.toString("utf8");
}

async function finalizeCoachCss(files) {
  const coachFile = files.find((file) => COACH_WORKSPACE_ASSET.test(path.basename(file)));
  if (!coachFile) {
    console.log("CoachWorkspaces CSS asset not found; no final Coach compaction applied.");
    return;
  }
  const source = await readFile(coachFile, "utf8");
  const output = compactCoachCss(source, path.basename(coachFile));
  if (output !== source) await writeFile(coachFile, output);
  console.log(`Final Coach CSS compaction saved ${((Buffer.byteLength(source) - Buffer.byteLength(output)) / 1024).toFixed(1)} KiB raw after selector reachability pruning.`);
}

async function main() {
  await stat(DIST_DIR);
  const files = await listCssFiles(DIST_DIR);

  if (FINAL_COACH_MODE) {
    await finalizeCoachCss(files);
    return;
  }

  const removedAuthorityCopies = await removeBundledAuthorityDuplicates();
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
  console.log(`Restructured ${changedFiles}/${files.length} production CSS files; saved ${((sourceBytes - outputBytes) / 1024).toFixed(1)} KiB raw.`);
}

await main();
