import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const system = readFileSync('src/components/SecondaryPageSystem.jsx', 'utf8');
const rosterLayer = readFileSync('src/styles/Phase2PremiumRosterLayer.css', 'utf8');
const closure = readFileSync('src/lib/phase1EvidenceClosure.js', 'utf8');

test('Phase 2C roster layer is loaded through the shared secondary-page bundle', () => {
  assert.match(system, /import "\.\.\/styles\/Phase2PremiumRosterLayer\.css"/);
  assert.match(rosterLayer, /#coach-roster-operations > \.fade-up > \.phase1RosterRow/);
});

test('Coach roster uses a flat editorial row instead of nested card chrome', () => {
  assert.match(rosterLayer, /\.phase1RosterRow\.coachRosterCard\s*\{[^}]*min-height:82px[^}]*border-radius:0[^}]*background:transparent[^}]*box-shadow:none/s);
  assert.match(rosterLayer, /\.coachRosterCard__profile,[\s\S]*\[data-phase1-open-profile="true"\][\s\S]*border:0!important;[\s\S]*background:transparent!important;/);
  assert.match(rosterLayer, /One row, one surface/);
});

test('Coach roster mobile geometry gives player identity the width and moves utilities below', () => {
  assert.match(rosterLayer, /@media\s*\(max-width:620px\)/);
  assert.match(rosterLayer, /grid-template-areas:\s*"avatar details"\s*"\. actions"/);
  assert.match(rosterLayer, /grid-area:details/);
  assert.match(rosterLayer, /grid-area:actions/);
  assert.match(rosterLayer, /font-size:16px!important/);
});

test('Phase 2C removes only duplicate legacy recap scaffolding and keeps working rows visible', () => {
  assert.match(rosterLayer, /div:nth-of-type\(1\):not\(\.fade-up\),/);
  assert.match(rosterLayer, /div:nth-of-type\(2\):not\(\.fade-up\)\s*\{\s*display:none!important;/);
  assert.match(rosterLayer, /header:first-child/);
  assert.doesNotMatch(rosterLayer, /\.phase1RosterRow[^{]*\{[^}]*display:\s*none/s);
  assert.doesNotMatch(rosterLayer, /visibility:\s*hidden/);
});

test('Roster tools retain phone-safe controls and explicit focus treatment', () => {
  assert.match(rosterLayer, /div:nth-of-type\(3\) select/);
  assert.match(rosterLayer, /min-height:44px!important/);
  assert.match(rosterLayer, /min-width:178px!important/);
  assert.match(closure, /classList\.add\("phase1RosterRow"\)/);
  assert.match(closure, /removeAttribute\("role"\)/);
  assert.match(closure, /data-phase1-open-profile/);
  assert.match(rosterLayer, /:focus-visible/);
  assert.match(rosterLayer, /outline:3px solid/);
  assert.match(rosterLayer, /@media\s*\(prefers-reduced-motion:reduce\)/);
  assert.doesNotMatch(rosterLayer, /pointer-events:\s*none/);
});

test('Phase 2C stays scoped to coach roster presentation', () => {
  assert.match(rosterLayer, /\.performance-shell--coach #coach-roster-operations/);
});
