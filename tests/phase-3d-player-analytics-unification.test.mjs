import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const index = readFileSync('index.html', 'utf8');
const css = readFileSync('public/shotlab-phase3d-player-analytics.css', 'utf8');
const charts = readFileSync('src/components/ShotLabCharts.jsx', 'utf8');
const workflow = readFileSync('.github/workflows/app-store-presentation-readiness.yml', 'utf8');

test('Phase 3D analytics authority loads after Phase 3C route framing', () => {
  const framing = index.indexOf('shotlab-phase3-native-route-framing');
  const analytics = index.indexOf('shotlab-phase3d-player-analytics');
  assert.ok(framing >= 0, 'Phase 3C route framing must remain loaded');
  assert.ok(analytics > framing, 'Phase 3D analytics authority must load after Phase 3C');
});

test('Phase 3D scopes presentation changes to the Player Profile analytics canvas', () => {
  assert.match(css, /performance-shell--player\[data-workspace-tab="profile"\]/);
  assert.match(css, /div\[style\*="min-height: 100vh"\]/);
  assert.match(css, /background:transparent!important;/);
  assert.match(css, /font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text"/);
});

test('Legacy analytics masthead becomes an in-flow native section header', () => {
  assert.match(css, /> div:first-child\{[\s\S]*?position:relative!important;[\s\S]*?border-radius:22px!important;[\s\S]*?background:var\(--p3d-surface\)!important;/);
  assert.match(css, /display:none!important;/);
  assert.match(css, /font-size:25px!important;/);
});

test('Analytics tabs remove emoji chrome and retain accessible touch sizing', () => {
  assert.match(css, /button > span:first-child\{\s*display:none!important;/s);
  assert.match(css, /min-height:42px!important;/);
  assert.match(css, /touch-action:manipulation;/);
  assert.match(css, /button:focus-visible\{/);
});

test('Legacy black surfaces and dark chart tokens are translated to the light Profile system', () => {
  for (const token of ['rgb(10, 10, 10)', 'rgb(17, 19, 24)', 'rgb(22, 27, 34)', 'rgb(13, 17, 23)']) {
    assert.ok(css.includes(token), `expected explicit legacy background translation for ${token}`);
  }
  assert.match(css, /svg \[stroke="#1e2530"\]/);
  assert.match(css, /svg \[fill="#6b7280"\]/);
  assert.match(css, /--p3d-surface:#ffffff/);
  assert.match(css, /--p3d-ink:#151a16/);
});

test('Phase 3D does not replace analytics calculations or data inputs', () => {
  assert.match(charts, /scores = \[\]/);
  assert.match(charts, /drills = \[\]/);
  assert.match(charts, /programDrills = \[\]/);
  assert.match(charts, /const myScores = useMemo/);
  assert.match(charts, /const selectedScores = useMemo/);
  assert.match(charts, /ResponsiveContainer/);
});

test('App Store presentation workflow verifies and captures Phase 3D', () => {
  assert.match(workflow, /agent\/phase-3c-native-route-framing/);
  assert.match(workflow, /tests\/phase-3d-player-analytics-unification\.test\.mjs/);
  assert.match(workflow, /shotlab-phase-3d-player-analytics-evidence/);
});
