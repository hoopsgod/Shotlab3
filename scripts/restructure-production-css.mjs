import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { minify } from "csso";

const DIST_DIR = path.resolve(process.cwd(), "dist");

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

async function main() {
  await stat(DIST_DIR);
  const files = await listCssFiles(DIST_DIR);
  let sourceBytes = 0;
  let outputBytes = 0;
  let changedFiles = 0;

  for (const file of files) {
    const source = await readFile(file, "utf8");
    const result = minify(source, {
      filename: path.relative(DIST_DIR, file),
      restructure: true,
      comments: false,
      forceMediaMerge: false,
    });
    const output = result.css;
    sourceBytes += Buffer.byteLength(source);
    outputBytes += Buffer.byteLength(output);
    if (output !== source) {
      await writeFile(file, output);
      changedFiles += 1;
    }
  }

  console.log(`Restructured ${changedFiles}/${files.length} production CSS files; saved ${((sourceBytes - outputBytes) / 1024).toFixed(1)} KiB raw.`);
}

await main();
