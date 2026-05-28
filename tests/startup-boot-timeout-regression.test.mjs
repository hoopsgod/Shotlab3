import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

test('startup boot timeout allows slow hydration without false startup crash panel', () => {
  const source = fs.readFileSync('src/main.jsx', 'utf8');
  assert.match(source, /const BOOT_TIMEOUT_MS = 30000/);
  assert.match(source, /window\.addEventListener\('shotlab:app-ready', onAppReady, \{ once: true \}\)/);
  assert.match(source, /window\.setTimeout\(\(\) => \{/);
});
