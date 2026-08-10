import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');
const srcRoot = path.join(repoRoot, 'src');
const appSource = await readFile(path.join(srcRoot, 'App.jsx'), 'utf8');

const requiredSharedSurfaces = [
  'CoachPlayersInteractiveDashboard',
  'CoachEventsInteractiveDashboard',
  'CoachPageDashboardHeader',
  'PlayerDailyCommandCenter',
  'PlayerWorkspaceCommandBar',
  'MobileNavigation',
];

const UI_ROOTS = ['components', 'screens'];
const UI_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx']);

async function collectFiles(root) {
  let entries;
  try {
    entries = await readdir(root);
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }

  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(root, entry);
    const info = await stat(fullPath);
    if (info.isDirectory()) files.push(...await collectFiles(fullPath));
    else files.push(fullPath);
  }
  return files;
}

const uiSources = [];
for (const rootName of UI_ROOTS) {
  const root = path.join(srcRoot, rootName);
  const files = (await collectFiles(root)).filter((file) => UI_EXTENSIONS.has(path.extname(file)));
  for (const file of files) {
    uiSources.push({
      file: path.relative(srcRoot, file).replaceAll('\\', '/'),
      source: await readFile(file, 'utf8'),
    });
  }
}

test('demo sessions use the shared production application tree', () => {
  assert.match(appSource, /const doDemo=async\(kind="player"\)=>/);
  assert.match(appSource, /kind==="coach"\?DEMO_COACH:DEMO_PLAYER/);
  assert.match(appSource, /setDemoMode\(true\)/);

  for (const component of requiredSharedSurfaces) {
    assert.match(appSource, new RegExp(`\\b${component}\\b`), `${component} must remain in the shared App tree`);
  }

  assert.doesNotMatch(
    appSource,
    /(?:DemoCoachApp|DemoPlayerApp|DemoCoachDashboard|DemoPlayerDashboard)/,
    'Demo users must not be routed to separate stale visual implementations',
  );
});

test('demo mode is limited to identity, sample data, and persistence safety—not alternate product UI', () => {
  const demoModeStyleBranches = appSource.match(/isDemoMode\(\)[^\n]{0,120}(?:className|style=|stylesheet)/g) || [];
  assert.equal(
    demoModeStyleBranches.length,
    0,
    `Found demo-only visual branches in App.jsx: ${demoModeStyleBranches.join(' | ')}`,
  );

  const violations = [];
  const forbiddenUiPatterns = [
    { pattern: /from\s+["'][^"']*demoMode(?:\.js)?["']/, reason: 'UI imports demo-mode identity helpers' },
    { pattern: /\bisDemoMode\s*\(/, reason: 'UI branches on demo mode' },
    { pattern: /\bisDemoAccount\s*\(/, reason: 'UI branches on demo identity' },
    { pattern: /\bsetDemoMode\s*\(/, reason: 'UI mutates demo mode outside the shared auth/app entry' },
    { pattern: /DEMO\s+STOREFRONT/i, reason: 'demo-only product copy' },
    { pattern: /See the player experience\./i, reason: 'demo-only product presentation' },
  ];

  for (const { file, source } of uiSources) {
    for (const { pattern, reason } of forbiddenUiPatterns) {
      if (pattern.test(source)) violations.push(`${file}: ${reason}`);
    }
  }

  assert.deepEqual(
    violations,
    [],
    `Demo and registered users must render the same UI paths. Found: ${violations.join(' | ')}`,
  );

  assert.match(appSource, /import "\.\/styles\/PremiumWorkspace\.css";/);
  assert.match(appSource, /import "\.\/styles\/CoachInteractiveDashboard\.css";/);
});

test('Team Store source and build enhancer preserve the same player state for demo and registered users', async () => {
  const teamStoreSource = await readFile(path.join(srcRoot, 'components/TeamStorePortal.jsx'), 'utf8');
  const teamStoreEnhancer = await readFile(path.join(repoRoot, 'scripts/apply-phase3m-player-team-store-retail.mjs'), 'utf8');

  assert.doesNotMatch(
    teamStoreSource,
    /isDemoAccount|isDemoPlayerPreview|DEMO STOREFRONT|Preview only in demo mode|Player experience preview/i,
    'TeamStorePortal.jsx must not contain a demo-only Team Store product path',
  );
  assert.match(teamStoreSource, /Your team store is not open yet/);
  assert.match(teamStoreSource, /store \? <>/);

  // The enhancer intentionally names forbidden demo artifacts in its detector regex.
  // Reject actual generated/rendered branch artifacts rather than the guard that detects them.
  assert.match(teamStoreEnhancer, /const forbiddenDemoUi\s*=\s*\/[^\n]+isDemoPlayerPreview[^\n]+\//);
  assert.doesNotMatch(teamStoreEnhancer, /:\s*isDemoPlayerPreview\s*\?/);
  assert.doesNotMatch(teamStoreEnhancer, /className="[^"]*\bis-demo\b[^"]*"/);
  assert.doesNotMatch(teamStoreEnhancer, /data-testid="player-team-store-demo-preview"/);
  assert.doesNotMatch(teamStoreEnhancer, /data-testid="player-team-store-demo-disclosure"/);
  assert.match(teamStoreEnhancer, /Your team store is not open yet/);
  assert.match(teamStoreEnhancer, /demo\/registered parity/);
});
