import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const appSource = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const authSource = readFileSync(new URL('../src/components/AuthWorkspace.jsx', import.meta.url), 'utf8');
const brandSource = readFileSync(new URL('../src/components/ShotLabBrand.jsx', import.meta.url), 'utf8');
const legacyStyleSource = readFileSync(new URL('../src/styles/appLegacyStyles.js', import.meta.url), 'utf8');

const appBytes = Buffer.byteLength(appSource);

test('App shell stays below Babel code-generation deoptimization threshold', () => {
  assert.ok(appBytes < 500_000, `App.jsx is ${appBytes} bytes; expected less than 500,000`);
  assert.match(appSource, /import Auth from "\.\/components\/AuthWorkspace\.jsx"/);
  assert.match(appSource, /AUTH_WORKSPACE_RUNTIME=Object\.freeze/);
  assert.match(appSource, /<Auth runtime=\{AUTH_WORKSPACE_RUNTIME\}/);
  assert.doesNotMatch(appSource, /function Auth\(/);
});

test('authentication remains a complete route workspace with preserved demo and legal entry contracts', () => {
  assert.match(authSource, /export default function Auth/);
  assert.match(authSource, /const \{BG,BORDER_CLR,CARD_BG,CourtBG,DEMO_COACH,DEMO_PLAYER/);
  assert.match(authSource, /Demo Player/);
  assert.match(authSource, /Demo Coach/);
  assert.match(authSource, /href="\/terms"/);
  assert.match(authSource, /href="\/privacy"/);
});

test('embedded brand asset and legacy style payload no longer inflate App source', () => {
  assert.match(brandSource, /export function SLLogo/);
  assert.match(brandSource, /data:image\/png;base64/);
  assert.match(brandSource, /export function BrandWordmark/);
  assert.match(brandSource, /export function BrandBackdrop/);
  assert.doesNotMatch(appSource, /data:image\/png;base64/);

  for (const exportName of [
    '_STYLES_CSS',
    '_PAGE_SIGNATURE_CSS',
    '_DESKTOP_SHELL_CSS',
    '_PLAYER_COMPACT_DASHBOARD_CSS',
  ]) {
    assert.match(legacyStyleSource, new RegExp(`export const ${exportName}`));
    assert.match(appSource, new RegExp(exportName));
  }
});
