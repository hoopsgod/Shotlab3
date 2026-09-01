import test from "node:test";
import assert from "node:assert/strict";
import { onRequestPost as syncPlayers } from "../functions/v1/players/index.js";

const ENV = {
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
  SUPABASE_ANON_KEY: "anon-key",
};

function context(body) {
  return {
    request: new Request("https://shotlab.test/v1/players", {
      method: "POST",
      headers: { "content-type": "application/json", "x-user-id": "coach@example.com" },
      body: JSON.stringify(body),
    }),
    env: ENV,
  };
}

function eqValue(value) {
  const raw = String(value || "");
  return decodeURIComponent(raw.startsWith("eq.") ? raw.slice(3) : raw);
}

function matches(row, url) {
  for (const [key, value] of url.searchParams.entries()) {
    if (["select", "order", "limit", "on_conflict"].includes(key)) continue;
    if (String(row?.[key] ?? "") !== eqValue(value)) return false;
  }
  return true;
}

test("a stale legacy coach self-sync cannot erase the authoritative team assignment", async () => {
  const originalFetch = global.fetch;
  const state = {
    players: [{
      id: "player:unassigned:coach@example.com",
      email: "coach@example.com",
      name: "Coach",
      role: "coach",
      team_id: "team_legacy_text_id",
      hide_from_leaderboards: false,
      created_at: 100,
    }],
  };

  global.fetch = async (input, init = {}) => {
    const url = new URL(String(input));
    const method = String(init.method || "GET").toUpperCase();
    const body = init.body ? JSON.parse(init.body) : null;

    if (url.pathname.endsWith("/rpc/resolve_app_user_uuid")) {
      return Response.json("11111111-1111-4111-8111-111111111111");
    }
    if (url.pathname.endsWith("/legacy_auth_profiles")) {
      return Response.json([{ team_id: "team_legacy_text_id", role: "coach" }]);
    }
    if (url.pathname.endsWith("/team_memberships")) {
      return Response.json([{ team_id: "team_legacy_text_id", role: "coach", status: "active" }]);
    }
    if (url.pathname.endsWith("/teams")) {
      return Response.json([{ id: "team_legacy_text_id", coach_user_id: "11111111-1111-4111-8111-111111111111" }]);
    }
    if (url.pathname.endsWith("/players")) {
      if (method === "GET") return Response.json(state.players.filter((row) => matches(row, url)));
      if (method === "POST") {
        for (const incoming of Array.isArray(body) ? body : [body]) {
          const index = state.players.findIndex((row) => row.id === incoming.id);
          if (index >= 0) state.players[index] = { ...state.players[index], ...incoming };
          else state.players.push({ ...incoming });
        }
        return Response.json(Array.isArray(body) ? body : [body], { status: 201 });
      }
    }
    return Response.json([]);
  };

  try {
    const response = await syncPlayers(context({
      players: [{
        id: "player:unassigned:coach@example.com",
        email: "coach@example.com",
        name: "Coach",
        role: "coach",
        team_id: null,
        hide_from_leaderboards: false,
        created_at: 100,
      }],
    }));

    assert.equal(response.status, 200);
    assert.equal(state.players[0].team_id, "team_legacy_text_id");
    assert.equal((await response.json()).players[0].team_id, "team_legacy_text_id");
  } finally {
    global.fetch = originalFetch;
  }
});
