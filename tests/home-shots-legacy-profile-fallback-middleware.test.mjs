import test from "node:test";
import assert from "node:assert/strict";
import { onRequest as homeShotsMiddleware } from "../functions/v1/home-shots/_middleware.js";
import { onRequestPost } from "../functions/v1/home-shots/log.js";

const ENV = { SUPABASE_URL: "https://example.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "service-role-key" };

function requestFor(body, headers = {}) {
  return new Request("https://shotlab.test/v1/home-shots/log", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body ?? {}),
  });
}

async function runThroughMiddleware({ request, env = ENV }) {
  const context = {
    request,
    env,
    data: {},
    next: () => onRequestPost({ request, env, data: context.data }),
  };
  return homeShotsMiddleware(context);
}

test("legacy_auth_profiles fallback authorizes registered player when durable binding rows are missing", async () => {
  const originalFetch = global.fetch;
  let repairUpsertAttempted = false;
  let shotInserted = false;
  global.fetch = async (url, init = {}) => {
    const href = String(url);
    const method = String(init.method || "GET");
    if (href.includes("/rpc/resolve_app_user_uuid")) return new Response(JSON.stringify("uuid-legacy-profile"), { status: 200 });
    if (href.includes("/legacy_auth_profiles") && href.includes("team_id=eq.team-a")) return new Response(JSON.stringify([{ email: "p@x.com", name: "Pat Player", role: "player", team_id: "team-a" }]), { status: 200 });
    if (href.includes("/team_memberships") && method === "GET") return new Response(JSON.stringify([]), { status: 200 });
    if (href.includes("/players") && method === "GET") return new Response(JSON.stringify([]), { status: 200 });
    if ((href.includes("/players") || href.includes("/team_memberships")) && method === "POST") { repairUpsertAttempted = true; return new Response(JSON.stringify([JSON.parse(init.body)[0]]), { status: 201 }); }
    if (href.includes("/shot_logs")) { shotInserted = true; return new Response(JSON.stringify([{ id: "remote-legacy", ...JSON.parse(init.body)[0] }]), { status: 201 }); }
    return new Response(JSON.stringify([]), { status: 200 });
  };
  try {
    const res = await runThroughMiddleware({ request: requestFor({ team_id: "team-a", player_id: "p@x.com", email: "p@x.com", made: 123, date: "2026-06-05" }, { "x-user-id": "p@x.com" }) });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.ok, true);
    assert.equal(body.diagnostic.authorized_by, "legacy_profile");
    assert.equal(body.diagnostic.legacy_profile_fallback_result, "match:legacy_auth_profiles/team_id");
    assert.equal(body.diagnostic.team_binding_repair_attempted, "no");
    assert.equal(repairUpsertAttempted, false);
    assert.equal(shotInserted, true);
  } finally { global.fetch = originalFetch; }
});

test("legacy_auth_profiles fallback can choose same-email matching teamId candidate", async () => {
  const originalFetch = global.fetch;
  global.fetch = async (url, init = {}) => {
    const href = String(url);
    const method = String(init.method || "GET");
    if (href.includes("/rpc/resolve_app_user_uuid")) return new Response(JSON.stringify("uuid-camel-profile"), { status: 200 });
    if (href.includes("/legacy_auth_profiles") && href.includes("team_id=eq.team-a")) return new Response(JSON.stringify({ message: "column team_id missing" }), { status: 400 });
    if (href.includes("/legacy_auth_profiles") && href.includes("teamId=eq.team-a")) return new Response(JSON.stringify([]), { status: 200 });
    if (href.includes("/legacy_auth_profiles")) return new Response(JSON.stringify([
      { email: "p@x.com", role: "player", teamId: "other-team" },
      { email: "p@x.com", role: "player", teamId: "team-a" },
    ]), { status: 200 });
    if (href.includes("/team_memberships") || href.includes("/players")) return new Response(JSON.stringify([]), { status: 200 });
    if (href.includes("/shot_logs") && method === "POST") return new Response(JSON.stringify([{ id: "remote-camel", ...JSON.parse(init.body)[0] }]), { status: 201 });
    return new Response(JSON.stringify([]), { status: 200 });
  };
  try {
    const res = await runThroughMiddleware({ request: requestFor({ team_id: "team-a", player_id: "p@x.com", email: "p@x.com", made: 44, date: "2026-06-05" }, { "x-user-id": "p@x.com" }) });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.diagnostic.authorized_by, "legacy_profile");
    assert.equal(body.diagnostic.legacy_profile_fallback_result, "match:legacy_auth_profiles/teamId/fallback");
  } finally { global.fetch = originalFetch; }
});

test("legacy_auth_profiles fallback does not authorize arbitrary team spoofing", async () => {
  const originalFetch = global.fetch;
  let shotInserted = false;
  let repairUpsertAttempted = false;
  global.fetch = async (url, init = {}) => {
    const href = String(url);
    const method = String(init.method || "GET");
    if (href.includes("/rpc/resolve_app_user_uuid")) return new Response(JSON.stringify("uuid-spoof"), { status: 200 });
    if (href.includes("/legacy_auth_profiles") && href.includes("team_id=eq.spoof-team")) return new Response(JSON.stringify([]), { status: 200 });
    if (href.includes("/legacy_auth_profiles") && href.includes("teamId=eq.spoof-team")) return new Response(JSON.stringify({ message: "column teamId missing" }), { status: 400 });
    if (href.includes("/legacy_auth_profiles")) return new Response(JSON.stringify([{ email: "p@x.com", role: "player", team_id: "real-team" }]), { status: 200 });
    if ((href.includes("/players") || href.includes("/team_memberships")) && method === "POST") { repairUpsertAttempted = true; return new Response(JSON.stringify([JSON.parse(init.body)[0]]), { status: 201 }); }
    if (href.includes("/team_memberships") || href.includes("/players")) return new Response(JSON.stringify([]), { status: 200 });
    if (href.includes("/shot_logs")) { shotInserted = true; return new Response(JSON.stringify([{ id: "should-not-insert" }]), { status: 201 }); }
    return new Response(JSON.stringify([]), { status: 200 });
  };
  try {
    const res = await runThroughMiddleware({ request: requestFor({ team_id: "spoof-team", player_id: "p@x.com", email: "p@x.com", made: 44, date: "2026-06-05" }, { "x-user-id": "p@x.com" }) });
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.error, "missing_durable_team_binding");
    assert.equal(body.diagnostic.authorized_by, "none");
    assert.equal(body.diagnostic.legacy_profile_fallback_result, "not_attempted");
    assert.equal(shotInserted, false);
    assert.equal(repairUpsertAttempted, false);
  } finally { global.fetch = originalFetch; }
});


test("legacy_auth_profiles middleware exact probe supports camelCase-only teamId schema", async () => {
  const originalFetch = global.fetch;
  global.fetch = async (url, init = {}) => {
    const href = String(url);
    if (href.includes("/rpc/resolve_app_user_uuid")) return new Response(JSON.stringify("uuid-teamid"), { status: 200 });
    if (href.includes("/legacy_auth_profiles") && href.includes("team_id=eq.team-a")) return new Response(JSON.stringify({ message: "column team_id does not exist" }), { status: 400 });
    if (href.includes("/legacy_auth_profiles") && href.includes("teamId=eq.team-a")) return new Response(JSON.stringify([{ email: "p@x.com", name: "Pat Player", role: "player", teamId: "team-a" }]), { status: 200 });
    if (href.includes("/team_memberships") || href.includes("/players")) return new Response(JSON.stringify([]), { status: 200 });
    if (href.includes("/shot_logs")) return new Response(JSON.stringify([{ id: "remote-teamid", ...JSON.parse(init.body)[0] }]), { status: 201 });
    return new Response(JSON.stringify([]), { status: 200 });
  };
  try {
    const res = await runThroughMiddleware({ request: requestFor({ team_id: "team-a", player_id: "p@x.com", email: "p@x.com", made: 31, date: "2026-06-05" }, { "x-user-id": "p@x.com" }) });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.diagnostic.authorized_by, "legacy_profile");
    assert.equal(body.diagnostic.legacy_profile_fallback_result, "match:legacy_auth_profiles/teamId");
  } finally { global.fetch = originalFetch; }
});

test("legacy_auth_profiles middleware exact probe supports snake_case-only team_id schema", async () => {
  const originalFetch = global.fetch;
  global.fetch = async (url, init = {}) => {
    const href = String(url);
    if (href.includes("/rpc/resolve_app_user_uuid")) return new Response(JSON.stringify("uuid-teamid"), { status: 200 });
    if (href.includes("/legacy_auth_profiles") && href.includes("team_id=eq.team-a")) return new Response(JSON.stringify([{ email: "p@x.com", name: "Pat Player", role: "player", team_id: "team-a" }]), { status: 200 });
    if (href.includes("/legacy_auth_profiles") && href.includes("teamId=eq.team-a")) return new Response(JSON.stringify({ message: "column teamId does not exist" }), { status: 400 });
    if (href.includes("/team_memberships") || href.includes("/players")) return new Response(JSON.stringify([]), { status: 200 });
    if (href.includes("/shot_logs")) return new Response(JSON.stringify([{ id: "remote-teamid", ...JSON.parse(init.body)[0] }]), { status: 201 });
    return new Response(JSON.stringify([]), { status: 200 });
  };
  try {
    const res = await runThroughMiddleware({ request: requestFor({ team_id: "team-a", player_id: "p@x.com", email: "p@x.com", made: 32, date: "2026-06-05" }, { "x-user-id": "p@x.com" }) });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.diagnostic.authorized_by, "legacy_profile");
    assert.equal(body.diagnostic.legacy_profile_fallback_result, "match:legacy_auth_profiles/team_id");
  } finally { global.fetch = originalFetch; }
});
