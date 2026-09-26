import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { onRequestPost } from "../functions/v1/player-photo/index.js";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const component = read("src/components/PlayerProfilePhotoCard.jsx");
const service = read("src/lib/playerProfilePhotoService.js");
const endpoint = read("functions/v1/player-photo/index.js");
const playersApi = read("functions/v1/players/index.js");
const enhancer = read("scripts/apply-phase7e-player-profile-photo.mjs");
const runner = read("scripts/run-route-enhancers.mjs");
const rosterCss = read("src/styles/Phase2PremiumRosterLayer.css");
const migration = read("migrations/057_player_profile_photos.sql");

const ENV = {
  SUPABASE_URL: "https://project.supabase.co",
  SUPABASE_ANON_KEY: "anon-test-key",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-test-key",
};

const json = (value, status = 200) => new Response(JSON.stringify(value), { status, headers: { "Content-Type": "application/json" } });

async function coachUpload({ targetTeam = "team-1" } = {}) {
  const originalFetch = globalThis.fetch;
  const writes = [];
  globalThis.fetch = async (input, init = {}) => {
    const url = String(input);
    const method = String(init?.method || "GET").toUpperCase();
    if (url.endsWith("/auth/v1/user")) return json({ id: "coach-auth", email: "coach@example.com" });
    if (url.includes("/rest/v1/players?")) {
      const parsed = new URL(url);
      const email = String(parsed.searchParams.get("email") || "").replace(/^eq\./, "");
      if (method === "GET" && email === "coach@example.com") return json([{ id: "coach-1", email, role: "coach", team_id: "team-1", photo_url: null }]);
      if (method === "GET" && email === "player@example.com") return json([{ id: "player-1", email, role: "player", team_id: targetTeam, photo_url: null }]);
      if (method === "PATCH" && email === "player@example.com") {
        writes.push({ kind: "player_update", url, body: JSON.parse(String(init.body || "{}")) });
        return json([{ id: "player-1", email, role: "player", team_id: targetTeam, photo_url: "saved" }]);
      }
      return json([]);
    }
    if (url.includes("/storage/v1/object/player-avatars/")) {
      writes.push({ kind: "storage", url, method });
      return new Response("", { status: 200 });
    }
    throw new Error(`Unexpected fetch: ${method} ${url}`);
  };
  try {
    const form = new FormData();
    form.append("player_email", "player@example.com");
    form.append("file", new Blob([new Uint8Array([1, 2, 3])], { type: "image/png" }), "avatar.png");
    const request = new Request("https://shotlab.test/v1/player-photo", {
      method: "POST",
      headers: { Authorization: "Bearer player-photo-test-token" },
      body: form,
    });
    const response = await onRequestPost({ request, env: ENV });
    return { response, body: await response.json(), writes };
  } finally {
    globalThis.fetch = originalFetch;
  }
}

test("player personalization exposes one shared, constrained photo picker using the premium system", () => {
  assert.match(component, /premiumSummaryPanel/);
  assert.match(component, /btn-v cta-primary/);
  assert.match(component, /width="80" height="80"/);
  assert.match(component, /borderRadius:"50%"/);
  assert.match(component, /objectFit:"cover"/);
  assert.match(component, /accept="image\/jpeg,image\/png,image\/webp"/);
  assert.match(component, /5242880/);
  assert.match(component, /saved\|\|player\.photoUrl\|\|player\.photo_url/);
  assert.match(component, /savePlayerProfilePhoto/);
  assert.doesNotMatch(component, /loadPlayerProfilePhoto|demoMode|isDemoAccount|isDemoMode/);
});

test("persistence service keeps demo uploads local and registered writes target the selected player", () => {
  assert.match(service, /isDemoAccount/);
  assert.match(service, /fetch\("\/v1\/player-photo"/);
  assert.match(service, /buildApiIdentityHeaders\(\)/);
  assert.match(service, /new FormData\(\)/);
  assert.match(service, /body\.append\("player_email", id\)/);
  assert.match(service, /URL\.createObjectURL/);
  assert.match(service, /throw Error/);
  assert.doesNotMatch(service, /loadPlayerProfilePhoto/);
});

test("photo endpoint authorizes player self-service or a coach for the same team", () => {
  assert.match(endpoint, /readAuthenticatedIdentity/);
  assert.match(endpoint, /allowDemo: false/);
  assert.match(endpoint, /COACH_ROLES/);
  assert.match(endpoint, /actorTeamId === targetTeamId/);
  assert.match(endpoint, /requester === targetEmail/);
  assert.match(endpoint, /player_photo_target_forbidden/);
  assert.match(endpoint, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(endpoint, /crypto\.subtle\.digest\("SHA-256"/);
  assert.match(endpoint, /const objectPath = `\$\{playerKey\}\/avatar`/);
  assert.match(endpoint, /"x-upsert": "true"/);
  assert.match(endpoint, /profile_photo_type_invalid/);
  assert.match(endpoint, /profile_photo_size_invalid/);
});

test("same-team coach can upload a photo that persists on the target player row", async () => {
  const result = await coachUpload();
  assert.equal(result.response.status, 200);
  assert.equal(result.body.ok, true);
  assert.match(result.body.photo_url, /\/storage\/v1\/object\/public\/player-avatars\//);
  assert.equal(result.writes.filter((entry) => entry.kind === "storage").length, 1);
  assert.equal(result.writes.filter((entry) => entry.kind === "player_update").length, 1);
  assert.match(result.writes.find((entry) => entry.kind === "player_update").url, /email=eq\.player%40example\.com/);
});

test("coach cannot upload a profile photo for a player on another team", async () => {
  const result = await coachUpload({ targetTeam: "team-2" });
  assert.equal(result.response.status, 403);
  assert.equal(result.body.error, "player_photo_target_forbidden");
  assert.equal(result.writes.length, 0);
});

test("players API carries one canonical photo URL without erasing it during unrelated sync", () => {
  assert.match(playersApi, /photo_url/);
  assert.match(playersApi, /photoUrl: cleanText\(value\?\.photo_url \?\? value\?\.photoUrl/);
  assert.match(playersApi, /if \(!row\.photoUrl && prior\?\.photo_url\) row\.photoUrl/);
});

test("route enhancer moves player photo out of Progress into Personalization and preserves coach identity surfaces", () => {
  assert.match(enhancer, /personalization:"\/personalization"/);
  assert.match(enhancer, /k:"personalization"/);
  assert.match(enhancer, /player-personalization-workspace/);
  assert.match(enhancer, /photo must live in Personalization before Progress/);
  assert.match(enhancer, /players\.find\(rowMatchesPlayerIdentity\)\|\|u/);
  assert.match(enhancer, /coachRosterCard__photo/);
  assert.match(enhancer, /p\.photoUrl\|\|p\.photo_url/);
  assert.match(enhancer, /coach-player-profile-photo/);
  assert.match(enhancer, /player\?\.photoUrl\|\|player\?\.photo_url/);
  assert.match(enhancer, /coach player profile avatar anchor missing/);
  assert.match(enhancer, /source\.split\(photoSurface\)\.length!==2/);
  assert.match(enhancer, /coach player profile photo rendering duplicated/);
  const phaseIndex = runner.indexOf("scripts/apply-phase7e-player-profile-photo.mjs");
  const minifyIndex = runner.indexOf("scripts/minify-visual-authority-css.mjs");
  assert.ok(phaseIndex > 0 && minifyIndex > phaseIndex, "Phase 7E must run after reconciliation and before final CSS minification");
});

test("route enhancer preserves canonical photo hydration within the unchanged JS budget", () => {
  assert.match(enhancer, /remotePersistence\.js/);
  assert.match(enhancer, /photoUrl: cleanText\(row\.photoUrl \|\| row\.photo_url\) \|\| null/);
  assert.match(enhancer, /player app-normalizer anchor missing/);
  assert.match(enhancer, /remoteRows === "object"/);
  assert.match(enhancer, /remote debug compaction marker missing/);
  assert.doesNotMatch(enhancer, /photo_url: app\.photoUrl/);
});

test("coach roster uses photos plus alternating restrained team color", () => {
  assert.match(enhancer, /style=\{\{objectFit:"cover"\}\}/);
  assert.match(rosterCss, /team-brand-primary/);
  assert.match(rosterCss, /team-brand-secondary/);
  assert.match(rosterCss, /\.phase1RosterRow:nth-of-type\(even\)/);
  assert.match(rosterCss, /\.phase1RosterRow\{[^}]*background:color-mix\(in srgb/);
});

test("migration records the canonical photo column and restricted avatar bucket", () => {
  assert.match(migration, /add column if not exists photo_url text/);
  assert.match(migration, /'player-avatars'/);
  assert.match(migration, /5242880/);
  assert.match(migration, /image\/jpeg/);
  assert.match(migration, /image\/png/);
  assert.match(migration, /image\/webp/);
});
