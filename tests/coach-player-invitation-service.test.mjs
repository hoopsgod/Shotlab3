import assert from "node:assert/strict";
import test from "node:test";
import { buildCoachPlayerInviteEmailLink, loadCoachPlayerInvitations, provisionCoachPlayer } from "../src/lib/coachPlayerInvitationService.js";

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

test("manual email fallback is pre-addressed and contains only the one-time setup link", () => {
  const link = buildCoachPlayerInviteEmailLink({
    recipient: "ARI@example.com",
    playerName: "Ari Player",
    setupUrl: "https://shotlab3.pages.dev/player-setup.html?token=one-time-token",
    expiresAt: "2026-07-26T12:00:00.000Z",
  });
  assert.match(link, /^mailto:ari%40example\.com\?/);
  const query = new URL(link).searchParams;
  assert.equal(query.get("subject"), "You've been added to ShotLab");
  const body = query.get("body");
  assert.match(body, /Hi Ari Player/);
  assert.match(body, /one-time link/i);
  assert.match(body, /https:\/\/shotlab3\.pages\.dev\/player-setup\.html\?token=one-time-token/);
  assert.match(body, /can only be used once/i);
  assert.match(body, /coach cannot see the password/i);
  assert.doesNotMatch(body, /temporary password/i);
});

test("manual email fallback is disabled without a recipient or secure URL", () => {
  assert.equal(buildCoachPlayerInviteEmailLink({ recipient: "", setupUrl: "https://example.test/setup" }), "");
  assert.equal(buildCoachPlayerInviteEmailLink({ recipient: "ari@example.com", setupUrl: "" }), "");
});
