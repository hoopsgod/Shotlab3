import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { onRequestGet, onRequestPost } from "../functions/v1/season-archives/index.js";
import { normalizeRestWriteBody, __testUtils as supabaseTestUtils } from "../src/lib/supabase.js";

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
      return jsonResponse(role === "none" ? [] : [{ team_id: "team-a", role }]);
    }
    if (href.includes("/rest/v1/team_memberships")) {
      return jsonResponse(role === "none" ? [] : [{ team_id: "team-a", role, status: "active" }]);
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

test("demo coach archive is validated but never written to production", async () => {
  const mock = installFetch();
  try {
    const demoArchive = {
      ...archive,
      id: "season_demo_team_2026-summer_20260704000000000",
      archivedBy: { email: "coach.demo@shotlab.app", name: "Demo Coach", role: "coach" },
    };
    const request = new Request("https://app.test/v1/season-archives", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": "coach.demo@shotlab.app" },
      body: JSON.stringify({ team_id: "team-a", archive: demoArchive }),
    });
    const response = await onRequestPost({ request, env });
    const body = await response.json();
    assert.equal(response.status, 201);
    assert.equal(body.ok, true);
    assert.equal(body.archive.storageMode, "demo_local");
    assert.equal(body.archive.demoLocalOnly, true);
    assert.equal(mock.calls.length, 0, "demo archive must not access Supabase");
  } finally {
    mock.restore();
  }
});

test("demo coach GET preserves browser cache by returning demo-local-only", async () => {
  const mock = installFetch();
  try {
    const request = new Request("https://app.test/v1/season-archives", { headers: { "x-user-id": "coach.demo@shotlab.app" } });
    const response = await onRequestGet({ request, env });
    const body = await response.json();
    assert.equal(response.status, 409);
    assert.equal(body.error, "demo_local_only");
    assert.equal(body.local_only, true);
    assert.equal(mock.calls.length, 0);
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

test("GET returns full archives only from coach-authorized teams", async () => {
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

test("registered player can read only their own career projection", async () => {
  const playerEmail = "player@a.test";
  const otherPlayerEmail = "other@a.test";
  const storedArchive = {
    ...archive,
    rosterSnapshot: [
      { email: playerEmail, teamId: "team-a", name: "Player A" },
      { email: otherPlayerEmail, teamId: "team-a", name: "Player B" },
    ],
    eventSnapshot: [{ id: "event-private", teamId: "team-a", title: "Coach-only archive detail" }],
    playerSeasonSummaries: [
      { email: playerEmail, totalHomeMakes: 25, totalShotLogMakes: 30 },
      { email: otherPlayerEmail, totalHomeMakes: 900, totalShotLogMakes: 900 },
    ],
    homeScoresSnapshot: [
      { email: playerEmail, teamId: "team-a", score: 25 },
      { email: otherPlayerEmail, teamId: "team-a", score: 900 },
    ],
  };
  const storedRow = {
    id: archive.id,
    team_id: "team-a",
    season_name: archive.seasonName,
    season_start_date: archive.seasonStartDate,
    season_end_date: archive.seasonEndDate,
    created_at: archive.createdAt,
    archive_version: 2,
    snapshot: storedArchive,
  };
  const mock = installFetch({ role: "player", storedRows: [storedRow] });
  try {
    const request = new Request("https://app.test/v1/season-archives?team_id=team-a", {
      headers: { "x-user-id": playerEmail },
    });
    const response = await onRequestGet({ request, env });
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.archives.length, 1);
    assert.equal(body.archives[0].accessMode, "player_self");
    assert.deepEqual(body.archives[0].playerSeasonSummaries.map((row) => row.email), [playerEmail]);
    assert.deepEqual(body.archives[0].homeScoresSnapshot.map((row) => row.email), [playerEmail]);
    assert.equal("rosterSnapshot" in body.archives[0], false);
    assert.equal("eventSnapshot" in body.archives[0], false);
    assert.equal(JSON.stringify(body).includes(otherPlayerEmail), false);
    assert.equal(JSON.stringify(body).includes("Coach-only archive detail"), false);
  } finally {
    mock.restore();
  }
});

test("production archive API rejects a spoofed identity header", async () => {
  const request = new Request("https://shotlab3.pages.dev/v1/season-archives", {
    headers: { "x-user-id": coachEmail },
  });
  const response = await onRequestGet({ request, env });
  assert.equal(response.status, 401);
  assert.equal((await response.json()).error, "unauthorized");
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

test("Supabase write normalization strips unsupported schema fields and aligns bulk keys", () => {
  const rows = normalizeRestWriteBody("teams", [
    {
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      name: "Varsity",
      branding: { primary: "lime" },
      joinCode: "ABC123",
      school: "Thomas",
    },
    {
      id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      name: "JV",
      level: "JV",
    },
  ]);
  assert.equal(rows.length, 2);
  assert.deepEqual(Object.keys(rows[0]), Object.keys(rows[1]));
  assert.ok(!("branding" in rows[0]));
  assert.ok(!("joinCode" in rows[0]));
  assert.equal(rows[1].school, null);

  const profiles = normalizeRestWriteBody("player_profiles", [{
    id: "profile-1",
    team_id: "team-a",
    email: "p@a.test",
    first_name: "Player",
    updated_at: 123,
    created_at: 100,
  }]);
  assert.equal(profiles.length, 1);
  assert.ok(!("updated_at" in profiles[0]));
  assert.ok(!("created_at" in profiles[0]));
});

test("demo persistence session is detected without touching production", () => {
  const originalWindow = globalThis.window;
  const values = new Map([
    ["sl:session", JSON.stringify({ email: "coach.demo@shotlab.app" })],
    ["sl:demoMode", "true"],
  ]);
  globalThis.window = { localStorage: { getItem: (key) => values.get(key) ?? null } };
  try {
    assert.equal(supabaseTestUtils.isDemoPersistenceSession(), true);
  } finally {
    if (originalWindow === undefined) delete globalThis.window;
    else globalThis.window = originalWindow;
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
