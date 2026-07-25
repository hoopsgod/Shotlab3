import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const migration = fs.readFileSync("migrations/036_coach_player_invitations.sql", "utf8");
const provisionRoute = fs.readFileSync("functions/v1/coach/players/provision.js", "utf8");
const claimRoute = fs.readFileSync("functions/v1/player-auth/claim.js", "utf8");
const component = fs.readFileSync("src/components/CoachPlayerInviteForm.jsx", "utf8");
const app = fs.readFileSync("src/App.jsx", "utf8");
const setupPage = fs.readFileSync("public/player-setup.html", "utf8");

test("migration stores only a setup token hash and protects direct access", () => {
  assert.match(migration, /setup_token_hash text not null unique/i);
  assert.doesNotMatch(migration, /setup_token\s+text/i);
  assert.match(migration, /enable row level security/i);
  assert.match(migration, /revoke all on table public\.coach_player_invitations from public, anon, authenticated/i);
  assert.match(migration, /claim_coach_player_invitation/i);
  assert.match(migration, /setup_expires_at <= now\(\)/i);
  assert.match(migration, /status = 'claimed'/i);
});

test("provisioning is coach-authorized and never creates an emailed password", () => {
  assert.match(provisionRoute, /authorizeCoach/);
  assert.match(provisionRoute, /x-user-id|readUserId/);
  assert.match(provisionRoute, /randomToken\(\)/);
  assert.match(provisionRoute, /sha256Hex\(token\)/);
  assert.match(provisionRoute, /sendPlayerSetupEmail/);
  assert.doesNotMatch(provisionRoute, /temporary_password/i);
  assert.doesNotMatch(provisionRoute, /password\s*:/i);
});

test("claim route requires a user-selected password and hashes it server-side", () => {
  assert.match(claimRoute, /password\.length < 8/);
  assert.match(claimRoute, /hashLegacyPassword\(password, saltHex\)/);
  assert.match(claimRoute, /claim_coach_player_invitation/);
  assert.doesNotMatch(claimRoute, /return Response\.json\([^\n]*password/i);
});

test("coach UI replaces profile-only add flow with invitation flow", () => {
  assert.match(app, /CoachPlayerInviteForm/);
  assert.match(app, /id="coach-add-player-form"/);
  assert.match(component, /ADD PLAYER & SEND INVITE/);
  assert.match(component, /Player email/);
  assert.match(component, /COPY SECURE SETUP LINK/);
  assert.match(component, /Invite Sent/);
  assert.match(component, /Account Active/);
});

test("setup page uses a single-use token and does not expose it after claim", () => {
  assert.match(setupPage, /\/v1\/player-auth\/claim/);
  assert.match(setupPage, /new_password/);
  assert.match(setupPage, /history\.replaceState/);
  assert.match(setupPage, /Your coach cannot see it/i);
});
