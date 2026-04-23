import test from "node:test";
import assert from "node:assert/strict";

import { onRequestGet } from "../functions/v1/leaderboards/home-shots.js";

const ENV = {
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
};

function makeContext(url, headers = {}, env = ENV) {
  return {
    request: new Request(url, { headers }),
    env,
  };
}

test("leaderboard route clamps requested limit to top 10 before RPC", async () => {
  const requests = [];
  const originalFetch = global.fetch;
  global.fetch = async (url, init) => {
    requests.push({ url: String(url), init });
    return new Response(JSON.stringify([{ rank: 1, player_display_name: "A", total_home_shots: 100 }]), { status: 200 });
  };

  try {
    const context = makeContext("https://shotlab.test/v1/leaderboards/home-shots?team_id=team-1&limit=25", {
      "x-user-id": "coach@team.test",
    });
    const res = await onRequestGet(context);
    assert.equal(res.status, 200);

    assert.equal(requests.length, 1);
    const body = JSON.parse(requests[0].init.body);
    assert.equal(body.p_limit, 10);
    assert.equal(body.p_scope, "players");
  } finally {
    global.fetch = originalFetch;
  }
});

test("route preserves backend ranking order (no client-side re-sort)", async () => {
  const backendRows = [
    { rank: 1, player_display_name: "Zoe", total_home_shots: 300 },
    { rank: 2, player_display_name: "Ava", total_home_shots: 300 },
    { rank: 3, player_display_name: "Mia", total_home_shots: 280 },
  ];

  const originalFetch = global.fetch;
  global.fetch = async () => new Response(JSON.stringify(backendRows), { status: 200 });

  try {
    const context = makeContext("https://shotlab.test/v1/leaderboards/home-shots?team_id=team-1&limit=10", {
      "x-user-id": "player@team.test",
    });
    const res = await onRequestGet(context);
    assert.equal(res.status, 200);

    const payload = await res.json();
    assert.deepEqual(payload.leaderboard.map((r) => r.player_display_name), ["Zoe", "Ava", "Mia"]);
    assert.deepEqual(payload.leaderboard.map((r) => r.rank), [1, 2, 3]);
  } finally {
    global.fetch = originalFetch;
  }
});

test("fewer than 10 leaderboard rows are returned unchanged", async () => {
  const backendRows = [
    { rank: 1, player_display_name: "Ava", total_home_shots: 120 },
    { rank: 2, player_display_name: "Mia", total_home_shots: 95 },
  ];

  const originalFetch = global.fetch;
  global.fetch = async () => new Response(JSON.stringify(backendRows), { status: 200 });

  try {
    const context = makeContext("https://shotlab.test/v1/leaderboards/home-shots?team_id=team-1", {
      "x-user-id": "coach@team.test",
    });
    const res = await onRequestGet(context);
    const payload = await res.json();
    assert.equal(payload.count, 2);
    assert.equal(payload.leaderboard.length, 2);
  } finally {
    global.fetch = originalFetch;
  }
});

test("unauthorized requests are blocked before RPC", async () => {
  const context = makeContext("https://shotlab.test/v1/leaderboards/home-shots?team_id=team-1", {});
  const res = await onRequestGet(context);
  assert.equal(res.status, 401);
  assert.deepEqual(await res.json(), { error: "unauthorized" });
});

test("cross-team access denied is mapped to forbidden", async () => {
  const originalFetch = global.fetch;
  global.fetch = async () =>
    new Response(JSON.stringify({ message: "NOT_AUTHORIZED_FOR_TEAM" }), {
      status: 400,
    });

  try {
    const context = makeContext("https://shotlab.test/v1/leaderboards/home-shots?team_id=team-2", {
      "x-user-id": "coach@team-1.test",
    });
    const res = await onRequestGet(context);
    assert.equal(res.status, 403);
    assert.deepEqual(await res.json(), { error: "forbidden" });
  } finally {
    global.fetch = originalFetch;
  }
});

test("unauthorized requests emit auth_failure telemetry", async () => {
  const originalLog = console.log;
  const logs = [];
  console.log = (line) => logs.push(JSON.parse(line));

  try {
    const context = makeContext("https://shotlab.test/v1/leaderboards/home-shots?team_id=team-1", {});
    const res = await onRequestGet(context);
    assert.equal(res.status, 401);
    assert.equal(logs.length, 1);
    assert.equal(logs[0].event, "leaderboard.home_shots.auth_failure");
    assert.equal(logs[0].reason, "unauthorized");
  } finally {
    console.log = originalLog;
  }
});

test("empty leaderboard responses emit query_empty telemetry", async () => {
  const originalFetch = global.fetch;
  const originalLog = console.log;
  const logs = [];
  console.log = (line) => logs.push(JSON.parse(line));
  global.fetch = async () => new Response(JSON.stringify([]), { status: 200 });

  try {
    const context = makeContext("https://shotlab.test/v1/leaderboards/home-shots?team_id=team-1", {
      "x-user-id": "coach@team.test",
    });
    const res = await onRequestGet(context);
    assert.equal(res.status, 200);
    const payload = await res.json();
    assert.equal(payload.count, 0);

    assert.equal(logs[0].event, "leaderboard.home_shots.query_start");
    assert.equal(logs[1].event, "leaderboard.home_shots.query_empty");
    assert.equal(logs[1].rows, 0);
    assert.equal(logs[1].scope, "players");
  } finally {
    global.fetch = originalFetch;
    console.log = originalLog;
  }
});

test("route passes coaches scope to RPC", async () => {
  const requests = [];
  const originalFetch = global.fetch;
  global.fetch = async (url, init) => {
    requests.push({ url: String(url), init });
    return new Response(JSON.stringify([]), { status: 200 });
  };

  try {
    const context = makeContext("https://shotlab.test/v1/leaderboards/home-shots?team_id=team-1&scope=coaches", {
      "x-user-id": "coach@team.test",
    });
    const res = await onRequestGet(context);
    assert.equal(res.status, 200);
    const body = JSON.parse(requests[0].init.body);
    assert.equal(body.p_scope, "coaches");
  } finally {
    global.fetch = originalFetch;
  }
});

test("invalid scope is rejected", async () => {
  const context = makeContext("https://shotlab.test/v1/leaderboards/home-shots?team_id=team-1&scope=staff", {
    "x-user-id": "coach@team.test",
  });
  const res = await onRequestGet(context);
  assert.equal(res.status, 400);
  assert.deepEqual(await res.json(), { error: "invalid_scope" });
});
