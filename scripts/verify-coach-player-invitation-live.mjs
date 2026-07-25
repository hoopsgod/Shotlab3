import assert from "node:assert/strict";

import { onRequestPost as provisionPlayer } from "../functions/v1/coach/players/provision.js";
import { onRequestPost as claimInvitation } from "../functions/v1/player-auth/claim.js";
import { onRequestPost as loginPlayer } from "../functions/v1/legacy-auth/login/index.js";

const SUPABASE_URL = String(process.env.SUPABASE_URL || "").replace(/\/$/, "");
const SERVICE_ROLE_KEY = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "");
const COACH_EMAIL = String(process.env.TEST_COACH_EMAIL || "aq@gmail.com").trim().toLowerCase();

assert.ok(SUPABASE_URL, "SUPABASE_URL is required");
assert.ok(SERVICE_ROLE_KEY, "SUPABASE_SERVICE_ROLE_KEY is required");
assert.ok(COACH_EMAIL, "TEST_COACH_EMAIL is required");

const env = {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: SERVICE_ROLE_KEY,
  APP_BASE_URL: "https://shotlab3.pages.dev",
};

const serviceHeaders = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  "Content-Type": "application/json",
};

async function rest(table, { method = "GET", query = "", body, prefer = "return=representation" } = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}${query ? `?${query}` : ""}`, {
    method,
    headers: { ...serviceHeaders, Prefer: prefer },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(`Supabase ${method} ${table} failed (${response.status}): ${payload?.message || payload?.hint || "unknown"}`);
  }
  return payload;
}

async function routeJson(handler, { url, body, headers = {} }) {
  const response = await handler({
    request: new Request(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
    }),
    env,
  });
  const payload = await response.json().catch(() => ({}));
  return { response, payload };
}

async function findCoach() {
  const rows = await rest(
    "legacy_auth_profiles",
    { query: `select=email,team_id,role&email=eq.${encodeURIComponent(COACH_EMAIL)}&role=eq.coach&limit=1` },
  );
  const coach = Array.isArray(rows) ? rows[0] : null;
  assert.ok(coach?.team_id, `Test coach ${COACH_EMAIL} must have an active team`);
  return { email: String(coach.email).toLowerCase(), teamId: String(coach.team_id) };
}

async function cleanup(email) {
  const filter = `player_email=eq.${encodeURIComponent(email)}`;
  await rest("coach_player_invitations", { method: "DELETE", query: filter, prefer: "return=minimal" }).catch(() => null);
  await rest("player_profiles", { method: "DELETE", query: `invited_email=eq.${encodeURIComponent(email)}`, prefer: "return=minimal" }).catch(() => null);
  await rest("legacy_auth_profiles", { method: "DELETE", query: `email=eq.${encodeURIComponent(email)}`, prefer: "return=minimal" }).catch(() => null);
}

async function countRows(table, query) {
  const rows = await rest(table, { query });
  return Array.isArray(rows) ? rows.length : 0;
}

const unique = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const playerEmail = `shotlab-invite-smoke-${unique}@example.invalid`;
const password = `ShotLab!${unique}`;

let completed = false;
try {
  const coach = await findCoach();
  await cleanup(playerEmail);

  const provision = await routeJson(provisionPlayer, {
    url: "https://shotlab3.pages.dev/v1/coach/players/provision",
    headers: { "x-user-id": coach.email },
    body: {
      team_id: coach.teamId,
      first_name: "Invite",
      last_name: "Smoke",
      email: playerEmail,
      jersey_number: "99",
    },
  });
  assert.equal(provision.response.status, 201, JSON.stringify(provision.payload));
  assert.equal(provision.payload.ok, true);
  assert.ok(provision.payload.setup_url, "Provisioning must return a secure setup URL when email delivery is unavailable");
  assert.notEqual(provision.payload.email_delivery_status, "sent", "Live smoke must use the manual secure-link fallback");

  const setupUrl = new URL(provision.payload.setup_url);
  const token = setupUrl.searchParams.get("token");
  assert.ok(token && token.length >= 32, "Setup URL must contain a strong token");

  const claim = await routeJson(claimInvitation, {
    url: "https://shotlab3.pages.dev/v1/player-auth/claim",
    body: { setup_token: token, new_password: password },
  });
  assert.equal(claim.response.status, 200, JSON.stringify(claim.payload));
  assert.equal(claim.payload.ok, true);
  assert.equal(claim.payload.email, playerEmail);
  assert.equal(claim.payload.teamId, coach.teamId);

  const login = await routeJson(loginPlayer, {
    url: "https://shotlab3.pages.dev/v1/legacy-auth/login",
    body: { email: playerEmail, password },
  });
  assert.equal(login.response.status, 200, JSON.stringify(login.payload));
  assert.equal(login.payload?.profile?.email, playerEmail);
  assert.equal(login.payload?.profile?.team_id, coach.teamId);
  assert.equal(login.payload?.profile?.role, "player");

  const wrongPassword = await routeJson(loginPlayer, {
    url: "https://shotlab3.pages.dev/v1/legacy-auth/login",
    body: { email: playerEmail, password: `${password}-wrong` },
  });
  assert.equal(wrongPassword.response.status, 401);
  assert.equal(wrongPassword.payload.error, "invalid_credentials");

  const replay = await routeJson(claimInvitation, {
    url: "https://shotlab3.pages.dev/v1/player-auth/claim",
    body: { setup_token: token, new_password: password },
  });
  assert.equal(replay.response.status, 409, JSON.stringify(replay.payload));
  assert.equal(replay.payload.error, "invitation_not_active");

  const invitations = await rest("coach_player_invitations", {
    query: `select=id,status,team_id,player_profile_id&player_email=eq.${encodeURIComponent(playerEmail)}`,
  });
  const profiles = await rest("player_profiles", {
    query: `select=id,user_id,team_id,invite_status&invited_email=eq.${encodeURIComponent(playerEmail)}`,
  });
  const accounts = await rest("legacy_auth_profiles", {
    query: `select=email,team_id,role,password_hash,password_salt&email=eq.${encodeURIComponent(playerEmail)}`,
  });

  assert.equal(invitations.length, 1, "Exactly one invitation should exist");
  assert.equal(invitations[0].status, "claimed");
  assert.equal(profiles.length, 1, "Exactly one roster profile should exist");
  assert.equal(profiles[0].user_id, playerEmail);
  assert.equal(profiles[0].team_id, coach.teamId);
  assert.equal(profiles[0].invite_status, "claimed");
  assert.equal(accounts.length, 1, "Exactly one login account should exist");
  assert.equal(accounts[0].team_id, coach.teamId);
  assert.equal(accounts[0].role, "player");
  assert.ok(accounts[0].password_hash && accounts[0].password_salt, "Password must be stored only as a hash and salt");

  completed = true;
  console.log("Live coach-player invitation verification passed: provision, claim, login, duplicate prevention, and token replay rejection.");
} finally {
  await cleanup(playerEmail);
  const [inviteCount, profileCount, accountCount] = await Promise.all([
    countRows("coach_player_invitations", `select=id&player_email=eq.${encodeURIComponent(playerEmail)}`),
    countRows("player_profiles", `select=id&invited_email=eq.${encodeURIComponent(playerEmail)}`),
    countRows("legacy_auth_profiles", `select=email&email=eq.${encodeURIComponent(playerEmail)}`),
  ]);
  assert.deepEqual({ inviteCount, profileCount, accountCount }, { inviteCount: 0, profileCount: 0, accountCount: 0 }, "Live smoke cleanup must remove every temporary row");
  if (!completed) console.error("Live coach-player invitation verification failed; cleanup completed.");
}
