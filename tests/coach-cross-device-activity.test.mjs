import assert from "node:assert/strict";
import test from "node:test";
import { onRequestGet, parseActivityLimit } from "../functions/v1/coach/activity/first-results.js";
import {
  getRemoteActiveNamesToday,
  loadCoachCrossDeviceActivity,
  mergeCoachActivityItems,
  normalizeCoachRemoteResult,
  resolveCoachActivityContext,
} from "../src/lib/coachCrossDeviceActivity.js";

const storage = (rows) => ({ getItem: (key) => (key in rows ? JSON.stringify(rows[key]) : null) });

test("coach context resolves the signed-in coach and active team", () => {
  const context = resolveCoachActivityContext({
    joinCode: "CROSS26",
    storage: storage({
      "sl:session": { email: "Coach@Example.com" },
      "sl:players": [{ email: "coach@example.com", role: "coach", teamId: "team-1" }],
      "sl:teams": [{ id: "team-1", joinCode: "CROSS26", ownerCoachId: "coach@example.com" }],
    }),
  });
  assert.deepEqual(context, { ok: true, requester: "coach@example.com", teamId: "team-1" });
});

test("remote results normalize, sort, dedupe, and identify today's active players", () => {
  const today = new Date().toISOString().slice(0, 10);
  const remote = normalizeCoachRemoteResult({ id: "result-1", player_email: "ari@example.com", player_name: "Ari Player", made: 33, date: today, observed_at: `${today}T14:00:00Z` });
  assert.equal(remote.detail, "Home shots · 33 makes");
  const merged = mergeCoachActivityItems({
    localItems: [
      { id: "upcoming-event", type: "event", name: "Team", detail: "Team Practice · 6:00 PM", date: today },
      { id: "local-old", type: "shooting", name: "Older Player", detail: "home · 10 makes", date: "2026-07-01", observedAt: "2026-07-01T12:00:00Z" },
    ],
    remoteItems: [remote, remote],
  });
  assert.equal(merged.length, 2);
  assert.equal(merged[0].name, "Ari Player");
  assert.equal(merged.some((item) => item.type === "event" || item.name === "Team"), false);
  assert.deepEqual([...getRemoteActiveNamesToday(merged, today)], ["ari player"]);
});

test("upcoming team events alone never count as player engagement", () => {
  const merged = mergeCoachActivityItems({
    localItems: [{ id: "event-1", type: "event", name: "Team", title: "Team Practice", detail: "Tomorrow · Main Gym", date: "2026-08-03" }],
    remoteItems: [],
  });
  assert.deepEqual(merged, []);
});

test("coach activity client sends only team-scoped identity and maps results", async () => {
  let request = null;
  const result = await loadCoachCrossDeviceActivity({
    joinCode: "CROSS26",
    storage: storage({
      "sl:session": { email: "coach@example.com" },
      "sl:players": [{ email: "coach@example.com", role: "coach", teamId: "team-1" }],
      "sl:teams": [{ id: "team-1", joinCode: "CROSS26" }],
    }),
    fetchImpl: async (url, options) => {
      request = { url, options };
      return new Response(JSON.stringify({ ok: true, results: [{ id: "result-1", player_name: "Ari Player", player_email: "ari@example.com", made: 33, date: "2026-08-02", observed_at: "2026-08-02T17:00:00Z" }] }), { status: 200, headers: { "Content-Type": "application/json" } });
    },
  });
  assert.equal(result.ok, true);
  assert.equal(result.items[0].name, "Ari Player");
  assert.match(request.url, /team_id=team-1/);
  assert.equal(request.options.headers["x-user-id"], "coach@example.com");
  assert.equal(request.options.cache, "no-store");
});

test("activity limit remains bounded", () => {
  assert.equal(parseActivityLimit(undefined), 25);
  assert.equal(parseActivityLimit("0"), 1);
  assert.equal(parseActivityLimit("999"), 50);
});

test("coach-only endpoint returns minimal authorized team evidence", { concurrency: false }, async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url) => {
    calls.push(String(url));
    if (String(url).includes("legacy_auth_profiles")) return new Response(JSON.stringify([{ email: "coach@example.com", role: "coach", team_id: "team-1" }]), { status: 200 });
    if (String(url).includes("shot_logs")) return new Response(JSON.stringify([
      { id: "result-1", team_id: "team-1", player_id: "ari@example.com", email: "ari@example.com", name: "Ari Player", made: 33, date: "2026-08-02", ts: "2026-08-02T17:00:00Z", password: "must-not-leak" },
      { id: "wrong-team", team_id: "team-2", player_id: "other@example.com", email: "other@example.com", name: "Other", made: 50, date: "2026-08-02", ts: "2026-08-02T18:00:00Z" },
    ]), { status: 200 });
    throw new Error(`Unexpected URL ${url}`);
  };
  try {
    const response = await onRequestGet({
      request: new Request("https://shotlab.test/v1/coach/activity/first-results?team_id=team-1", { headers: { "x-user-id": "coach@example.com" } }),
      env: { SUPABASE_URL: "https://db.test", SUPABASE_SERVICE_ROLE_KEY: "service-role" },
    });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.count, 1);
    assert.deepEqual(Object.keys(body.results[0]).sort(), ["date", "id", "made", "observed_at", "player_email", "player_id", "player_name", "team_id"]);
    assert.equal(body.results[0].player_name, "Ari Player");
    assert.equal(response.headers.get("Cache-Control"), "private, no-store");
    assert.ok(calls.some((url) => url.includes("team_id=eq.team-1")));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("coach-only endpoint rejects a requester outside the team", { concurrency: false }, async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    if (String(url).includes("legacy_auth_profiles")) return new Response(JSON.stringify([{ email: "outsider@example.com", role: "coach", team_id: "team-2" }]), { status: 200 });
    if (String(url).includes("teams")) return new Response(JSON.stringify([{ id: "team-1", owner_coach_id: "coach@example.com" }]), { status: 200 });
    throw new Error(`Unexpected URL ${url}`);
  };
  try {
    const response = await onRequestGet({
      request: new Request("https://shotlab.test/v1/coach/activity/first-results?team_id=team-1", { headers: { "x-user-id": "outsider@example.com" } }),
      env: { SUPABASE_URL: "https://db.test", SUPABASE_SERVICE_ROLE_KEY: "service-role" },
    });
    assert.equal(response.status, 403);
    assert.deepEqual(await response.json(), { error: "forbidden" });
  } finally {
    globalThis.fetch = originalFetch;
  }
});
