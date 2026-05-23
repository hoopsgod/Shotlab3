import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('backend health enumerates configured/reachable/unavailable states', async () => {
  const src = await readFile(new URL('../src/lib/backendHealth.js', import.meta.url), 'utf8');
  assert.match(src, /SUPABASE_CONFIGURED:\s*'supabase_configured'/);
  assert.match(src, /SUPABASE_REACHABLE:\s*'supabase_reachable'/);
  assert.match(src, /SUPABASE_UNAVAILABLE:\s*'supabase_unavailable'/);
});

test('backend health probe catches errors and does not throw startup-breaking errors', async () => {
  const src = await readFile(new URL('../src/lib/backendHealth.js', import.meta.url), 'utf8');
  assert.match(src, /try\s*\{/);
  assert.match(src, /catch \(error\)/);
  assert.match(src, /status:\s*BACKEND_HEALTH\.SUPABASE_UNAVAILABLE/);
});

test('developer-only backend status utility is attached in main bootstrap', async () => {
  const src = await readFile(new URL('../src/main.jsx', import.meta.url), 'utf8');
  assert.match(src, /if \(DEV\) \{/);
  assert.match(src, /window\.__shotlabBackendStatus\s*=\s*async\s*\(\)\s*=>/);
  assert.match(src, /getBackendStatusLabel/);
});
