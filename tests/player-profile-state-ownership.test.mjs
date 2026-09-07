import test from "node:test";
import assert from "node:assert/strict";
import {
  createPlayerProfilePersistenceService,
  hasPendingProfileRows,
  reconcilePendingProfileRows,
} from "../src/lib/playerProfilePersistenceService.js";
import {
  hydrateAuthenticatedCollectionsToStorage,
  requestLegacySignedCollection,
} from "../src/lib/legacySignedCollectionPersistence.js";

const COACH = "coach@example.com";
const TEAM = "team-a";
const PENDING = { id: "profile-one", userId: "one@example.com", teamId: TEAM, firstName: "Pending", lastName: "Player" };
const OTHER_LOCAL = { id: "profile-two", userId: "two@example.com", teamId: TEAM, firstName: "Local", lastName: "Stale" };
const REMOTE_PENDING = { id: "profile-one", user_id: "one@example.com", team_id: TEAM, first_name: "Remote", last_name: "Old" };
const REMOTE_OTHER = { id: "profile-two", user_id: "two@example.com", team_id: TEAM, first_name: "Remote", last_name: "Fresh" };
const PLAYER_ROW = { id: "coach-row", email: COACH, role: "coach", team_id: TEAM };

function memoryStorage(entries = []) {
  const values = new Map(entries);
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
    json(key) { const raw = values.get(key); return raw ? JSON.parse(raw) : null; },
  };
}

function registeredStorage({ email = COACH, role = "coach", teamId = TEAM, profiles = [PENDING, OTHER_LOCAL], pending = "" } = {}) {
  return memoryStorage([
    ["sl:session", JSON.stringify({ email, role, teamId })],
    ["sl:players", JSON.stringify([{ ...PLAYER_ROW, email, role, team_id: teamId }])],
    ["sl:player-profiles", JSON.stringify(profiles)],
    ...(pending ? [["sl:pp", pending]] : []),
  ]);
}

const response = (payload, status = 200) => Response.json(payload, { status });
const firstName = (row) => row?.firstName ?? row?.first_name;

test("failed profile upsert preserves only the explicitly pending local row across a stale signed read", async () => {
  const storage = registeredStorage();
  let phase = "write";
  const service = createPlayerProfilePersistenceService({
    storage,
    fetchImpl: async () => phase === "write"
      ? response({ error: "profile_sync_failed" }, 500)
      : response({ ok: true, storage_mode: "signed_api", profiles: [REMOTE_PENDING, REMOTE_OTHER] }),
  });

  await assert.rejects(service.syncProfiles([PENDING]), /profile_sync_failed/);
  assert.equal(hasPendingProfileRows(storage), true);

  phase = "read";
  const loaded = await service.loadProfiles();
  assert.equal(loaded.storageMode, "local_pending");
  assert.equal(firstName(loaded.rows.find((row) => row.id === "profile-one")), "Pending");
  assert.equal(firstName(loaded.rows.find((row) => row.id === "profile-two")), "Remote");
});

test("successful retry clears only completed profile ownership and restores remote authority", async () => {
  const storage = registeredStorage({ pending: `${COACH}\t${TEAM}\tprofile-one` });
  const service = createPlayerProfilePersistenceService({
    storage,
    fetchImpl: async (_input, init = {}) => String(init.method || "GET").toUpperCase() === "POST"
      ? response({ ok: true, storage_mode: "signed_api", profiles: [PENDING, REMOTE_OTHER] })
      : response({ ok: true, storage_mode: "signed_api", profiles: [REMOTE_PENDING, REMOTE_OTHER] }),
  });

  await service.syncProfiles([PENDING]);
  assert.equal(hasPendingProfileRows(storage), false);
  const loaded = await service.loadProfiles();
  assert.equal(firstName(loaded.rows.find((row) => row.id === "profile-one")), "Remote");
});

test("pending profile ownership is requester/team scoped and cannot override another session", () => {
  const storage = registeredStorage({
    email: "other@example.com",
    teamId: "team-b",
    profiles: [{ ...PENDING, teamId: "team-b" }],
    pending: `${COACH}\t${TEAM}\tprofile-one`,
  });
  assert.equal(hasPendingProfileRows(storage), false);
  assert.deepEqual(reconcilePendingProfileRows(storage, [REMOTE_PENDING]), [REMOTE_PENDING]);
});

test("player-scoped pending ownership cannot elevate another cached profile", () => {
  const storage = registeredStorage({
    email: "one@example.com",
    role: "player",
    profiles: [PENDING, OTHER_LOCAL],
    pending: `one@example.com\t${TEAM}\tprofile-one\tprofile-two`,
  });
  const rows = reconcilePendingProfileRows(storage, [REMOTE_PENDING, REMOTE_OTHER]);
  assert.equal(firstName(rows.find((row) => row.id === "profile-one")), "Pending");
  assert.equal(firstName(rows.find((row) => row.id === "profile-two")), "Remote");
});

test("legacy signed profile reads preserve the pending row while accepting fresh remote peers", async () => {
  const storage = registeredStorage({ pending: `${COACH}\t${TEAM}\tprofile-one` });
  const result = await requestLegacySignedCollection({
    table: "player_profiles",
    storage,
    fetchImpl: async () => response({ ok: true, storage_mode: "signed_api", profiles: [REMOTE_PENDING, REMOTE_OTHER] }),
  });
  assert.equal(result.storageMode, "local_pending");
  assert.equal(firstName(result.data.find((row) => row.id === "profile-one")), "Pending");
  assert.equal(firstName(result.data.find((row) => row.id === "profile-two")), "Remote");
});

test("post-auth hydration applies the same row-level pending profile policy", async () => {
  const storage = registeredStorage({ pending: `${COACH}\t${TEAM}\tprofile-one` });
  const fetchImpl = async (input) => {
    const path = String(input).split("?")[0];
    if (path === "/v1/teams") return response({ ok: true, teams: [] });
    if (path === "/v1/players") return response({ ok: true, players: [PLAYER_ROW] });
    if (path === "/v1/player-profiles") return response({ ok: true, profiles: [REMOTE_PENDING, REMOTE_OTHER] });
    if (path === "/v1/scores") return response({ ok: true, scores: [] });
    if (path === "/v1/program-scores") return response({ ok: true, program_scores: [] });
    if (path === "/v1/shot-logs") return response({ ok: true, shot_logs: [] });
    if (path === "/v1/events") return response({ ok: true, events: [] });
    if (path === "/v1/rsvps") return response({ ok: true, rsvps: [] });
    if (path === "/v1/strength-conditioning") return response({ ok: true, sessions: [], rsvps: [], logs: [] });
    throw new Error(`unexpected_path:${path}`);
  };

  const result = await hydrateAuthenticatedCollectionsToStorage({
    fetchImpl,
    storage,
    expectedIdentity: COACH,
    groupAttempts: 1,
  });

  assert.equal(result.ok, true);
  assert.equal(result.pending.includes("sl:player-profiles"), true);
  const rows = storage.json("sl:player-profiles");
  assert.equal(firstName(rows.find((row) => row.id === "profile-one")), "Pending");
  assert.equal(firstName(rows.find((row) => row.id === "profile-two")), "Remote");
});
