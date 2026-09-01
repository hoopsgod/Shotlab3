import test from "node:test";
import assert from "node:assert/strict";
import { brandingMatches, persistCoachBranding } from "../src/lib/teamBrandingPersistence.js";
import { __testUtils as teamPersistenceUtils } from "../src/lib/teamPersistenceService.js";

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

test("legacy coach context recovers a sole signed team when the player identity row is unassigned", () => {
  const legacyTeamId = "team_legacy_text_id";
  const storage = memoryStorage({
    "sl:session": JSON.stringify({ email: "coach@example.com" }),
    "sl:players": JSON.stringify([{ id: "player:unassigned:coach@example.com", email: "coach@example.com", role: "coach", team_id: null }]),
    "sl:teams": JSON.stringify([{ id: legacyTeamId, name: "BK", branding: staleBranding }]),
  });
  const context = teamPersistenceUtils.readContext(storage);
  assert.equal(context.requester, "coach@example.com");
  assert.equal(context.role, "coach");
  assert.equal(context.teamId, legacyTeamId);
});

test("branding save posts only the active team id and branding, then verifies the authoritative response", async () => {
  let syncPayload = null;
  const fakeService = {
    readContext: () => ({ requester: "coach@example.com", teamId: "team-1", role: "coach" }),
    syncTeams: async (rows) => {
      syncPayload = rows;
      return {
        ok: true,
        storageMode: "signed_api",
        rows: [{
          id: "team-1",
          name: "BK",
          owner_coach_id: "coach@example.com",
          school: "West Test High",
          level: "Varsity",
          branding: { ...desiredBranding, updatedAt: 100, updatedBy: "coach@example.com", version: 3 },
        }],
      };
    },
  };

  const result = await persistCoachBranding({
    nextBranding: desiredBranding,
    appSave: async () => ({ ok: true }),
    serviceFactory: () => fakeService,
  });

  assert.deepEqual(syncPayload, [{ id: "team-1", branding: desiredBranding }]);
  assert.equal(result.ok, true);
  assert.equal(result.team.school, "West Test High");
  assert.equal(result.branding.logoUrl, desiredBranding.logoUrl);
});

test("branding save fails closed when the signed response drops a coach choice", async () => {
  const fakeService = {
    readContext: () => ({ requester: "coach@example.com", teamId: "team-1", role: "coach" }),
    syncTeams: async () => ({ ok: true, rows: [{ id: "team-1", branding: staleBranding }] }),
  };

  await assert.rejects(
    () => persistCoachBranding({
      nextBranding: desiredBranding,
      appSave: async () => ({ ok: true }),
      serviceFactory: () => fakeService,
    }),
    /Branding verification failed/,
  );
});
