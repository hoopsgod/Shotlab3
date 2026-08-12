import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const minifyVisualAuthorityCss = (source) => source
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/\s+/g, " ")
  // A space before a pseudo-class may be a descendant combinator. Removing it
  // turns `html :is(.page)` into the non-equivalent `html:is(.page)`.
  .replace(/\s*([{};,>+~])\s*/g, "$1")
  .replace(/:\s+/g, ":")
  .replace(/;}/g, "}")
  .trim();

export async function minifyVisualAuthorityFiles({ cwd = process.cwd() } = {}) {
  const publicDir = path.resolve(cwd, "public");
  const files = (await readdir(publicDir)).filter((name) => /^shotlab-.*\.css$/i.test(name));

  for (const name of files) {
    const file = path.join(publicDir, name);
    const source = await readFile(file, "utf8");
    const output = minifyVisualAuthorityCss(source);
    if (output !== source) await writeFile(file, `${output}\n`);
  }

  return files.length;
}

const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedFile === fileURLToPath(import.meta.url)) {
  const count = await minifyVisualAuthorityFiles();
  console.log(`Minified ${count} ShotLab visual authority stylesheets.`);
}
