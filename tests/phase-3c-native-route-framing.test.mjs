import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const index = readFileSync('index.html', 'utf8');
const css = readFileSync('public/shotlab-phase3-native-route-framing.css', 'utf8');
const phase7Chrome = readFileSync('src/components/Phase7AuthenticatedChrome.css', 'utf8');
const backEnhancer = readFileSync('scripts/apply-phase4d-shared-back-hit-area.mjs', 'utf8');
const workspaceSource = readFileSync('src/components/PlayerOperationalWorkspace.jsx', 'utf8');
const workflow = readFileSync('.github/workflows/app-store-presentation-readiness.yml', 'utf8');

test('Phase 3C route framing loads after the existing Phase 3 secondary authority', () => {
  const acceptance = index.indexOf('shotlab-phase3-secondary-acceptance');
  const framing = index.indexOf('shotlab-phase3-native-route-framing');
  assert.ok(acceptance >= 0, 'Phase 3 acceptance stylesheet must remain loaded');
  assert.ok(framing > acceptance, 'Phase 3C framing must load after Phase 3 acceptance');
});

test('Player secondary destinations keep one gutter authority and explicit account access', () => {
  assert.match(css, /\.performance-shell--player\.is-mobile:not\(\[data-workspace-tab="home"\]\) \.player-quick-actions\{[\s\S]*?height:0!important;[\s\S]*?overflow:visible!important;/);
  assert.match(css, /player-quick-actions button\[aria-label="Logout"\][\s\S]*?min-height:44px!important;[\s\S]*?pointer-events:auto;/);
  assert.doesNotMatch(css, /player-quick-actions\{\s*display:none!important;/s);
  assert.match(css, /\.performance-shell--player\.is-mobile:not\(\[data-workspace-tab="home"\]\) \[data-testid\^="player-workspace-"\]\{margin-left:0!important;margin-right:0!important\}/);
  assert.match(css, /\[data-testid="premium-leaderboards-hub"\],[\s\S]*?\[data-testid="player-career-history"\]\{width:100%!important;max-width:none!important;margin-left:0!important;margin-right:0!important\}/);
});

test('Phase 7 owns return-control geometry while Phase 3C keeps only route-density behavior', () => {
  assert.doesNotMatch(css, /--p3c-route-(?:control|radius|line|shadow)/);
  assert.doesNotMatch(css, /player-scroll-container>button\[type="button"\]/);
  assert.doesNotMatch(css, /page\.pageShell>button\[type="button"\]:first-child/);
  assert.match(phase7Chrome, /\.is-mobile \.shared-dashboard-back-action/);
  assert.match(phase7Chrome, /width:44px!important/);
  assert.match(phase7Chrome, /border-radius:14px!important/);
  assert.match(backEnhancer, /minHeight:44/);
  assert.match(backEnhancer, /touchAction:"manipulation"/);
});

test('Leaderboard destination removes duplicated inner title rows while keeping context content', () => {
  assert.match(css, /premium-leaderboards-hub"\]>header>div:nth-child\(1\)/);
  assert.match(css, /premium-leaderboards-hub"\]>header>div:nth-child\(2\)/);
  assert.match(css, />header>div:nth-child\(2\)\{display:none!important\}/);
  assert.match(css, /premium-leaderboards-hub"\]>header\{margin-bottom:10px!important;padding:0 0 12px!important\}/);
});

test('Leaderboard hero cannot claim the top spot for a lower displayed rank', () => {
  assert.match(workspaceSource, /function resolveWorkspaceSubtitle\(model\)/);
  assert.match(workspaceSource, /model\?\.id !== "leaderboards"/);
  assert.match(workspaceSource, /rank <= 1/);
  assert.match(workspaceSource, /You are tied on makes with the position ahead\./);
  assert.match(workspaceSource, /summary=\{subtitle\}/);
});

test('Secondary route focus behavior remains explicit after Phase 7 reconciliation', () => {
  assert.match(css, /button\[aria-label="Logout"\]:focus-visible/);
  assert.match(phase7Chrome, /shared-dashboard-back-action:focus-visible/);
  assert.match(phase7Chrome, /outline:3px solid color-mix/);
});

test('App Store presentation workflow verifies the stacked Phase 3C contract', () => {
  assert.match(workflow, /agent\/phase-3b-interaction-polish/);
  assert.match(workflow, /tests\/phase-3c-native-route-framing\.test\.mjs/);
  assert.match(workflow, /name: shotlab-phase-3[\w-]*-evidence/);
});
