import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const appSource = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');

test('runtime source contains no unsafe renderPremiumLeaderboardsHub helper reference', () => {
  assert.equal(appSource.includes('renderPremiumLeaderboardsHub'), false);
});

