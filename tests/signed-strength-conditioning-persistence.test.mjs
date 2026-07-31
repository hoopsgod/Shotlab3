import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  onRequestGet as getStrengthState,
  onRequestPost as syncStrengthState,
  sanitizeScRsvp,
} from "../functions/v1/strength-conditioning/index.js";
import { createStrengthConditioningPersistenceService } from "../src/lib/strengthConditioningPersistenceService.js";
import { __testUtils as bridgeUtils } from "../src/lib/apiFetchBridge.js";
import { buildAppRows, normalizeScRsvpRowForApp } from "../src/lib/remotePersistence.js";

const ENV = {
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
  SUPABASE_ANON_KEY: "anon-key",
};

function context({ method = "GET", path = "/v1/strength-conditioning", body, headers = {}, host = "shotlab.test" } = {}) {
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
  requester = "coach@example.com",
  role = "coach",
  teamId = "team-a",
  sessions = [],
  rsvps = [],
  logs = [],
} = {}) {
  const originalFetch = global.fetch;
  const calls = [];
  const state = {
    sc_sessions: sessions.map((row) => ({ ...row })),
    sc_rsvps: rsvps.map((row) => ({ ...row })),
    sc_logs: logs.map((row) => ({ ...row })),
  };

  global.fetch = async (input, init = {}) => {
    const url = new URL(String(input));
    const method = String(init.method || "GET").toUpperCase();
    const body = init.body ? JSON.parse(init.body) : null;
    calls.push({ url: url.toString(), method, body });

    if (url.pathname.endsWith("/rpc/resolve_app_user_uuid")) return Response.json(`uuid-${requester.split("@")[0]}`);
    if (url.pathname.endsWith("/legacy_auth_profiles")) return Response.json([{ team_id: teamId, role }]);
    if (url.pathname.endsWith("/team_memberships")) return Response.json([{ team_id: teamId, role, status: "active" }]);
    if (url.pathname.endsWith("/teams")) return Response.json(role === "coach" ? [{ id: teamId, coach_user_id: `uuid-${requester.split("@")[0]}` }] : []);

    const table = ["sc_sessions", "sc_rsvps", "sc_logs"].find((name) => url.pathname.endsWith(`/${name}`));
    if (table) {
      const rows = state[table];
      if (method === "GET") return Response.json(rows.filter((row) => matches(row, url)));
      if (method === "POST") {
        const incoming = Array.isArray(body) ? body : [body];
        const keyFor = table === "sc_sessions"
          ? (row) => `${row.team_id}:${row.id}`
          : table === "sc_rsvps"
            ? (row) => `${row.team_id}:${row.session_id}:${row.player_id}`
            : (row) => `${row.team_id}:${row.id}`;
        for (const row of incoming) {
          const index = rows.findIndex((existing) => keyFor(existing) === keyFor(row));
          if (index >= 0) rows[index] = { ...rows[index], ...row };
          else rows.push({ ...row });
        }
        return Response.json(incoming, { status: 201 });
      }
      if (method === "DELETE") {
        const removed = rows.filter((row) => matches(row, url));
        state[table] = rows.filter((row) => !matches(row, url));
        if (table === "sc_sessions") {
          for (const row of removed) {
            state.sc_rsvps = state.sc_rsvps.filter((rsvp) => !(rsvp.team_id === row.team_id && rsvp.session_id === row.id));
          }
        }
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
  };
}

const SESSION = {
  team_id: "team-a",
  id: "lift-a",
  sport: "Team Lift",
  date: "2026-08-03",
  time: "8:00 AM",
  session_type: "School",
};
const PLAYER_RSVP = {
  team_id: "team-a",
  session_id: "lift-a",
  player_id: "player@example.com",
  email: "player@example.com",
  name: "Player",
  ts: 1,
};
const OTHER_RSVP = {
  team_id: "team-a",
  session_id: "lift-a",
  player_id: "other@example.com",
  email: "other@example.com",
  name: "Other",
  ts: 2,
};

test("production identity headers alone cannot access Strength & Conditioning data", async () => {
  const response = await getStrengthState(context({
    host: "app.shotlab.com",
    headers: { "x-user-id": "coach@example.com" },
  }));
  assert.equal(response.status, 401);
});

test("players receive shared sessions but only their own RSVP and log records", async () => {
  const backend = installBackend({
    requester: "player@example.com",
    role: "player",
    sessions: [SESSION],
    rsvps: [PLAYER_RSVP, OTHER_RSVP],
    logs: [
      { team_id: "team-a", id: "mine", player_id: "player@example.com", email: "player@example.com", sport: "Lift", ts: 3 },
      { team_id: "team-a", id: "other", player_id: "other@example.com", email: "other@example.com", sport: "Lift", ts: 4 },
    ],
  });
  try {
    const response = await getStrengthState(context({
      path: "/v1/strength-conditioning?team_id=team-a",
      headers: { "x-user-id": "player@example.com" },
    }));
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.deepEqual(body.sessions.map((row) => row.id), ["lift-a"]);
    assert.deepEqual(body.rsvps.map((row) => row.email), ["player@example.com"]);
    assert.deepEqual(body.logs.map((row) => row.email), ["player@example.com"]);
    assert.equal(body.can_write_sessions, false);
  } finally {
    backend.restore();
  }
});

test("players cannot change schedules or write another player's commitments", async () => {
  const backend = installBackend({ requester: "player@example.com", role: "player", sessions: [SESSION] });
  try {
    const scheduleWrite = await syncStrengthState(context({
      method: "POST",
      headers: { "x-user-id": "player@example.com" },
      body: { team_id: "team-a", resource: "sessions", rows: [SESSION] },
    }));
    assert.equal(scheduleWrite.status, 403);

    const forgedWrite = await syncStrengthState(context({
      method: "POST",
      headers: { "x-user-id": "player@example.com" },
      body: { team_id: "team-a", resource: "rsvps", rows: [OTHER_RSVP] },
    }));
    assert.equal(forgedWrite.status, 403);
    assert.equal(backend.state.sc_rsvps.length, 0);
  } finally {
    backend.restore();
  }
});

test("player replacement changes only that player's RSVP rows", async () => {
  const backend = installBackend({
    requester: "player@example.com",
    role: "player",
    sessions: [SESSION],
    rsvps: [PLAYER_RSVP, OTHER_RSVP],
  });
  try {
    const response = await syncStrengthState(context({
      method: "POST",
      headers: { "x-user-id": "player@example.com" },
      body: { team_id: "team-a", resource: "rsvps", rows: [] },
    }));
    assert.equal(response.status, 200);
    assert.deepEqual(backend.state.sc_rsvps.map((row) => row.email), ["other@example.com"]);
  } finally {
    backend.restore();
  }
});

test("coach replacement is team-scoped and supports empty collection deletion", async () => {
  const backend = installBackend({
    sessions: [SESSION, { ...SESSION, id: "lift-b", sport: "Speed" }],
    rsvps: [PLAYER_RSVP],
  });
  try {
    const response = await syncStrengthState(context({
      method: "POST",
      headers: { "x-user-id": "coach@example.com" },
      body: { team_id: "team-a", resource: "sessions", rows: [{ ...SESSION, sport: "Updated Lift" }] },
    }));
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.deleted_count, 1);
    assert.deepEqual(backend.state.sc_sessions.map((row) => row.id), ["lift-a"]);

    const empty = await syncStrengthState(context({
      method: "POST",
      headers: { "x-user-id": "coach@example.com" },
      body: { team_id: "team-a", resource: "sessions", rows: [] },
    }));
    assert.equal(empty.status, 200);
    assert.equal(backend.state.sc_sessions.length, 0);
    assert.equal(backend.state.sc_rsvps.length, 0);
  } finally {
    backend.restore();
  }
});

test("client rejects malformed successful responses and bridge recognizes all S&C tables", async () => {
  const service = createStrengthConditioningPersistenceService({
    storage: memoryStorage([
      ["sl:session", JSON.stringify({ email: "player@example.com", teamId: "team-a", role: "player" })],
      ["sl:players", JSON.stringify([{ email: "player@example.com", teamId: "team-a", role: "player" }])],
    ]),
    fetchImpl: async () => new Response("<!doctype html><title>ShotLab</title>", {
      status: 200,
      headers: { "content-type": "text/html" },
    }),
  });
  await assert.rejects(service.loadState(), (error) => error?.code === "strength_conditioning_load_failed");
  for (const [table, resource] of [["sc_sessions", "sessions"], ["sc_rsvps", "rsvps"], ["sc_logs", "logs"]]) {
    assert.equal(
      bridgeUtils.signedStrengthResourceFor(`https://example.supabase.co/rest/v1/${table}`, { location: { origin: "https://shotlab.test" } }),
      resource,
    );
  }
});

test("local S&C fallback preserves legacy IDs and absent timestamps exactly", () => {
  const localSessions = [{ id: 1785462812819, teamId: "team-a", sport: "Strength" }];
  const localRsvps = [{ id: "rsvp-a", teamId: "team-a", sessionId: "lift-a", email: "player@example.com" }];
  const localLogs = [{ id: "log-a", teamId: "team-a", playerId: "player@example.com", completed: true }];

  assert.deepEqual(buildAppRows("sl:sc-sessions", localSessions, { source: "local" }), localSessions);
  assert.deepEqual(buildAppRows("sl:sc-rsvps", localRsvps, { source: "local" }), localRsvps);
  assert.deepEqual(buildAppRows("sl:sc-logs", localLogs, { source: "local" }), localLogs);
  assert.equal(Object.hasOwn(buildAppRows("sl:sc-rsvps", localRsvps, { source: "local" })[0], "ts"), false);
  assert.equal(sanitizeScRsvp({ ...localRsvps[0], ts: null }).ts, null);
  assert.equal(normalizeScRsvpRowForApp({ ...localRsvps[0], playerId: "player@example.com", ts: null }).ts, null);
});

test("migration and application integration enforce a service-only signed boundary", () => {
  const migration = fs.readFileSync(new URL("../migrations/052_strength_conditioning_signed_api.sql", import.meta.url), "utf8");
  const app = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
  const dataModels = fs.readFileSync(new URL("../src/lib/appDataModels.js", import.meta.url), "utf8");
  assert.match(migration, /create table if not exists public\.sc_sessions/i);
  assert.match(migration, /create table if not exists public\.sc_rsvps/i);
  assert.match(migration, /create table if not exists public\.sc_logs/i);
  assert.match(migration, /alter table public\.sc_sessions enable row level security/i);
  assert.match(migration, /revoke all privileges on table public\.sc_sessions, public\.sc_rsvps, public\.sc_logs\s+from public, anon, authenticated/i);
  assert.match(migration, /grant select, insert, update, delete on table public\.sc_sessions, public\.sc_rsvps, public\.sc_logs\s+to service_role/i);
  assert.doesNotMatch(migration, /create policy/i);
  assert.match(dataModels, /\[STORAGE_KEYS\.scSessions\]: "sc_sessions"/);
  assert.match(app, /const signedReplacementCollection = k === "sl:sc-sessions" \|\| k === "sl:sc-rsvps" \|\| k === "sl:sc-logs"/);
  assert.match(app, /await DB\.set\("sl:sc-sessions",m\.scSM\);\s*await Promise\.all/);
  assert.match(app, /strictLocal:true,strictRemote:true/);
});
