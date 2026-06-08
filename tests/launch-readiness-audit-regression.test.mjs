import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const appSource = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');

test('auth screen can scroll on small mobile Safari viewports so auth and legal links stay reachable', () => {
  assert.match(appSource, /overflowY:\"auto\"/);
  assert.match(appSource, /WebkitOverflowScrolling:\"touch\"/);
  assert.match(appSource, /env\(safe-area-inset-bottom, 0px\)/);
  assert.match(appSource, /function Auth[\s\S]*?alignItems:\"flex-start\"[\s\S]*?overflowX:\"hidden\"[\s\S]*?overflowY:\"auto\"/);
});

test('legal and support links are sized as tappable controls and expose mail support', () => {
  assert.match(appSource, /aria-label=\"Legal and support links\"/);
  assert.match(appSource, /minHeight:36/);
  assert.match(appSource, /touchAction:\"manipulation\"/);
  assert.match(appSource, /const LEGAL_CONTACT_EMAIL=\"support@shotlab\.app\"/);
  assert.match(appSource, /mailto:\$\{LEGAL_CONTACT_EMAIL\}/);
  assert.match(appSource, />EMAIL SUPPORT</);
});

test('registration consent copy links terms and privacy without claiming all data is local-only', () => {
  assert.match(appSource, /href=\"\/terms\"/);
  assert.match(appSource, /href=\"\/privacy\"/);
  assert.match(appSource, /request account deletion or a data export/);
  assert.doesNotMatch(appSource, /All data is stored locally on your device/);
});
