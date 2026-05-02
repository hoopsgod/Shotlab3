import test from "node:test";
import assert from "node:assert/strict";
import { onRequestPost } from "../functions/v1/home-shots/log.js";
import { onRequestGet } from "../functions/v1/leaderboards/home-shots.js";

const ENV = { SUPABASE_URL: "https://example.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "service-role-key" };

function ctx(body, headers = {}) {
  return { request: new Request("https://shotlab.test/v1/home-shots/log", { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body ?? {}) }), env: ENV };
}

test("succeeds when x-user-id email resolves to UUID membership", async () => {
  const calls = [];
  const originalFetch = global.fetch;
  global.fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    if (String(url).includes("/rpc/resolve_app_user_uuid")) return new Response(JSON.stringify("uuid-1"), { status: 200 });
    if (String(url).includes("/team_memberships") && String(url).includes("user_id=eq.p%40x.com")) return new Response(JSON.stringify([]), { status: 200 });
    if (String(url).includes("/team_memberships") && String(url).includes("user_id=eq.uuid-1")) return new Response(JSON.stringify([{ id: "m1", status: "active" }]), { status: 200 });
    return new Response(JSON.stringify([{ id: 10, ...JSON.parse(init.body)[0] }]), { status: 201 });
  };
  try {
    const res = await onRequestPost(ctx({ team_id: "team-a", player_id: "p@x.com", email: "p@x.com", made: 50, date: "2026-05-01" }, { "x-user-id": "p@x.com" }));
    assert.equal(res.status, 200);
    const payload = await res.json();
    assert.equal(payload.ok, true);
    assert.equal(payload.diagnostic.authorized_by, "uuid");
    assert.equal(calls.length, 4);
  } finally { global.fetch = originalFetch; }
});

test("missing user identity returns diagnostic error", async () => {
  const res = await onRequestPost(ctx({ team_id: "team-a", email: "p@x.com", made: 1, date: "2026-05-01" }));
  assert.equal(res.status, 401);
  const body = await res.json();
  assert.equal(body.error, "missing_user_identity");
  assert.equal(body.diagnostic.stage, "request_identity");
});

test("email membership query failure is caught and surfaced", async () => {
  const originalFetch = global.fetch;
  global.fetch = async (url) => {
    if (String(url).includes("/rpc/resolve_app_user_uuid")) return new Response(JSON.stringify("uuid-2"), { status: 200 });
    if (String(url).includes("/team_memberships") && String(url).includes("user_id=eq.p%40x.com")) return new Response(JSON.stringify({ message: "boom" }), { status: 500 });
    return new Response(JSON.stringify([]), { status: 200 });
  };
  try {
    const res = await onRequestPost(ctx({ team_id: "team-a", player_id: "p@x.com", made: 1, date: "2026-05-01" }, { "x-user-id": "p@x.com" }));
    assert.equal(res.status, 500);
    const body = await res.json();
    assert.equal(body.error, "membership_email_query_failed");
    assert.equal(body.diagnostic.stage, "email_membership_lookup");
  } finally { global.fetch = originalFetch; }
});

test("uuid membership query is attempted when email membership has no rows", async () => {
  const calls = [];
  const originalFetch = global.fetch;
  global.fetch = async (url, init) => {
    calls.push(String(url));
    if (String(url).includes("/rpc/resolve_app_user_uuid")) return new Response(JSON.stringify("uuid-1"), { status: 200 });
    if (String(url).includes("user_id=eq.p%40x.com")) return new Response(JSON.stringify([]), { status: 200 });
    if (String(url).includes("user_id=eq.uuid-1")) return new Response(JSON.stringify([{ id: "m1", status: "active" }]), { status: 200 });
    return new Response(JSON.stringify([{ id: 13, ...JSON.parse(init.body)[0] }]), { status: 201 });
  };
  try {
    const res = await onRequestPost(ctx({ team_id: "team-a", player_id: "p@x.com", made: 2, date: "2026-05-01" }, { "x-user-id": "p@x.com" }));
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.diagnostic.uuid_membership_query_attempted, "yes");
    assert.equal(calls.filter((u) => u.includes("/team_memberships")).length, 2);
  } finally { global.fetch = originalFetch; }
});

test("shot_logs insert failure returns persist_failed with safe diagnostic", async () => {
  const originalFetch = global.fetch;
  global.fetch = async (url) => {
    if (String(url).includes("/team_memberships")) return new Response(JSON.stringify([{ id: "m2", status: "active" }]), { status: 200 });
    if (String(url).includes("/shot_logs")) return new Response(JSON.stringify({ message: "insert error" }), { status: 500 });
    return new Response(JSON.stringify(""), { status: 200 });
  };
  try {
    const res = await onRequestPost(ctx({ team_id: "team-a", player_id: "p@x.com", made: 3, date: "2026-05-01" }, { "x-user-id": "p@x.com" }));
    assert.equal(res.status, 500);
    const body = await res.json();
    assert.equal(body.error, "persist_failed");
    assert.equal(body.diagnostic.stage, "shot_logs_insert");
  } finally { global.fetch = originalFetch; }
});

test("coach leaderboard reads inserted row and excludes other team", async () => {
  const rowsByTeam = { "team-a": [{ rank: 1, player_display_name: "Player A", total_home_shots: 33 }], "team-b": [{ rank: 1, player_display_name: "Other", total_home_shots: 99 }] };
  const originalFetch = global.fetch;
  global.fetch = async (url, init) => {
    if (String(url).includes("/rpc/")) {
      const body = JSON.parse(init.body);
      return new Response(JSON.stringify(rowsByTeam[body.p_team_id] || []), { status: 200 });
    }
    return new Response(JSON.stringify([{ id: "m1", status: "active" }]), { status: 200 });
  };
  try {
    const resA = await onRequestGet({ request: new Request("https://shotlab.test/v1/leaderboards/home-shots?team_id=team-a", { headers: { "x-user-id": "coach@a.com" } }), env: ENV });
    const bodyA = await resA.json();
    assert.equal(bodyA.leaderboard[0].player_display_name, "Player A");
    assert.equal(bodyA.leaderboard.some((r) => r.player_display_name === "Other"), false);
  } finally { global.fetch = originalFetch; }
});
