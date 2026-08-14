import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const appSource = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
const demoDataSource = await readFile(new URL("../src/lib/demoData.js", import.meta.url), "utf8");
const inviteSource = await readFile(new URL("../src/lib/coachPlayerInvitationService.js", import.meta.url), "utf8");

test("App resolves sandbox behavior through centralized account capabilities", () => {
  assert.match(appSource, /buildAccountCapabilities, requireAccountCapability/);
  assert.match(appSource, /const accountCapabilities=useMemo\(\(\)=>buildAccountCapabilities\(user\),\[user\]\)/);
  assert.match(appSource, /accountCapabilities\.isSandbox/);
  assert.doesNotMatch(appSource, /\bisDemoMode\s*\(/, "App presentation and product behavior must not branch directly on demo mode");
  assert.doesNotMatch(appSource, /\bisDemoHomeShotSession\b/, "Demo must not maintain a separate sync presentation state");
});

test("shared home-shot UI does not hide or fork itself for demo sessions", () => {
  assert.match(appSource, /function HomeShotSyncRetryPanel\(\{syncIssueShots=\[\],retryHomeShotLog,setShotSaveNotice\}\)/);
  assert.doesNotMatch(appSource, /HomeShotSyncRetryPanel\([^)]*isDemoSession/);
  assert.doesNotMatch(appSource, /isDemoSession\|\|!visibleSyncIssueShots\.length/);
});

test("destructive and external account actions are capability-protected", () => {
  assert.match(appSource, /requireAccountCapability\(accountCapabilities,"canDeleteAccount"\)/);
  assert.match(inviteSource, /requireAccountCapability\(buildAccountCapabilities\(coach\), "canSendInvites"\)/);
  assert.match(inviteSource, /if \(!capabilities\.canSendInvites\) return \{ ok: true, invitations: \[\], storageMode: "demo_local" \}/);
});

test("demo reset controls are sandbox-only at both action and presentation boundaries", () => {
  const resetGuards = appSource.match(/requireAccountCapability\(accountCapabilities,"canResetSandbox"\)/g) || [];
  assert.equal(resetGuards.length, 2, "load and clear actions must independently require sandbox reset authority");
  assert.match(appSource, /accountCapabilities\?\.canResetSandbox&&<article className="coachAdministrationCard">/);
  assert.match(appSource, /accountCapabilities=\{accountCapabilities\}/);
});

test("demo cleanup is row-scoped and cannot wipe shared local collections", () => {
  const clearStart = demoDataSource.indexOf("export async function clearDemoData");
  assert.ok(clearStart >= 0, "clearDemoData must exist");
  const clearSource = demoDataSource.slice(clearStart);
  assert.match(clearSource, /rowTeamId\(row\) === teamId/);
  assert.match(clearSource, /rowUsesManagedDemoIdentity\(row, managedIdentities\)/);
  assert.doesNotMatch(clearSource, /localStorage\.removeItem\(/, "Demo cleanup must never remove a shared collection key wholesale");
  assert.doesNotMatch(clearSource, /JSON\.stringify\(\[\]\)/, "Demo cleanup must preserve unrelated tenant rows");
});
