import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const centering = readFileSync(new URL('../public/shotlab-mobile-centering-reconciliation.css', import.meta.url), 'utf8');
const parityWorkflow = readFileSync(new URL('../.github/workflows/demo-paid-parity.yml', import.meta.url), 'utf8');

test('mobile centering authority clips the authenticated outer shell instead of allowing document panning', () => {
  assert.match(centering, /html,\s*\n\s*body,\s*\n\s*#root\s*\{[\s\S]*overflow-x:\s*clip/);
  assert.match(centering, /\.app-shell\.is-mobile[\s\S]*\.shell-main[\s\S]*\.content-wrap[\s\S]*\.performance-workspace[\s\S]*overflow-x:\s*clip/);
  assert.match(centering, /min-width:\s*0/);
  assert.match(centering, /max-width:\s*100%/);
});

test('Experience Parity executes the registered secondary-route viewport regression', () => {
  assert.match(parityWorkflow, /tests\/e2e\/registered-mobile-viewport-lock\.spec\.mjs/);
});
