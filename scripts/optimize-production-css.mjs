/*
 * Production CSS safety gate.
 *
 * The previous optimizer attempted to prove selector reachability by searching
 * source text for class names. That is unsafe for Vite CSS modules because the
 * production class names (for example `s_a1B2c3`) are generated only during
 * compilation and therefore do not exist in the source corpus. In production
 * this stripped valid Player workspace rules while development remained intact.
 *
 * Keep selector handling intentionally non-destructive. The following production
 * stages still perform standards-based CSS restructuring/minification and the
 * guarded global-selector pruning step preserves generated CSS-module classes.
 * Any future selector-level dead-code elimination must operate on the compiled
 * module graph, not source-text guesses.
 *
 * A syntax-only production compaction is safe here because CSS Color 4 defines
 * rgb() and rgba() as aliases. Rewriting rgba(...) to rgb(...) changes no
 * computed color, selector, cascade, specificity, or browser-visible geometry;
 * it only removes one byte per occurrence from the already-compiled CSS.
 */

import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const DIST_ROOT = path.resolve(process.cwd(), 'dist');
let filesChanged = 0;
let bytesSaved = 0;

async function compactDirectory(directory) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await compactDirectory(target);
      continue;
    }
    if (!entry.isFile() || !entry.name.endsWith('.css')) continue;

    const before = await readFile(target, 'utf8');
    const after = before.replace(/rgba\(/g, 'rgb(');
    if (after === before) continue;

    await writeFile(target, after);
    filesChanged += 1;
    bytesSaved += Buffer.byteLength(before) - Buffer.byteLength(after);
  }
}

await compactDirectory(DIST_ROOT);

console.log(
  `Production CSS safety gate: preserving compiled CSS-module selectors; ` +
  `compacted ${filesChanged} CSS file(s) with standards-equivalent color syntax; ` +
  `saved ${bytesSaved} raw byte(s).`
);
