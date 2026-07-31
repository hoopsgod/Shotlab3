import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const workflow = fs.readFileSync('.github/workflows/team-store-production-smoke.yml', 'utf8');

const requiredMarkers = [
  'name: Team Store Production Smoke',
  'node --test tests/team-store-phase-1-contract.test.mjs',
  'npm run build',
  'https://shotlab3.pages.dev',
  'id="team-store-root"',
  'SHOTLAB COMMERCE',
  'ShotLab may earn a commission',
  'PUBLISH STORE',
  'SHOP TEAM STORE',
];

test('Team Store production smoke workflow protects build and live deployment', () => {
  for (const marker of requiredMarkers) {
    assert.match(workflow, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('production probe is limited to post-merge or manual runs', () => {
  assert.match(workflow, /if: github\.event_name == 'push' \|\| github\.event_name == 'workflow_dispatch'/);
  assert.match(workflow, /needs: contract-and-build/);
});
