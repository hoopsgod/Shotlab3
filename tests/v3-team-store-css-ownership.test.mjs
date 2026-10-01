import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const foundation = fs.readFileSync('public/shotlab-v3-foundation.css', 'utf8');
const industrial = fs.readFileSync('src/components/TeamStoreIndustrial.css', 'utf8');
const immersive = fs.readFileSync('public/shotlab-phase3i-team-store-immersive.css', 'utf8');
const entry = fs.readFileSync('src/teamStoreEntry.jsx', 'utf8');

test('Team Store presentation is source-owned outside the legacy V3 foundation', () => {
  assert.doesNotMatch(foundation, /\.ts-(?:overlay|panel|header|eyebrow|section|progress|preview|player|close|coach|form|metrics|partner|field|button)/);
  assert.match(entry, /import ["']\.\/components\/TeamStoreIndustrial\.css["']/);
  assert.match(industrial, /\.ts-panel\s*\{/);
  assert.match(industrial, /\.ts-header\s*\{/);
  assert.match(industrial, /\.ts-field input,[\s\S]*\.ts-field select/);
  assert.match(industrial, /@media \(max-width: 720px\)/);
  assert.match(immersive, /html\.team-store-portal-open \.ts-panel/);
  assert.match(immersive, /@media \(prefers-reduced-motion:reduce\)/);
});
