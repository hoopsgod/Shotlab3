import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  LEGACY_SESSION_COOKIE,
  buildLegacySessionClearCookie,
  buildLegacySessionCookie,
  hashLegacySessionToken,
  parseCookieHeader,
  readAuthenticatedIdentity,
  readSupabaseBearerIdentity,
} from "../functions/_utils/legacySession.js";
import { hashLegacyPassword } from "../functions/v1/legacy-auth/_password.js";
import { onRequestPost as loginPost } from "../functions/v1/legacy-auth/login/index.js";
import { onRequestPost as restorePost } from "../functions/v1/legacy-auth/restore/index.js";
import { onRequestPost as logoutPost } from "../functions/v1/legacy-auth/logout/index.js";
import { onRequestGet as prioritiesGet } from "../functions/v1/team-priorities/index.js";
import { onRequestGet as followUpsGet } from "../functions/v1/coach-follow-ups/index.js";
import { buildApiIdentityHeaders, readSupabaseAccessToken } from "../src/lib/apiIdentityHeaders.js";

const ENV = {
  SUPABASE_URL: "https://project.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-test-key",
  SUPABASE_ANON_KEY: "anon-test-key",
};

const PROFILE = {
  email: "coach@example.com",
  name: "Coach Example",
  role: "coach",
  team_id: "team-a",
  hide_from_leaderboards: false,
};

const memoryStorage = (seed = {}) => {
  const values = new Map(Object.entries(seed).map(([key, value]) => [key, typeof value === "string" ? value : JSON.stringify(value)]));
  return {
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, String(value)),
  };
};

async function withFetch(mock, run) {
  const original = globalThis.fetch;
  globalThis.fetch = mock;
  try { return await run(); } finally { globalThis.fetch = original; }
}

test("legacy session cookies are opaque, HttpOnly, same-site, and secure on HTTPS", async () => {
  const request = new Request("https://shotlab3.pages.dev/v1/legacy-auth/login");
  const rawToken = "raw-session-token-value";
  const cookie = buildLegacySessionCookie(rawToken, request, { maxAge: 600 });
  const clearCookie = buildLegacySessionClearCookie(request);
  const digest = await hashLegacySessionToken(rawToken);

  assert.match(cookie, new RegExp(`^${LEGACY_SESSION_COOKIE}=${rawToken};`));
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Lax/);
  assert.match(cookie, /Secure/);
  assert.match(cookie, /Max-Age=600/);
  assert.doesNotMatch(cookie, /Domain=/i);
  assert.equal(digest.length, 64);
  assert.notEqual(digest, rawToken);
  assert.match(clearCookie, /Max-Age=0/);
  assert.equal(parseCookieHeader(`${LEGACY_SESSION_COOKIE}=${rawToken}; other=value`).get(LEGACY_SESSION_COOKIE), rawToken);
});

test("production email headers are not identity proof, while explicit test and demo contexts remain supported", async () => {
  const production = await readAuthenticatedIdentity({
    env: ENV,
    request: new Request("https://shotlab3.pages.dev/v1/team-priorities", { headers: { "x-user-id": "coach@example.com" } }),
  });
  assert.equal(production.source, "unauthenticated");
  assert.equal(production.identity, "");

  const development = await readAuthenticatedIdentity({
    env: ENV,
    request: new Request("https://shotlab.test/v1/team-priorities", { headers: { "x-user-id": "coach@example.com" } }),
  });
  assert.equal(development.source, "development_header");
  assert.equal(development.identity, "coach@example.com");

  const demo = await readAuthenticatedIdentity({
    env: ENV,
    request: new Request("https://shotlab3.pages.dev/v1/team-priorities", { headers: { "x-user-id": "coach.demo@shotlab.app" } }),
    allowDemo: true,
  });
  assert.equal(demo.source, "demo_header");
});

test("Supabase bearer tokens are validated against the configured auth service", async () => {
  let authRequest = null;
  const result = await readSupabaseBearerIdentity({
    env: ENV,
    request: new Request("https://shotlab3.pages.dev/v1/team-priorities", { headers: { Authorization: "Bearer signed-user-token" } }),
    fetchImpl: async (url, options) => {
      authRequest = { url, options };
      return new Response(JSON.stringify({ id: "user-1", email: "SUPABASE@EXAMPLE.COM" }), { status: 200, headers: { "Content-Type": "application/json" } });
    },
  });
  assert.equal(result.userEmail, "supabase@example.com");
  assert.equal(authRequest.url, "https://project.supabase.co/auth/v1/user");
  assert.equal(authRequest.options.headers.Authorization, "Bearer signed-user-token");
  assert.equal(authRequest.options.headers.apikey, ENV.SUPABASE_ANON_KEY);
});

test("API clients send Supabase bearer context while retaining demo/test identity headers", () => {
  const storage = memoryStorage({
    "sl:supabase-session": { access_token: "stored-access-token" },
  });
  assert.equal(readSupabaseAccessToken(storage), "stored-access-token");
  const headers = buildApiIdentityHeaders({ requester: "Coach@Example.com", storage, headers: { "Content-Type": "application/json" } });
  assert.equal(headers.Authorization, "Bearer stored-access-token");
  assert.equal(headers["x-user-id"], "coach@example.com");
  assert.equal(headers["Content-Type"], "application/json");
});

test("successful legacy login stores only the token hash and issues an HttpOnly cookie", async () => {
  const salt = "00112233445566778899aabbccddeeff";
  const passwordHash = await hashLegacyPassword("correct-password", salt);
  let insertedSession = null;

  const response = await withFetch(async (url, options = {}) => {
    const target = String(url);
    if (target.includes("/rest/v1/legacy_auth_profiles")) {
      return new Response(JSON.stringify([{ ...PROFILE, password_hash: passwordHash, password_salt: salt }]), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    if (target.includes("/rest/v1/legacy_auth_sessions") && options.method === "POST") {
      insertedSession = JSON.parse(options.body)[0];
      return new Response(JSON.stringify([insertedSession]), { status: 201, headers: { "Content-Type": "application/json" } });
    }
    throw new Error(`Unexpected fetch: ${target}`);
  }, () => loginPost({
    env: ENV,
    request: new Request("https://shotlab3.pages.dev/v1/legacy-auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: PROFILE.email, password: "correct-password" }),
    }),
  }));

  assert.equal(response.status, 200);
  const cookie = response.headers.get("set-cookie");
  const payload = await response.json();
  assert.match(cookie, /^sl_legacy_session=/);
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /Secure/);
  assert.equal(insertedSession.user_email, PROFILE.email);
  assert.equal(insertedSession.token_hash.length, 64);
  assert.equal(Object.prototype.hasOwnProperty.call(insertedSession, "token"), false);
  assert.equal(payload.profile.email, PROFILE.email);
  assert.equal(Object.prototype.hasOwnProperty.call(payload, "token"), false);
});

test("restore ignores a spoofed body email and trusts only the server session cookie", async () => {
  const rawToken = "restore-session-token";
  const tokenHash = await hashLegacySessionToken(rawToken);
  const expiresAt = new Date(Date.now() + 86_400_000).toISOString();

  const response = await withFetch(async (url) => {
    const target = String(url);
    if (target.includes("/rest/v1/legacy_auth_sessions")) {
      return new Response(JSON.stringify([{
        token_hash: tokenHash,
        user_email: PROFILE.email,
        user_role: PROFILE.role,
        team_id: PROFILE.team_id,
        created_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString(),
        expires_at: expiresAt,
        revoked_at: null,
      }]), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    if (target.includes("/rest/v1/legacy_auth_profiles")) {
      return new Response(JSON.stringify([PROFILE]), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    throw new Error(`Unexpected fetch: ${target}`);
  }, () => restorePost({
    env: ENV,
    request: new Request("https://shotlab3.pages.dev/v1/legacy-auth/restore", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: `${LEGACY_SESSION_COOKIE}=${rawToken}` },
      body: JSON.stringify({ email: "attacker@example.com" }),
    }),
  }));

  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.profile.email, PROFILE.email);
  assert.notEqual(payload.profile.email, "attacker@example.com");
});

test("restore rejects body-email-only impersonation", async () => {
  const response = await restorePost({
    env: ENV,
    request: new Request("https://shotlab3.pages.dev/v1/legacy-auth/restore", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: PROFILE.email }),
    }),
  });
  assert.equal(response.status, 401);
  assert.equal((await response.json()).error, "session_required");
  assert.match(response.headers.get("set-cookie"), /Max-Age=0/);
});

test("logout revokes the stored hash and clears the browser cookie", async () => {
  const rawToken = "logout-session-token";
  let patch = null;
  const response = await withFetch(async (url, options = {}) => {
    const target = String(url);
    assert.match(target, /legacy_auth_sessions/);
    patch = { method: options.method, body: JSON.parse(options.body), target };
    return new Response(JSON.stringify([]), { status: 200, headers: { "Content-Type": "application/json" } });
  }, () => logoutPost({
    env: ENV,
    request: new Request("https://shotlab3.pages.dev/v1/legacy-auth/logout", {
      method: "POST",
      headers: { Cookie: `${LEGACY_SESSION_COOKIE}=${rawToken}` },
    }),
  }));

  assert.equal(response.status, 200);
  assert.equal(patch.method, "PATCH");
  assert.ok(patch.body.revoked_at);
  assert.match(response.headers.get("set-cookie"), /Max-Age=0/);
  assert.match(response.headers.get("set-cookie"), /HttpOnly/);
});

test("production coach APIs reject caller-supplied email headers without a validated session", async () => {
  const request = new Request("https://shotlab3.pages.dev/v1/team-priorities", { headers: { "x-user-id": "coach@example.com" } });
  const priorityResponse = await prioritiesGet({ request, env: ENV });
  assert.equal(priorityResponse.status, 401);

  const followUpResponse = await followUpsGet({
    request: new Request("https://shotlab3.pages.dev/v1/coach-follow-ups?team_id=team-a", { headers: { "x-user-id": "coach@example.com" } }),
    env: ENV,
  });
  assert.equal(followUpResponse.status, 401);
});

test("session storage migration and logout client hook are release-gated", () => {
  const migration = fs.readFileSync(new URL("../migrations/038_legacy_auth_sessions.sql", import.meta.url), "utf8");
  const analytics = fs.readFileSync(new URL("../src/lib/analytics.js", import.meta.url), "utf8");
  const restore = fs.readFileSync(new URL("../functions/v1/legacy-auth/restore/index.js", import.meta.url), "utf8");
  assert.match(migration, /create table if not exists public\.legacy_auth_sessions/i);
  assert.match(migration, /enable row level security/i);
  assert.match(migration, /revoke all on table public\.legacy_auth_sessions from anon/i);
  assert.match(migration, /revoke all on table public\.legacy_auth_sessions from authenticated/i);
  assert.match(migration, /grant select, insert, update, delete on table public\.legacy_auth_sessions to service_role/i);
  assert.match(analytics, /type === "auth_logout"/);
  assert.match(analytics, /\/v1\/legacy-auth\/logout/);
  assert.match(analytics, /keepalive:\s*true/);
  assert.match(restore, /readLegacySession/);
  assert.doesNotMatch(restore, /email=eq\.\$\{encodeURIComponent\(email\)\}/);
});
