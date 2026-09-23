import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const system = readFileSync('src/components/SecondaryPageSystem.jsx', 'utf8');
const rosterLayer = readFileSync('src/styles/Phase2PremiumRosterLayer.css', 'utf8');
const closure = readFileSync('src/lib/phase1EvidenceClosure.js', 'utf8');

test('Phase 2C roster layer is retained as one dedicated production authority', () => {
  assert.match(system, /import "\.\.\/styles\/Phase2PremiumRosterLayer\.css\?roster-authority"/);
  assert.equal((system.match(/Phase2PremiumRosterLayer\.css/g) || []).length, 1);
  assert.match(rosterLayer, /#coach-roster-operations > \.fade-up > \.phase1RosterRow/);
});

test('Coach roster uses a flat editorial row instead of nested card chrome', () => {
  assert.match(rosterLayer, /\.phase1RosterRow\.coachRosterCard\{[^}]*min-height:82px[^}]*border-radius:0!important[^}]*background:transparent!important[^}]*box-shadow:none!important/s);
  for (const part of ['coachRosterCard__body','coachRosterCard__details','coachRosterCard__identity','coachRosterCard__metrics','coachRosterCard__actions']) {
    assert.match(rosterLayer, new RegExp(`\\.${part}\\{[^}]*border:0!important[^}]*border-radius:0!important[^}]*background:transparent!important[^}]*box-shadow:none!important`, 's'));
  }
  assert.match(rosterLayer, /One row, one surface/);
});

test('Coach roster mobile geometry gives player identity the width and moves utilities below', () => {
  assert.match(rosterLayer, /@media\(max-width:620px\)/);
  assert.match(rosterLayer, /\.phase1RosterRow\.coachRosterCard \.coachRosterCard__body\{grid-template-columns:36px minmax\(0,1fr\)!important;grid-template-areas:"avatar details" "\. actions"!important/);
  assert.match(rosterLayer, /\.phase1RosterRow\.coachRosterCard \.coachRosterCard__details\{grid-area:details!important/);
  assert.match(rosterLayer, /\.phase1RosterRow\.coachRosterCard \.coachRosterCard__actions\{grid-area:actions!important;flex-direction:row!important/);
  assert.match(rosterLayer, /font-size:16px!important/);
});

test('Roster utilities are visually secondary but remain touch and keyboard usable', () => {
  assert.match(rosterLayer, /\.coachRosterCard__actions button\{[^}]*min-height:36px!important[^}]*background:transparent!important/s);
  assert.match(rosterLayer, /\.coachRosterCard__remove:is\(:hover,:focus-visible\)/);
  assert.match(rosterLayer, /:focus-visible/);
  assert.match(rosterLayer, /outline:3px solid/);
  assert.match(rosterLayer, /@media\(prefers-reduced-motion:reduce\)/);
  assert.doesNotMatch(rosterLayer, /pointer-events:\s*none/);
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
