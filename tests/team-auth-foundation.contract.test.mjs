import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { BACKEND_MODE, getBackendRuntime } from '../src/lib/backendConfig.js';
import { TEAM_AUTH_TABLES, TEAM_ROLE, TEAM_MEMBERSHIP_STATUS, createTeamAuthService } from '../src/lib/teamAuthFoundation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

test('team auth foundation exposes stable table + role constants', () => {
  assert.equal(TEAM_ROLE.COACH, 'coach');
  assert.equal(TEAM_ROLE.PLAYER, 'player');
  assert.equal(TEAM_MEMBERSHIP_STATUS.ACTIVE, 'active');
  assert.equal(TEAM_AUTH_TABLES.leaderboard_entries, 'leaderboard_entries');
});

test('backend runtime resolves to known mode', () => {
  const runtime = getBackendRuntime();
  assert.ok(Object.values(BACKEND_MODE).includes(runtime.mode));
  assert.equal(typeof runtime.supabaseEnabled, 'boolean');
  assert.equal(typeof runtime.demoFallback, 'boolean');
});

test('demo fallback service no-ops safely without backend/team data', async () => {
  const service = createTeamAuthService({ supabaseClient: null });
  assert.equal(service.runtime.demoFallback, true);

  const [teamRow, membersRes, joinCodeRes, shotLogRes, leaderboardRes] = await Promise.all([
    service.teams.getById(null),
    service.teamMembers.listByTeamId(undefined),
    service.joinCodes.consume(''),
    service.shotLogs.listByPlayerId(undefined),
    service.leaderboards.listByTeamId(undefined),
  ]);

  assert.equal(teamRow.error, null);
  assert.deepEqual(membersRes.data, []);
  assert.equal(joinCodeRes.error, null);
  assert.deepEqual(shotLogRes.data, []);
  assert.deepEqual(leaderboardRes.data, []);
});

test('startup is not hard-blocked by missing Supabase env', () => {
  const mainSource = fs.readFileSync(path.join(repoRoot, 'src/main.jsx'), 'utf8');
  assert.doesNotMatch(mainSource, /Missing Supabase configuration for this deployment\./);
  assert.match(mainSource, /demoBootstrap\(\)/);
  assert.match(mainSource, /ReactDOM\.createRoot\(rootEl\)\.render/);
});

test('UI components/screens do not directly depend on Supabase client', () => {
  const uiPaths = ['src/components', 'src/screens'];
  for (const rel of uiPaths) {
    const absolute = path.join(repoRoot, rel);
    const files = fs.readdirSync(absolute, { withFileTypes: true });
    const stack = files.map((entry) => path.join(absolute, entry.name));
    while (stack.length) {
      const next = stack.pop();
      const stat = fs.statSync(next);
      if (stat.isDirectory()) {
        for (const child of fs.readdirSync(next)) stack.push(path.join(next, child));
        continue;
      }
      if (!/\.(js|jsx|ts|tsx)$/.test(next)) continue;
      const src = fs.readFileSync(next, 'utf8');
      assert.doesNotMatch(src, /from\s+['\"]\.\/lib\/supabase\.js['\"]/);
      assert.doesNotMatch(src, /from\s+['\"]\.\.\/lib\/supabase\.js['\"]/);
    }
  }
});
