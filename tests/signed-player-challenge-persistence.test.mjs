import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  onRequestGet as getPlayerChallenges,
  onRequestPost as mutatePlayerChallenge,
} from "../functions/v1/player-challenges/index.js";
import {
  createPlayerChallengePersistenceService,
  mergePlayerChallenges,
} from "../src/lib/playerChallengePersistenceService.js";

const ENV = {
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
  SUPABASE_ANON_KEY: "anon-key",
};
const TEAM_ID = "team-a";
const ROSTER = [
  { id: "p1", email: "player@example.com", name: "Player One", role: "player", team_id: TEAM_ID },
  { id: "p2", email: "other@example.com", name: "Player Two", role: "player", team_id: TEAM_ID },
  { id: "p3", email: "third@example.com", name: "Player Three", role: "player", team_id: TEAM_ID },
];

function context({ method = "GET", path = "/v1/player-challenges", body, headers = {}, host = "shotlab.test" } = {}) {
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

function requestIdentity(url, body) {
  if (url.pathname.endsWith("/rpc/resolve_app_user_uuid")) return String(body?.p_identifier || "").toLowerCase();
  return eqValue(url.searchParams.get("email") || url.searchParams.get("user_id") || "");
}

function installBackend({ challenges = [], roster = ROSTER } = {}) {
  const originalFetch = global.fetch;
  const state = {
    players: roster.map((row) => ({ ...row })),
    player_challenges: challenges.map((row) => ({ ...row })),
  };
  const roles = new Map([
    ["player@example.com", "player"],
    ["other@example.com", "player"],
    ["third@example.com", "player"],
    ["coach@example.com", "coach"],
  ]);

  global.fetch = async (input, init = {}) => {
    const url = new URL(String(input));
    const method = String(init.method || "GET").toUpperCase();
    const body = init.body ? JSON.parse(init.body) : null;
    if (url.pathname.endsWith("/rpc/resolve_app_user_uuid")) return Response.json(`uuid-${requestIdentity(url, body).split("@")[0]}`);
    if (url.pathname.endsWith("/legacy_auth_profiles")) {
      const identity = requestIdentity(url, body);
      const role = roles.get(identity);
      return Response.json(role ? [{ team_id: TEAM_ID, role }] : []);
    }
    if (url.pathname.endsWith("/team_memberships")) {
      const uuid = requestIdentity(url, body).replace(/^uuid-/, "");
      const identity = [...roles.keys()].find((email) => email.split("@")[0] === uuid);
      const role = roles.get(identity);
      return Response.json(role ? [{ team_id: TEAM_ID, role, status: "active" }] : []);
    }
    if (url.pathname.endsWith("/teams")) return Response.json([]);
    if (url.pathname.endsWith("/players")) return Response.json(state.players.filter((row) => matches(row, url)));
    if (url.pathname.endsWith("/player_challenges")) {
      if (method === "GET") return Response.json(state.player_challenges.filter((row) => matches(row, url)));
      if (method === "POST") {
        const rows = Array.isArray(body) ? body : [body];
        state.player_challenges.push(...rows.map((row) => ({ ...row })));
        return Response.json(rows, { status: 201 });
      }
      if (method === "PATCH") {
        const updated = [];
        state.player_challenges = state.player_challenges.map((row) => {
          if (!matches(row, url)) return row;
          const next = { ...row, ...body };
          updated.push(next);
          return next;
        });
        return Response.json(updated);
      }
    }
    return Response.json([]);
  };
  return { state, restore() { global.fetch = originalFetch; } };
}

function memoryStorage(entries = []) {
  const values = new Map(entries);
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
  };
}

const CHALLENGE_INPUT = {
  id: "challenge-1",
  teamId: TEAM_ID,
  from: "spoofed@example.com",
  fromName: "Spoofed Name",
  to: "other@example.com",
  toName: "Spoofed Opponent",
  drillId: "form-ladder",
  drillName: "Form Shooting Ladder",
  score: 18,
  max: 25,
  ts: 1000,
};

test("production identity headers alone cannot access player challenges", async () => {
  const response = await getPlayerChallenges(context({
    host: "app.shotlab.com",
    path: `/v1/player-challenges?team_id=${TEAM_ID}`,
    headers: { "x-user-id": "player@example.com" },
  }));
  assert.equal(response.status, 401);
});

test("active players can challenge only same-team roster opponents and server identity wins", async () => {
  const backend = installBackend();
  try {
    const created = await mutatePlayerChallenge(context({
      method: "POST",
      headers: { "x-user-id": "player@example.com" },
      body: { team_id: TEAM_ID, action: "create", challenge: CHALLENGE_INPUT },
    }));
    assert.equal(created.status, 201);
    const body = await created.json();
    assert.equal(body.challenge.from, "player@example.com");
    assert.equal(body.challenge.fromName, "Player One");
    assert.equal(body.challenge.toName, "Player Two");
    assert.equal(backend.state.player_challenges[0].status, "pending");

    const missingOpponent = await mutatePlayerChallenge(context({
      method: "POST",
      headers: { "x-user-id": "player@example.com" },
      body: { team_id: TEAM_ID, action: "create", challenge: { ...CHALLENGE_INPUT, id: "challenge-2", to: "outside@example.com" } },
    }));
    assert.equal(missingOpponent.status, 400);

    const coachWrite = await mutatePlayerChallenge(context({
      method: "POST",
      headers: { "x-user-id": "coach@example.com" },
      body: { team_id: TEAM_ID, action: "create", challenge: { ...CHALLENGE_INPUT, id: "challenge-3" } },
    }));
    assert.equal(coachWrite.status, 403);
    assert.equal(backend.state.player_challenges.length, 1);
  } finally {
    backend.restore();
  }
});

test("reads expose only the signed player's active-roster challenge relationships", async () => {
  const backend = installBackend({
    roster: ROSTER,
    challenges: [
      { team_id: TEAM_ID, id: "mine", challenger_id: "player@example.com", challenger_name: "Player One", opponent_id: "other@example.com", opponent_name: "Player Two", drill_id: "d1", drill_name: "Drill", challenger_score: 5, status: "pending", created_ts: 1 },
      { team_id: TEAM_ID, id: "not-mine", challenger_id: "other@example.com", challenger_name: "Player Two", opponent_id: "third@example.com", opponent_name: "Player Three", drill_id: "d1", drill_name: "Drill", challenger_score: 6, status: "pending", created_ts: 2 },
      { team_id: TEAM_ID, id: "removed", challenger_id: "player@example.com", challenger_name: "Player One", opponent_id: "removed@example.com", opponent_name: "Removed", drill_id: "d1", drill_name: "Drill", challenger_score: 7, status: "pending", created_ts: 3 },
    ],
  });
  try {
    const response = await getPlayerChallenges(context({
      path: `/v1/player-challenges?team_id=${TEAM_ID}`,
      headers: { "x-user-id": "player@example.com" },
    }));
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.deepEqual(body.challenges.map((row) => row.id), ["mine"]);
    assert.ok(body.challenges.every((row) => row.from === "player@example.com" || row.to === "player@example.com"));
  } finally {
    backend.restore();
  }
});

test("only the named opponent can respond and the server computes the outcome", async () => {
  const backend = installBackend({
    challenges: [{ team_id: TEAM_ID, id: "duel", challenger_id: "player@example.com", challenger_name: "Player One", opponent_id: "other@example.com", opponent_name: "Player Two", drill_id: "d1", drill_name: "Drill", challenger_score: 12, max_score: 20, response_score: null, status: "pending", created_ts: 10, responded_ts: null }],
  });
  try {
    const forged = await mutatePlayerChallenge(context({
      method: "POST",
      headers: { "x-user-id": "third@example.com" },
      body: { team_id: TEAM_ID, action: "respond", challenge: { id: "duel", score: 15 } },
    }));
    assert.equal(forged.status, 403);

    const response = await mutatePlayerChallenge(context({
      method: "POST",
      headers: { "x-user-id": "other@example.com" },
      body: { team_id: TEAM_ID, action: "respond", challenge: { id: "duel", score: 15, status: "lost" } },
    }));
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.challenge.status, "won");
    assert.equal(body.challenge.respScore, 15);
    assert.equal(backend.state.player_challenges[0].status, "won");
  } finally {
    backend.restore();
  }
});

test("client rejects malformed success responses and promotes only authored pending local rows", async () => {
  const storage = memoryStorage([
    ["sl:session", JSON.stringify({ email: "player@example.com", teamId: TEAM_ID, role: "player" })],
    ["sl:players", JSON.stringify(ROSTER.map((row) => ({ ...row, teamId: row.team_id })))],
    ["sl:supabase-session", JSON.stringify({ access_token: "player-token" })],
  ]);
  const malformed = createPlayerChallengePersistenceService({
    storage,
    fetchImpl: async () => new Response("<!doctype html>", { status: 200, headers: { "content-type": "text/html" } }),
  });
  await assert.rejects(malformed.loadChallenges({ teamId: TEAM_ID }), (error) => error?.code === "player_challenge_load_failed");

  const posted = [];
  const requestHeaders = [];
  const service = createPlayerChallengePersistenceService({
    storage,
    fetchImpl: async (_input, init = {}) => {
      if (String(init.method || "GET").toUpperCase() === "GET") {
        return Response.json({ ok: true, storage_mode: "signed_api", team_id: TEAM_ID, challenges: [] });
      }
      const body = JSON.parse(init.body);
      posted.push(body);
      requestHeaders.push(new Headers(init.headers));
      return Response.json({ ok: true, storage_mode: "signed_api", team_id: TEAM_ID, challenge: { ...body.challenge, from: "player@example.com", fromName: "Player One", status: "pending" } }, { status: 201 });
    },
  });
  const localOutgoing = { ...CHALLENGE_INPUT, from: "player@example.com", fromName: "Player One", status: "pending" };
  const localIncoming = { ...CHALLENGE_INPUT, id: "incoming", from: "other@example.com", to: "player@example.com", status: "pending" };
  const result = await service.hydrateChallenges({ teamId: TEAM_ID, localChallenges: [localOutgoing, localIncoming] });
  assert.equal(result.promotedCount, 1);
  assert.deepEqual(posted.map((row) => row.challenge.id), ["challenge-1"]);
  assert.deepEqual(result.rows.map((row) => row.id), ["challenge-1"]);
  assert.equal(requestHeaders[0].get("authorization"), "Bearer player-token");
});

test("merge keeps remote challenge state authoritative by durable id", () => {
  const local = { ...CHALLENGE_INPUT, from: "player@example.com", status: "pending" };
  const remote = { ...local, respScore: 20, respTs: 2000, status: "won" };
  assert.deepEqual(mergePlayerChallenges([local], [remote]), [expectChallenge(remote)]);
});

function expectChallenge(row) {
  return Object.fromEntries(Object.entries({
    id: row.id,
    teamId: row.teamId,
    playerId: row.playerId || row.from,
    from: row.from,
    fromName: row.fromName,
    to: row.to,
    toName: row.toName,
    drillId: row.drillId,
    drillName: row.drillName,
    score: row.score,
    max: row.max,
    respScore: row.respScore,
    status: row.status,
    ts: row.ts,
    respTs: row.respTs,
  }).filter(([, value]) => value !== null && value !== "" && value !== undefined));
}

test("migration and UI enforce the signed service-only cross-device contract", () => {
  const migration = fs.readFileSync(new URL("../migrations/053_player_challenges_signed_api.sql", import.meta.url), "utf8");
  const app = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
  assert.match(migration, /alter table public\.player_challenges enable row level security/i);
  assert.match(migration, /revoke all privileges on table public\.player_challenges from public, anon, authenticated/i);
  assert.match(migration, /grant select, insert, update, delete on table public\.player_challenges to service_role/i);
  assert.match(migration, /player_challenges_team_challenger_created_idx/);
  assert.match(migration, /player_challenges_team_opponent_created_idx/);
  assert.match(app, /playerChallengePersistence\.hydrateChallenges/);
  assert.match(app, /playerChallengePersistence\.createChallenge/);
  assert.match(app, /playerChallengePersistence\.respondChallenge/);
  assert.match(app, /<DuelsPanel u=\{u\} challenges=\{challenges\}/);
  assert.match(app, /Challenge could not be delivered\. Please try again\./);
});

test("demo challenge creation remains local-only at the production host", async () => {
  const response = await mutatePlayerChallenge(context({
    method: "POST",
    host: "shotlab3.pages.dev",
    headers: { "x-user-id": "demo@shotlab.app" },
    body: { team_id: "demo-team", action: "create", challenge: { ...CHALLENGE_INPUT, teamId: "demo-team", from: "demo@shotlab.app" } },
  }));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.storage_mode, "demo_local");
  assert.equal(body.challenge.from, "demo@shotlab.app");
});
