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
    if (String(url).includes("/rpc/resolve_app_user_uuid")) return new Response(JSON.stringify("uuid-1"), { status: 200 });
    if (String(url).includes("/team_memberships")) return new Response(JSON.stringify([{ id: "m1", status: "active" }]), { status: 200 });
    return new Response(JSON.stringify([{ id: 10, ...JSON.parse(init.body)[0] }]), { status: 201 });
  };
  try {
    const res = await onRequestPost(ctx({ team_id: "team-a", player_id: "p@x.com", email: "p@x.com", made: 50, date: "2026-05-01" }, { "x-user-id": "p@x.com" }));
    assert.equal(res.status, 200);
    const payload = await res.json();
    assert.equal(payload.ok, true);
    assert.equal(calls.length, 3);
    assert.match(calls[1].url, /or=\(user_id\.eq\.p%40x\.com,user_id\.eq\.uuid-1\)/);
  } finally { global.fetch = originalFetch; }
});



test("succeeds when membership stores raw email", async () => {
  const originalFetch = global.fetch;
  global.fetch = async (url, init) => {
    if (String(url).includes("/rpc/resolve_app_user_uuid")) return new Response(JSON.stringify(""), { status: 200 });
    if (String(url).includes("/team_memberships")) return new Response(JSON.stringify([{ id: "m2", status: "active" }]), { status: 200 });
    return new Response(JSON.stringify([{ id: 12, ...JSON.parse(init.body)[0] }]), { status: 201 });
  };
  try {
    const res = await onRequestPost(ctx({ team_id: "team-a", player_id: "p@x.com", made: 50, date: "2026-05-01" }, { "x-user-id": "p@x.com" }));
    assert.equal(res.status, 200);
  } finally { global.fetch = originalFetch; }
});
test("missing x-user-id is rejected", async () => {
  const res = await onRequestPost(ctx({ team_id: "team-a", email: "p@x.com", made: 1, date: "2026-05-01" }));
  assert.equal(res.status, 401);
});

test("wrong team/inactive membership rejected", async () => {
  const originalFetch = global.fetch;
  global.fetch = async (url) => {
    if (String(url).includes("/rpc/resolve_app_user_uuid")) return new Response(JSON.stringify("uuid-2"), { status: 200 });
    return new Response(JSON.stringify([]), { status: 200 });
  };
  try {
    const res = await onRequestPost(ctx({ team_id: "team-b", player_id: "p@x.com", made: 2, date: "2026-05-01" }, { "x-user-id": "p@x.com" }));
    assert.equal(res.status, 403);
  } finally { global.fetch = originalFetch; }
});

test("invalid made values are rejected", async () => {
  const res = await onRequestPost(ctx({ team_id: "team-a", player_id: "p@x.com", made: -1, date: "2026-05-01" }, { "x-user-id": "p@x.com" }));
  assert.equal(res.status, 400);
});

test("valid request inserts DB-compatible shot_logs row", async () => {
  let inserted = null;
  const originalFetch = global.fetch;
  global.fetch = async (url, init) => {
    if (String(url).includes("/team_memberships")) return new Response(JSON.stringify([{ id: "m1", status: "active" }]), { status: 200 });
    inserted = JSON.parse(init.body)[0];
    return new Response(JSON.stringify([{ id: 11, ...inserted }]), { status: 201 });
  };
  try {
    await onRequestPost(ctx({ teamId: "team-a", playerId: "p@x.com", email: "p@x.com", made: 8, date: "2026-05-01" }, { "x-user-id": "p@x.com" }));
    assert.equal(inserted.team_id, "team-a");
    assert.equal(inserted.player_id, "p@x.com");
    assert.equal(typeof inserted.made, "number");
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
