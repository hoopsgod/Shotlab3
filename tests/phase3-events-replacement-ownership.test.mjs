import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createSchedulePersistenceService } from "../src/lib/schedulePersistenceService.js";
import { hydrateAuthenticatedCollectionsToStorage, requestLegacySignedCollection } from "../src/lib/legacySignedCollectionPersistence.js";
import { routeEnhancersFor } from "../scripts/run-route-enhancers.mjs";

const EMAIL = "events.owner@shotlab.test";
const TEAM_ID = "team-events-owner";
const EVENT_PENDING_KEY = "sl:ep";
const scope = (requester = EMAIL, teamId = TEAM_ID) => `${requester.trim().toLowerCase()}\t${teamId.trim()}`;

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

const LOCAL_EVENT = {
  id: "event-local-pending",
  teamId: TEAM_ID,
  ownerCoachId: EMAIL,
  title: "Offline Practice",
  date: "2026-09-07",
  time: "17:00",
  location: "Aux Gym",
  desc: "Keep pending local truth",
  type: "practice",
};

const REMOTE_EVENT = {
  id: "event-remote",
  team_id: TEAM_ID,
  title: "Remote Practice",
  date: "2026-09-08",
  time: "18:00",
  location: "Main Gym",
  description: "Remote authority",
  type: "practice",
};

function registeredStorage(events = [LOCAL_EVENT], teamId = TEAM_ID) {
  return memoryStorage([
    ["sl:session", JSON.stringify({ email: EMAIL, teamId, role: "coach" })],
    ["sl:players", JSON.stringify([{ id: "coach-events", email: EMAIL, teamId, role: "coach" }])],
    ["sl:events", JSON.stringify(events)],
  ]);
}

function hydrationPayloads(remoteEvents = []) {
  return {
    "/v1/teams": { ok: true, teams: [{ id: TEAM_ID, name: "Events Team" }] },
    "/v1/players": { ok: true, players: [{ id: "coach-events", email: EMAIL, role: "coach", team_id: TEAM_ID }] },
    "/v1/player-profiles": { ok: true, profiles: [] },
    "/v1/scores": { ok: true, scores: [] },
    "/v1/program-scores": { ok: true, program_scores: [] },
    "/v1/shot-logs": { ok: true, shot_logs: [] },
    "/v1/events": { ok: true, events: remoteEvents },
    "/v1/rsvps": { ok: true, rsvps: [] },
    "/v1/strength-conditioning": { ok: true, sessions: [], rsvps: [], logs: [] },
  };
}

test("failed Events replacement keeps same-requester/team pending truth and pending reads stay local", async () => {
  const storage = registeredStorage([LOCAL_EVENT]);
  let calls = 0;
  const service = createSchedulePersistenceService({
    storage,
    fetchImpl: async () => {
      calls += 1;
      return response({ error: "offline" }, 503);
    },
  });

  await assert.rejects(() => service.syncEvents([LOCAL_EVENT]), /event_sync_failed|offline/);
  assert.equal(storage.getItem(EVENT_PENDING_KEY), scope());

  const loaded = await service.loadEvents();
  assert.equal(loaded.storageMode, "local_pending");
  assert.deepEqual(loaded.rows, [LOCAL_EVENT]);
  assert.equal(calls, 1, "pending Events read must not refetch stale remote truth");
});

test("failed final-event deletion records pending empty replacement truth", async () => {
  const storage = registeredStorage([]);
  let posted = null;
  const service = createSchedulePersistenceService({
    storage,
    fetchImpl: async (path, init = {}) => {
      posted = { path, body: JSON.parse(init.body) };
      return response({ error: "offline" }, 503);
    },
  });

  await assert.rejects(() => service.syncEvents([]), /event_sync_failed|offline/);
  assert.equal(storage.getItem(EVENT_PENDING_KEY), scope());
  assert.deepEqual(posted, { path: "/v1/events", body: { team_id: TEAM_ID, events: [] } });

  const loaded = await service.loadEvents();
  assert.equal(loaded.storageMode, "local_pending");
  assert.deepEqual(loaded.rows, []);
});

test("successful Events replacement clears only the active pending scope", async () => {
  const storage = registeredStorage([LOCAL_EVENT]);
  const service = createSchedulePersistenceService({
    storage,
    fetchImpl: async (path, init = {}) => {
      assert.equal(path, "/v1/events");
      assert.equal(init.method, "POST");
      return response({ ok: true, storage_mode: "signed_api", events: [REMOTE_EVENT], deleted_count: 0 });
    },
  });

  storage.setItem(EVENT_PENDING_KEY, scope());
  const result = await service.syncEvents([LOCAL_EVENT]);
  assert.equal(result.ok, true);
  assert.equal(storage.getItem(EVENT_PENDING_KEY), null);
});

test("legacy signed Events reads serve pending local truth without contacting remote", async () => {
  const storage = registeredStorage([LOCAL_EVENT]);
  storage.setItem(EVENT_PENDING_KEY, scope());
  let calls = 0;
  const result = await requestLegacySignedCollection({
    table: "events",
    storage,
    fetchImpl: async () => {
      calls += 1;
      return response({ ok: true, events: [REMOTE_EVENT] });
    },
  });

  assert.equal(result.error, null);
  assert.equal(result.storageMode, "local_pending");
  assert.deepEqual(result.data, [LOCAL_EVENT]);
  assert.equal(calls, 0);
});

test("post-auth hydration preserves pending event additions and pending empty deletion truth", async () => {
  for (const scenario of [
    { name: "addition", local: [LOCAL_EVENT], remote: [] },
    { name: "delete-final-event", local: [], remote: [REMOTE_EVENT] },
  ]) {
    const storage = registeredStorage(scenario.local);
    storage.setItem(EVENT_PENDING_KEY, scope());
    const payloads = hydrationPayloads(scenario.remote);
    const calls = [];

    const result = await hydrateAuthenticatedCollectionsToStorage({
      storage,
      fetchImpl: async (path) => {
        calls.push(path);
        return response(payloads[path]);
      },
      expectedIdentity: EMAIL,
      groupAttempts: 1,
      sessionWaitMs: 20,
      sessionPollMs: 1,
    });

    assert.equal(result.ok, true, `${scenario.name}: ${result.failures.join(" | ")}`);
    assert.ok(result.pending.includes("sl:events"));
    assert.equal(calls.includes("/v1/events"), false, `${scenario.name}: pending hydration must not fetch stale Events`);
    assert.deepEqual(JSON.parse(storage.getItem("sl:events")), scenario.local);
  }
});

test("pending Events ownership from another team cannot override current remote truth", async () => {
  const activeTeamId = "team-events-current";
  const storage = registeredStorage([LOCAL_EVENT], activeTeamId);
  storage.setItem(EVENT_PENDING_KEY, scope(EMAIL, TEAM_ID));
  const currentRemote = { ...REMOTE_EVENT, id: "event-current", team_id: activeTeamId };
  const payloads = hydrationPayloads([currentRemote]);
  payloads["/v1/teams"] = { ok: true, teams: [{ id: activeTeamId, name: "Current Team" }] };
  payloads["/v1/players"] = { ok: true, players: [{ id: "coach-events", email: EMAIL, role: "coach", team_id: activeTeamId }] };

  const result = await hydrateAuthenticatedCollectionsToStorage({
    storage,
    fetchImpl: async (path) => response(payloads[path]),
    expectedIdentity: EMAIL,
    groupAttempts: 1,
    sessionWaitMs: 20,
    sessionPollMs: 1,
  });

  assert.equal(result.ok, true, result.failures.join(" | "));
  assert.equal(result.pending.includes("sl:events"), false);
  assert.deepEqual(JSON.parse(storage.getItem("sl:events")), [currentRemote]);
});

test("Events build authority restricts empty replacement to explicit coach deletion and preserves remote empty truth", () => {
  const enhancer = readFileSync("scripts/apply-phase3-events-replacement-ownership.mjs", "utf8");
  const phase3d = readFileSync("scripts/apply-phase3d-rsvp-state-ownership.mjs", "utf8");
  const schedule = readFileSync("src/lib/schedulePersistenceService.js", "utf8");

  assert.match(enhancer, /signedReplacementCollection = \(k===\"sl:events\"&&options\?\.replace===true\) \|\| k === \"sl:rsvps\"/);
  assert.match(enhancer, /P\(\"sl:events\",deletion\.events,setEvents,\{replace:true\}\)/);
  assert.match(enhancer, /table !== \"rsvps\" && table !== \"events\"/);
  assert.match(enhancer, /k===\"sl:events\"&&!isDemoPersistenceSession\(\)&&Array\.isArray\(data\)&&signedRead\?\.storageMode!==\"local_pending\"/);
  assert.match(schedule, /const EP = \"sl:ep\"/);
  assert.match(phase3d, /eventAuthority/);
  assert.match(phase3d, /options\?\.replace===true/);
  for (const mode of ["dev", "build"]) {
    assert.ok(routeEnhancersFor(mode).includes("scripts/apply-phase3-events-replacement-ownership.mjs"));
  }
});
