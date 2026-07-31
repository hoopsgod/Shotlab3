import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const workflow = fs.readFileSync('.github/workflows/team-store-production-smoke.yml', 'utf8');

for (const marker of [
  'name: Team Store Production Smoke',
  'node --test tests/team-store-phase-1-contract.test.mjs tests/team-store-production-smoke-contract.test.mjs',
  'npm run build',
  'https://shotlab3.pages.dev',
  'id="team-store-root"',
  'SHOTLAB COMMERCE',
  'ShotLab may earn a commission',
  'PUBLISH STORE',
  'SHOP TEAM STORE',
]) {
  test(`production smoke workflow includes ${marker}`, () => {
    assert.ok(workflow.includes(marker));
  });
}

test('live production probe runs only after merge or manual dispatch', () => {
  assert.match(workflow, /if: github\.event_name == 'push' \|\| github\.event_name == 'workflow_dispatch'/);
  assert.match(workflow, /needs: contract-and-build/);
});
