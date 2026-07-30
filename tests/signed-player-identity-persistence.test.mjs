import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { onRequestGet as getPlayers, onRequestPost as syncPlayers } from "../functions/v1/players/index.js";
import { installApiIdentityFetchBridge, __testUtils as bridgeUtils } from "../src/lib/apiFetchBridge.js";

const ENV = {
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
  SUPABASE_ANON_KEY: "anon-key",
};

const COACH = { id: "coach-id", email: "coach@example.com", name: "Coach", role: "coach", team_id: "team-a", hide_from_leaderboards: false, created_at: 1 };
const PLAYER = { id: "player-id", email: "player@example.com", name: "Player", role: "player", team_id: "team-a", hide_from_leaderboards: false, created_at: 2 };
const OTHER = { id: "other-id", email: "other@example.com", name: "Other", role: "player", team_id: "team-b", hide_from_leaderboards: false, created_at: 3 };

function context({ method = "GET", path = "/v1/players", body, headers = {}, host = "shotlab.test" } = {}) {
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

function installBackend({ requester = "player@example.com", role = "player", teamId = "team-a", rows = [COACH, PLAYER, OTHER] } = {}) {
  const originalFetch = global.fetch;
  const calls = [];
  const state = { rows: rows.map((row) => ({ ...row })) };
  global.fetch = async (input, init = {}) => {
    const url = new URL(String(input));
    const method = String(init.method || "GET").toUpperCase();
    const body = init.body ? JSON.parse(init.body) : null;
    calls.push({ url: url.toString(), method, body });

    if (url.pathname.endsWith("/rpc/resolve_app_user_uuid")) return Response.json(`uuid-${requester.split("@")[0]}`);
    if (url.pathname.endsWith("/legacy_auth_profiles")) return Response.json([{ team_id: teamId, role }]);
    if (url.pathname.endsWith("/team_memberships")) return Response.json(teamId ? [{ team_id: teamId, role, status: "active" }] : []);
    if (url.pathname.endsWith("/teams")) return Response.json(role === "coach" && teamId ? [{ id: teamId, coach_user_id: `uuid-${requester.split("@")[0]}` }] : []);
    if (url.pathname.endsWith("/players")) {
      if (method === "GET") return Response.json(state.rows.filter((row) => matches(row, url)));
      if (method === "POST") {
        const incoming = Array.isArray(body) ? body : [body];
        for (const row of incoming) {
          const index = state.rows.findIndex((existing) => existing.id === row.id);
          if (index >= 0) state.rows[index] = { ...state.rows[index], ...row };
          else state.rows.push({ ...row });
        }
        return Response.json(incoming, { status: 201 });
      }
      if (method === "DELETE") {
        const removed = state.rows.filter((row) => matches(row, url));
        state.rows = state.rows.filter((row) => !matches(row, url));
        return Response.json(removed);
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

test("production email headers are not accepted as player identity proof", async () => {
  const response = await getPlayers(context({ host: "app.shotlab.com", headers: { "x-user-id": "coach@example.com" } }));
  assert.equal(response.status, 401);
});

test("players see and update only their own row", async () => {
  const backend = installBackend();
  try {
    const read = await getPlayers(context({ path: "/v1/players?team_id=team-a", headers: { "x-user-id": "player@example.com" } }));
    assert.equal(read.status, 200);
    assert.deepEqual((await read.json()).players.map((row) => row.id), ["player-id"]);

    const update = await syncPlayers(context({
      method: "POST",
      headers: { "x-user-id": "player@example.com" },
      body: { replace: true, players: [{ ...OTHER, name: "Attacker change" }, { ...PLAYER, name: "Updated", hide_from_leaderboards: true, updated_at: 99 }] },
    }));
    assert.equal(update.status, 200);
    assert.equal((await update.json()).ignored_count, 1);
    assert.equal(backend.state.rows.find((row) => row.id === "player-id")?.name, "Updated");
    assert.equal(backend.state.rows.find((row) => row.id === "other-id")?.name, "Other");
    assert.equal(Object.hasOwn(backend.state.rows.find((row) => row.id === "player-id"), "updated_at"), false);

    const roleChange = await syncPlayers(context({
      method: "POST",
      headers: { "x-user-id": "player@example.com" },
      body: { players: [{ ...PLAYER, role: "coach" }] },
    }));
    assert.equal(roleChange.status, 409);
    assert.equal((await roleChange.json()).error, "player_role_conflict");
  } finally { backend.restore(); }
});

test("new signed users may create an unassigned self row and later join an authorized team", async () => {
  const backend = installBackend({ requester: "new@example.com", role: "player", teamId: "", rows: [] });
  try {
    const register = await syncPlayers(context({
      method: "POST",
      headers: { "x-user-id": "new@example.com" },
      body: { players: [{ id: "new-id", email: "new@example.com", name: "New", role: "player", team_id: null }] },
    }));
    assert.equal(register.status, 200);
    assert.equal(backend.state.rows[0]?.team_id, null);

    const forbiddenJoin = await syncPlayers(context({
      method: "POST",
      headers: { "x-user-id": "new@example.com" },
      body: { players: [{ ...backend.state.rows[0], team_id: "team-x" }] },
    }));
    assert.equal(forbiddenJoin.status, 403);
    assert.equal((await forbiddenJoin.json()).error, "team_assignment_forbidden");
  } finally { backend.restore(); }
});

test("coaches see their team, detach team players, and cannot mutate another coach", async () => {
  const backend = installBackend({ requester: "coach@example.com", role: "coach" });
  try {
    const read = await getPlayers(context({ path: "/v1/players?team_id=team-a", headers: { "x-user-id": "coach@example.com" } }));
    assert.equal(read.status, 200);
    assert.deepEqual((await read.json()).players.map((row) => row.id).sort(), ["coach-id", "player-id"]);

    const detach = await syncPlayers(context({
      method: "POST",
      headers: { "x-user-id": "coach@example.com" },
      body: { replace: true, players: [COACH, { ...PLAYER, team_id: null, hide_from_leaderboards: true }] },
    }));
    assert.equal(detach.status, 200);
    assert.equal(backend.state.rows.find((row) => row.id === "player-id")?.team_id, null);

    const mutateCoach = await syncPlayers(context({
      method: "POST",
      headers: { "x-user-id": "coach@example.com" },
      body: { players: [{ ...COACH, id: "other-coach", email: "othercoach@example.com", role: "coach" }] },
    }));
    assert.equal(mutateCoach.status, 200);
    assert.equal((await mutateCoach.json()).ignored_count, 1);
  } finally { backend.restore(); }
});

test("replacement without the requester row deletes only the requester's own identity row", async () => {
  const backend = installBackend();
  try {
    const response = await syncPlayers(context({
      method: "POST",
      headers: { "x-user-id": "player@example.com" },
      body: { replace: true, players: [OTHER] },
    }));
    assert.equal(response.status, 200);
    assert.equal((await response.json()).deleted_self, true);
    assert.equal(backend.state.rows.some((row) => row.email === "player@example.com"), false);
    assert.equal(backend.state.rows.some((row) => row.email === "other@example.com"), true);
  } finally { backend.restore(); }
});

test("cache pruning and fetch routing keep only authorized player and team rows", async () => {
  const storage = memoryStorage([
    ["sl:session", JSON.stringify({ email: "player@example.com", teamId: "team-a", role: "player" })],
    ["sl:players", JSON.stringify([PLAYER, OTHER])],
    ["sl:teams", JSON.stringify([{ id: "team-a", name: "Alpha" }, { id: "team-b", name: "Beta" }])],
  ]);
  assert.deepEqual(bridgeUtils.prunePlayerCache(storage).map((row) => row.id), ["player-id"]);
  assert.deepEqual(bridgeUtils.pruneTeamCache(storage).map((row) => row.id), ["team-a"]);

  const calls = [];
  const target = {
    localStorage: storage,
    location: { origin: "https://app.shotlab.test" },
    Response,
    fetch: async (input, init = {}) => {
      calls.push({ input: String(input), init });
      if (String(input).startsWith("/v1/players")) {
        if (String(init.method || "GET").toUpperCase() === "POST") return Response.json({ ok: true, players: JSON.parse(init.body).players });
        return Response.json({ ok: true, players: [PLAYER] });
      }
      if (String(input).startsWith("/v1/teams")) return Response.json({ ok: true, teams: [{ id: "team-a", name: "Alpha" }] });
      return Response.json([{ passthrough: true }]);
    },
  };
  installApiIdentityFetchBridge(target);
  const read = await target.fetch("https://example.supabase.co/rest/v1/players");
  assert.deepEqual((await read.json()).map((row) => row.id), ["player-id"]);
  assert.match(calls[0].input, /^\/v1\/players\?team_id=team-a$/);
  assert.deepEqual(JSON.parse(storage.snapshot("sl:players")).map((row) => row.id), ["player-id"]);

  const teamRead = await target.fetch("https://example.supabase.co/rest/v1/teams");
  assert.deepEqual((await teamRead.json()).map((row) => row.id), ["team-a"]);
  assert.match(calls[1].input, /^\/v1\/teams\?team_id=team-a$/);
  assert.equal(bridgeUtils.signedPlayerResourceFor("https://example.supabase.co/rest/v1/players", target), true);
  assert.equal(bridgeUtils.signedPlayerResourceFor("https://example.supabase.co/rest/v1/teams", target), false);
  assert.equal(bridgeUtils.signedTeamResourceFor("https://example.supabase.co/rest/v1/teams", target), true);
});

test("migration removes direct browser access without deleting player rows", () => {
  const migration = fs.readFileSync(new URL("../migrations/046_players_signed_api_boundary.sql", import.meta.url), "utf8");
  assert.match(migration, /alter table public\.players enable row level security/i);
  assert.match(migration, /drop policy if exists "Allow all" on public\.players/i);
  assert.match(migration, /revoke all privileges on table public\.players from public, anon, authenticated/i);
  assert.match(migration, /grant select, insert, update, delete on table public\.players to service_role/i);
  assert.doesNotMatch(migration, /drop table|truncate table|delete from/i);
});
