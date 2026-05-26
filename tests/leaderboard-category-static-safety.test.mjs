import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const SRC_DIR = new URL('../src/', import.meta.url);

function getJsLikeFiles(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...getJsLikeFiles(full));
      continue;
    }
    if (/\.(js|jsx|ts|tsx|mjs|cjs)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

test('runtime source contains no unsafe legacy leaderboardCategory or renderPremiumLeaderboardsHub identifiers', () => {
  const files = getJsLikeFiles(SRC_DIR.pathname);
  const offenders = [];

  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8');
    const normalized = source
      .replace(/\/\*[\s\S]*?\*\//g, ' ')
      .replace(/\/\/.*$/gm, ' ')
      .replace(/(['"`])(?:\\.|(?!\1)[^\\])*\1/g, ' ');
    if (/\bleaderboardCategory\b/.test(normalized) || /\brenderPremiumLeaderboardsHub\b/.test(normalized)) {
      offenders.push(path.relative(process.cwd(), file));
    }
  }

  assert.deepEqual(offenders, []);
});
