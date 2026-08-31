import { readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { minify } from 'terser'

const DIST_DIR = path.resolve(process.cwd(), 'dist')

async function listJavaScriptFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...await listJavaScriptFiles(fullPath))
    else if (entry.isFile() && entry.name.endsWith('.js')) files.push(fullPath)
  }
  return files
}

async function recompress(file) {
  const source = await readFile(file, 'utf8')
  const result = await minify(source, {
    ecma: 2022,
    module: true,
    compress: {
      passes: 5,
      toplevel: true,
      pure_funcs: ['console.log', 'console.debug', 'console.info'],
    },
    mangle: { toplevel: true },
    format: { comments: false },
  })
  const output = result.code || source
  if (Buffer.byteLength(output) >= Buffer.byteLength(source)) {
    return { changed: false, sourceBytes: Buffer.byteLength(source), outputBytes: Buffer.byteLength(source) }
  }
  await writeFile(file, output)
  return { changed: true, sourceBytes: Buffer.byteLength(source), outputBytes: Buffer.byteLength(output) }
}

const files = await listJavaScriptFiles(DIST_DIR)
let changedFiles = 0
let sourceBytes = 0
let outputBytes = 0
for (const file of files) {
  const result = await recompress(file)
  sourceBytes += result.sourceBytes
  outputBytes += result.outputBytes
  if (result.changed) changedFiles += 1
}

console.log(`Recompressed ${changedFiles}/${files.length} production JavaScript files with the existing Terser toolchain; saved ${((sourceBytes - outputBytes) / 1024).toFixed(1)} KiB raw.`)
