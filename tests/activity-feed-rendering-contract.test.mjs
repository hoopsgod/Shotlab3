import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');

test('activity feed card is rendered in player and coach homes with compact empty-state copy', () => {
  assert.match(source, /<RecentActivityCard title="Recent Activity" items=\{recentPlayerActivity\}\/>/);
  assert.match(source, /<RecentActivityCard title="Activity" items=\{recentCoachActivity\}\/>/);
  assert.match(source, /Team activity will appear here as players and coaches use ShotLab\./);
});
