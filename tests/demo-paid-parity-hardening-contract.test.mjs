import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const runtimeSpec = await readFile(new URL('./e2e/demo-paid-parity.spec.mjs', import.meta.url), 'utf8');
const workflow = await readFile(new URL('../.github/workflows/demo-paid-parity.yml', import.meta.url), 'utf8');
const contract = await readFile(new URL('../docs/demo-registered-parity-contract.md', import.meta.url), 'utf8');

test('parity runtime compares matched data across the complete shared navigation matrix', () => {
  assert.match(runtimeSpec, /buildDemoDataBundle/);
  assert.match(runtimeSpec, /const REQUIRED_NAV_KEYS/);
  assert.match(runtimeSpec, /collectNavigationKeys/);
  assert.match(runtimeSpec, /visualFingerprint/);
  assert.match(runtimeSpec, /for \(const key of paidKeys\)/);
  assert.match(runtimeSpec, /coach-page-dashboard-leaderboards/);
  assert.match(runtimeSpec, /team-store/);
  assert.match(runtimeSpec, /coach-branding-workspace/);
  assert.match(runtimeSpec, /expectPhoneSafe/);
  assert.match(runtimeSpec, /parity-evidence\/\$\{role\}-\$\{safeKey\}-paid\.png/);
  assert.match(runtimeSpec, /parity-evidence\/\$\{role\}-\$\{safeKey\}-demo\.png/);
});

test('parity workflow certifies the exact built production bundle', () => {
  assert.match(workflow, /Build exact production bundle/);
  assert.match(workflow, /npm run build/);
  assert.match(workflow, /Start exact built production preview/);
  assert.match(workflow, /npm run preview:agent/);
  assert.match(workflow, /ACCEPTANCE_BASE_URL: http:\/\/127\.0\.0\.1:4173/);
  assert.doesNotMatch(workflow, /run:\s+npm run dev/);
});

test('written parity contract requires one production UI and matched-state visual certification', () => {
  assert.match(contract, /matched canonical product data/);
  assert.match(contract, /complete mobile navigation matrix/);
  assert.match(contract, /exact built production bundle/);
  assert.match(contract, /never copy a visual change into a separate demo implementation/);
});
