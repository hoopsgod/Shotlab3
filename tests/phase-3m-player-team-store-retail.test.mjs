import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const enhancer = readFileSync('scripts/apply-phase3m-player-team-store-retail.mjs', 'utf8');
const css = readFileSync('public/shotlab-phase3m-player-team-store-retail.css', 'utf8');
const html = readFileSync('index.html', 'utf8');
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const screenshots = readFileSync('tests/e2e/phase-3m-player-team-store-retail-screenshots.spec.mjs', 'utf8');

test('Phase 3M runs after accepted Team Store and Leaderboard transforms with a guarded idempotent mutation', () => {
  assert.match(pkg.scripts.dev, /apply-phase3i-team-store-immersive\.mjs[\s\S]*apply-phase3l-coach-leaderboard-hierarchy\.mjs[\s\S]*apply-phase3m-player-team-store-retail\.mjs/);
  assert.match(pkg.scripts['prepare:route-enhancers'], /apply-phase3i-team-store-immersive\.mjs[\s\S]*apply-phase3m-player-team-store-retail\.mjs/);
  assert.match(enhancer, /expected exactly one anchor/);
  assert.match(enhancer, /Player Team Store retail hierarchy already applied/);
});

test('Player Team Store gains stable first-screen retail hierarchy seams', () => {
  for (const marker of [
    'data-testid="player-team-store-retail"',
    'data-testid="player-team-store-hero"',
    'data-testid="player-team-store-card"',
    'Official program store',
    'Your team. Your gear.',
    'Partner checkout',
  ]) assert.ok(enhancer.includes(marker), `missing Player Team Store marker: ${marker}`);
});

test('Phase 3M styling is player-scoped and preserves the light premium system', () => {
  assert.match(css, /\.ts-player-content\[data-testid="player-team-store-retail"\]/);
  assert.match(css, /\.ts-player-retail-hero[\s\S]*linear-gradient/);
  assert.match(css, /\.ts-player-retail-signals[\s\S]*grid-template-columns: repeat\(3/);
  assert.match(css, /\.ts-player-storefront-shell[\s\S]*background: rgba\(255, 255, 255, \.92\)/);
  assert.match(css, /\.ts-preview-button-disabled[\s\S]*min-height: 54px/);
  assert.match(css, /@media \(max-width: 759px\)/);
  assert.match(css, /prefers-reduced-motion: reduce/);
});

test('Player retail authority loads after the accepted Phase 3L layer', () => {
  assert.match(html, /shotlab-phase3l-coach-leaderboard-hierarchy\.css[\s\S]*shotlab-phase3m-player-team-store-retail\.css/);
});

test('Team Store publishing, attribution, live shopping, demo safety, and empty-state behavior remain preserved', () => {
  for (const preserved of [
    'TEAM_STORE_OPEN_EVENT',
    'getSquadLockerPartnerReadiness',
    'buildTeamStoreReferralStart',
    'window.open(store.storeUrl, "_blank", "noopener,noreferrer")',
    'window.open(partnerUrl, "_blank", "noopener,noreferrer")',
    'onOpen={() => openStore("player_portal")}',
    'PUBLISH STORE',
    'AFFILIATE_DISCLOSURE',
    'Your team store is not open yet',
  ]) assert.ok(enhancer.includes(preserved), `missing preserved Team Store behavior: ${preserved}`);
});

test('fresh iPhone evidence checks first-viewport hierarchy, containment, and portal recovery', () => {
  assert.match(screenshots, /player-team-store-retail/);
  assert.match(screenshots, /player-team-store-hero/);
  assert.match(screenshots, /player-team-store-card/);
  assert.match(screenshots, /04m-player-team-store-retail/);
  assert.match(screenshots, /scrollWidth - window\.innerWidth/);
  assert.match(screenshots, /mobile-navigation-dock/);
});
