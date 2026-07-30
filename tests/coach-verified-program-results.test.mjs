import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  onRequestDelete,
  onRequestGet,
  onRequestPost,
  sanitizeProgramScoreRow,
} from "../functions/v1/program-scores/index.js";
import { createProgramScorePersistenceService } from "../src/lib/programScorePersistenceService.js";
import {
  buildCoachVerifiedProgramScoreRow,
  validateCoachProgramScoreEntry,
} from "../src/lib/coachProgramScoreEntry.js";

const ENV = {
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
  SUPABASE_ANON_KEY: "anon-key",
};

const PROGRAM_SCORE = {
  id: "program-score-1",
  team_id: "team-a",
  player_id: "player@example.com",
  player_email: "player@example.com",
  player_name: "Player One",
  drill_id: "program-1",
  drill_name: "Pressure Free Throws",
  score: 18,
  session_date: "2026-07-30",
  src: "program",
};

function requestContext({ method = "GET", path = "/v1/program-scores", body, requester = "coach@example.com" } = {}) {
  return {
    request: new Request(`https://shotlab.test${path}`, {
      method,
      headers: {
        "x-user-id": requester,
        ...(body === undefined ? {} : { "content-type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    }),
    env: ENV,
  };
}

function filterValue(value) {
  return String(value || "").replace(/^eq\./, "");
}

function installBackend({
  requester = "coach@example.com",
  role = "coach",
  roster = [{ id: "player@example.com", email: "player@example.com", role: "player", team_id: "team-a", hide_from_leaderboards: false }],
  profiles = [],
  scores = [],
} = {}) {
  const originalFetch = global.fetch;
  const calls = [];
  global.fetch = async (input, init = {}) => {
    const url = new URL(String(input));
    const method = init.method || "GET";
    calls.push({ url: url.toString(), method, body: init.body ? JSON.parse(init.body) : null });
    if (url.pathname.endsWith("/rpc/resolve_app_user_uuid")) return Response.json(`uuid-${requester.split("@")[0]}`);
    if (url.pathname.endsWith("/legacy_auth_profiles")) return Response.json([{ team_id: "team-a", role }]);
    if (url.pathname.endsWith("/team_memberships")) return Response.json([{ team_id: "team-a", role, status: "active" }]);
    if (url.pathname.endsWith("/teams")) return Response.json(role === "coach" ? [{ id: "team-a", coach_user_id: `uuid-${requester.split("@")[0]}` }] : []);
    if (url.pathname.endsWith("/players")) return Response.json(roster);
    if (url.pathname.endsWith("/player_profiles")) return Response.json(profiles);
    if (url.pathname.endsWith("/program_scores")) {
      if (method === "POST") return Response.json(init.body ? JSON.parse(init.body) : [], { status: 201 });
      if (method === "DELETE") {
        const identity = filterValue(url.searchParams.get("player_email") || url.searchParams.get("player_id"));
        return Response.json(scores.filter((row) => row.player_email === identity || row.player_id === identity));
      }
      const id = filterValue(url.searchParams.get("id"));
      if (id) return Response.json(scores.filter((row) => row.id === id));
      return Response.json(scores);
    }
    return Response.json([]);
  };
  return { calls, restore: () => { global.fetch = originalFetch; } };
}

test("coach entry model validates drill limits and builds a player-scoped Program row", () => {
  const player = { id: "player-1", email: "Player@Example.com", name: "Player One", teamId: "team-a" };
  const drill = { id: "program-1", name: "Pressure Free Throws", max: 20 };
  assert.equal(validateCoachProgramScoreEntry({ player, drill, score: 21, date: "2026-07-30" }).ok, false);
  assert.equal(validateCoachProgramScoreEntry({ player, drill: { ...drill, max: null }, score: 21, date: "2026-07-30" }).ok, true);
  const row = buildCoachVerifiedProgramScoreRow({
    id: "verified-1",
    player,
    drill,
    score: 18,
    date: "2026-07-30",
    teamId: "team-a",
    now: 123,
  });
  assert.equal(row.email, "player@example.com");
  assert.equal(row.playerId, "player@example.com");
  assert.equal(row.drillId, "program-1");
  assert.equal(row.score, 18);
  assert.equal(row.src, "program");
});

test("program score sanitizer accepts only bounded Program result fields", () => {
  const row = sanitizeProgramScoreRow({ ...PROGRAM_SCORE, player_email: " PLAYER@EXAMPLE.COM ", score: -2 });
  assert.equal(row.playerEmail, "player@example.com");
  assert.equal(row.score, 0);
  assert.equal(row.teamId, "team-a");
});

test("coach may record a server-audited result only for an active roster player", async () => {
  let backend = installBackend();
  try {
    const response = await onRequestPost(requestContext({
      method: "POST",
      body: { program_scores: [{ ...PROGRAM_SCORE, logged_at: "2000-01-01T00:00:00.000Z" }] },
    }));
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.program_scores[0].recorded_by, "coach@example.com");
    assert.equal(body.program_scores[0].recorded_by_role, "coach");
    const write = backend.calls.find((call) => call.method === "POST" && call.url.includes("/program_scores?"));
    assert.equal(write.body[0].player_email, "player@example.com");
    assert.equal(write.body[0].recorded_by, "coach@example.com");
    assert.notEqual(write.body[0].logged_at, "2000-01-01T00:00:00.000Z");
  } finally {
    backend.restore();
  }

  backend = installBackend({ roster: [], profiles: [] });
  try {
    const rejected = await onRequestPost(requestContext({
      method: "POST",
      body: { program_scores: [PROGRAM_SCORE] },
    }));
    assert.equal(rejected.status, 403);
    assert.equal((await rejected.json()).error, "active_roster_player_required");
  } finally {
    backend.restore();
  }
});

test("player writes remain self-only while readable team results stay available", async () => {
  const backend = installBackend({ requester: "player@example.com", role: "player", scores: [PROGRAM_SCORE] });
  try {
    const read = await onRequestGet(requestContext({
      path: "/v1/program-scores?team_id=team-a",
      requester: "player@example.com",
    }));
    assert.equal(read.status, 200);
    assert.equal((await read.json()).program_scores.length, 1);

    const mismatch = await onRequestPost(requestContext({
      method: "POST",
      requester: "player@example.com",
      body: { program_scores: [{ ...PROGRAM_SCORE, player_id: "other@example.com", player_email: "other@example.com" }] },
    }));
    assert.equal(mismatch.status, 403);
    assert.equal((await mismatch.json()).error, "identity_mismatch");
  } finally {
    backend.restore();
  }
});

test("coaches can delete Program results only inside writable teams", async () => {
  const backend = installBackend({ scores: [PROGRAM_SCORE] });
  try {
    const response = await onRequestDelete(requestContext({
      method: "DELETE",
      body: { team_id: "team-a", player_identity: "player@example.com" },
    }));
    assert.equal(response.status, 200);
    assert.equal((await response.json()).deleted_count, 1);
    assert.equal(backend.calls.filter((call) => call.method === "DELETE" && call.url.includes("/program_scores?")).length, 2);
  } finally {
    backend.restore();
  }
});

test("browser Program score service uses only the signed API", async () => {
  const storage = {
    values: new Map([
      ["sl:session", JSON.stringify({ email: "coach@example.com" })],
      ["sl:supabase-session", JSON.stringify({ access_token: "user-token" })],
    ]),
    getItem(key) { return this.values.get(key) || null; },
  };
  const calls = [];
  const service = createProgramScorePersistenceService({
    storage,
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return Response.json({ ok: true, storage_mode: "signed_api", program_scores: [PROGRAM_SCORE], deleted_count: 1 });
    },
  });
  await service.loadProgramScores();
  await service.upsertProgramScores([PROGRAM_SCORE]);
  await service.deletePlayerProgramScores({ teamId: "team-a", playerIdentity: "player@example.com" });
  assert.deepEqual(calls.map((call) => [call.url, call.options.method]), [
    ["/v1/program-scores", "GET"],
    ["/v1/program-scores", "POST"],
    ["/v1/program-scores", "DELETE"],
  ]);
  assert.ok(calls.every((call) => call.options.headers.Authorization === "Bearer user-token"));
  assert.ok(calls.every((call) => !String(call.url).includes("/rest/v1/program_scores")));
});

test("migration and app wiring close direct Program score access and replace the dead quick action", () => {
  const migration = fs.readFileSync(new URL("../migrations/048_program_scores_signed_api_boundary.sql", import.meta.url), "utf8");
  const adapter = fs.readFileSync(new URL("../src/lib/supabase.js", import.meta.url), "utf8");
  const app = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
  const commandCenter = fs.readFileSync(new URL("../src/components/CoachCommandCenter.jsx", import.meta.url), "utf8");
  assert.match(migration, /revoke all privileges on table public\.program_scores from public, anon, authenticated/i);
  assert.match(migration, /grant select, insert, update, delete on table public\.program_scores to service_role/i);
  assert.doesNotMatch(migration, /create policy/i);
  assert.match(adapter, /if \(table === "program_scores"\) return programScoreApiRequest/);
  assert.match(adapter, /programScorePersistence\.upsertProgramScores/);
  assert.match(app, /<CoachProgramScoreDrawer/);
  assert.match(app, /addCoachProgramScore/);
  assert.doesNotMatch(app, /TODO: Route to dedicated coach score logging flow/);
  assert.match(commandCenter, /Record Result/);
});
