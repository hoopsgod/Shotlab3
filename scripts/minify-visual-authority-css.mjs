import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const publicDir = path.resolve(process.cwd(), "public");
const files = (await readdir(publicDir)).filter((name) => /^shotlab-.*\.css$/i.test(name));

const minify = (source) => source
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/\s+/g, " ")
  .replace(/\s*([{}:;,>+~])\s*/g, "$1")
  .replace(/;}/g, "}")
  .trim();

for (const name of files) {
  const file = path.join(publicDir, name);
  const source = await readFile(file, "utf8");
  const output = minify(source);
  if (output !== source) await writeFile(file, `${output}\n`);
}

console.log(`Minified ${files.length} ShotLab visual authority stylesheets.`);
