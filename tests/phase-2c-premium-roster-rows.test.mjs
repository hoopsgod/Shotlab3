import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const system = readFileSync('src/components/SecondaryPageSystem.jsx', 'utf8');
const rosterLayer = readFileSync('src/styles/Phase2PremiumRosterLayer.css', 'utf8');
const closure = readFileSync('src/lib/phase1EvidenceClosure.js', 'utf8');

test('Phase 2C roster layer is retained as one dedicated production authority', () => {
  assert.match(system, /import "\.\.\/styles\/Phase2PremiumRosterLayer\.css\?roster-authority"/);
  assert.equal((system.match(/Phase2PremiumRosterLayer\.css/g) || []).length, 1);
  assert.match(rosterLayer, /#coach-roster-operations \.phase1RosterRow/);
});

test('Coach roster uses one flat editorial player surface', () => {
  assert.match(rosterLayer, /:is\(\.phase1RosterRow,\.coachRosterCard__body,\.coachRosterCard__details,\.coachRosterCard__identity,\.coachRosterCard__metrics,\.coachRosterCard__actions\)\{border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important\}/);
  assert.match(rosterLayer, /\.phase1RosterRow\{[^}]*min-height:92px!important[^}]*border-bottom:1px solid var\(--phase2c-line\)!important/s);
  for (const part of ['coachRosterCard__body','coachRosterCard__details','coachRosterCard__identity','coachRosterCard__metrics','coachRosterCard__actions']) {
    assert.match(rosterLayer, new RegExp(`\\.${part}\\{`));
  }
  assert.match(rosterLayer, /One row, one surface/);
});

test('Player identity is dominant and the row body behaves as the profile action', () => {
  assert.match(rosterLayer, /\[data-phase1-open-profile="true"\]\{[^}]*font:840 19px\/1\.04/s);
  assert.match(rosterLayer, /\[data-phase1-open-profile="true"\]::after\{content:"";position:absolute;z-index:1;inset:/);
  assert.match(rosterLayer, /span:last-child\{display:none\}/);
  assert.match(rosterLayer, /:focus-visible/);
});

test('Healthy status is quiet while exception status remains available', () => {
  assert.match(rosterLayer, /\.phase1RosterRow\[data-status="success"\] \[data-testid="semantic-roster-status"\]\{display:none!important\}/);
  assert.doesNotMatch(rosterLayer, /\.phase1RosterRow\[data-status="warning"\] \[data-testid="semantic-roster-status"\]\{display:none/);
  assert.doesNotMatch(rosterLayer, /\.phase1RosterRow\[data-status="danger"\] \[data-testid="semantic-roster-status"\]\{display:none/);
});

test('Roster utilities stay subordinate and accessible', () => {
  assert.match(rosterLayer, /\.coachRosterCard__actions button\{[^}]*min-width:44px!important[^}]*min-height:44px!important[^}]*background:transparent!important/s);
  assert.match(rosterLayer, /\.coachRosterCard__manageTrigger\{[^}]*transform:rotate\(90deg\)/s);
  assert.match(rosterLayer, /\.coachRosterCard__remove:is\(:hover,:focus-visible\)/);
  assert.match(rosterLayer, /outline:3px solid/);
  assert.match(rosterLayer, /@media\(prefers-reduced-motion:reduce\)/);
  assert.doesNotMatch(rosterLayer, /pointer-events:\s*none/);
});

test('Mobile geometry preserves density and long-name width', () => {
  assert.match(rosterLayer, /@media\(max-width:620px\)/);
  assert.match(rosterLayer, /\.phase1RosterRow\{[^}]*min-height:92px!important/s);
  assert.match(rosterLayer, /grid-template-columns:38px minmax\(0,1fr\) 44px!important/);
  assert.match(rosterLayer, /text-overflow:ellipsis;white-space:nowrap/);
  assert.match(rosterLayer, /@media\(max-width:360px\)/);
});

test('Phase 1 closure preserves semantics without injecting roster presentation CSS', () => {
  assert.match(closure, /classList\.add\("phase1RosterRow"\)/);
  assert.match(closure, /removeAttribute\("role"\)/);
  assert.match(closure, /data-phase1-open-profile/);
  assert.doesNotMatch(closure, /coachRosterCard__body/);
});

test('Phase 2C stays scoped to coach roster presentation', () => {
  assert.match(rosterLayer, /\.performance-shell--coach #coach-roster-operations/);
});
