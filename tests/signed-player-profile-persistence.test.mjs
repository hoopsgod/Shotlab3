import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  onRequestGet as getProfiles,
  onRequestPost as syncProfiles,
} from "../functions/v1/player-profiles/index.js";
import { installApiIdentityFetchBridge, __testUtils as bridgeUtils } from "../src/lib/apiFetchBridge.js";

const ENV = {
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
  SUPABASE_ANON_KEY: "anon-key",
};

const SELF_PROFILE = {
  id: "profile-self",
  user_id: "player@example.com",
  team_id: "team-a",
  first_name: "Player",
  last_name: "One",
  jersey_number: "12",
  created_at: 1_722_353_200_000,
  invited_email: null,
  invite_status: null,
  invite_id: null,
  invite_sent_at: null,
  invite_claimed_at: null,
};

const OTHER_PROFILE = {
  ...SELF_PROFILE,
  id: "profile-other",
  user_id: "other@example.com",
  first_name: "Other",
  last_name: "Player",
};

const SHELL_PROFILE = {
  ...SELF_PROFILE,
  id: "profile-shell",
  user_id: null,
  first_name: "Roster",
  last_name: "Shell",
  invited_email: null,
};

function context({ method = "GET", path = "/v1/player-profiles", body, headers = {}, host = "shotlab.test" } = {}) {
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

function installBackend({
  requester = "player@example.com",
  role = "player",
  teamId = "team-a",
  profiles = [SELF_PROFILE, OTHER_PROFILE, SHELL_PROFILE],
} = {}) {
  const originalFetch = global.fetch;
  const calls = [];
  const state = { profiles: profiles.map((row) => ({ ...row })) };

  global.fetch = async (input, init = {}) => {
    const url = new URL(String(input));
    const method = String(init.method || "GET").toUpperCase();
    const body = init.body ? JSON.parse(init.body) : null;
    calls.push({ url: url.toString(), method, body });

    if (url.pathname.endsWith("/rpc/resolve_app_user_uuid")) {
      return Response.json(`uuid-${requester.split("@")[0]}`);
    }
    if (url.pathname.endsWith("/legacy_auth_profiles")) {
      return Response.json([{ team_id: teamId, role }]);
    }
    if (url.pathname.endsWith("/team_memberships")) {
      return Response.json([{ team_id: teamId, role, status: "active" }]);
    }
    if (url.pathname.endsWith("/teams")) {
      return Response.json(role === "coach" ? [{ id: teamId, coach_user_id: `uuid-${requester.split("@")[0]}` }] : []);
    }
    if (url.pathname.endsWith("/player_profiles")) {
      if (method === "GET") return Response.json(state.profiles.filter((row) => matches(row, url)));
      if (method === "POST") {
        const incoming = Array.isArray(body) ? body : [body];
        for (const row of incoming) {
          const index = state.profiles.findIndex((existing) => String(existing.id) === String(row.id));
          if (index >= 0) state.profiles[index] = { ...state.profiles[index], ...row };
          else state.profiles.push({ ...row });
        }
        return Response.json(incoming, { status: 201 });
      }
    }

    return Response.json([]);
  };

  return {
    calls,
    state,
    restore() { global.fetch = originalFetch; },
  };
}

function memoryStorage(entries = []) {
  const values = new Map(entries);
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
    snapshot(key) { return values.get(key); },
  };
}

test("production email headers are not accepted as player profile identity proof", async () => {
  const response = await getProfiles(context({
    host: "app.shotlab.com",
    headers: { "x-user-id": "coach@example.com" },
  }));
  assert.equal(response.status, 401);
});

test("coaches read and synchronize only profiles from teams they manage", async () => {
  const backend = installBackend({ requester: "coach@example.com", role: "coach" });
  try {
    const read = await getProfiles(context({
      path: "/v1/player-profiles?team_id=team-a",
      headers: { "x-user-id": "coach@example.com" },
    }));
    assert.equal(read.status, 200);
    assert.deepEqual((await read.json()).profiles.map((row) => row.id).sort(), ["profile-other", "profile-self", "profile-shell"]);

    const crossTeam = await getProfiles(context({
      path: "/v1/player-profiles?team_id=team-b",
      headers: { "x-user-id": "coach@example.com" },
    }));
    assert.equal(crossTeam.status, 403);

    const createShell = await syncProfiles(context({
      method: "POST",
      headers: { "x-user-id": "coach@example.com" },
      body: {
        team_id: "team-a",
        profiles: [{ id: "profile-new", team_id: "team-a", user_id: null, first_name: "New", last_name: "Player", jersey_number: "33" }],
      },
    }));
    assert.equal(createShell.status, 200);
    assert.equal(backend.state.profiles.find((row) => row.id === "profile-new")?.jersey_number, "33");

    const moveIdentity = await syncProfiles(context({
      method: "POST",
      headers: { "x-user-id": "coach@example.com" },
      body: {
        team_id: "team-a",
        profiles: [{ ...SELF_PROFILE, user_id: "other@example.com" }],
      },
    }));
    assert.equal(moveIdentity.status, 409);
    assert.equal((await moveIdentity.json()).error, "profile_identity_conflict");
  } finally {
    backend.restore();
  }
});

test("players read and synchronize only their own claimed profile", async () => {
  const backend = installBackend({ requester: "player@example.com", role: "player" });
  try {
    const read = await getProfiles(context({
      path: "/v1/player-profiles?team_id=team-a",
      headers: { "x-user-id": "player@example.com" },
    }));
    assert.equal(read.status, 200);
    assert.deepEqual((await read.json()).profiles.map((row) => row.id), ["profile-self"]);

    const sync = await syncProfiles(context({
      method: "POST",
      headers: { "x-user-id": "player@example.com" },
      body: {
        team_id: "team-a",
        profiles: [
          { ...OTHER_PROFILE, first_name: "Changed by attacker" },
          { ...SELF_PROFILE, first_name: "Updated", email: "unsupported@example.com", updated_at: 99 },
        ],
      },
    }));
    assert.equal(sync.status, 200);
    const body = await sync.json();
    assert.equal(body.ignored_count, 1);
    assert.deepEqual(body.profiles.map((row) => row.id), ["profile-self"]);
    assert.equal(backend.state.profiles.find((row) => row.id === "profile-self")?.first_name, "Updated");
    assert.equal(backend.state.profiles.find((row) => row.id === "profile-other")?.first_name, "Other");
    assert.equal(Object.hasOwn(backend.state.profiles.find((row) => row.id === "profile-self"), "email"), false);
    assert.equal(Object.hasOwn(backend.state.profiles.find((row) => row.id === "profile-self"), "updated_at"), false);

    const hijack = await syncProfiles(context({
      method: "POST",
      headers: { "x-user-id": "player@example.com" },
      body: {
        team_id: "team-a",
        profiles: [{ ...SELF_PROFILE, id: "profile-other", user_id: "player@example.com" }],
      },
    }));
    assert.equal(hijack.status, 409);
    assert.equal((await hijack.json()).error, "profile_identity_conflict");

    const claimUninvited = await syncProfiles(context({
      method: "POST",
      headers: { "x-user-id": "player@example.com" },
      body: {
        team_id: "team-a",
        profiles: [{ ...SHELL_PROFILE, user_id: "player@example.com" }],
      },
    }));
    assert.equal(claimUninvited.status, 403);
    assert.equal((await claimUninvited.json()).error, "profile_claim_forbidden");
  } finally {
    backend.restore();
  }
});

test("profile cache pruning removes cross-player and cross-team rows before hydration", () => {
  const playerStorage = memoryStorage([
    ["sl:session", JSON.stringify({ email: "player@example.com", teamId: "team-a", role: "player" })],
    ["sl:players", JSON.stringify([{ email: "player@example.com", teamId: "team-a", role: "player" }])],
    ["sl:player-profiles", JSON.stringify([
      { id: "self", userId: "player@example.com", teamId: "team-a" },
      { id: "other", userId: "other@example.com", teamId: "team-a" },
    ])],
  ]);
  assert.deepEqual(bridgeUtils.prunePlayerProfileCache(playerStorage).map((row) => row.id), ["self"]);
  assert.deepEqual(JSON.parse(playerStorage.snapshot("sl:player-profiles")).map((row) => row.id), ["self"]);

  const coachStorage = memoryStorage([
    ["sl:session", JSON.stringify({ email: "coach@example.com", teamId: "team-a", role: "coach" })],
    ["sl:players", JSON.stringify([{ email: "coach@example.com", teamId: "team-a", role: "coach" }])],
    ["sl:player-profiles", JSON.stringify([
      { id: "a", userId: null, teamId: "team-a" },
      { id: "b", userId: null, teamId: "team-b" },
    ])],
  ]);
  assert.deepEqual(bridgeUtils.prunePlayerProfileCache(coachStorage).map((row) => row.id), ["a"]);
});

test("fetch bridge reroutes only Supabase player_profiles REST requests", async () => {
  const storage = memoryStorage([
    ["sl:session", JSON.stringify({ email: "coach@example.com", teamId: "team-a", role: "coach" })],
    ["sl:players", JSON.stringify([{ email: "coach@example.com", teamId: "team-a", role: "coach" }])],
    ["sl:player-profiles", JSON.stringify([])],
  ]);
  const calls = [];
  const target = {
    localStorage: storage,
    location: { origin: "https://app.shotlab.test" },
    Response,
    fetch: async (input, init = {}) => {
      calls.push({ input: String(input), init });
      if (String(input).startsWith("/v1/player-profiles")) {
        if (String(init.method || "GET").toUpperCase() === "POST") {
          return Response.json({ ok: true, profiles: JSON.parse(init.body).profiles });
        }
        return Response.json({ ok: true, profiles: [SELF_PROFILE] });
      }
      return Response.json([{ passthrough: true }]);
    },
  };

  installApiIdentityFetchBridge(target);
  const read = await target.fetch("https://example.supabase.co/rest/v1/player_profiles");
  assert.deepEqual((await read.json()).map((row) => row.id), ["profile-self"]);
  assert.match(calls[0].input, /^\/v1\/player-profiles\?team_id=team-a$/);
  assert.deepEqual(JSON.parse(storage.snapshot("sl:player-profiles")).map((row) => row.id), ["profile-self"]);

  const write = await target.fetch("https://example.supabase.co/rest/v1/player_profiles", {
    method: "POST",
    body: JSON.stringify([SELF_PROFILE]),
  });
  assert.equal((await write.json())[0].id, "profile-self");
  assert.equal(calls[1].input, "/v1/player-profiles");

  await target.fetch("https://example.supabase.co/rest/v1/players");
  assert.equal(calls[2].input, "https://example.supabase.co/rest/v1/players");
  assert.equal(bridgeUtils.signedPlayerProfileResourceFor("https://example.supabase.co/rest/v1/player_profiles", target), true);
  assert.equal(bridgeUtils.signedPlayerProfileResourceFor("https://example.supabase.co/rest/v1/players", target), false);
});

test("migration removes direct browser access without deleting profile rows", () => {
  const migration = fs.readFileSync(new URL("../migrations/045_player_profiles_signed_api_boundary.sql", import.meta.url), "utf8");
  assert.match(migration, /alter table public\.player_profiles enable row level security/i);
  assert.match(migration, /drop policy if exists "Allow all" on public\.player_profiles/i);
  assert.match(migration, /revoke all privileges on table public\.player_profiles from public, anon, authenticated/i);
  assert.match(migration, /grant select, insert, update, delete on table public\.player_profiles to service_role/i);
  assert.doesNotMatch(migration, /drop table|truncate table|delete from/i);
});
