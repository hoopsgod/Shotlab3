import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { onRequestGet, onRequestPost } from "../functions/v1/season-archives/index.js";

const env = { SUPABASE_URL: "https://db.test", SUPABASE_SERVICE_ROLE_KEY: "service-key" };
const coachEmail = "coach@a.test";
const coachUuid = "11111111-1111-4111-8111-111111111111";

const archive = {
  id: "season_team-a_2026-summer_20260704000000000",
  teamId: "team-a",
  seasonName: "2026 Summer",
  seasonStartDate: "2026-05-01",
  seasonEndDate: "2026-07-01",
  createdAt: "2026-07-04T00:00:00.000Z",
  archivedBy: { email: coachEmail, name: "Coach A", role: "coach" },
  version: 2,
  rosterSnapshot: [],
  playerProfileSnapshot: [],
  homeScoresSnapshot: [],
  programScoresSnapshot: [],
  shotLogsSnapshot: [],
  eventSnapshot: [],
  eventRsvpSnapshot: [],
  scSessionSnapshot: [],
  scRsvpSnapshot: [],
  scLogSnapshot: [],
  programDrillSnapshot: [],
  drillSnapshot: [],
  challengeSnapshot: [],
  playerSeasonSummaries: [],
  summary: {},
};

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function installFetch({ role = "coach", duplicate = false, storedRows = [] } = {}) {
  const calls = [];
  const original = globalThis.fetch;
  globalThis.fetch = async (url, options = {}) => {
    const href = String(url);
    calls.push({ href, options });

    if (href.includes("/rest/v1/rpc/resolve_app_user_uuid")) return jsonResponse(coachUuid);
    if (href.includes("/rest/v1/legacy_auth_profiles")) {
      return jsonResponse(role === "coach" ? [{ team_id: "team-a", role: "coach" }] : []);
    }
    if (href.includes("/rest/v1/team_memberships")) {
      return jsonResponse(role === "coach" ? [{ team_id: "team-a", role: "coach", status: "active" }] : []);
    }
    if (href.includes("/rest/v1/teams")) return jsonResponse(role === "coach" ? [{ id: "team-a", coach_user_id: coachUuid }] : []);
    if (href.includes("/rest/v1/season_archives")) {
      if ((options.method || "GET") === "POST") {
        if (duplicate) return jsonResponse({ code: "23505", message: "duplicate key value violates unique constraint" }, 409);
        const row = JSON.parse(options.body)[0];
        return jsonResponse([row], 201);
      }
      return jsonResponse(storedRows);
    }
    throw new Error(`Unexpected fetch: ${href}`);
  };
  return { calls, restore: () => { globalThis.fetch = original; } };
}

test("authorized coach can insert an archive with insert-only semantics", async () => {
  const mock = installFetch();
  try {
    const request = new Request("https://app.test/v1/season-archives", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": coachEmail },
      body: JSON.stringify({ team_id: "team-a", archive }),
    });
    const response = await onRequestPost({ request, env });
    const body = await response.json();
    assert.equal(response.status, 201);
    assert.equal(body.ok, true);
    assert.equal(body.archive.teamId, "team-a");
    const insertCall = mock.calls.find((call) => call.href.includes("/rest/v1/season_archives") && call.options.method === "POST");
    assert.ok(insertCall);
    assert.ok(!insertCall.href.includes("on_conflict"), "archives must never use upsert semantics");
    const [inserted] = JSON.parse(insertCall.options.body);
    assert.equal(inserted.created_by, coachEmail);
    assert.equal(inserted.created_by_user_id, coachUuid);
    assert.equal(inserted.snapshot.archivedBy.email, coachEmail);
    assert.match(inserted.snapshot_hash, /^[a-f0-9]{64}$/);
  } finally {
    mock.restore();
  }
});

test("player or cross-team requester cannot create an archive", async () => {
  const mock = installFetch({ role: "player" });
  try {
    const request = new Request("https://app.test/v1/season-archives", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": "player@a.test" },
      body: JSON.stringify({ team_id: "team-a", archive }),
    });
    const response = await onRequestPost({ request, env });
    assert.equal(response.status, 403);
    assert.equal((await response.json()).error, "forbidden");
    assert.ok(!mock.calls.some((call) => call.href.includes("/rest/v1/season_archives") && call.options.method === "POST"));
  } finally {
    mock.restore();
  }
});

test("duplicate archive returns conflict rather than replacing history", async () => {
  const mock = installFetch({ duplicate: true });
  try {
    const request = new Request("https://app.test/v1/season-archives", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": coachEmail },
      body: JSON.stringify({ team_id: "team-a", archive }),
    });
    const response = await onRequestPost({ request, env });
    assert.equal(response.status, 409);
    assert.equal((await response.json()).error, "duplicate_archive");
  } finally {
    mock.restore();
  }
});

test("GET returns only archives from coach-authorized teams", async () => {
  const storedRow = {
    id: archive.id,
    team_id: "team-a",
    season_name: archive.seasonName,
    season_start_date: archive.seasonStartDate,
    season_end_date: archive.seasonEndDate,
    created_at: archive.createdAt,
    archive_version: 2,
    snapshot: archive,
  };
  const mock = installFetch({ storedRows: [storedRow] });
  try {
    const request = new Request("https://app.test/v1/season-archives", { headers: { "x-user-id": coachEmail } });
    const response = await onRequestGet({ request, env });
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.archives.length, 1);
    assert.equal(body.archives[0].teamId, "team-a");
    const archiveSelects = mock.calls.filter((call) => call.href.includes("/rest/v1/season_archives"));
    assert.equal(archiveSelects.length, 1);
    assert.match(archiveSelects[0].href, /team_id=eq\.team-a/);
  } finally {
    mock.restore();
  }
});

test("malformed or mismatched snapshots are rejected before database access", async () => {
  const mock = installFetch();
  try {
    const request = new Request("https://app.test/v1/season-archives", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": coachEmail },
      body: JSON.stringify({ team_id: "team-b", archive }),
    });
    const response = await onRequestPost({ request, env });
    assert.equal(response.status, 400);
    assert.equal((await response.json()).error, "team_mismatch");
    assert.equal(mock.calls.length, 0);
  } finally {
    mock.restore();
  }
});

test("migration enforces immutable, coach-scoped archive storage", () => {
  const sql = fs.readFileSync(new URL("../migrations/033_season_archives.sql", import.meta.url), "utf8");
  assert.match(sql, /create table if not exists public\.season_archives/i);
  assert.match(sql, /unique index[\s\S]*lower\(trim\(season_name\)\)/i);
  assert.match(sql, /enable row level security/i);
  assert.match(sql, /role in \('coach', 'assistant_coach'\)/i);
  assert.match(sql, /before update on public\.season_archives/i);
  assert.match(sql, /before delete on public\.season_archives/i);
  assert.match(sql, /revoke all on table public\.season_archives from public, anon/i);
  assert.doesNotMatch(sql, /grant[^;]*update/i);
  assert.doesNotMatch(sql, /grant[^;]*delete/i);
});
