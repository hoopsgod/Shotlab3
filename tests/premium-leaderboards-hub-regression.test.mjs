import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const appSource = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const hubSource = fs.readFileSync(new URL('../src/components/LeaderboardsHub.jsx', import.meta.url), 'utf8');
const compactSource = fs.readFileSync(new URL('../src/components/CompactLeaderboardPreviewCard.jsx', import.meta.url), 'utf8');

test('player and coach dashboards both render the shared leaderboards hub', () => {
  assert.match(appSource, /<LeaderboardsHub viewerRole="player"/);
  assert.match(appSource, /<LeaderboardsHub viewerRole="coach"/);
});

test('preview and CTA test ids are present', () => {
  assert.match(compactSource, /data-testid=\{previewTestId\}/);
  assert.match(compactSource, /data-testid=\{ctaTestId\}/);
  assert.match(appSource, /viewAllLabel="View Leaderboards"/);
  assert.match(appSource, /viewAllLabel="Open Competition Hub"/);
});

test('leaderboards hub includes all category selectors and shell test id', () => {
  assert.match(hubSource, /data-testid="leaderboards-hub"/);
  assert.match(hubSource, /leaderboards-category-home-shots/);
  assert.match(hubSource, /leaderboards-category-events/);
  assert.match(hubSource, /leaderboards-category-strength/);
  assert.match(hubSource, /leaderboards-category-drills/);
});
