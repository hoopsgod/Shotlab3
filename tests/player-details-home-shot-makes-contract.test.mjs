import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');

test('player details/profile computes makes from shotLogs.made with safe numeric fallback', () => {
  assert.match(source, /const getPlayerHomeShotMakes=\(playerEmail,logs,teamId\)=>\{/);
  assert.match(source, /return total\+toSafeNumber\(log\?\.made\|\|0\);/);
});

test('player details/profile makes calculation filters by normalized player email', () => {
  assert.match(source, /const targetEmail=normalizeEmail\(playerEmail\);/);
  assert.match(source, /if\(normalizeEmail\(log\?\.email\)!==targetEmail\)return total;/);
});

test('player details/profile excludes wrong-team shot logs when log teamId exists', () => {
  assert.match(source, /const logTeamId=log\?\.teamId\|\|null;/);
  assert.match(source, /if\(teamId&&logTeamId&&logTeamId!==teamId\)return total;/);
});

test('events count remains RSVP-based while summary displays makes from shotLogs', () => {
  assert.match(source, /\{tot\} makes · \{rsvps\.filter\(r=>normalizeEmail\(r\.email\)===normalizeEmail\(p\.email\)\)\.length\} events/);
});

test('coach development profile displays At Home makes from shotLogs helper data', () => {
  assert.match(source, /statCard\("At Home Makes",profile\.totalAtHomeMakes,VOLT\)/);
  assert.match(source, /shotLogs=\{shotLogs\}/);
});
