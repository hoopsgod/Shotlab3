import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const component = read("src/components/PlayerProfilePhotoCard.jsx");
const service = read("src/lib/playerProfilePhotoService.js");
const endpoint = read("functions/v1/player-photo/index.js");
const playersApi = read("functions/v1/players/index.js");
const enhancer = read("scripts/apply-phase7e-player-profile-photo.mjs");
const runner = read("scripts/run-route-enhancers.mjs");
const rosterCss = read("src/styles/Phase2PremiumRosterLayer.css");
const migration = read("migrations/057_player_profile_photos.sql");

test("player profile exposes one shared, constrained photo picker", () => {
  assert.match(component, /data-testid="player-profile-photo-card"/);
  assert.match(component, /accept="image\/jpeg,image\/png,image\/webp"/);
  assert.match(component, /5 \* 1024 \* 1024/);
  assert.match(component, /loadPlayerProfilePhoto/);
  assert.match(component, /savePlayerProfilePhoto/);
  assert.doesNotMatch(component, /demoMode|isDemoAccount|isDemoMode/);
});

test("persistence service contains demo safety without creating alternate product UI", () => {
  assert.match(service, /isDemoAccount/);
  assert.match(service, /fetch\("\/v1\/player-photo"/);
  assert.match(service, /buildApiIdentityHeaders/);
  assert.match(service, /new FormData\(\)/);
  assert.match(service, /URL\.createObjectURL/);
});

test("photo endpoint authenticates the player and keeps storage credentials server-side", () => {
  assert.match(endpoint, /readAuthenticatedIdentity/);
  assert.match(endpoint, /allowDemo: false/);
  assert.match(endpoint, /normalizeIdentity\(player\?\.role\) !== "player"/);
  assert.match(endpoint, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(endpoint, /crypto\.subtle\.digest\("SHA-256"/);
  assert.match(endpoint, /const objectPath = `\$\{playerKey\}\/avatar`/);
  assert.match(endpoint, /"x-upsert": "true"/);
  assert.match(endpoint, /profile_photo_type_invalid/);
  assert.match(endpoint, /profile_photo_size_invalid/);
});

test("players API carries one canonical photo URL without erasing it during unrelated sync", () => {
  assert.match(playersApi, /photo_url/);
  assert.match(playersApi, /photoUrl: cleanText\(value\?\.photo_url \?\? value\?\.photoUrl/);
  assert.match(playersApi, /if \(!row\.photoUrl && prior\?\.photo_url\) row\.photoUrl/);
});

test("route enhancer places the player photo on profile and coach roster", () => {
  assert.match(enhancer, /PlayerProfilePhotoCard/);
  assert.match(enhancer, /data-phase7e-player-photo/);
  assert.match(enhancer, /coachRosterCard__photo/);
  assert.match(enhancer, /p\.photoUrl\|\|p\.photo_url/);
  assert.match(enhancer, /data-player-roster-identity/);
  const phaseIndex = runner.indexOf("scripts/apply-phase7e-player-profile-photo.mjs");
  const minifyIndex = runner.indexOf("scripts/minify-visual-authority-css.mjs");
  assert.ok(phaseIndex > 0 && minifyIndex > phaseIndex, "Phase 7E must run after reconciliation and before final CSS minification");
});

test("coach roster uses photos plus restrained alternating team color", () => {
  assert.match(rosterCss, /\.coachRosterCard__photo\{/);
  assert.match(rosterCss, /object-fit:cover!important/);
  assert.match(rosterCss, /team-brand-primary/);
  assert.match(rosterCss, /team-brand-secondary/);
  assert.match(rosterCss, /\.phase1RosterRow:nth-of-type\(even\)/);
  assert.match(rosterCss, /color-mix\(in srgb/);
});

test("migration records the canonical photo column and restricted avatar bucket", () => {
  assert.match(migration, /add column if not exists photo_url text/);
  assert.match(migration, /'player-avatars'/);
  assert.match(migration, /5242880/);
  assert.match(migration, /image\/jpeg/);
  assert.match(migration, /image\/png/);
  assert.match(migration, /image\/webp/);
});
