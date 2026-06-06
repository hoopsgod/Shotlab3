import test from "node:test";
import assert from "node:assert/strict";
import { onRequestPost } from "../functions/v1/home-shots/log.js";

const ENV = { SUPABASE_URL: "https://example.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "service-role-key" };

function requestFor(body, headers = {}) {
  return new Request("https://shotlab.test/v1/home-shots/log", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body ?? {}),
  });
}

async function logHomeShot({ body, headers = {}, env = ENV }) {
  return onRequestPost({ request: requestFor(body, headers), env, data: {} });
}

test("home shot insert uses matched players roster player_id/id and roster team_id", async () => {
  const originalFetch = global.fetch;
  let insertedShot = null;
  global.fetch = async (url, init = {}) => {
    const href = String(url);
    const method = String(init.method || "GET");
    if (href.includes("/rpc/resolve_app_user_uuid")) return new Response(JSON.stringify("uuid-aahna"), { status: 200 });
    if (href.includes("/team_memberships") && method === "GET") {
      return new Response(JSON.stringify([{ team_id: "team_roster", user_id: "uuid-aahna", status: "active" }]), { status: 200 });
    }
    if (href.includes("/players") && method === "GET") {
      return new Response(JSON.stringify([{
        id: "player:team_roster_aahna",
        player_id: "player:team_roster_aahna",
        team_id: "team_roster",
        email: "aahna@gmail.com",
        name: "Aahna",
        role: "player",
        status: "active",
      }]), { status: 200 });
    }
    if (href.includes("/shot_logs") && method === "POST") {
      insertedShot = JSON.parse(init.body)[0];
      return new Response(JSON.stringify([{ id: "remote-shot", ...insertedShot }]), { status: 201 });
    }
    return new Response(JSON.stringify([]), { status: 200 });
  };
  try {
    const res = await logHomeShot({
      body: { team_id: "team_roster", player_id: "aahna@gmail.com", email: "aahna@gmail.com", made: 42, date: "2026-06-05" },
      headers: { "x-user-id": "aahna@gmail.com" },
    });
    assert.equal(res.status, 200);
    const payload = await res.json();
    assert.equal(payload.ok, true);
    assert.equal(insertedShot.player_id, "player:team_roster_aahna");
    assert.equal(insertedShot.team_id, "team_roster");
    assert.equal(insertedShot.email, "aahna@gmail.com");
    assert.notEqual(insertedShot.player_id, "uuid-aahna");
    assert.notEqual(insertedShot.player_id, "aahna@gmail.com");
    assert.equal(payload.diagnostic.shot_logs_player_id_source, "matched_player_roster_key");
  } finally {
    global.fetch = originalFetch;
  }
});

test("home shot insert falls back to requester email only when no players row exists", async () => {
  const originalFetch = global.fetch;
  let insertedShot = null;
  global.fetch = async (url, init = {}) => {
    const href = String(url);
    const method = String(init.method || "GET");
    if (href.includes("/rpc/resolve_app_user_uuid")) return new Response(JSON.stringify("uuid-email-fallback"), { status: 200 });
    if (href.includes("/team_memberships") && method === "GET") {
      return new Response(JSON.stringify([{ team_id: "team_email", user_id: "uuid-email-fallback", status: "active" }]), { status: 200 });
    }
    if (href.includes("/players") && method === "GET") return new Response(JSON.stringify([]), { status: 200 });
    if (href.includes("/shot_logs") && method === "POST") {
      insertedShot = JSON.parse(init.body)[0];
      return new Response(JSON.stringify([{ id: "remote-shot", ...insertedShot }]), { status: 201 });
    }
    return new Response(JSON.stringify([]), { status: 200 });
  };
  try {
    const res = await logHomeShot({
      body: { team_id: "team_email", player_id: "fallback@example.com", email: "fallback@example.com", made: 7, date: "2026-06-05" },
      headers: { "x-user-id": "fallback@example.com" },
    });
    assert.equal(res.status, 200);
    const payload = await res.json();
    assert.equal(insertedShot.player_id, "fallback@example.com");
    assert.equal(insertedShot.team_id, "team_email");
    assert.equal(insertedShot.email, "fallback@example.com");
    assert.notEqual(insertedShot.player_id, "uuid-email-fallback");
    assert.equal(payload.diagnostic.shot_logs_player_id_source, "requester_email");
  } finally {
    global.fetch = originalFetch;
  }
});

test("player repair upsert does not overwrite existing generated roster player key with email", async () => {
  const originalFetch = global.fetch;
  const playerRepairRows = [];
  let playerCreated = false;
  let insertedShot = null;
  const env = { ...ENV, INTERNAL_API_TOKEN: "repair-token" };
  global.fetch = async (url, init = {}) => {
    const href = String(url);
    const method = String(init.method || "GET");
    if (href.includes("/rpc/resolve_app_user_uuid")) return new Response(JSON.stringify("uuid-repair"), { status: 200 });
    if (href.includes("/legacy_auth_profiles") && href.includes("team_id=eq.team_repair")) {
      return new Response(JSON.stringify([{ email: "repair@example.com", name: "Repair Player", role: "player", team_id: "team_repair" }]), { status: 200 });
    }
    if (href.includes("/legacy_auth_profiles")) return new Response(JSON.stringify([]), { status: 200 });
    if (href.includes("/team_memberships") && method === "GET") return new Response(JSON.stringify([]), { status: 200 });
    if (href.includes("/players") && method === "GET") {
      if (!playerCreated) return new Response(JSON.stringify([]), { status: 200 });
      return new Response(JSON.stringify([{
        id: "player:team_repair_existing",
        player_id: "player:team_repair_existing",
        team_id: "team_repair",
        email: "repair@example.com",
        name: "Repair Player",
        role: "player",
        status: "active",
      }]), { status: 200 });
    }
    if (href.includes("/players") && method === "POST") {
      const row = JSON.parse(init.body)[0];
      playerRepairRows.push(row);
      playerCreated = true;
      return new Response(JSON.stringify([row]), { status: 201 });
    }
    if (href.includes("/shot_logs") && method === "POST") {
      insertedShot = JSON.parse(init.body)[0];
      return new Response(JSON.stringify([{ id: "remote-shot", ...insertedShot }]), { status: 201 });
    }
    return new Response(JSON.stringify([]), { status: 200 });
  };
  try {
    const res = await logHomeShot({
      body: { team_id: "team_repair", player_id: "repair@example.com", email: "repair@example.com", made: 11, date: "2026-06-05" },
      headers: { "x-user-id": "repair@example.com", "x-internal-api-token": "repair-token" },
      env,
    });
    assert.equal(res.status, 200);
    assert.equal(playerRepairRows.length, 1);
    assert.equal(Object.hasOwn(playerRepairRows[0], "player_id"), false);
    assert.equal(Object.hasOwn(playerRepairRows[0], "playerId"), false);
    assert.equal(insertedShot.player_id, "player:team_repair_existing");
  } finally {
    global.fetch = originalFetch;
  }
});
