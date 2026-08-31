import test from "node:test";
import assert from "node:assert/strict";
import { brandingMatches, persistCoachBranding } from "../src/lib/teamBrandingPersistence.js";

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
  };
}

const desiredBranding = {
  primaryColor: "#3B82F6",
  secondaryColor: "#93C5FD",
  accentColor: "#2563EB",
  textOnPrimary: "#EAF2FF",
  logoUrl: "data:image/png;base64,clean-full",
  logoMarkUrl: "data:image/png;base64,clean-mark",
  textScale: "large",
};

const staleBranding = {
  primaryColor: "#64748B",
  secondaryColor: "#CBD5E1",
  accentColor: "#475569",
  textOnPrimary: "#F1F5F9",
  logoUrl: "/branding/titans-exact-logo.png.PNG",
  logoMarkUrl: "/branding/titans-default-mark.svg",
  textScale: "standard",
};

test("branding comparison ignores server metadata but requires every coach-controlled choice", () => {
  assert.equal(brandingMatches(desiredBranding, { ...desiredBranding, updatedAt: 42, updatedBy: "coach@example.com", version: 9 }), true);
  assert.equal(brandingMatches(desiredBranding, { ...desiredBranding, textScale: "standard" }), false);
});

test("a stale server round trip is repaired from authoritative team metadata and cached for the next login", async () => {
  const storage = memoryStorage({
    "sl:session": JSON.stringify({ email: "coach@example.com" }),
    "sl:players": JSON.stringify([{ email: "coach@example.com", role: "coach", teamId: "team-1" }]),
    "sl:teams": JSON.stringify([{
      id: "team-1",
      name: "BK",
      ownerCoachId: "legacy-local-owner@example.com",
      coachUserId: "legacy-local-user-id",
      joinCode: "LOCAL1",
      createdAt: 999,
      branding: staleBranding,
    }]),
  });
  let syncCalls = 0;
  let syncPayload = null;

  const remoteTeam = {
    id: "team-1",
    name: "BK",
    owner_coach_id: "coach@example.com",
    coach_user_id: "11111111-1111-4111-8111-111111111111",
    join_code: "REMOTE1",
    created_at: 100,
    branding: staleBranding,
  };

  const fakeService = {
    readContext: () => ({ requester: "coach@example.com", teamId: "team-1", role: "coach" }),
    loadTeams: async () => ({ ok: true, rows: [remoteTeam] }),
    syncTeams: async (rows) => {
      syncCalls += 1;
      syncPayload = rows;
      return {
        ok: true,
        storageMode: "signed_api",
        rows: [{
          ...remoteTeam,
          branding: { ...desiredBranding, updatedAt: 100, updatedBy: "coach@example.com", version: 3 },
        }],
      };
    },
  };

  const result = await persistCoachBranding({
    nextBranding: desiredBranding,
    appSave: async () => ({ ok: true }),
    storage,
    serviceFactory: () => fakeService,
  });

  assert.equal(result.ok, true);
  assert.equal(syncCalls, 1);
  assert.equal(syncPayload[0].branding.primaryColor, desiredBranding.primaryColor);
  assert.equal(syncPayload[0].branding.logoUrl, desiredBranding.logoUrl);
  assert.equal(syncPayload[0].owner_coach_id, "coach@example.com");
  assert.equal(syncPayload[0].coach_user_id, "11111111-1111-4111-8111-111111111111");
  assert.equal(syncPayload[0].join_code, "REMOTE1");
  assert.equal(syncPayload[0].created_at, 100);
  assert.equal(syncPayload[0].ownerCoachId, undefined);

  const cached = JSON.parse(storage.getItem("sl:teams"));
  assert.equal(cached.length, 1);
  assert.equal(cached[0].id, "team-1");
  assert.equal(cached[0].ownerCoachId, "coach@example.com");
  assert.equal(cached[0].branding.primaryColor, desiredBranding.primaryColor);
  assert.equal(cached[0].branding.logoMarkUrl, desiredBranding.logoMarkUrl);
});

test("an already-persisted server value is verified without issuing a redundant repair write", async () => {
  const storage = memoryStorage({
    "sl:session": JSON.stringify({ email: "coach@example.com" }),
    "sl:players": JSON.stringify([{ email: "coach@example.com", role: "coach", teamId: "team-1" }]),
    "sl:teams": JSON.stringify([{ id: "team-1", name: "BK", branding: desiredBranding }]),
  });

  const fakeService = {
    readContext: () => ({ requester: "coach@example.com", teamId: "team-1", role: "coach" }),
    loadTeams: async () => ({ ok: true, rows: [{ id: "team-1", name: "BK", branding: { ...desiredBranding, version: 4 } }] }),
    syncTeams: async () => { throw new Error("sync should not run"); },
  };

  const result = await persistCoachBranding({
    nextBranding: desiredBranding,
    appSave: async () => ({ ok: true }),
    storage,
    serviceFactory: () => fakeService,
  });

  assert.equal(result.ok, true);
  assert.equal(result.branding.primaryColor, desiredBranding.primaryColor);
});

test("the save fails closed when the repaired server response still drops the coach choices", async () => {
  const storage = memoryStorage({
    "sl:session": JSON.stringify({ email: "coach@example.com" }),
    "sl:players": JSON.stringify([{ email: "coach@example.com", role: "coach", teamId: "team-1" }]),
    "sl:teams": JSON.stringify([{ id: "team-1", name: "BK", branding: staleBranding }]),
  });

  const fakeService = {
    readContext: () => ({ requester: "coach@example.com", teamId: "team-1", role: "coach" }),
    loadTeams: async () => ({ ok: true, rows: [{ id: "team-1", name: "BK", branding: staleBranding }] }),
    syncTeams: async () => ({ ok: true, rows: [{ id: "team-1", name: "BK", branding: staleBranding }] }),
  };

  await assert.rejects(
    () => persistCoachBranding({
      nextBranding: desiredBranding,
      appSave: async () => ({ ok: true }),
      storage,
      serviceFactory: () => fakeService,
    }),
    /did not survive the server round trip/,
  );
});
