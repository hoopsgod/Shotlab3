import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  AUTHENTICATED_COLLECTION_STORAGE_KEYS,
  hydrateAuthenticatedCollectionsToStorage,
  waitForRegisteredSession,
} from "../src/lib/legacySignedCollectionPersistence.js";

function memoryStorage(entries = []) {
  const values = new Map(entries);
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
    snapshot() { return Object.fromEntries(values); },
  };
}

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const REGISTERED_EMAIL = "registered.player@shotlab.test";
const TEAM_ID = "team-mobile-parity";

const endpointPayloads = {
  "/v1/teams": { ok: true, teams: [{ id: TEAM_ID, name: "Parity Titans" }] },
  "/v1/players": {
    ok: true,
    players: [
      { id: "player-parity", email: REGISTERED_EMAIL, name: "Registered Player", role: "player", team_id: TEAM_ID },
      { id: "player-ava", email: "ava@shotlab.test", name: "Ava Brooks", role: "player", team_id: TEAM_ID },
    ],
  },
  "/v1/player-profiles": { ok: true, profiles: [{ id: "profile-parity", email: REGISTERED_EMAIL, team_id: TEAM_ID, first_name: "Registered", last_name: "Player" }] },
  "/v1/scores": { ok: true, scores: [{ id: "score-parity", email: REGISTERED_EMAIL, team_id: TEAM_ID, score: 12, date: "2026-08-14" }] },
  "/v1/program-scores": { ok: true, program_scores: [{ id: "program-parity", player_email: REGISTERED_EMAIL, team_id: TEAM_ID, score: 31, session_date: "2026-08-14" }] },
  "/v1/shot-logs": { ok: true, shot_logs: [{ id: "shot-parity", email: REGISTERED_EMAIL, player_id: REGISTERED_EMAIL, team_id: TEAM_ID, made: 125, date: "2026-08-14" }] },
  "/v1/events": { ok: true, events: [{ id: "event-parity", team_id: TEAM_ID, title: "Parity Marker Practice", date: "2026-08-15", time: "6:00 PM" }] },
  "/v1/rsvps": { ok: true, rsvps: [{ id: "rsvp-parity", team_id: TEAM_ID, event_id: "event-parity", email: REGISTERED_EMAIL }] },
  "/v1/strength-conditioning": {
    ok: true,
    sessions: [{ id: "sc-parity", team_id: TEAM_ID, sport: "Strength", date: "2026-08-16", location: "Parity Weight Room" }],
    rsvps: [{ id: "sc-rsvp-parity", team_id: TEAM_ID, session_id: "sc-parity", email: REGISTERED_EMAIL }],
    logs: [{ id: "sc-log-parity", team_id: TEAM_ID, session_id: "sc-parity", email: REGISTERED_EMAIL, sport: "Recovery" }],
  },
};

test("post-auth hydration waits for the newly signed-in identity instead of accepting a stale session", async () => {
  const storage = memoryStorage([["sl:session", JSON.stringify({ email: "stale.user@shotlab.test" })]]);
  setTimeout(() => storage.setItem("sl:session", JSON.stringify({ email: REGISTERED_EMAIL })), 20);

  const result = await waitForRegisteredSession({
    storage,
    expectedIdentity: REGISTERED_EMAIL,
    timeoutMs: 250,
    pollMs: 5,
  });

  assert.equal(result.ok, true);
  assert.equal(result.identity, REGISTERED_EMAIL);
});

test("registered post-auth hydration requires every mobile-visible signed collection and preserves backend markers", async () => {
  const storage = memoryStorage([["sl:session", JSON.stringify({ email: REGISTERED_EMAIL })]]);
  const calls = [];
  let playersAttempts = 0;

  const fetchImpl = async (path, options = {}) => {
    calls.push({ path: String(path), headers: new Headers(options.headers || {}) });
    if (path === "/v1/players") {
      playersAttempts += 1;
      if (playersAttempts === 1) return jsonResponse({ error: "temporary_unavailable" }, 503);
    }
    const payload = endpointPayloads[path];
    assert.ok(payload, `unexpected signed collection request: ${path}`);
    return jsonResponse(payload);
  };

  const result = await hydrateAuthenticatedCollectionsToStorage({
    fetchImpl,
    storage,
    expectedIdentity: REGISTERED_EMAIL,
    groupAttempts: 2,
    retryDelayMs: 1,
    sessionWaitMs: 50,
    sessionPollMs: 1,
  });

  assert.equal(result.ok, true, result.failures.join(" | "));
  assert.equal(result.identity, REGISTERED_EMAIL);
  assert.equal(result.identityHydrated, true);
  assert.deepEqual([...result.hydrated].sort(), [...AUTHENTICATED_COLLECTION_STORAGE_KEYS].sort());
  assert.equal(playersAttempts, 2, "transient signed reads must be retried before accepting an empty/default mobile state");

  const shotLogs = JSON.parse(storage.getItem("sl:shotlogs"));
  assert.equal(shotLogs[0].made, 125);
  assert.equal(shotLogs[0].email, REGISTERED_EMAIL);
  const events = JSON.parse(storage.getItem("sl:events"));
  assert.equal(events[0].title, "Parity Marker Practice");
  const strength = JSON.parse(storage.getItem("sl:sc-sessions"));
  assert.equal(strength[0].location, "Parity Weight Room");

  for (const call of calls) {
    assert.equal(call.headers.get("x-user-id"), REGISTERED_EMAIL, `${call.path} must be tied to the newly authenticated identity`);
  }
});

test("registered startup overlaps independent signed collection reads instead of serializing mobile login", async () => {
  const storage = memoryStorage([["sl:session", JSON.stringify({ email: REGISTERED_EMAIL })]]);
  let active = 0;
  let maxActive = 0;
  const started = [];

  const fetchImpl = async (path, options = {}) => {
    started.push(String(path));
    assert.equal(new Headers(options.headers || {}).get("x-user-id"), REGISTERED_EMAIL);
    active += 1;
    maxActive = Math.max(maxActive, active);
    await new Promise((resolve) => setTimeout(resolve, 8));
    active -= 1;
    const payload = endpointPayloads[path];
    assert.ok(payload, `unexpected signed collection request: ${path}`);
    return jsonResponse(payload);
  };

  const result = await hydrateAuthenticatedCollectionsToStorage({
    fetchImpl,
    storage,
    expectedIdentity: REGISTERED_EMAIL,
    groupAttempts: 1,
    sessionWaitMs: 20,
    sessionPollMs: 1,
  });

  assert.equal(result.ok, true, result.failures.join(" | "));
  assert.ok(maxActive > 1, `expected overlapping signed collection reads; observed maximum concurrency ${maxActive}`);
  assert.equal(new Set(started).size, 9, "all nine independent authenticated collection endpoints must participate in startup hydration");
});

test("registered hydration fails closed when the signed players payload does not contain the authenticated identity", async () => {
  const storage = memoryStorage([["sl:session", JSON.stringify({ email: REGISTERED_EMAIL })]]);
  const fetchImpl = async (path) => {
    const payload = path === "/v1/players"
      ? { ok: true, players: [{ id: "other", email: "other@shotlab.test", team_id: TEAM_ID, role: "player" }] }
      : endpointPayloads[path];
    return jsonResponse(payload);
  };

  const result = await hydrateAuthenticatedCollectionsToStorage({
    fetchImpl,
    storage,
    expectedIdentity: REGISTERED_EMAIL,
    groupAttempts: 1,
    sessionWaitMs: 20,
    sessionPollMs: 1,
  });

  assert.equal(result.ok, false);
  assert.equal(result.identityHydrated, false);
  assert.ok(result.failures.includes("sl:players:authenticated_identity_missing"));
});

test("production route enhancers are idempotent and finish authenticated data hydration before exposing the mobile workspace", () => {
  const enhancer = fs.readFileSync(new URL("../scripts/apply-post-auth-persistence-hydration.mjs", import.meta.url), "utf8");
  const signedReadsEnhancer = fs.readFileSync(new URL("../scripts/apply-legacy-signed-collection-reads.mjs", import.meta.url), "utf8");
  const auth = fs.readFileSync(new URL("../src/components/AuthWorkspace.jsx", import.meta.url), "utf8");
  const app = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
  const routeRunner = fs.readFileSync(new URL("../scripts/run-route-enhancers.mjs", import.meta.url), "utf8");

  assert.match(enhancer, /hydrateAuthenticatedCollectionsToStorage, requestLegacySignedCollection/);
  assert.match(enhancer, /await DB\.set\("sl:session"/);
  assert.match(enhancer, /hydrateAuthenticatedCollectionsToStorage\(\{expectedIdentity:normalizeEmail\(p\.email\)\}\)/);
  assert.match(enhancer, /await hydratePersistedData\(\)/);
  assert.match(enhancer, /setUserIndex < hydrateIndex/);
  assert.match(enhancer, /Authenticated persistence import must exist exactly once after enhancement/);
  assert.match(enhancer, /source\.split\(signedImport\)\.join\(''\)/);
  assert.match(enhancer, /combinedOccurrences > 1/);
  assert.match(enhancer, /AuthWorkspace must not trigger a second post-login hydration\/reload/);

  assert.match(signedReadsEnhancer, /const combinedImport = 'import \{ hydrateAuthenticatedCollectionsToStorage, requestLegacySignedCollection \}/);
  assert.match(signedReadsEnhancer, /!source\.includes\(importLine\) && !source\.includes\(combinedImport\)/);

  assert.match(app, /hydrateAuthenticatedCollectionsToStorage\(\{expectedIdentity:normalizeEmail\(p\.email\)\}\)/);
  assert.match(app, /await hydratePersistedData\(\)/);
  assert.doesNotMatch(auth, /hydrateAuthenticatedCollectionsToStorage/);
  assert.doesNotMatch(auth, /window\.location\?\.reload/);

  const signedReadsIndex = routeRunner.indexOf("scripts/apply-legacy-signed-collection-reads.mjs");
  const postAuthIndex = routeRunner.indexOf("scripts/apply-post-auth-persistence-hydration.mjs");
  assert.ok(signedReadsIndex >= 0 && postAuthIndex > signedReadsIndex, "signed collection adapters must be installed before post-auth hydration");
});
