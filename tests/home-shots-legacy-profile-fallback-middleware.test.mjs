import test from "node:test";
import assert from "node:assert/strict";
import { onRequest } from "../functions/v1/home-shots/_middleware.js";

const ENV = { SUPABASE_URL: "https://example.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "service-role-key" };

function ctx(body, headers = {}) {
  return {
    request: new Request("https://shotlab.test/v1/home-shots/log", {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: JSON.stringify(body ?? {}),
    }),
    env: ENV,
    next: async () => Response.json({ delegated: true }, { status: 599 }),
  };
}

test("matching legacy profile authorizes registered home-shot save without repair token", async () => {
  const originalFetch = global.fetch;
  let insertedRow = null;
  global.fetch = async (url, init = {}) => {
    const href = String(url);
    if (href.includes("/legacy_auth_profiles") && href.includes("team_id=eq.team-a")) {
      return new Response(JSON.stringify([{ email: "p@x.com", name: "Pat Player", role: "player", team_id: "team-a" }]), { status: 200 });
    }
    if (href.includes("/shot_logs")) {
      insertedRow = JSON.parse(init.body)[0];
      return new Response(JSON.stringify([{ id: "remote-shot", ...insertedRow }]), { status: 201 });
    }
    return new Response(JSON.stringify([]), { status: 200 });
  };
  try {
    const res = await onRequest(ctx({ team_id: "team-a", player_id: "p@x.com", email: "p@x.com", made: 123, date: "2026-06-04" }, { "x-user-id": "p@x.com" }));
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.ok, true);
    assert.equal(body.diagnostic.authorized_by, "legacy_profile");
    assert.equal(body.diagnostic.legacy_profile_query_result, "match:team_id_exact");
    assert.equal(body.diagnostic.shot_logs_insert_success, "yes");
    assert.equal(insertedRow.team_id, "team-a");
    assert.equal(insertedRow.player_id, "p@x.com");
  } finally {
    global.fetch = originalFetch;
  }
});

test("mismatched legacy profile delegates to the existing guarded route", async () => {
  const originalFetch = global.fetch;
  let shotInsertAttempted = false;
  global.fetch = async (url, init = {}) => {
    const href = String(url);
    if (href.includes("/legacy_auth_profiles") && href.includes("team_id=eq.team-a")) return new Response(JSON.stringify([]), { status: 200 });
    if (href.includes("/legacy_auth_profiles")) {
      return new Response(JSON.stringify([{ email: "p@x.com", name: "Pat Player", role: "player", team_id: "other-team" }]), { status: 200 });
    }
    if (href.includes("/shot_logs")) {
      shotInsertAttempted = true;
      return new Response(JSON.stringify([{ id: "should-not-insert", ...JSON.parse(init.body)[0] }]), { status: 201 });
    }
    return new Response(JSON.stringify([]), { status: 200 });
  };
  try {
    const res = await onRequest(ctx({ team_id: "team-a", player_id: "p@x.com", email: "p@x.com", made: 123, date: "2026-06-04" }, { "x-user-id": "p@x.com" }));
    assert.equal(res.status, 599);
    const body = await res.json();
    assert.equal(body.delegated, true);
    assert.equal(shotInsertAttempted, false);
  } finally {
    global.fetch = originalFetch;
  }
});
