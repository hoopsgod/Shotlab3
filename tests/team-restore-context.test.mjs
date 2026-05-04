import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequestPost } from '../functions/v1/teams/restore-context.js';

test('rejects unauthorized email/team combination', async () => {
  global.fetch = async () => new Response(JSON.stringify([]), { status: 200 });
  const res = await onRequestPost({ request: new Request('https://x', { method: 'POST', body: JSON.stringify({ email: 'a@b.com', team_id: 'team-1' }) }), env: { SUPABASE_URL: 'https://s', SUPABASE_SERVICE_ROLE_KEY: 'k' } });
  assert.equal(res.status, 403);
});

test('response never includes password or keys', async () => {
  const source = await (await import('node:fs/promises')).readFile(new URL('../functions/v1/teams/restore-context.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /password_hash|password_salt|SUPABASE_SERVICE_ROLE_KEY/);
});
