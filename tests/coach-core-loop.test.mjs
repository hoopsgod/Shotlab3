import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { buildCoachCoreLoopModel, getCoachCoreLoopStateLabel } from "../src/lib/coachCoreLoopSelectors.js";
import { classifyCoachCoreLoopError, loadCoachCoreLoop, saveCoachCoreLoopAction } from "../src/lib/coachFollowUpService.js";

const row = (overrides = {}) => ({
  key: "inactive@example.test",
  name: "Inactive Player",
  email: "inactive@example.test",
  statusKey: "attention",
  statusLabel: "Needs follow-up",
  lastActivityDate: "2026-09-12",
  player: { id: "inactive", email: "inactive@example.test", name: "Inactive Player" },
  ...overrides,
});

const memoryStorage = (seed = {}) => {
  const values = new Map(Object.entries(seed).map(([key, value]) => [key, typeof value === "string" ? value : JSON.stringify(value)]));
  return {
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, String(value)),
  };
};

test("core-loop selector derives the attention decision and excludes completed work", () => {
  const model = buildCoachCoreLoopModel({
    playerRows: [row(), row({ key: "active@example.test", email: "active@example.test", name: "Active Player", statusKey: "active", statusLabel: "Active this week" })],
    records: [{ teamId: "team-a", playerIdentity: "inactive@example.test", playerName: "Inactive Player", state: "planned", updatedAt: "2026-09-19T10:00:00Z" }],
    requestState: "success",
  });

  assert.equal(model.state, "populated");
  assert.equal(model.openCount, 1);
  assert.equal(model.attentionItems[0].name, "Inactive Player");
  assert.match(model.attentionItems[0].detail, /follow-up open/i);

  const completed = buildCoachCoreLoopModel({
    playerRows: [row()],
    records: [{ teamId: "team-a", playerIdentity: "inactive@example.test", playerName: "Inactive Player", state: "completed", updatedAt: "2026-09-19T10:00:00Z" }],
    requestState: "success",
    feedback: { playerIdentity: "inactive@example.test", playerName: "Inactive Player", state: "completed" },
  });
  assert.equal(completed.state, "empty");
  assert.equal(completed.openCount, 0);
  assert.equal(completed.feedback.state, "completed");
  assert.equal(getCoachCoreLoopStateLabel(completed), "all_clear");
});

test("core-loop selector handles empty, malformed, partial, and pending refresh data safely", () => {
  const noRoster = buildCoachCoreLoopModel({ playerRows: null, records: [null, "bad", { state: "unknown" }], requestState: "success" });
  assert.equal(noRoster.state, "empty");
  assert.equal(noRoster.hasRoster, false);
  assert.equal(noRoster.openCount, 0);

  const loading = buildCoachCoreLoopModel({ playerRows: [row()], records: [], requestState: "loading" });
  assert.equal(loading.requestState, "loading");
  assert.equal(loading.attentionItems.length, 1);
  assert.equal(getCoachCoreLoopStateLabel(loading), "loading");

  const staleData = buildCoachCoreLoopModel({ playerRows: [row()], records: [], requestState: "error", error: "offline", storageMode: "local_fallback" });
  assert.equal(staleData.state, "error");
  assert.equal(staleData.openCount, 1);
  assert.equal(staleData.error, "offline");
});

test("core-loop service classifies permission and unavailable failures honestly", async () => {
  assert.equal(classifyCoachCoreLoopError("403 forbidden"), "permission");
  assert.equal(classifyCoachCoreLoopError("endpoint unavailable"), "unavailable");
  assert.equal(classifyCoachCoreLoopError("network timeout"), "error");
  assert.equal((await loadCoachCoreLoop({ teamId: "" })).state, "permission");

  const storage = memoryStorage({ "sl:session": { email: "coach@example.test", teamId: "team-a" } });
  const failed = await loadCoachCoreLoop({ teamId: "team-a", storage, fetchImpl: async () => ({ ok: false, json: async () => ({ error: "permission_denied" }) }) });
  assert.equal(failed.state, "permission");
  assert.equal(failed.ok, false);

  const saved = await saveCoachCoreLoopAction({ teamId: "team-a", playerIdentity: "inactive@example.test", playerName: "Inactive Player", state: "completed", storage, fetchImpl: null });
  assert.equal(saved.ok, true);
  assert.equal(saved.record.state, "completed");
});

test("Phase 7A wiring uses the service boundary and provides a truthful return path", () => {
  const app = fs.readFileSync("src/App.jsx", "utf8");
  const followUp = fs.readFileSync("src/components/CoachDashboardPhase2.jsx", "utf8");
  const commandCenter = fs.readFileSync("src/components/CoachCommandCenter.jsx", "utf8");
  const drawer = fs.readFileSync("src/components/CoachDashboardPhase2.jsx", "utf8");
  assert.match(app, /buildCoachCoreLoopModel/);
  assert.match(app, /COACH_CORE_LOOP_CHANGE_EVENT/);
  assert.match(app, /onReturnToHome/);
  assert.match(followUp, /saveCoachCoreLoopAction/);
  assert.match(followUp, /loadCoachCoreLoopPlayer/);
  assert.match(commandCenter, /CoachCoreLoopPanel/);
  assert.match(drawer, /data-testid="coach-return-to-home"/);
});
