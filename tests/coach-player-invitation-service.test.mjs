import assert from "node:assert/strict";
import test from "node:test";
import { loadCoachPlayerInvitations, provisionCoachPlayer } from "../src/lib/coachPlayerInvitationService.js";

test("provision sends coach identity and player fields without a password", async () => {
  let request;
  const result = await provisionCoachPlayer({
    coach: { email: "COACH@example.com", role: "coach" },
    teamId: "team-1",
    firstName: "Ari",
    lastName: "Player",
    email: "ARI@example.com",
    jerseyNumber: "22",
    fetchImpl: async (url, init) => {
      request = { url, init, body: JSON.parse(init.body) };
      return new Response(JSON.stringify({ ok: true, status: "sent", email_delivery_status: "sent", profile: { id: "pp-1" } }), { status: 201, headers: { "Content-Type": "application/json" } });
    },
  });
  assert.equal(result.ok, true);
  assert.equal(request.url, "/v1/coach/players/provision");
  assert.equal(request.init.headers["x-user-id"], "coach@example.com");
  assert.deepEqual(request.body, { team_id: "team-1", first_name: "Ari", last_name: "Player", email: "ari@example.com", jersey_number: "22" });
  assert.equal("password" in request.body, false);
  assert.equal("temporary_password" in request.body, false);
});

test("provision maps cross-team account conflict safely", async () => {
  const result = await provisionCoachPlayer({
    coach: { email: "coach@example.com", role: "coach" },
    teamId: "team-1",
    firstName: "Ari",
    email: "ari@example.com",
    fetchImpl: async () => new Response(JSON.stringify({ error: "account_on_other_team" }), { status: 409, headers: { "Content-Type": "application/json" } }),
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /another ShotLab team/i);
});

test("invitation list uses coach-scoped team query", async () => {
  let request;
  const result = await loadCoachPlayerInvitations({
    coach: { email: "coach@example.com" },
    teamId: "team 1",
    fetchImpl: async (url, init) => {
      request = { url, init };
      return new Response(JSON.stringify({ invitations: [{ id: "i-1", status: "sent" }] }), { status: 200, headers: { "Content-Type": "application/json" } });
    },
  });
  assert.equal(result.ok, true);
  assert.equal(result.invitations.length, 1);
  assert.equal(request.url, "/v1/coach/players/provision?team_id=team%201");
  assert.equal(request.init.headers["x-user-id"], "coach@example.com");
});
