import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const migration = fs.readFileSync(new URL('../migrations/030_scores_program_drill_identity.sql', import.meta.url), 'utf8');

test('scores program drill identity migration makes drill_id text-compatible for stable Program keys', () => {
  assert.match(migration, /to_regclass\('public\.scores'\) is null/i);
  assert.match(migration, /alter column drill_id type text using drill_id::text/i);
  assert.match(migration, /add column drill_id text/i);
  assert.match(migration, /drop constraint if exists/i);
});

test('scores program drill identity migration preserves src filtering and reloads PostgREST schema', () => {
  assert.match(migration, /alter column src type text using coalesce\(src::text, 'home'\)/i);
  assert.match(migration, /add column src text default 'home'/i);
  assert.match(migration, /update public\.scores set src = 'home' where src is null/i);
  assert.match(migration, /scores_team_src_drill_idx/i);
  assert.match(migration, /notify pgrst, 'reload schema'/i);
});
