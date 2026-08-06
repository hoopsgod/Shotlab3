import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  WORKSPACE_RECOVERY_CODES,
  buildWorkspaceRecoveryModel,
  classifyWorkspaceError,
  resolveDataDisplayState,
} from "../src/lib/workspaceRecovery.js";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const boundarySource = read("../src/components/WorkspaceRecoveryBoundary.jsx");
const leaderboardSource = read("../src/components/CompactLeaderboardPreviewCard.jsx");
const protectedWrappers = [
  "../src/components/DeferredCoachInteractiveDashboards.jsx",
  "../src/components/DeferredCoachDashboardPhase2.jsx",
  "../src/components/DeferredPlayerDailyCommandCenter.jsx",
  "../src/components/DeferredPlayerDashboardHeader.jsx",
  "../src/components/DeferredPlayerCareerHistory.jsx",
  "../src/components/DeferredPlayerOperationalWorkspace.jsx",
].map(read);

test("workspace errors are classified without exposing raw failure text", () => {
  assert.equal(classifyWorkspaceError(new Error("Failed to fetch dynamically imported module")), WORKSPACE_RECOVERY_CODES.ASSET_LOAD_FAILED);
  assert.equal(classifyWorkspaceError(new Error("new row violates row-level security policy")), WORKSPACE_RECOVERY_CODES.PERMISSION_DENIED);
  assert.equal(classifyWorkspaceError(new Error("Network request failed")), WORKSPACE_RECOVERY_CODES.NETWORK_UNAVAILABLE);
  assert.equal(classifyWorkspaceError(new ReferenceError("attendance is not defined")), WORKSPACE_RECOVERY_CODES.RENDER_REFERENCE_ERROR);
  assert.equal(classifyWorkspaceError(new TypeError("Cannot read properties of undefined")), WORKSPACE_RECOVERY_CODES.RENDER_TYPE_ERROR);
  assert.equal(classifyWorkspaceError(new Error("unknown")), WORKSPACE_RECOVERY_CODES.WORKSPACE_FAILED);
});

test("workspace recovery models choose safe and useful actions", () => {
  const chunk = buildWorkspaceRecoveryModel({ error: new Error("Loading chunk 12 failed"), label: "Coach players" });
  assert.equal(chunk.primaryAction, "reload");
  assert.equal(chunk.primaryLabel, "Reload workspace");
  assert.equal(chunk.title, "Reload Coach players");
  assert.doesNotMatch(JSON.stringify(chunk), /chunk 12/i);

  const permission = buildWorkspaceRecoveryModel({ error: new Error("permission denied"), label: "Leaderboards" });
  assert.equal(permission.primaryAction, "retry");
  assert.match(permission.detail, /saved records remain protected/i);

  const render = buildWorkspaceRecoveryModel({ error: new ReferenceError("Ga is not defined"), label: "Player daily plan" });
  assert.equal(render.title, "Reset Player daily plan");
  assert.equal(render.primaryLabel, "Reopen section");
  assert.match(render.note, /do not clear training data/i);
  assert.doesNotMatch(JSON.stringify(render), /Ga is not defined/);
});

test("data status distinguishes loading error empty and ready states", () => {
  assert.equal(resolveDataDisplayState({ status: "loading", rows: [] }), "loading");
  assert.equal(resolveDataDisplayState({ status: "pending", rows: [{ rank: 1 }] }), "loading");
  assert.equal(resolveDataDisplayState({ status: "error", rows: [{ rank: 1 }] }), "error");
  assert.equal(resolveDataDisplayState({ status: "failed", rows: [] }), "error");
  assert.equal(resolveDataDisplayState({ status: "success", rows: [{ rank: 1 }] }), "ready");
  assert.equal(resolveDataDisplayState({ status: "success", rows: [] }), "empty");
  assert.equal(resolveDataDisplayState({ status: "idle", rows: [] }), "empty");
});

test("workspace boundary contains errors and reports only safe codes", () => {
  assert.match(boundarySource, /getDerivedStateFromError/);
  assert.match(boundarySource, /shotlab:workspace-error/);
  assert.match(boundarySource, /detail: \{ code: model\.code, label:/);
  assert.match(boundarySource, /WorkspaceRecoveryNotice/);
  assert.match(boundarySource, /data-error-code=\{model\.code\}/);
  assert.match(boundarySource, /Reload ShotLab/);
  assert.doesNotMatch(boundarySource, /error\.message\}/);
});

test("all high-risk lazy workspaces use section-level recovery", () => {
  protectedWrappers.forEach((source) => {
    assert.match(source, /WorkspaceRecoveryBoundary/);
    assert.match(source, /<Suspense/);
    assert.match(source, /recovery|Recovery/);
  });
});

test("leaderboard cards expose truthful data states", () => {
  assert.match(leaderboardSource, /resolveDataDisplayState/);
  assert.match(leaderboardSource, /data-data-state=\{displayState\}/);
  assert.match(leaderboardSource, /data-testid=\{`leaderboard-\$\{displayState\}-state`\}/);
  assert.match(leaderboardSource, /displayState === "loading"/);
  assert.match(leaderboardSource, /displayState === "error"/);
  assert.match(leaderboardSource, /displayState === "ready"/);
  assert.match(leaderboardSource, /Saved training results are still safe/);
  assert.match(leaderboardSource, /typeof onRetry === "function"/);
});
