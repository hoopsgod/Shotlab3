import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { onRequestGet as getTeams, onRequestPost as syncTeams } from "../functions/v1/teams/index.js";
import { installApiIdentityFetchBridge, __testUtils as bridgeUtils } from "../src/lib/apiFetchBridge.js";

const ENV = {
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
  SUPABASE_ANON_KEY: "anon-key",
};

const TEAM_A = {
  id: "team-a",
  name: "Alpha",
  owner_coach_id: "coach@example.com",
  join_code: "ALPHA1",
  created_at: 100,
  updated_at: 200,
  coach_user_id: "11111111-1111-4111-8111-111111111111",
  school: "Alpha High",
  level: "Varsity",
};

const TEAM_B = {
  ...TEAM_A,
  id: "team-b",
  name: "Beta",
  owner_coach_id: "othercoach@example.com",
  join_code: "BETA22",
  coach_user_id: "22222222-2222-4222-8222-222222222222",
};

function context({ method = "GET", path = "/v1/teams", body, headers = {}, host = "shotlab.test" } = {}) {
  return {
    request: new Request(`https://${host}${path}`, {
      method,
      headers: { ...(body === undefined ? {} : { "content-type": "application/json" }), ...headers },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    }),
    env: ENV,
  };
}

function eqValue(value) {
  const raw = String(value || "");
  return decodeURIComponent(raw.startsWith("eq.") ? raw.slice(3) : raw);
}

function matches(row, url) {
  for (const [key, value] of url.searchParams.entries()) {
    if (["select", "order", "limit", "on_conflict"].includes(key)) continue;
    if (String(row?.[key] ?? "") !== eqValue(value)) return false;
  }
  return true;
}

function installBackend({ requester = "coach@example.com", role = "coach", teamId = "team-a", teams = [TEAM_A, TEAM_B] } = {}) {
  const originalFetch = global.fetch;
  const calls = [];
  const state = { teams: teams.map((row) => ({ ...row })) };
  const requesterUuid = role === "coach" ? TEAM_A.coach_user_id : "33333333-3333-4333-8333-333333333333";

  global.fetch = async (input, init = {}) => {
    const url = new URL(String(input));
    const method = String(init.method || "GET").toUpperCase();
    const body = init.body ? JSON.parse(init.body) : null;
    calls.push({ url: url.toString(), method, body });

    if (url.pathname.endsWith("/rpc/resolve_app_user_uuid")) return Response.json(requesterUuid);
    if (url.pathname.endsWith("/legacy_auth_profiles")) return Response.json(teamId ? [{ team_id: teamId, role }] : []);
    if (url.pathname.endsWith("/team_memberships")) return Response.json(teamId ? [{ team_id: teamId, role, status: "active" }] : []);
    if (url.pathname.endsWith("/teams")) {
      if (method === "GET") return Response.json(state.teams.filter((row) => matches(row, url)));
      if (method === "POST") {
        const incoming = Array.isArray(body) ? body : [body];
        for (const row of incoming) {
          const index = state.teams.findIndex((existing) => existing.id === row.id);
          if (index >= 0) state.teams[index] = { ...state.teams[index], ...row };
          else state.teams.push({ ...row });
        }
        return Response.json(incoming, { status: 201 });
      }
    }
    return Response.json([]);
  };

  return { calls, state, restore() { global.fetch = originalFetch; } };
}

function memoryStorage(entries = []) {
  const values = new Map(entries);
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    snapshot(key) { return values.get(key); },
  };
}

test("production email headers are not accepted as team identity proof", async () => {
  const response = await getTeams(context({ host: "app.shotlab.com", headers: { "x-user-id": "coach@example.com" } }));
  assert.equal(response.status, 401);
});

test("players read their team but cannot update team metadata", async () => {
  const backend = installBackend({ requester: "player@example.com", role: "player" });
  try {
    const read = await getTeams(context({ path: "/v1/teams?team_id=team-a", headers: { "x-user-id": "player@example.com" } }));
    assert.equal(read.status, 200);
    assert.deepEqual((await read.json()).teams.map((row) => row.id), ["team-a"]);

    const crossTeam = await getTeams(context({ path: "/v1/teams?team_id=team-b", headers: { "x-user-id": "player@example.com" } }));
    assert.equal(crossTeam.status, 403);

    const update = await syncTeams(context({
      method: "POST",
      headers: { "x-user-id": "player@example.com" },
      body: { teams: [{ ...TEAM_A, name: "Player changed team" }] },
    }));
    assert.equal(update.status, 200);
    assert.equal((await update.json()).ignored_count, 1);
    assert.equal(backend.state.teams.find((row) => row.id === "team-a")?.name, "Alpha");
  } finally { backend.restore(); }
});

test("coaches update only owned team metadata and immutable ownership stays intact", async () => {
  const backend = installBackend();
  try {
    const update = await syncTeams(context({
      method: "POST",
      headers: { "x-user-id": "coach@example.com" },
      body: {
        teams: [{
          ...TEAM_A,
          name: "Alpha Updated",
          join_code: "NEW123",
          school: "Updated School",
          level: "JV",
          branding: { unsupported: true },
        }],
      },
    }));
    assert.equal(update.status, 200);
    const stored = backend.state.teams.find((row) => row.id === "team-a");
    assert.equal(stored.name, "Alpha Updated");
    assert.equal(stored.join_code, "NEW123");
    assert.equal(stored.school, "Updated School");
    assert.equal(stored.level, "JV");
    assert.equal(stored.owner_coach_id, TEAM_A.owner_coach_id);
    assert.equal(stored.coach_user_id, TEAM_A.coach_user_id);
    assert.equal(stored.created_at, TEAM_A.created_at);
    assert.equal(Object.hasOwn(stored, "branding"), false);

    const ownerChange = await syncTeams(context({
      method: "POST",
      headers: { "x-user-id": "coach@example.com" },
      body: { teams: [{ ...TEAM_A, owner_coach_id: "attacker@example.com" }] },
    }));
    assert.equal(ownerChange.status, 409);
    assert.equal((await ownerChange.json()).error, "team_owner_immutable");

    const otherTeam = await syncTeams(context({
      method: "POST",
      headers: { "x-user-id": "coach@example.com" },
      body: { teams: [{ ...TEAM_B, name: "Unauthorized" }] },
    }));
    assert.equal(otherTeam.status, 200);
    assert.equal((await otherTeam.json()).ignored_count, 1);
    assert.equal(backend.state.teams.find((row) => row.id === "team-b")?.name, "Beta");
  } finally { backend.restore(); }
});

test("generic persistence cannot create teams or reuse another team's join code", async () => {
  const backend = installBackend();
  try {
    const create = await syncTeams(context({
      method: "POST",
      headers: { "x-user-id": "coach@example.com" },
      body: { teams: [{ ...TEAM_A, id: "team-new", join_code: "NEW777" }] },
    }));
    assert.equal(create.status, 409);
    assert.equal((await create.json()).error, "team_creation_requires_create_route");

    const collision = await syncTeams(context({
      method: "POST",
      headers: { "x-user-id": "coach@example.com" },
      body: { teams: [{ ...TEAM_A, join_code: TEAM_B.join_code }] },
    }));
    assert.equal(collision.status, 409);
    assert.equal((await collision.json()).error, "join_code_conflict");
  } finally { backend.restore(); }
});

test("team cache is reduced to the active team and REST requests use the signed API", async () => {
  const storage = memoryStorage([
    ["sl:session", JSON.stringify({ email: "coach@example.com", teamId: "team-a", role: "coach" })],
    ["sl:players", JSON.stringify([{ id: "coach-row", email: "coach@example.com", teamId: "team-a", role: "coach" }])],
    ["sl:teams", JSON.stringify([TEAM_A, TEAM_B])],
  ]);
  assert.deepEqual(bridgeUtils.pruneTeamCache(storage).map((row) => row.id), ["team-a"]);

  const calls = [];
  const target = {
    localStorage: storage,
    location: { origin: "https://app.shotlab.test" },
    Response,
    fetch: async (input, init = {}) => {
      calls.push({ input: String(input), init });
      if (String(input).startsWith("/v1/teams")) {
        if (String(init.method || "GET").toUpperCase() === "POST") return Response.json({ ok: true, teams: JSON.parse(init.body).teams });
        return Response.json({ ok: true, teams: [TEAM_A] });
      }
      return Response.json([{ passthrough: true }]);
    },
  };

  installApiIdentityFetchBridge(target);
  const read = await target.fetch("https://example.supabase.co/rest/v1/teams?select=*");
  assert.deepEqual((await read.json()).map((row) => row.id), ["team-a"]);
  assert.match(calls[0].input, /^\/v1\/teams\?team_id=team-a$/);
  assert.deepEqual(JSON.parse(storage.snapshot("sl:teams")).map((row) => row.id), ["team-a"]);
  assert.equal(calls.some((call) => call.input.includes("/rest/v1/teams")), false);
  assert.equal(bridgeUtils.signedTeamResourceFor("https://example.supabase.co/rest/v1/teams", target), true);
  assert.equal(bridgeUtils.signedTeamResourceFor("https://evil.example/rest/v1/teams", target), false);
});

test("migration removes direct browser access without deleting teams", () => {
  const migration = fs.readFileSync(new URL("../migrations/047_teams_signed_api_boundary.sql", import.meta.url), "utf8");
  assert.match(migration, /alter table public\.teams enable row level security/i);
  assert.match(migration, /drop policy if exists "Allow all" on public\.teams/i);
  assert.match(migration, /revoke all privileges on table public\.teams from public, anon, authenticated/i);
  assert.match(migration, /grant select, insert, update, delete on table public\.teams to service_role/i);
  assert.doesNotMatch(migration, /drop table|truncate table|delete from/i);
});
