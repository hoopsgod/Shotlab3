import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  createStrengthConditioningPersistenceService,
  scPendingMask,
} from "../src/lib/strengthConditioningPersistenceService.js";
import {
  hydrateAuthenticatedCollectionsToStorage,
  requestLegacySignedCollection,
} from "../src/lib/legacySignedCollectionPersistence.js";
import { routeEnhancersFor } from "../scripts/run-route-enhancers.mjs";

const EMAIL = "strength.owner@shotlab.test";
const TEAM_ID = "team-strength-owner";
const PENDING_KEY = "sl:scp";

function memoryStorage(entries = []) {
  const values = new Map(entries);
  return {
    values,
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
  };
}

function response(payload, status = 200) {
  return new Response(JSON.stringify(payload), { status, headers: { "content-type": "application/json" } });
}

const LOCAL_SESSION = { id: 1785462812819, teamId: TEAM_ID, sport: "Offline Lift", date: "2026-09-08" };
const REMOTE_SESSION = { id: "remote-lift", team_id: TEAM_ID, sport: "Remote Lift", date: "2026-09-09" };
const LOCAL_RSVP = { sessionId: "remote-lift", playerId: EMAIL, email: EMAIL, teamId: TEAM_ID, ts: 7 };
const REMOTE_RSVP = { id: `${TEAM_ID}:remote-lift:${EMAIL}`, session_id: "remote-lift", player_id: EMAIL, email: EMAIL, team_id: TEAM_ID, ts: 8 };
const LOCAL_LOG = { id: 1785462812999, sessionId: "remote-lift", playerId: EMAIL, email: EMAIL, teamId: TEAM_ID, sport: "Offline Lift", ts: 9 };
const REMOTE_LOG = { id: "remote-log", session_id: "remote-lift", player_id: EMAIL, email: EMAIL, team_id: TEAM_ID, sport: "Remote Lift", ts: 10 };

function registeredStorage({ sessions = [LOCAL_SESSION], rsvps = [LOCAL_RSVP], logs = [LOCAL_LOG], teamId = TEAM_ID } = {}) {
  return memoryStorage([
    ["sl:session", JSON.stringify({ email: EMAIL, teamId, role: "player" })],
    ["sl:players", JSON.stringify([{ id: "strength-owner", email: EMAIL, teamId, role: "player" }])],
    ["sl:sc-sessions", JSON.stringify(sessions)],
    ["sl:sc-rsvps", JSON.stringify(rsvps)],
    ["sl:sc-logs", JSON.stringify(logs)],
  ]);
}

function hydrationPayloads({ sessions = [REMOTE_SESSION], rsvps = [REMOTE_RSVP], logs = [REMOTE_LOG], teamId = TEAM_ID } = {}) {
  return {
    "/v1/teams": { ok: true, teams: [{ id: teamId, name: "Strength Team" }] },
    "/v1/players": { ok: true, players: [{ id: "strength-owner", email: EMAIL, role: "player", team_id: teamId }] },
    "/v1/player-profiles": { ok: true, profiles: [] },
    "/v1/scores": { ok: true, scores: [] },
    "/v1/program-scores": { ok: true, program_scores: [] },
    "/v1/shot-logs": { ok: true, shot_logs: [] },
    "/v1/events": { ok: true, events: [] },
    "/v1/rsvps": { ok: true, rsvps: [] },
    "/v1/strength-conditioning": { ok: true, team_id: teamId, sessions, rsvps, logs },
  };
}

test("failed S&C replacement records exact requester/team resource ownership, including empty deletion truth", async () => {
  const storage = registeredStorage({ sessions: [] });
  let posted = null;
  const service = createStrengthConditioningPersistenceService({
    storage,
    fetchImpl: async (path, init = {}) => {
      posted = { path, body: JSON.parse(init.body) };
      return response({ error: "offline" }, 503);
    },
  });

  await assert.rejects(() => service.sync("sessions", []), /strength_conditioning_sync_failed|offline/);
  assert.deepEqual(posted, {
    path: "/v1/strength-conditioning",
    body: { team_id: TEAM_ID, resource: "sessions", rows: [] },
  });
  assert.equal(scPendingMask(storage), 1);
  assert.equal(storage.getItem(PENDING_KEY), `${EMAIL}\t${TEAM_ID}\t1`);
});

test("S&C pending bitmask preserves partial failures and successful retry clears only confirmed resource", async () => {
  const storage = registeredStorage();
  let mode = "fail";
  const service = createStrengthConditioningPersistenceService({
    storage,
    fetchImpl: async (_path, init = {}) => {
      const body = JSON.parse(init.body);
      if (mode === "fail") return response({ error: "offline" }, 503);
      return response({ ok: true, storage_mode: "signed_api", team_id: TEAM_ID, resource: body.resource, rows: body.rows, deleted_count: 0 });
    },
  });

  await assert.rejects(() => service.sync("sessions", [LOCAL_SESSION]));
  await assert.rejects(() => service.sync("rsvps", [LOCAL_RSVP]));
  assert.equal(scPendingMask(storage), 3);
  assert.equal(storage.getItem(PENDING_KEY), `${EMAIL}\t${TEAM_ID}\t3`);

  mode = "success";
  await service.sync("sessions", [LOCAL_SESSION]);
  assert.equal(scPendingMask(storage), 2);
  assert.equal(storage.getItem(PENDING_KEY), `${EMAIL}\t${TEAM_ID}\t2`);

  await service.sync("rsvps", [LOCAL_RSVP]);
  assert.equal(scPendingMask(storage), 0);
  assert.equal(storage.getItem(PENDING_KEY), null);
});

test("legacy S&C reads serve exact pending local collection without contacting stale remote state", async () => {
  for (const [table, resource, key, local] of [
    ["sc_sessions", "sessions", "sl:sc-sessions", []],
    ["sc_rsvps", "rsvps", "sl:sc-rsvps", [LOCAL_RSVP]],
    ["sc_logs", "logs", "sl:sc-logs", [LOCAL_LOG]],
  ]) {
    const storage = registeredStorage();
    storage.setItem(key, JSON.stringify(local));
    const bit = resource === "sessions" ? 1 : resource === "rsvps" ? 2 : 4;
    storage.setItem(PENDING_KEY, `${EMAIL}\t${TEAM_ID}\t${bit}`);
    let calls = 0;

    const result = await requestLegacySignedCollection({
      table,
      storage,
      supabaseAuthEnabled: true,
      fetchImpl: async () => {
        calls += 1;
        return response({ ok: true, sessions: [REMOTE_SESSION], rsvps: [REMOTE_RSVP], logs: [REMOTE_LOG] });
      },
    });

    assert.equal(result.error, null, resource);
    assert.equal(result.storageMode, "local_pending", resource);
    assert.deepEqual(result.data, local, resource);
    assert.equal(calls, 0, `${resource}: pending startup read must not contact stale remote state`);
  }
});

test("post-auth S&C hydration preserves only pending resources while remote wins confirmed resources", async () => {
  const storage = registeredStorage();
  storage.setItem(PENDING_KEY, `${EMAIL}\t${TEAM_ID}\t2`);
  const payloads = hydrationPayloads();

  const result = await hydrateAuthenticatedCollectionsToStorage({
    storage,
    fetchImpl: async (path) => response(payloads[path]),
    expectedIdentity: EMAIL,
    groupAttempts: 1,
    sessionWaitMs: 20,
    sessionPollMs: 1,
  });

  assert.equal(result.ok, true, result.failures.join(" | "));
  assert.deepEqual(result.pending.filter((key) => key.startsWith("sl:sc-")), ["sl:sc-rsvps"]);
  assert.deepEqual(JSON.parse(storage.getItem("sl:sc-sessions")), [REMOTE_SESSION]);
  assert.deepEqual(JSON.parse(storage.getItem("sl:sc-rsvps")), [LOCAL_RSVP]);
  assert.deepEqual(JSON.parse(storage.getItem("sl:sc-logs")), [REMOTE_LOG]);
});

test("S&C pending ownership from another team cannot override successful current-team remote truth", async () => {
  const activeTeamId = "team-strength-current";
  const storage = registeredStorage({ teamId: activeTeamId });
  storage.setItem(PENDING_KEY, `${EMAIL}\t${TEAM_ID}\t7`);
  const currentSession = { ...REMOTE_SESSION, id: "current-lift", team_id: activeTeamId };
  const currentRsvp = { ...REMOTE_RSVP, id: `${activeTeamId}:current-lift:${EMAIL}`, session_id: "current-lift", team_id: activeTeamId };
  const currentLog = { ...REMOTE_LOG, id: "current-log", session_id: "current-lift", team_id: activeTeamId };
  const payloads = hydrationPayloads({ sessions: [currentSession], rsvps: [currentRsvp], logs: [currentLog], teamId: activeTeamId });

  const result = await hydrateAuthenticatedCollectionsToStorage({
    storage,
    fetchImpl: async (path) => response(payloads[path]),
    expectedIdentity: EMAIL,
    groupAttempts: 1,
    sessionWaitMs: 20,
    sessionPollMs: 1,
  });

  assert.equal(result.ok, true, result.failures.join(" | "));
  assert.equal(result.pending.some((key) => key.startsWith("sl:sc-")), false);
  assert.deepEqual(JSON.parse(storage.getItem("sl:sc-sessions")), [currentSession]);
  assert.deepEqual(JSON.parse(storage.getItem("sl:sc-rsvps")), [currentRsvp]);
  assert.deepEqual(JSON.parse(storage.getItem("sl:sc-logs")), [currentLog]);
});

test("S&C build authority makes cache rewrites read-only and real strict mutations replacements", () => {
  const enhancer = readFileSync("scripts/apply-phase3-strength-conditioning-state-ownership.mjs", "utf8");
  const eventEnhancer = readFileSync("scripts/apply-phase3-events-replacement-ownership.mjs", "utf8");
  const rsvpEnhancer = readFileSync("scripts/apply-phase3d-rsvp-state-ownership.mjs", "utf8");

  assert.match(enhancer, /const scReplacement=k\.startsWith\("sl:sc-"\),signedReplacementCollection=[^;]+scReplacement&&options\?\.strictRemote===true/);
  assert.match(enhancer, /!scReplacement\|\|signedReplacementCollection/);
  assert.match(enhancer, /source:pending\?"local":"remote"/);
  assert.match(enhancer, /\^sc_\(sessions\|rsvps\|logs\)\$/);
  assert.doesNotMatch(enhancer, /setScSessions,\{strictRemote:true,replace:true\}/);
  assert.match(eventEnhancer, /strengthAuthority/);
  assert.match(rsvpEnhancer, /strengthAuthority/);
  for (const mode of ["dev", "build"]) {
    assert.ok(routeEnhancersFor(mode).includes("scripts/apply-phase3-strength-conditioning-state-ownership.mjs"));
  }
});
