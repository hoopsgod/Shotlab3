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
    assert.equal(payload.diagnostic.uuid_membership_query_attempted, "yes");
    assert.equal(payload.diagnostic.email_membership_query_attempted, "no");
    assert.equal(calls.length, 3);
  } finally { global.fetch = originalFetch; }
});

test("missing user identity returns diagnostic error", async () => {
  const res = await onRequestPost(ctx({ team_id: "team-a", email: "p@x.com", made: 1, date: "2026-05-01" }));
  assert.equal(res.status, 401);
  const body = await res.json();
  assert.equal(body.error, "missing_user_identity");
  assert.equal(body.diagnostic.stage, "request_identity");
});

test("500-level email membership lookup failure stays fatal", async () => {
  const originalFetch = global.fetch;
  global.fetch = async (url) => {
    if (String(url).includes("/rpc/resolve_app_user_uuid")) return new Response(JSON.stringify("uuid-2"), { status: 200 });
    if (String(url).includes("/team_memberships") && String(url).includes("user_id=eq.uuid-2")) return new Response(JSON.stringify([]), { status: 200 });
    if (String(url).includes("/team_memberships") && String(url).includes("user_id=eq.p%40x.com")) return new Response(JSON.stringify({ message: "boom" }), { status: 500 });
    return new Response(JSON.stringify([]), { status: 200 });
  };
  try {
    const res = await onRequestPost(ctx({ team_id: "team-a", player_id: "p@x.com", made: 1, date: "2026-05-01" }, { "x-user-id": "p@x.com" }));
    assert.equal(res.status, 500);
    const body = await res.json();
    assert.equal(body.error, "membership_email_query_failed");
    assert.equal(body.diagnostic.stage, "email_membership_lookup");
    assert.match(body.diagnostic.email_membership_query_result, /^error:boom/);
  } finally { global.fetch = originalFetch; }
});

test("uuid membership query is attempted before email query when uuid exists", async () => {
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
    assert.equal(body.diagnostic.email_membership_query_attempted, "no");
    const membershipCalls = calls.filter((u) => u.includes("/team_memberships"));
    assert.equal(membershipCalls.length, 1);
    assert.match(membershipCalls[0], /user_id=eq.uuid-1/);
  } finally { global.fetch = originalFetch; }
});

test("raw email membership still authorizes when table stores email values", async () => {
  const originalFetch = global.fetch;
  global.fetch = async (url, init) => {
    if (String(url).includes("/rpc/resolve_app_user_uuid")) return new Response(JSON.stringify("uuid-miss"), { status: 200 });
    if (String(url).includes("/team_memberships") && String(url).includes("uuid-miss")) return new Response(JSON.stringify([]), { status: 200 });
    if (String(url).includes("/team_memberships") && String(url).includes("user_id=eq.p%40x.com")) return new Response(JSON.stringify([{ id: "m-email", status: "active" }]), { status: 200 });
    return new Response(JSON.stringify([{ id: 22, ...JSON.parse(init.body)[0] }]), { status: 201 });
  };
  try {
    const res = await onRequestPost(ctx({ team_id: "team-a", player_id: "p@x.com", made: 2, date: "2026-05-01" }, { "x-user-id": "p@x.com" }));
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.diagnostic.authorized_by, "email");
    assert.equal(body.diagnostic.shot_logs_insert_success, "yes");
  } finally { global.fetch = originalFetch; }
});

test("shot_logs insert failure returns persist_failed with safe PostgREST diagnostic details", async () => {
  const originalFetch = global.fetch;
  global.fetch = async (url) => {
    if (String(url).includes("/team_memberships")) return new Response(JSON.stringify([{ id: "m2", status: "active" }]), { status: 200 });
    if (String(url).includes("/shot_logs")) {
      return new Response(JSON.stringify({
        code: "23502",
        message: "null value in column \"player_id\" of relation \"shot_logs\" violates not-null constraint",
        details: "Failing row contains a redacted shot log",
        hint: "Check migration 029 durable shot_logs schema repair",
      }), { status: 400 });
    }
    return new Response(JSON.stringify(""), { status: 200 });
  };
  try {
    const res = await onRequestPost(ctx({ team_id: "team-a", player_id: "p@x.com", made: 3, date: "2026-05-01" }, { "x-user-id": "p@x.com" }));
    assert.equal(res.status, 500);
    const body = await res.json();
    assert.equal(body.error, "persist_failed");
    assert.equal(body.diagnostic.stage, "shot_logs_insert");
    assert.equal(body.diagnostic.shot_logs_insert_safe_error_code, "persist_failed");
    assert.equal(body.diagnostic.shot_logs_insert_postgrest_error.status, 400);
    assert.equal(body.diagnostic.shot_logs_insert_postgrest_error.code, "23502");
    assert.match(body.diagnostic.shot_logs_insert_postgrest_error.message, /player_id/);
    assert.match(body.diagnostic.shot_logs_insert_postgrest_error.hint, /migration 029/);
  } finally { global.fetch = originalFetch; }
});


test("insert includes non-empty text id and numeric ts fallback", async () => {
  const originalFetch = global.fetch;
  let insertedRow;
  global.fetch = async (url, init) => {
    if (String(url).includes("/team_memberships")) return new Response(JSON.stringify([{ id: "m2", status: "active" }]), { status: 200 });
    if (String(url).includes("/shot_logs")) {
      insertedRow = JSON.parse(init.body)[0];
      return new Response(JSON.stringify([insertedRow]), { status: 201 });
    }
    return new Response(JSON.stringify(""), { status: 200 });
  };
  const realNow = Date.now;
  Date.now = () => 1777777777777;
  try {
    const res = await onRequestPost(ctx({ team_id: "team-a", player_id: "p@x.com", made: 3, date: "2026-05-01" }, { "x-user-id": "p@x.com" }));
    assert.equal(res.status, 200);
    assert.equal(typeof insertedRow.id, "string");
    assert.equal(insertedRow.id.length > 0, true);
    assert.equal(typeof insertedRow.ts, "string");
    assert.equal(insertedRow.ts, new Date(1777777777777).toISOString());
  } finally {
    Date.now = realNow;
    global.fetch = originalFetch;
  }
});

test("numeric body.ts is normalized to ISO timestamptz string", async () => {
  const originalFetch = global.fetch;
  let insertedRow;
  global.fetch = async (url, init) => {
    if (String(url).includes("/team_memberships")) return new Response(JSON.stringify([{ id: "m2", status: "active" }]), { status: 200 });
    if (String(url).includes("/shot_logs")) {
      insertedRow = JSON.parse(init.body)[0];
      return new Response(JSON.stringify([insertedRow]), { status: 201 });
    }
    return new Response(JSON.stringify(""), { status: 200 });
  };
  try {
    const res = await onRequestPost(ctx({ team_id: "team-a", player_id: "p@x.com", made: 3, date: "2026-05-01", ts: 1234567890 }, { "x-user-id": "p@x.com" }));
    assert.equal(res.status, 200);
    assert.equal(insertedRow.ts, new Date(1234567890).toISOString());
    assert.equal(typeof insertedRow.ts, "string");
  } finally {
    global.fetch = originalFetch;
  }
});

test("persist_failed is not caused by missing id or invalid ts in route payload", async () => {
  const originalFetch = global.fetch;
  let insertedRow;
  global.fetch = async (url, init) => {
    if (String(url).includes("/team_memberships")) return new Response(JSON.stringify([{ id: "m2", status: "active" }]), { status: 200 });
    if (String(url).includes("/shot_logs")) {
      insertedRow = JSON.parse(init.body)[0];
      return new Response(JSON.stringify([insertedRow]), { status: 201 });
    }
    return new Response(JSON.stringify(""), { status: 200 });
  };
  try {
    const res = await onRequestPost(ctx({ team_id: "team-a", player_id: "p@x.com", made: 3, date: "2026-05-01", ts: "2026-05-01T00:00:00.000Z" }, { "x-user-id": "p@x.com" }));
    assert.equal(res.status, 200);
    assert.equal(typeof insertedRow.id, "string");
    assert.equal(typeof insertedRow.ts, "string");
    const body = await res.json();
    assert.equal(body.diagnostic.shot_logs_insert_success, "yes");
  } finally {
    global.fetch = originalFetch;
  }
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

test("camelCase team_memberships authorizes save", async () => {
  const originalFetch = global.fetch;
  let insertedRow;
  global.fetch = async (url, init) => {
    const href = String(url);
    if (href.includes("/rpc/resolve_app_user_uuid")) return new Response(JSON.stringify("uuid-camel"), { status: 200 });
    if (href.includes("/team_memberships") && href.includes("team_id=")) return new Response(JSON.stringify({ message: "column team_id does not exist" }), { status: 400 });
    if (href.includes("/team_memberships") && href.includes("teamId=eq.team-a") && href.includes("userId=eq.uuid-camel")) return new Response(JSON.stringify([{ id: "m-camel", status: "active" }]), { status: 200 });
    if (href.includes("/team_memberships")) return new Response(JSON.stringify([]), { status: 200 });
    if (href.includes("/shot_logs")) {
      insertedRow = JSON.parse(init.body)[0];
      return new Response(JSON.stringify([insertedRow]), { status: 201 });
    }
    return new Response(JSON.stringify([]), { status: 200 });
  };
  try {
    const res = await onRequestPost(ctx({ teamId: "team-a", playerId: "p@x.com", made: 7, date: "2026-05-02" }, { "x-user-id": "p@x.com" }));
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.diagnostic.authorized_by, "uuid");
    assert.match(body.diagnostic.uuid_membership_query_result, /teamId\/userId/);
    assert.equal(insertedRow.team_id, "team-a");
  } finally { global.fetch = originalFetch; }
});



test("404 schema probing errors are tolerated during flexible membership lookup", async () => {
  const originalFetch = global.fetch;
  let insertedRow;
  global.fetch = async (url, init) => {
    const href = String(url);
    if (href.includes("/rpc/resolve_app_user_uuid")) return new Response(JSON.stringify("uuid-404"), { status: 200 });
    if (href.includes("/team_memberships") && href.includes("team_id=")) return new Response(JSON.stringify({ message: "schema cache missing column team_id" }), { status: 404 });
    if (href.includes("/team_memberships") && href.includes("teamId=eq.team-a") && href.includes("userId=eq.uuid-404")) return new Response(JSON.stringify([{ id: "m-404", status: "active" }]), { status: 200 });
    if (href.includes("/team_memberships")) return new Response(JSON.stringify([]), { status: 200 });
    if (href.includes("/shot_logs")) {
      insertedRow = JSON.parse(init.body)[0];
      return new Response(JSON.stringify([insertedRow]), { status: 201 });
    }
    return new Response(JSON.stringify([]), { status: 200 });
  };
  try {
    const res = await onRequestPost(ctx({ teamId: "team-a", playerId: "p@x.com", made: 7, date: "2026-05-02" }, { "x-user-id": "p@x.com" }));
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.diagnostic.authorized_by, "uuid");
    assert.match(body.diagnostic.uuid_membership_query_result, /teamId\/userId/);
    assert.equal(insertedRow.team_id, "team-a");
  } finally { global.fetch = originalFetch; }
});

test("players table fallback authorizes same requester on the same team", async () => {
  const originalFetch = global.fetch;
  global.fetch = async (url, init) => {
    const href = String(url);
    if (href.includes("/rpc/resolve_app_user_uuid")) return new Response(JSON.stringify("uuid-player"), { status: 200 });
    if (href.includes("/team_memberships")) return new Response(JSON.stringify([]), { status: 200 });
    if (href.includes("/players") && href.includes("team_id=eq.team-a") && href.includes("email=eq.p%40x.com")) return new Response(JSON.stringify([{ id: "player-1", email: "p@x.com", team_id: "team-a", role: "player", status: "active" }]), { status: 200 });
    if (href.includes("/players")) return new Response(JSON.stringify([]), { status: 200 });
    if (href.includes("/shot_logs")) return new Response(JSON.stringify([{ id: "remote-shot", ...JSON.parse(init.body)[0] }]), { status: 201 });
    return new Response(JSON.stringify([]), { status: 200 });
  };
  try {
    const res = await onRequestPost(ctx({ team_id: "team-a", player_id: "p@x.com", made: 8, date: "2026-05-02" }, { "x-user-id": "p@x.com" }));
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.diagnostic.authorized_by, "player_record");
    assert.equal(body.shot_log.syncState, undefined);
  } finally { global.fetch = originalFetch; }
});

test("shot_logs insert retries without client id when live schema still generates id", async () => {
  const originalFetch = global.fetch;
  const insertBodies = [];
  global.fetch = async (url, init) => {
    const href = String(url);
    if (href.includes("/rpc/resolve_app_user_uuid")) return new Response(JSON.stringify("uuid-1"), { status: 200 });
    if (href.includes("/team_memberships") && href.includes("user_id=eq.uuid-1")) return new Response(JSON.stringify([{ id: "m1", status: "active" }]), { status: 200 });
    if (href.includes("/shot_logs")) {
      insertBodies.push(JSON.parse(init.body)[0]);
      if (insertBodies.length === 1) {
        return new Response(JSON.stringify({ code: "22P02", message: "invalid input syntax for type bigint", details: "column id rejected shotlog_abc" }), { status: 400 });
      }
      return new Response(JSON.stringify([{ id: 42, ...insertBodies[1] }]), { status: 201 });
    }
    return new Response(JSON.stringify([]), { status: 200 });
  };
  try {
    const res = await onRequestPost(ctx({ id: "shotlog_abc", team_id: "team-a", player_id: "p@x.com", made: 9, date: "2026-05-02" }, { "x-user-id": "p@x.com" }));
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.ok, true);
    assert.equal(body.shot_log.id, 42);
    assert.equal(insertBodies[0].id, "shotlog_abc");
    assert.equal(Object.hasOwn(insertBodies[1], "id"), false);
    assert.equal(body.diagnostic.shot_logs_insert_retry_without_client_id, "yes");
    assert.equal(body.diagnostic.shot_logs_insert_first_attempt_error.code, "22P02");
  } finally { global.fetch = originalFetch; }
});


test("500-level players fallback lookup failure stays fatal", async () => {
  const originalFetch = global.fetch;
  global.fetch = async (url) => {
    const href = String(url);
    if (href.includes("/rpc/resolve_app_user_uuid")) return new Response(JSON.stringify("uuid-player-fail"), { status: 200 });
    if (href.includes("/team_memberships")) return new Response(JSON.stringify([]), { status: 200 });
    if (href.includes("/players")) return new Response(JSON.stringify({ message: "players backend unavailable" }), { status: 500 });
    return new Response(JSON.stringify([]), { status: 200 });
  };
  try {
    const res = await onRequestPost(ctx({ team_id: "team-a", player_id: "p@x.com", made: 8, date: "2026-05-02" }, { "x-user-id": "p@x.com" }));
    assert.equal(res.status, 500);
    const body = await res.json();
    assert.equal(body.error, "player_record_query_failed");
    assert.equal(body.diagnostic.stage, "player_record_lookup");
    assert.match(body.diagnostic.player_record_query_result, /^error:players backend unavailable/);
  } finally { global.fetch = originalFetch; }
});

test("missing durable relationship is repaired, then shot_logs insert succeeds", async () => {
  const originalFetch = global.fetch;
  let playersUpserted = false;
  let membershipUpserted = false;
  let shotInserted = false;
  global.fetch = async (url, init = {}) => {
    const href = String(url);
    const method = String(init.method || "GET");
    if (href.includes("/rpc/resolve_app_user_uuid")) return new Response(JSON.stringify("uuid-repair"), { status: 200 });
    if (href.includes("/legacy_auth_profiles")) return new Response(JSON.stringify([{ email: "p@x.com", name: "Pat Player", role: "player", team_id: "team-a" }]), { status: 200 });
    if (href.includes("/players") && method === "POST") { playersUpserted = true; return new Response(JSON.stringify([JSON.parse(init.body)[0]]), { status: 201 }); }
    if (href.includes("/team_memberships") && method === "POST") { membershipUpserted = true; return new Response(JSON.stringify([JSON.parse(init.body)[0]]), { status: 201 }); }
    if (href.includes("/team_memberships") && method === "GET") {
      return new Response(JSON.stringify(membershipUpserted ? [{ id: "m-repaired", user_id: "uuid-repair", team_id: "team-a", role: "player", status: "active" }] : []), { status: 200 });
    }
    if (href.includes("/players") && method === "GET") {
      return new Response(JSON.stringify([]), { status: 200 });
    }
    if (href.includes("/shot_logs")) {
      shotInserted = true;
      return new Response(JSON.stringify([{ id: "remote-shot", ...JSON.parse(init.body)[0] }]), { status: 201 });
    }
    return new Response(JSON.stringify([]), { status: 200 });
  };
  try {
    const res = await onRequestPost(ctx({ team_id: "team-a", player_id: "p@x.com", email: "p@x.com", name: "Pat Player", made: 123, date: "2026-06-04" }, { "x-user-id": "p@x.com" }));
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.ok, true);
    assert.equal(body.shot_log.made, 123);
    assert.equal(body.diagnostic.team_binding_repair_attempted, "yes");
    assert.equal(body.diagnostic.team_binding_repair_account_probe, "match:legacy_auth_profiles");
    assert.equal(body.diagnostic.team_binding_repair_result, "repaired");
    assert.equal(body.diagnostic.shot_logs_insert_success, "yes");
    assert.equal(playersUpserted, true);
    assert.equal(membershipUpserted, true);
    assert.equal(shotInserted, true);
  } finally { global.fetch = originalFetch; }
});

test("repair failure returns missing_durable_team_binding diagnostics", async () => {
  const originalFetch = global.fetch;
  global.fetch = async (url, init = {}) => {
    const href = String(url);
    const method = String(init.method || "GET");
    if (href.includes("/rpc/resolve_app_user_uuid")) return new Response(JSON.stringify("uuid-repair-fail"), { status: 200 });
    if (href.includes("/legacy_auth_profiles")) return new Response(JSON.stringify([{ email: "p@x.com", name: "Pat Player", role: "player", team_id: "team-a" }]), { status: 200 });
    if ((href.includes("/players") || href.includes("/team_memberships")) && method === "POST") {
      return new Response(JSON.stringify({ message: "schema cache missing repair column" }), { status: 400 });
    }
    if (href.includes("/players") || href.includes("/team_memberships")) return new Response(JSON.stringify([]), { status: 200 });
    return new Response(JSON.stringify([]), { status: 200 });
  };
  try {
    const res = await onRequestPost(ctx({ team_id: "team-a", player_id: "p@x.com", made: 11, date: "2026-06-04" }, { "x-user-id": "p@x.com" }));
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.error, "missing_durable_team_binding");
    assert.equal(body.diagnostic.stage, "team_binding_repair");
    assert.equal(body.diagnostic.team_binding_repair_attempted, "yes");
    assert.match(body.diagnostic.team_binding_repair_players_result, /schema cache missing repair column/);
    assert.equal(body.diagnostic.shot_logs_insert_attempted, "no");
  } finally { global.fetch = originalFetch; }
});

test("arbitrary team repair is blocked without trusted team evidence", async () => {
  const originalFetch = global.fetch;
  let repairUpsertAttempted = false;
  global.fetch = async (url, init = {}) => {
    const href = String(url);
    const method = String(init.method || "GET");
    if (href.includes("/rpc/resolve_app_user_uuid")) return new Response(JSON.stringify("uuid-spoof"), { status: 200 });
    if (href.includes("/legacy_auth_profiles")) return new Response(JSON.stringify([{ email: "p@x.com", name: "Pat Player", role: "player", team_id: "real-team" }]), { status: 200 });
    if ((href.includes("/players") || href.includes("/team_memberships")) && method === "POST") { repairUpsertAttempted = true; return new Response(JSON.stringify([JSON.parse(init.body)[0]]), { status: 201 }); }
    if (href.includes("/players") || href.includes("/team_memberships")) return new Response(JSON.stringify([]), { status: 200 });
    return new Response(JSON.stringify([]), { status: 200 });
  };
  try {
    const res = await onRequestPost(ctx({ team_id: "spoof-team", player_id: "p@x.com", email: "p@x.com", made: 123, date: "2026-06-04" }, { "x-user-id": "p@x.com" }));
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.error, "missing_durable_team_binding");
    assert.equal(body.diagnostic.stage, "team_binding_repair");
    assert.match(body.diagnostic.team_binding_repair_account_probe, /^team_mismatch:real-team/);
    assert.equal(repairUpsertAttempted, false);
    assert.equal(body.diagnostic.shot_logs_insert_attempted, "no");
  } finally { global.fetch = originalFetch; }
});


test("players repair authorizes save even when membership repair would fail", async () => {
  const originalFetch = global.fetch;
  let playersUpserted = false;
  let membershipUpsertAttempted = false;
  global.fetch = async (url, init = {}) => {
    const href = String(url);
    const method = String(init.method || "GET");
    if (href.includes("/rpc/resolve_app_user_uuid")) return new Response(JSON.stringify("uuid-player-only"), { status: 200 });
    if (href.includes("/legacy_auth_profiles")) return new Response(JSON.stringify([{ email: "p@x.com", name: "Pat Player", role: "player", team_id: "team-a" }]), { status: 200 });
    if (href.includes("/players") && method === "POST") { playersUpserted = true; return new Response(JSON.stringify([JSON.parse(init.body)[0]]), { status: 201 }); }
    if (href.includes("/team_memberships") && method === "POST") { membershipUpsertAttempted = true; return new Response(JSON.stringify({ message: "membership schema mismatch" }), { status: 400 }); }
    if (href.includes("/team_memberships") && method === "GET") return new Response(JSON.stringify([]), { status: 200 });
    if (href.includes("/players") && method === "GET") return new Response(JSON.stringify(playersUpserted ? [{ id: "player-only", email: "p@x.com", team_id: "team-a", role: "player", status: "active" }] : []), { status: 200 });
    if (href.includes("/shot_logs")) return new Response(JSON.stringify([{ id: "remote-player-only", ...JSON.parse(init.body)[0] }]), { status: 201 });
    return new Response(JSON.stringify([]), { status: 200 });
  };
  try {
    const res = await onRequestPost(ctx({ team_id: "team-a", player_id: "p@x.com", email: "p@x.com", made: 123, date: "2026-06-04" }, { "x-user-id": "p@x.com" }));
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.ok, true);
    assert.equal(body.diagnostic.authorized_by, "player_record");
    assert.equal(body.diagnostic.team_binding_repair_result, "repaired_player_record");
    assert.equal(body.diagnostic.shot_logs_insert_success, "yes");
    assert.equal(playersUpserted, true);
    assert.equal(membershipUpsertAttempted, false);
  } finally { global.fetch = originalFetch; }
});

test("repair is blocked when no trusted team evidence exists for submitted team", async () => {
  const originalFetch = global.fetch;
  let repairUpsertAttempted = false;
  let shotInsertAttempted = false;
  global.fetch = async (url, init = {}) => {
    const href = String(url);
    const method = String(init.method || "GET");
    if (href.includes("/rpc/resolve_app_user_uuid")) return new Response(JSON.stringify("uuid-no-evidence"), { status: 200 });
    if (href.includes("/legacy_auth_profiles")) return new Response(JSON.stringify([]), { status: 200 });
    if ((href.includes("/players") || href.includes("/team_memberships")) && method === "POST") { repairUpsertAttempted = true; return new Response(JSON.stringify([JSON.parse(init.body)[0]]), { status: 201 }); }
    if (href.includes("/players") || href.includes("/team_memberships")) return new Response(JSON.stringify([]), { status: 200 });
    if (href.includes("/shot_logs")) { shotInsertAttempted = true; return new Response(JSON.stringify([{ id: "should-not-insert" }]), { status: 201 }); }
    return new Response(JSON.stringify([]), { status: 200 });
  };
  try {
    const res = await onRequestPost(ctx({ team_id: "random-team", player_id: "p@x.com", email: "p@x.com", made: 123, date: "2026-06-04" }, { "x-user-id": "p@x.com" }));
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.error, "missing_durable_team_binding");
    assert.equal(body.diagnostic.stage, "team_binding_repair");
    assert.equal(body.diagnostic.team_binding_repair_account_probe, "0");
    assert.equal(body.diagnostic.repair_reason, "registered_profile_not_found");
    assert.equal(repairUpsertAttempted, false);
    assert.equal(shotInsertAttempted, false);
    assert.equal(body.diagnostic.shot_logs_insert_attempted, "no");
  } finally { global.fetch = originalFetch; }
});
