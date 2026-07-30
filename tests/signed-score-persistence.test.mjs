import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  onRequestDelete,
  onRequestGet,
  onRequestPost,
  sanitizeScoreRow,
} from "../functions/v1/scores/index.js";
import { createScorePersistenceService } from "../src/lib/scorePersistenceService.js";

const ENV = {
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
  SUPABASE_ANON_KEY: "anon-key",
};

function requestContext({ method = "GET", path = "/v1/scores", body, headers = {}, host = "shotlab.test" } = {}) {
  return {
    request: new Request(`https://${host}${path}`, {
      method,
      headers: { ...(body === undefined ? {} : { "content-type": "application/json" }), ...headers },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    }),
    env: ENV,
  };
}

function installBackendMock({
  requester = "player@example.com",
  role = "player",
  teamId = "team-a",
  scores = [],
  existingById = {},
} = {}) {
  const originalFetch = global.fetch;
  const calls = [];
  global.fetch = async (input, init = {}) => {
    const url = new URL(String(input));
    calls.push({ url: url.toString(), method: init.method || "GET", body: init.body ? JSON.parse(init.body) : null });

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
    if (url.pathname.endsWith("/scores")) {
      if ((init.method || "GET") === "POST") return Response.json(init.body ? JSON.parse(init.body) : [], { status: 201 });
      if ((init.method || "GET") === "DELETE") {
        const identity = url.searchParams.get("email") || url.searchParams.get("player_id");
        const deleted = scores.filter((row) => row.team_id === url.searchParams.get("team_id") && (row.email === identity || row.player_id === identity));
        return Response.json(deleted);
      }
      const id = url.searchParams.get("id");
      if (id) return Response.json(existingById[id] ? [existingById[id]] : []);
      const requestedTeam = url.searchParams.get("team_id");
      return Response.json(scores.filter((row) => !requestedTeam || row.team_id === requestedTeam));
    }
    return Response.json([]);
  };
  return { calls, restore: () => { global.fetch = originalFetch; } };
}

const PLAYER_SCORE = {
  id: "score-1",
  email: "player@example.com",
  name: "Player One",
  team_id: "team-a",
  drill_id: "form-shooting",
  score: 42,
  date: "2026-07-30",
  ts: 1_722_353_200_000,
  src: "home",
  player_id: "player@example.com",
};

test("score sanitizer bounds identity and numeric fields", () => {
  const row = sanitizeScoreRow({
    ...PLAYER_SCORE,
    email: " PLAYER@EXAMPLE.COM ",
    score: 2_000_000_000,
    ts: -100,
    src: "unknown",
  });
  assert.equal(row.email, "player@example.com");
  assert.equal(row.score, 1_000_000_000);
  assert.equal(row.ts, 0);
  assert.equal(row.src, "home");
});

test("production email headers are not accepted as score identity proof", async () => {
  const response = await onRequestGet(requestContext({
    host: "app.shotlab.com",
    headers: { "x-user-id": "player@example.com" },
  }));
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: "unauthorized" });
});

test("player and coach reads are limited to readable team scores", async () => {
  const backend = installBackendMock({ scores: [PLAYER_SCORE, { ...PLAYER_SCORE, id: "score-b", team_id: "team-b" }] });
  try {
    const allowed = await onRequestGet(requestContext({
      path: "/v1/scores?team_id=team-a",
      headers: { "x-user-id": "player@example.com" },
    }));
    assert.equal(allowed.status, 200);
    assert.deepEqual((await allowed.json()).scores.map((row) => row.id), ["score-1"]);

    const forbidden = await onRequestGet(requestContext({
      path: "/v1/scores?team_id=team-b",
      headers: { "x-user-id": "player@example.com" },
    }));
    assert.equal(forbidden.status, 403);
  } finally {
    backend.restore();
  }
});

test("player may upsert only their own score in their active team", async () => {
  const backend = installBackendMock();
  try {
    const response = await onRequestPost(requestContext({
      method: "POST",
      headers: { "x-user-id": "player@example.com" },
      body: { scores: [PLAYER_SCORE] },
    }));
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.ok, true);
    assert.equal(body.scores[0].email, "player@example.com");
    const post = backend.calls.find((call) => call.method === "POST" && call.url.includes("/scores?"));
    assert.equal(post.body[0].team_id, "team-a");
    assert.equal(post.body[0].player_id, "player@example.com");
  } finally {
    backend.restore();
  }
});

test("player cross-identity writes and coach score writes are rejected", async () => {
  let backend = installBackendMock();
  try {
    const mismatch = await onRequestPost(requestContext({
      method: "POST",
      headers: { "x-user-id": "player@example.com" },
      body: { scores: [{ ...PLAYER_SCORE, email: "other@example.com", player_id: "other@example.com" }] },
    }));
    assert.equal(mismatch.status, 403);
    assert.equal((await mismatch.json()).error, "identity_mismatch");
  } finally {
    backend.restore();
  }

  backend = installBackendMock({ requester: "coach@example.com", role: "coach" });
  try {
    const coachWrite = await onRequestPost(requestContext({
      method: "POST",
      headers: { "x-user-id": "coach@example.com" },
      body: { scores: [{ ...PLAYER_SCORE, email: "coach@example.com", player_id: "coach@example.com" }] },
    }));
    assert.equal(coachWrite.status, 403);
    assert.equal((await coachWrite.json()).error, "player_score_write_required");
  } finally {
    backend.restore();
  }
});

test("existing score ids cannot be claimed by a different player", async () => {
  const backend = installBackendMock({
    existingById: {
      "score-1": { ...PLAYER_SCORE, email: "other@example.com", player_id: "other@example.com" },
    },
  });
  try {
    const response = await onRequestPost(requestContext({
      method: "POST",
      headers: { "x-user-id": "player@example.com" },
      body: { scores: [PLAYER_SCORE] },
    }));
    assert.equal(response.status, 409);
    assert.equal((await response.json()).error, "score_id_conflict");
  } finally {
    backend.restore();
  }
});

test("players delete only self scores and coaches delete only inside writable teams", async () => {
  let backend = installBackendMock({ scores: [PLAYER_SCORE] });
  try {
    const mismatch = await onRequestDelete(requestContext({
      method: "DELETE",
      headers: { "x-user-id": "player@example.com" },
      body: { team_id: "team-a", player_identity: "other@example.com" },
    }));
    assert.equal(mismatch.status, 403);
    assert.equal((await mismatch.json()).error, "identity_mismatch");

    const selfDelete = await onRequestDelete(requestContext({
      method: "DELETE",
      headers: { "x-user-id": "player@example.com" },
      body: { team_id: "team-a", player_identity: "player@example.com" },
    }));
    assert.equal(selfDelete.status, 200);
    assert.equal((await selfDelete.json()).deleted_count, 1);
  } finally {
    backend.restore();
  }

  backend = installBackendMock({ requester: "coach@example.com", role: "coach", scores: [PLAYER_SCORE] });
  try {
    const coachDelete = await onRequestDelete(requestContext({
      method: "DELETE",
      headers: { "x-user-id": "coach@example.com" },
      body: { team_id: "team-a", player_identity: "player@example.com" },
    }));
    assert.equal(coachDelete.status, 200);
    const deleteCalls = backend.calls.filter((call) => call.method === "DELETE" && call.url.includes("/scores?"));
    assert.equal(deleteCalls.length, 2);
    assert.ok(deleteCalls.every((call) => call.url.includes("team_id=eq.team-a")));
  } finally {
    backend.restore();
  }
});

test("browser score service sends bearer identity and never calls the scores table directly", async () => {
  const storage = {
    values: new Map([
      ["sl:session", JSON.stringify({ email: "player@example.com" })],
      ["sl:supabase-session", JSON.stringify({ access_token: "user-token" })],
    ]),
    getItem(key) { return this.values.get(key) || null; },
  };
  const calls = [];
  const service = createScorePersistenceService({
    storage,
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return Response.json({ ok: true, storage_mode: "signed_api", scores: [PLAYER_SCORE], deleted_count: 1 });
    },
  });

  await service.loadScores();
  await service.upsertScores([PLAYER_SCORE]);
  await service.deletePlayerScores({ teamId: "team-a", playerIdentity: "player@example.com" });

  assert.deepEqual(calls.map((call) => [call.url, call.options.method]), [
    ["/v1/scores", "GET"],
    ["/v1/scores", "POST"],
    ["/v1/scores", "DELETE"],
  ]);
  assert.ok(calls.every((call) => call.options.headers.Authorization === "Bearer user-token"));
  assert.ok(calls.every((call) => call.options.headers["x-user-id"] === "player@example.com"));
  assert.ok(calls.every((call) => !String(call.url).includes("/rest/v1/scores")));
});

test("scores table migration removes all direct browser policies and privileges", () => {
  const migration = fs.readFileSync(new URL("../migrations/041_scores_signed_api_boundary.sql", import.meta.url), "utf8");
  const adapter = fs.readFileSync(new URL("../src/lib/supabase.js", import.meta.url), "utf8");

  assert.match(migration, /drop policy if exists "Allow all" on public\.scores/i);
  assert.match(migration, /drop policy if exists scores_client_insert_player_rows on public\.scores/i);
  assert.match(migration, /drop policy if exists scores_client_select_team_rows on public\.scores/i);
  assert.match(migration, /drop policy if exists scores_client_update_player_rows on public\.scores/i);
  assert.match(migration, /revoke all privileges on table public\.scores from public, anon, authenticated/i);
  assert.match(migration, /grant select, insert, update, delete on table public\.scores to service_role/i);
  assert.doesNotMatch(migration, /create policy/i);

  assert.match(adapter, /if \(table === "scores"\) return scoreApiRequest/);
  assert.match(adapter, /scorePersistence\.loadScores/);
  assert.match(adapter, /scorePersistence\.upsertScores/);
});
