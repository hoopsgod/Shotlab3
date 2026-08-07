import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const enhancer = readFileSync('scripts/apply-phase3i-team-store-immersive.mjs', 'utf8');
const css = readFileSync('public/shotlab-phase3i-team-store-immersive.css', 'utf8');
const html = readFileSync('index.html', 'utf8');
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const workflow = readFileSync('.github/workflows/app-store-presentation-readiness.yml', 'utf8');
const screenshots = readFileSync('tests/e2e/design-system-screenshots.spec.mjs', 'utf8');
const production = readFileSync('tests/e2e/team-store-production.spec.mjs', 'utf8');

test('Phase 3I enhancer runs after the accepted Phase 3H transform and is guarded/idempotent', () => {
  assert.match(pkg.scripts.dev, /apply-phase3h-coach-players-hierarchy\.mjs[\s\S]*apply-phase3i-team-store-immersive\.mjs/);
  assert.match(pkg.scripts['prepare:route-enhancers'], /apply-phase3h-coach-players-hierarchy\.mjs[\s\S]*apply-phase3i-team-store-immersive\.mjs/);
  assert.match(enhancer, /expected exactly one anchor/);
  assert.match(enhancer, /Phase 3I Team Store immersive shell already applied/);
});

test('Team Store open lifecycle owns and cleans a document-level immersive state', () => {
  assert.match(enhancer, /const portalClass = "team-store-portal-open"/);
  assert.match(enhancer, /document\.documentElement\.classList\.add\(portalClass\)/);
  assert.match(enhancer, /document\.body\.classList\.add\(portalClass\)/);
  assert.match(enhancer, /document\.documentElement\.classList\.remove\(portalClass\)/);
  assert.match(enhancer, /document\.body\.classList\.remove\(portalClass\)/);
  assert.match(enhancer, /document\.body\.style\.overflow = previousOverflow/);
});

test('mobile Team Store exclusively owns the viewport instead of behaving as a bottom sheet', () => {
  assert.match(css, /@media \(max-width: 759px\)/);
  assert.match(css, /body > #root[\s\S]*display: none !important/);
  assert.match(css, /mobile-navigation-dock[\s\S]*mobile-navigation-overlay[\s\S]*display: none !important/);
  assert.match(css, /#team-store-root[\s\S]*position: fixed !important[\s\S]*height: 100dvh !important/);
  assert.match(css, /\.ts-overlay[\s\S]*padding: 0 !important[\s\S]*backdrop-filter: none !important/);
  assert.match(css, /\.ts-panel[\s\S]*height: 100dvh !important[\s\S]*max-height: none !important[\s\S]*border-radius: 0 !important/);
  assert.match(css, /\.ts-header[\s\S]*position: sticky !important[\s\S]*safe-area-inset-top/);
  assert.match(css, /\.ts-coach-content,[\s\S]*\.ts-player-content[\s\S]*safe-area-inset-bottom/);
});

test('Team Store dialog receives stable rendered seams for viewport verification', () => {
  assert.match(enhancer, /data-testid=\"team-store-portal-overlay\"/);
  assert.match(enhancer, /data-testid=\"team-store-portal-panel\"/);
  assert.match(enhancer, /role=\"dialog\"/);
  assert.match(enhancer, /aria-modal=\"true\"/);
});

test('referral attribution, publishing, and external-store behavior remain untouched', () => {
  for (const preserved of [
    'TEAM_STORE_OPEN_EVENT',
    'getSquadLockerPartnerReadiness',
    'buildTeamStoreReferralStart',
    'window.open(store.storeUrl, "_blank", "noopener,noreferrer")',
    'window.open(partnerUrl, "_blank", "noopener,noreferrer")',
  ]) {
    assert.ok(enhancer.includes(preserved), `missing preserved Team Store marker: ${preserved}`);
  }
  for (const behavior of [
    'CREATE SQUADLOCKER STORE',
    'utm_source',
    'referral_partner_master',
    'PUBLISH STORE',
    'SHOP TEAM STORE',
    'ShotLab may receive referral compensation',
  ]) {
    assert.ok(production.includes(behavior), `missing Team Store production journey marker: ${behavior}`);
  }
});

test('Phase 3I authority loads after Phase 3H and preserves focus/reduced-motion mobile behavior', () => {
  assert.match(html, /shotlab-phase3h-coach-players-hierarchy\.css[\s\S]*shotlab-phase3i-team-store-immersive\.css/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /touch-action: manipulation/);
  assert.match(css, /min-width: 44px !important/);
  assert.match(css, /min-height: 44px !important/);
});

test('rendered iPhone audit proves exclusive viewport ownership for both roles', () => {
  assert.match(screenshots, /expectImmersiveTeamStore/);
  assert.match(screenshots, /team-store-portal-overlay/);
  assert.match(screenshots, /team-store-portal-panel/);
  assert.match(screenshots, /mobile-navigation-dock/);
  assert.match(screenshots, /04-player-team-store/);
  assert.match(screenshots, /09-coach-team-store/);
});

test('App Store presentation workflow carries Phase 3I and its evidence package', () => {
  assert.match(workflow, /tests\/phase-3i-team-store-immersive\.test\.mjs/);
  assert.match(workflow, /shotlab-phase-3i-team-store-immersive-evidence/);
});
