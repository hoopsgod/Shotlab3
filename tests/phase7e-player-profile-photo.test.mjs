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

async function coachUpload({ targetTeam = "team-1", coachTeams = ["team-1", "team-3"], storageStatus = 200, fallbackDataUrl = "" } = {}) {
  const originalFetch = globalThis.fetch;
  const writes = [];
  globalThis.fetch = async (input, init = {}) => {
    const url = String(input);
    const method = String(init?.method || "GET").toUpperCase();
    if (url.includes("/rest/v1/legacy_auth_sessions?")) {
      return json([{
        token_hash: "session-hash",
        user_email: "coach@example.com",
        user_role: "coach",
        team_id: coachTeams[0] || null,
        created_at: "2026-01-01T00:00:00.000Z",
        last_seen_at: "2026-01-01T00:00:00.000Z",
        expires_at: "2099-01-01T00:00:00.000Z",
        revoked_at: null,
      }]);
    }
    if (url.includes("/rest/v1/rpc/resolve_app_user_uuid")) return json("coach-uuid");
    if (url.includes("/rest/v1/legacy_auth_profiles?")) {
      return json(coachTeams.map((team_id) => ({ team_id, role: "coach" })));
    }
    if (url.includes("/rest/v1/team_memberships?")) return json([]);
    if (url.includes("/rest/v1/teams?")) return json([]);
    if (url.includes("/rest/v1/players?")) {
      const parsed = new URL(url);
      const email = String(parsed.searchParams.get("email") || "").replace(/^eq\./, "");
      if (method === "GET" && email === "coach@example.com") return json([]);
      if (method === "GET" && email === "player@example.com") return json([{ id: "player-1", email, role: "player", team_id: targetTeam, photo_url: null }]);
      if (method === "PATCH" && email === "player@example.com") {
        writes.push({ kind: "player_update", url, body: JSON.parse(String(init.body || "{}")) });
        return json([{ id: "player-1", email, role: "player", team_id: targetTeam, photo_url: "saved" }]);
      }
      return json([]);
    }
    if (url.includes("/storage/v1/object/player-avatars/")) {
      writes.push({ kind: "storage", url, method });
      return storageStatus === 200 ? new Response("", { status: 200 }) : new Response("bucket unavailable", { status: storageStatus });
    }
    throw new Error(`Unexpected fetch: ${method} ${url}`);
  };
  try {
    const form = new FormData();
    form.append("player_email", "player@example.com");
    form.append("file", new Blob([new Uint8Array([1, 2, 3])], { type: "image/png" }), "avatar.png");
    if (fallbackDataUrl) form.append("fallback_data_url", fallbackDataUrl);
    const request = new Request("https://shotlab.test/v1/player-photo", {
      method: "POST",
      headers: { Cookie: "sl_legacy_session=coach-session-token" },
      body: form,
    });
    const response = await onRequestPost({ request, env: ENV });
    return { response, body: await response.json(), writes };
  } finally {
    globalThis.fetch = originalFetch;
  }
}

test("player personalization accepts iPhone photo sources and exposes actionable state", () => {
  assert.match(component, /premiumSummaryPanel/);
  assert.match(component, /btn-v cta-primary/);
  assert.match(component, /width="80" height="80"/);
  assert.match(component, /borderRadius: "50%"/);
  assert.match(component, /objectFit: "cover"/);
  assert.match(component, /accept="image\/\*"/);
  assert.match(component, /Preparing photo/);
  assert.match(component, /role="alert"/);
  assert.match(component, /savePlayerProfilePhoto/);
});

test("persistence service creates a compact JPEG fallback without duplicating the upload payload", () => {
  assert.match(service, /c\.width=c\.height=512/);
  assert.match(service, /g\.drawImage/);
  assert.match(service, /toDataURL\("image\/jpeg",\.82\)/);
  assert.match(service, /fallback_data_url/);
  assert.match(service, /buildApiIdentityHeaders\(\)/);
  assert.match(service, /fetch\("\/v1\/player-photo"/);
  assert.match(service, /MAX=15\*1024\*1024/);
  assert.doesNotMatch(service, /canvasToBlob|new File\(\[blob\]/);
});

test("photo endpoint authorizes player self-service or a coach with canonical write access to the target team", () => {
  assert.match(endpoint, /readAuthenticatedIdentity/);
  assert.match(endpoint, /allowDemo: false/);
  assert.match(endpoint, /collectTeamPriorityAccess/);
  assert.match(endpoint, /writableTeamIds\.has\(targetTeamId\)/);
  assert.match(endpoint, /requester === targetEmail/);
  assert.match(endpoint, /player_photo_target_forbidden/);
});

test("endpoint accepts HEIC and HEIF and retains bounded input limits", () => {
  assert.match(endpoint, /image\/heic/);
  assert.match(endpoint, /image\/heif/);
  assert.match(endpoint, /MAX_BYTES = 15 \* 1024 \* 1024/);
  assert.match(endpoint, /MAX_FALLBACK_DATA_URL_CHARS = 2_000_000/);
});

test("real legacy-session coach can upload without a coach row in players", async () => {
  const result = await coachUpload();
  assert.equal(result.response.status, 200);
  assert.equal(result.body.ok, true);
  assert.equal(result.body.storage_mode, "signed_api");
  assert.match(result.body.photo_url, /\/storage\/v1\/object\/public\/player-avatars\//);
  assert.equal(result.writes.filter((entry) => entry.kind === "storage").length, 1);
  assert.equal(result.writes.filter((entry) => entry.kind === "player_update").length, 1);
});

test("storage failure automatically falls back to a compact database-backed photo", async () => {
  const fallback = `data:image/jpeg;base64,${Buffer.from("fallback-avatar").toString("base64")}`;
  const result = await coachUpload({ storageStatus: 500, fallbackDataUrl: fallback });
  assert.equal(result.response.status, 200);
  assert.equal(result.body.ok, true);
  assert.equal(result.body.storage_mode, "database_fallback");
  assert.equal(result.body.photo_url, fallback);
  const update = result.writes.find((entry) => entry.kind === "player_update");
  assert.equal(update?.body?.photo_url, fallback);
});

test("multi-team coach can upload for a player on another team they can write", async () => {
  const result = await coachUpload({ targetTeam: "team-3" });
  assert.equal(result.response.status, 200);
  assert.equal(result.body.ok, true);
  assert.equal(result.writes.filter((entry) => entry.kind === "player_update").length, 1);
});

test("coach cannot upload a profile photo for a player on a team they cannot write", async () => {
  const result = await coachUpload({ targetTeam: "team-2" });
  assert.equal(result.response.status, 403);
  assert.equal(result.body.error, "player_photo_target_forbidden");
  assert.equal(result.writes.length, 0);
});

test("players API carries one canonical bounded photo value without erasing it during unrelated sync", () => {
  assert.match(playersApi, /MAX_PHOTO_URL_CHARS = 2_000_000/);
  assert.match(playersApi, /photoUrl: cleanText\(value\?\.photo_url \?\? value\?\.photoUrl, MAX_PHOTO_URL_CHARS\)/);
  assert.match(playersApi, /if \(!row\.photoUrl && prior\?\.photo_url\) row\.photoUrl = cleanText\(prior\.photo_url, MAX_PHOTO_URL_CHARS\)/);
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

test("migration allows iPhone formats while retaining the canonical photo column", () => {
  assert.match(migration, /add column if not exists photo_url text/);
  assert.match(migration, /'player-avatars'/);
  assert.match(migration, /15728640/);
  assert.match(migration, /image\/jpeg/);
  assert.match(migration, /image\/png/);
  assert.match(migration, /image\/webp/);
  assert.match(migration, /image\/heic/);
  assert.match(migration, /image\/heif/);
});
