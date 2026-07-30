import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { installApiIdentityFetchBridge } from "../src/lib/apiFetchBridge.js";
import { createShotLogPersistenceService } from "../src/lib/shotLogPersistenceService.js";
import { onRequest as homeShotsMiddleware } from "../functions/v1/home-shots/_middleware.js";
import { onRequestGet as getShotLogs } from "../functions/v1/shot-logs/index.js";

const ENV = {
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
  SUPABASE_ANON_KEY: "anon-key",
};

const SHOT_LOG = {
  id: "shot-1",
  email: "player@example.com",
  player_id: "player@example.com",
  team_id: "team-a",
  name: "Player One",
  made: 42,
  date: "2026-07-30",
  ts: "2026-07-30T15:00:00.000Z",
  attempted_shots: 50,
  drill_id: "form-shooting",
  session_id: "session-1",
  created_at: "2026-07-30T15:00:00.000Z",
};

const filterValue = (value) => String(value || "").replace(/^eq\./, "");

function memoryStorage(entries = []) {
  const values = new Map(entries);
  return {
    getItem(key) { return values.get(key) || null; },
    setItem(key, value) { values.set(key, String(value)); },
  };
}

function postRequest({ host = "shotlab.test", identity = "player@example.com", bearer = "", body = {} } = {}) {
  const headers = { "content-type": "application/json", "x-user-id": identity };
  if (bearer) headers.Authorization = `Bearer ${bearer}`;
  return new Request(`https://${host}/v1/home-shots/log`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

async function runMiddleware(request, env = ENV) {
  const context = {
    request,
    env,
    data: {},
    next: () => Response.json({ ok: true, data: context.data }),
  };
  return homeShotsMiddleware(context);
}

function installBackendMock({ role = "player", teamId = "team-a", shotLogs = [SHOT_LOG] } = {}) {
  const originalFetch = global.fetch;
  const calls = [];
  global.fetch = async (input, init = {}) => {
    const url = new URL(String(input));
    const method = String(init.method || "GET");
    calls.push({ url: url.toString(), method, headers: init.headers || {} });

    if (url.pathname.endsWith("/rpc/resolve_app_user_uuid")) return Response.json("uuid-player");
    if (url.pathname.endsWith("/legacy_auth_profiles")) return Response.json([{ team_id: teamId, role }]);
    if (url.pathname.endsWith("/team_memberships")) return Response.json([{ team_id: teamId, role, status: "active" }]);
    if (url.pathname.endsWith("/teams")) return Response.json(role === "coach" ? [{ id: teamId, coach_user_id: "uuid-player" }] : []);
    if (url.pathname.endsWith("/shot_logs")) {
      const requestedTeam = filterValue(url.searchParams.get("team_id"));
      return Response.json(shotLogs.filter((row) => !requestedTeam || row.team_id === requestedTeam));
    }
    return Response.json([]);
  };
  return { calls, restore: () => { global.fetch = originalFetch; } };
}

test("same-origin API bridge adds bearer and requester only to ShotLab API calls", async () => {
  const calls = [];
  const storage = memoryStorage([
    ["sl:session", JSON.stringify({ email: "player@example.com" })],
    ["sl:supabase-session", JSON.stringify({ access_token: "user-token" })],
  ]);
  const target = {
    location: { origin: "https://app.shotlab.com" },
    localStorage: storage,
    fetch: async (input, init = {}) => {
      calls.push({ input: String(input), init });
      return Response.json({ ok: true });
    },
  };

  installApiIdentityFetchBridge(target);
  await target.fetch("/v1/home-shots/log", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  await target.fetch("https://example.supabase.co/auth/v1/user", {
    headers: { apikey: "anon-key" },
  });

  const apiHeaders = new Headers(calls[0].init.headers);
  assert.equal(apiHeaders.get("Authorization"), "Bearer user-token");
  assert.equal(apiHeaders.get("x-user-id"), "player@example.com");
  const externalHeaders = new Headers(calls[1].init.headers);
  assert.equal(externalHeaders.get("Authorization"), null);
  assert.equal(externalHeaders.get("x-user-id"), null);
});

test("production home-shot write rejects email-header spoofing without a verified session", async () => {
  const response = await runMiddleware(postRequest({
    host: "app.shotlab.com",
    body: { player_id: "player@example.com", email: "player@example.com" },
  }));
  assert.equal(response.status, 401);
  assert.equal((await response.json()).error, "missing_user_identity");
});

test("verified Supabase bearer authorizes matching home-shot identity", async () => {
  const originalFetch = global.fetch;
  global.fetch = async (input) => {
    const url = new URL(String(input));
    if (url.pathname.endsWith("/auth/v1/user")) return Response.json({ id: "uuid-player", email: "player@example.com" });
    return Response.json([]);
  };
  try {
    const response = await runMiddleware(postRequest({
      host: "app.shotlab.com",
      bearer: "user-token",
      body: { player_id: "player@example.com", email: "player@example.com" },
    }));
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.data.verifiedRequester, "player@example.com");
    assert.equal(body.data.verifiedRequesterSource, "supabase_bearer");
  } finally {
    global.fetch = originalFetch;
  }
});

test("verified bearer cannot submit a different header or player identity", async () => {
  const originalFetch = global.fetch;
  global.fetch = async (input) => {
    const url = new URL(String(input));
    if (url.pathname.endsWith("/auth/v1/user")) return Response.json({ id: "uuid-player", email: "player@example.com" });
    return Response.json([]);
  };
  try {
    const response = await runMiddleware(postRequest({
      host: "app.shotlab.com",
      identity: "other@example.com",
      bearer: "user-token",
      body: { player_id: "other@example.com", email: "other@example.com" },
    }));
    assert.equal(response.status, 403);
    assert.equal((await response.json()).error, "identity_mismatch");
  } finally {
    global.fetch = originalFetch;
  }
});

test("signed shot-log read route returns only readable team rows", async () => {
  const backend = installBackendMock({
    shotLogs: [SHOT_LOG, { ...SHOT_LOG, id: "shot-b", team_id: "team-b" }],
  });
  try {
    const allowed = await getShotLogs({
      request: new Request("https://shotlab.test/v1/shot-logs?team_id=team-a", { headers: { "x-user-id": "player@example.com" } }),
      env: ENV,
    });
    assert.equal(allowed.status, 200);
    assert.deepEqual((await allowed.json()).shot_logs.map((row) => row.id), ["shot-1"]);

    const forbidden = await getShotLogs({
      request: new Request("https://shotlab.test/v1/shot-logs?team_id=team-b", { headers: { "x-user-id": "player@example.com" } }),
      env: ENV,
    });
    assert.equal(forbidden.status, 403);
  } finally {
    backend.restore();
  }
});

test("shot-log browser service uses signed API rather than direct table REST", async () => {
  const calls = [];
  const storage = memoryStorage([
    ["sl:session", JSON.stringify({ email: "player@example.com" })],
    ["sl:supabase-session", JSON.stringify({ access_token: "user-token" })],
  ]);
  const service = createShotLogPersistenceService({
    storage,
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return Response.json({ ok: true, storage_mode: "signed_api", shot_logs: [SHOT_LOG] });
    },
  });

  const result = await service.loadShotLogs({ teamId: "team-a" });
  assert.equal(result.shotLogs[0].id, "shot-1");
  assert.equal(calls[0].url, "/v1/shot-logs?team_id=team-a");
  assert.equal(calls[0].options.headers.Authorization, "Bearer user-token");
  assert.equal(calls[0].options.headers["x-user-id"], "player@example.com");
  assert.doesNotMatch(calls[0].url, /rest\/v1\/shot_logs/);
});

test("generic shot-log adapter reads through API and skips duplicate writes", () => {
  const adapter = fs.readFileSync(new URL("../src/lib/supabase.js", import.meta.url), "utf8");
  assert.match(adapter, /if \(table === "shot_logs"\) return shotLogApiRequest/);
  assert.match(adapter, /shotLogPersistence\.loadShotLogs/);
  assert.match(adapter, /skipped: "dedicated_home_shot_api"/);
  assert.doesNotMatch(adapter, /rest\/v1\/shot_logs/);
});

test("shot_logs migration removes public policy and browser table privileges", () => {
  const migration = fs.readFileSync(new URL("../migrations/042_shot_logs_signed_api_boundary.sql", import.meta.url), "utf8");
  assert.match(migration, /drop policy if exists "Allow all" on public\.shot_logs/i);
  assert.match(migration, /revoke all privileges on table public\.shot_logs from public, anon, authenticated/i);
  assert.match(migration, /grant select, insert, update, delete on table public\.shot_logs to service_role/i);
  assert.doesNotMatch(migration, /create policy/i);
});
