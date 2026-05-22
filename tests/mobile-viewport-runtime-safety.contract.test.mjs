import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const MAIN_PATH = new URL('../src/main.jsx', import.meta.url);

test('main runtime viewport sync is throttled and does not bind visualViewport scroll loop', async () => {
  const source = await readFile(MAIN_PATH, 'utf8');
  assert.match(source, /requestAnimationFrame\(\(\) => \{/);
  assert.match(source, /Math\.abs\(prevHeightPx - nextHeightPx\) < 0\.5/);
  assert.match(source, /visualViewport\?\.addEventListener\('resize', scheduleSyncViewportHeight, \{ passive: true \}\)/);
  assert.doesNotMatch(source, /visualViewport\?\.addEventListener\('scroll', scheduleSyncViewportHeight/);
});
