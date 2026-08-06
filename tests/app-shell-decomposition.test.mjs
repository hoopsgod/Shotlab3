import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const appSource = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const authSource = readFileSync(new URL('../src/components/AuthWorkspace.jsx', import.meta.url), 'utf8');
const brandSource = readFileSync(new URL('../src/components/ShotLabBrand.jsx', import.meta.url), 'utf8');
const legacyStyleSource = readFileSync(new URL('../src/styles/appLegacyStyles.js', import.meta.url), 'utf8');
const legacyStyleRuntimeSource = readFileSync(new URL('../src/styles/appLegacyStylesRuntime.js', import.meta.url), 'utf8');
const viteConfigSource = readFileSync(new URL('../vite.config.js', import.meta.url), 'utf8');

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
  assert.match(authSource, /const \{BG,DEMO_COACH,DEMO_PLAYER,DrillIcon,LegalSupportLinks,SLLogo\}=runtime/);
  assert.match(authSource, /const doDemo=async\(kind="player"\)/);
  assert.match(authSource, /const demo=await onDemo\(kind\)/);
  assert.match(authSource, />Player demo<\/button>/);
  assert.match(authSource, />Coach demo<\/button>/);
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

test('legacy style payload hydrates every extracted runtime token before browser evaluation', () => {
  assert.match(viteConfigSource, /STATIC_LEGACY_STYLE_IMPORT = '\.\/styles\/appLegacyStyles\.js'/);
  assert.match(viteConfigSource, /LEGACY_STYLE_RUNTIME_MODULE/);
  assert.match(viteConfigSource, /function hydrateLegacyStyles\(\)/);
  assert.match(viteConfigSource, /hydrateLegacyStyles\(\)/);
  assert.match(legacyStyleRuntimeSource, /import TOKENS from "\.\.\/theme\/appTokens"/);
  assert.match(legacyStyleRuntimeSource, /import legacyStyleModuleSource from "\.\/appLegacyStyles\.js\?raw"/);
  assert.match(legacyStyleRuntimeSource, /unresolvedTokens/);

  const interpolationNames = [...new Set(
    [...legacyStyleSource.matchAll(/\$\{([A-Z_]+)\}/g)].map(([, name]) => name),
  )].sort();
  const expectedRuntimeNames = ['BG', 'BORDER_CLR', 'CYAN', 'FB', 'FD', 'ORANGE', 'VOLT'].sort();

  assert.deepEqual(interpolationNames, expectedRuntimeNames);
  for (const runtimeName of expectedRuntimeNames) {
    assert.match(
      legacyStyleRuntimeSource,
      new RegExp(`\\b${runtimeName}:`),
      `Expected ${runtimeName} to be explicitly bound in the legacy style runtime`,
    );
  }
});
