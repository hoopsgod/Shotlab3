import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const index = readFileSync('index.html', 'utf8');
const css = readFileSync('public/shotlab-phase3-native-route-framing.css', 'utf8');
const workspaceSource = readFileSync('src/components/PlayerOperationalWorkspace.jsx', 'utf8');
const workflow = readFileSync('.github/workflows/app-store-presentation-readiness.yml', 'utf8');

test('Phase 3C route framing loads after the existing Phase 3 secondary authority', () => {
  const acceptance = index.indexOf('shotlab-phase3-secondary-acceptance');
  const framing = index.indexOf('shotlab-phase3-native-route-framing');
  assert.ok(acceptance >= 0, 'Phase 3 acceptance stylesheet must remain loaded');
  assert.ok(framing > acceptance, 'Phase 3C framing must load after Phase 3 acceptance');
});

test('Player secondary destinations use compact native route chrome and one gutter authority', () => {
  assert.match(css, /\.performance-shell--player\.is-mobile:not\(\[data-workspace-tab="home"\]\) \.player-quick-actions\{[\s\S]*?height:0!important;[\s\S]*?overflow:visible!important;/);
  assert.match(css, /player-quick-actions button\[aria-label="Logout"\][\s\S]*?min-height:44px!important;[\s\S]*?pointer-events:auto;/);
  assert.doesNotMatch(css, /player-quick-actions\{\s*display:none!important;/s);
  assert.match(css, /\.performance-shell--player\.is-mobile:not\(\[data-workspace-tab="home"\]\) \.player-scroll-container>button\[type="button"\][\s\S]*?width:var\(--p3c-route-control\)!important;[\s\S]*?font-size:0!important;/);
  assert.match(css, /player-scroll-container>button\[type="button"\]>span\[aria-hidden="true"\][\s\S]*?font-size:20px!important;/);
  assert.match(css, /\[data-testid\^="player-workspace-"\]\{\s*margin-left:0!important;\s*margin-right:0!important;/s);
  assert.match(css, /\[data-testid="premium-leaderboards-hub"\],[\s\S]*?\[data-testid="player-career-history"\][\s\S]*?width:100%!important;/);
});

test('Leaderboard destination removes the duplicated inner title while keeping context content', () => {
  assert.match(css, /premium-leaderboards-hub"\]>header>div:nth-child\(1\)/);
  assert.match(css, /premium-leaderboards-hub"\]>header>div:nth-child\(2\)/);
  assert.match(css, /display:none!important;/);
  assert.match(css, /premium-leaderboards-hub"\]>header\{[\s\S]*?padding:0 0 12px!important;/);
});

test('Leaderboard hero cannot claim the top spot for a lower displayed rank', () => {
  assert.match(workspaceSource, /function resolveWorkspaceSubtitle\(model\)/);
  assert.match(workspaceSource, /model\?\.id !== "leaderboards"/);
  assert.match(workspaceSource, /rank <= 1/);
  assert.match(workspaceSource, /You are tied on makes with the position ahead\./);
  assert.match(workspaceSource, /<p className=\{styles\.subtitle\}>\{subtitle\}<\/p>/);
});

test('Coach secondary routes share the same compact return affordance', () => {
  assert.match(css, /\.performance-shell--coach\.is-mobile \.page\.pageShell>button\[type="button"\]:first-child\{/);
  assert.match(css, /width:var\(--p3c-route-control\)!important;/);
  assert.match(css, /border-radius:var\(--p3c-route-radius\)!important;/);
  assert.match(css, /touch-action:manipulation;/);
});

test('Phase 3C keeps account access, focus, and reduced-motion behavior explicit', () => {
  assert.match(css, /button\[aria-label="Logout"\]:focus-visible/);
  assert.match(css, /:focus-visible\{/);
  assert.match(css, /outline:3px solid color-mix/);
  assert.match(css, /@media \(prefers-reduced-motion:reduce\)/);
  assert.match(css, /transform:none!important;/);
});

test('App Store presentation workflow verifies the stacked Phase 3C contract', () => {
  assert.match(workflow, /agent\/phase-3b-interaction-polish/);
  assert.match(workflow, /tests\/phase-3c-native-route-framing\.test\.mjs/);
  assert.match(workflow, /shotlab-phase-3c-native-route-framing-evidence/);
});
