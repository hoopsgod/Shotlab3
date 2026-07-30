import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  onRequestGet as getEvents,
  onRequestPost as syncEvents,
} from "../functions/v1/events/index.js";
import {
  onRequestGet as getRsvps,
  onRequestPost as syncRsvps,
} from "../functions/v1/rsvps/index.js";
import { installApiIdentityFetchBridge, __testUtils as bridgeUtils } from "../src/lib/apiFetchBridge.js";

const ENV = {
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
  SUPABASE_ANON_KEY: "anon-key",
};

const EVENT_A = {
  id: "event-a",
  team_id: "team-a",
  title: "Team Practice",
  date: "2026-07-30",
  time: "18:00",
  location: "Main Gym",
  description: "Practice",
  type: "practice",
};

const SELF_RSVP = {
  id: "rsvp-self",
  email: "player@example.com",
  player_id: "player@example.com",
  name: "Player One",
  event_id: "event-a",
  team_id: "team-a",
  attended: false,
  ts: 1_722_353_200_000,
};

const OTHER_RSVP = {
  ...SELF_RSVP,
  id: "rsvp-other",
  email: "other@example.com",
  player_id: "other@example.com",
  name: "Other Player",
};

function context({ method = "GET", path = "/v1/events", body, headers = {}, host = "shotlab.test" } = {}) {
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

function installBackend({ requester = "player@example.com", role = "player", teamId = "team-a", events = [EVENT_A], rsvps = [SELF_RSVP, OTHER_RSVP] } = {}) {
  const originalFetch = global.fetch;
  const calls = [];
  const state = {
    events: events.map((row) => ({ ...row })),
    rsvps: rsvps.map((row) => ({ ...row })),
  };

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

    const tableName = url.pathname.endsWith("/events") ? "events" : url.pathname.endsWith("/rsvps") ? "rsvps" : "";
    if (tableName) {
      const rows = state[tableName];
      if (method === "GET") return Response.json(rows.filter((row) => matches(row, url)));
      if (method === "POST") {
        const incoming = Array.isArray(body) ? body : [body];
        for (const row of incoming) {
          const index = rows.findIndex((existing) => String(existing.id) === String(row.id));
          if (index >= 0) rows[index] = { ...rows[index], ...row };
          else rows.push({ ...row });
        }
        return Response.json(incoming, { status: 201 });
      }
      if (method === "DELETE") {
        const removed = rows.filter((row) => matches(row, url));
        state[tableName] = rows.filter((row) => !matches(row, url));
        return Response.json(removed);
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

test("production email headers are not accepted as event or RSVP identity proof", async () => {
  const eventResponse = await getEvents(context({
    host: "app.shotlab.com",
    headers: { "x-user-id": "coach@example.com" },
  }));
  assert.equal(eventResponse.status, 401);

  const rsvpResponse = await getRsvps(context({
    host: "app.shotlab.com",
    path: "/v1/rsvps",
    headers: { "x-user-id": "player@example.com" },
  }));
  assert.equal(rsvpResponse.status, 401);
});

test("events are team-scoped and only coaches may synchronize them", async () => {
  let backend = installBackend({ requester: "player@example.com", role: "player" });
  try {
    const readable = await getEvents(context({
      path: "/v1/events?team_id=team-a",
      headers: { "x-user-id": "player@example.com" },
    }));
    assert.equal(readable.status, 200);
    assert.deepEqual((await readable.json()).events.map((row) => row.id), ["event-a"]);

    const crossTeam = await getEvents(context({
      path: "/v1/events?team_id=team-b",
      headers: { "x-user-id": "player@example.com" },
    }));
    assert.equal(crossTeam.status, 403);

    const playerWrite = await syncEvents(context({
      method: "POST",
      headers: { "x-user-id": "player@example.com" },
      body: { team_id: "team-a", events: [EVENT_A] },
    }));
    assert.equal(playerWrite.status, 403);
  } finally {
    backend.restore();
  }

  backend = installBackend({ requester: "coach@example.com", role: "coach", rsvps: [SELF_RSVP, OTHER_RSVP] });
  try {
    const create = await syncEvents(context({
      method: "POST",
      headers: { "x-user-id": "coach@example.com" },
      body: { team_id: "team-a", events: [EVENT_A, { ...EVENT_A, id: "event-b", title: "Film" }] },
    }));
    assert.equal(create.status, 200);
    assert.deepEqual(backend.state.events.map((row) => row.id).sort(), ["event-a", "event-b"]);

    const remove = await syncEvents(context({
      method: "POST",
      headers: { "x-user-id": "coach@example.com" },
      body: { team_id: "team-a", events: [{ ...EVENT_A, id: "event-b", title: "Film" }] },
    }));
    assert.equal(remove.status, 200);
    assert.deepEqual(backend.state.events.map((row) => row.id), ["event-b"]);
    assert.equal(backend.state.rsvps.some((row) => row.event_id === "event-a"), false);
  } finally {
    backend.restore();
  }
});

test("players see and synchronize only their own RSVP rows while coaches see the team", async () => {
  let backend = installBackend({ requester: "player@example.com", role: "player" });
  try {
    const read = await getRsvps(context({
      path: "/v1/rsvps?team_id=team-a",
      headers: { "x-user-id": "player@example.com" },
    }));
    assert.equal(read.status, 200);
    assert.deepEqual((await read.json()).rsvps.map((row) => row.id), ["rsvp-self"]);

    const sync = await syncRsvps(context({
      method: "POST",
      path: "/v1/rsvps",
      headers: { "x-user-id": "player@example.com" },
      body: {
        team_id: "team-a",
        rsvps: [
          { ...OTHER_RSVP },
          { ...SELF_RSVP, attended: true },
        ],
      },
    }));
    assert.equal(sync.status, 200);
    assert.equal(backend.state.rsvps.find((row) => row.id === "rsvp-self")?.attended, true);
    assert.equal(backend.state.rsvps.find((row) => row.id === "rsvp-other")?.email, "other@example.com");
    assert.deepEqual((await sync.json()).rsvps.map((row) => row.id), ["rsvp-self"]);

    const removeSelf = await syncRsvps(context({
      method: "POST",
      path: "/v1/rsvps",
      headers: { "x-user-id": "player@example.com" },
      body: { team_id: "team-a", rsvps: [OTHER_RSVP] },
    }));
    assert.equal(removeSelf.status, 200);
    assert.equal(backend.state.rsvps.some((row) => row.id === "rsvp-self"), false);
    assert.equal(backend.state.rsvps.some((row) => row.id === "rsvp-other"), true);

    const mismatch = await syncRsvps(context({
      method: "POST",
      path: "/v1/rsvps",
      headers: { "x-user-id": "player@example.com" },
      body: { team_id: "team-a", rsvps: [{ ...SELF_RSVP, player_id: "uuid-player", email: "other@example.com" }] },
    }));
    assert.equal(mismatch.status, 403);
    assert.equal((await mismatch.json()).error, "identity_mismatch");
  } finally {
    backend.restore();
  }

  backend = installBackend({ requester: "coach@example.com", role: "coach" });
  try {
    const read = await getRsvps(context({
      path: "/v1/rsvps?team_id=team-a",
      headers: { "x-user-id": "coach@example.com" },
    }));
    assert.equal(read.status, 200);
    assert.deepEqual((await read.json()).rsvps.map((row) => row.id).sort(), ["rsvp-other", "rsvp-self"]);
  } finally {
    backend.restore();
  }
});

test("fetch bridge reroutes only Supabase events and RSVP REST requests to signed APIs", async () => {
  const storageValues = new Map([
    ["sl:session", JSON.stringify({ email: "coach@example.com", teamId: "team-a" })],
    ["sl:players", JSON.stringify([{ email: "coach@example.com", teamId: "team-a", role: "coach" }])],
    ["sl:supabase-session", JSON.stringify({ access_token: "user-token" })],
  ]);
  const calls = [];
  const target = {
    location: { origin: "https://app.shotlab.com" },
    localStorage: { getItem(key) { return storageValues.get(key) || null; } },
    Headers,
    Response,
    fetch: async (input, init = {}) => {
      calls.push({ url: String(input), init });
      if (String(input).startsWith("/v1/events")) return Response.json({ ok: true, storage_mode: "signed_api", events: [EVENT_A] });
      if (String(input).startsWith("/v1/rsvps")) return Response.json({ ok: true, storage_mode: "signed_api", rsvps: [SELF_RSVP] });
      return Response.json({ untouched: true });
    },
  };

  installApiIdentityFetchBridge(target);
  const eventsGet = await target.fetch("https://example.supabase.co/rest/v1/events?select=*");
  assert.deepEqual((await eventsGet.json()).map((row) => row.id), ["event-a"]);

  const rsvpPost = await target.fetch("https://example.supabase.co/rest/v1/rsvps?on_conflict=id", {
    method: "POST",
    body: JSON.stringify([SELF_RSVP]),
  });
  assert.deepEqual((await rsvpPost.json()).map((row) => row.id), ["rsvp-self"]);

  const untouched = await target.fetch("https://example.supabase.co/rest/v1/players?select=*");
  assert.deepEqual(await untouched.json(), { untouched: true });

  assert.equal(calls.some((call) => call.url.includes("/rest/v1/events")), false);
  assert.equal(calls.some((call) => call.url.includes("/rest/v1/rsvps")), false);
  assert.equal(calls.some((call) => call.url.includes("/rest/v1/players")), true);
  const signedCall = calls.find((call) => call.url.startsWith("/v1/events"));
  assert.equal(new Headers(signedCall.init.headers).get("authorization"), "Bearer user-token");
  assert.equal(new Headers(signedCall.init.headers).get("x-user-id"), "coach@example.com");
});

test("bridge resource detection is narrow and migration removes browser table access", () => {
  const target = { location: { origin: "https://app.shotlab.com" } };
  assert.equal(bridgeUtils.signedScheduleResourceFor("https://example.supabase.co/rest/v1/events?select=*", target), "events");
  assert.equal(bridgeUtils.signedScheduleResourceFor("https://example.supabase.co/rest/v1/rsvps", target), "rsvps");
  assert.equal(bridgeUtils.signedScheduleResourceFor("https://example.supabase.co/rest/v1/players", target), "");
  assert.equal(bridgeUtils.signedScheduleResourceFor("https://evil.example/rest/v1/events", target), "");

  const migration = fs.readFileSync(new URL("../migrations/043_events_rsvps_signed_api_boundary.sql", import.meta.url), "utf8");
  assert.match(migration, /drop policy if exists "Allow all" on public\.events/i);
  assert.match(migration, /drop policy if exists "Allow all" on public\.rsvps/i);
  assert.match(migration, /revoke all privileges on table public\.events from public, anon, authenticated/i);
  assert.match(migration, /revoke all privileges on table public\.rsvps from public, anon, authenticated/i);
  assert.match(migration, /grant select, insert, update, delete on table public\.events to service_role/i);
  assert.match(migration, /grant select, insert, update, delete on table public\.rsvps to service_role/i);
  assert.doesNotMatch(migration, /create policy/i);
});
