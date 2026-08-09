import { readdir, readFile, unlink } from "node:fs/promises";
import path from "node:path";

const DIST_DIR = path.resolve(process.cwd(), "dist");
const indexPath = path.join(DIST_DIR, "index.html");
const html = await readFile(indexPath, "utf8");

if (!html.includes("data-shotlab-authority-bundle")) {
  console.log("Visual authority bundles were not present; no CSS copies removed.");
  process.exit(0);
}

const referenced = new Set(
  [...html.matchAll(/href=["'](?:\.\/|\/)?([^"'?]+\.css)(?:\?[^"']*)?["']/gi)]
    .map((match) => path.basename(match[1])),
);
const entries = await readdir(DIST_DIR, { withFileTypes: true });
const staleAuthorities = entries
  .filter((entry) => entry.isFile() && /^shotlab-.*\.css$/i.test(entry.name) && !referenced.has(entry.name))
  .map((entry) => entry.name);

await Promise.all(staleAuthorities.map((name) => unlink(path.join(DIST_DIR, name))));
console.log(`Removed ${staleAuthorities.length} unreferenced visual-authority CSS copies after production optimization.`);
