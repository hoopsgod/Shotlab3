import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const migration = readFileSync(new URL("../migrations/027_legacy_restore_invite_codegen.sql", import.meta.url), "utf8");

test("migration adds plaintext_code safely", () => {
  assert.match(migration, /add column if not exists plaintext_code text/i);
});

test("rpc persists code_hash, code_last4, plaintext_code and does not return code_last4", () => {
  assert.match(migration, /insert into public\.team_invites[\s\S]*code_hash[\s\S]*code_last4[\s\S]*plaintext_code/i);
  assert.match(migration, /return query select[\s\S]*plaintext_code/i);
});

test("migration applies rpc execute lockdown and schema reload", () => {
  assert.match(migration, /revoke all on function public\.ensure_team_invite_code_for_legacy_restore\(text, text\) from public;/i);
  assert.match(migration, /revoke all on function public\.ensure_team_invite_code_for_legacy_restore\(text, text\) from anon;/i);
  assert.match(migration, /revoke all on function public\.ensure_team_invite_code_for_legacy_restore\(text, text\) from authenticated;/i);
  assert.match(migration, /grant execute on function public\.ensure_team_invite_code_for_legacy_restore\(text, text\) to service_role;/i);
  assert.match(migration, /notify pgrst, 'reload schema';/i);
});
