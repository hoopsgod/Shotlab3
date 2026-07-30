import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { STORAGE_KEYS, TABLE_MAP } from "../src/lib/appDataModels.js";

const migration = await readFile(new URL("../migrations/040_session_table_lockdown.sql", import.meta.url), "utf8");
const supabaseClient = await readFile(new URL("../src/lib/supabase.js", import.meta.url), "utf8");
const legacySession = await readFile(new URL("../functions/_utils/legacySession.js", import.meta.url), "utf8");

test("application session state remains local and is not mapped to public.sessions", () => {
  assert.equal(STORAGE_KEYS.sessions, "sl:session");
  assert.equal(TABLE_MAP[STORAGE_KEYS.sessions], undefined);
  assert.doesNotMatch(JSON.stringify(TABLE_MAP), /"sessions"/);
});

test("Supabase Auth continues using auth-managed browser tokens", () => {
  assert.match(supabaseClient, /const SESSION_KEY = "sl:supabase-session"/);
  assert.match(supabaseClient, /auth\/v1\/token\?grant_type=password/);
  assert.match(supabaseClient, /auth\/v1\/user/);
  assert.match(supabaseClient, /auth\/v1\/logout/);
});

test("legacy auth continues using the dedicated opaque session table", () => {
  assert.match(legacySession, /legacy_auth_sessions/);
  assert.match(legacySession, /HttpOnly/);
  assert.match(legacySession, /SameSite=Lax/);
  assert.doesNotMatch(legacySession, /public\.sessions/);
});

test("migration removes permissive browser access without deleting session rows", () => {
  assert.match(migration, /alter table public\.sessions enable row level security/i);
  assert.match(migration, /drop policy if exists "Allow all" on public\.sessions/i);
  assert.match(migration, /revoke all privileges on table public\.sessions from public, anon, authenticated/i);
  assert.match(migration, /grant select, insert, update, delete on table public\.sessions to service_role/i);
  assert.doesNotMatch(migration, /drop table|truncate table|delete from/i);
});
