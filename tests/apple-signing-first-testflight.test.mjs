import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (file) => fs.readFileSync(file, "utf8");
const json = (file) => JSON.parse(read(file));

const handoff = json("native/first-testflight-handoff.json");
const profile = json("native/ios-release-profile.json");
const capacitor = json("capacitor.config.json");
const project = read("ios/App/App.xcodeproj/project.pbxproj");
const signingScript = read("scripts/configure-ios-signing.mjs");
const releaseScript = read("scripts/ios-release.mjs");
const preflightScript = read("scripts/apple-signing-first-build.mjs");

test("first TestFlight handoff stays aligned with the certified release identity", () => {
  assert.equal(handoff.bundleIdentifier, profile.bundleIdentifier);
  assert.equal(capacitor.appId, profile.bundleIdentifier);
  assert.equal(handoff.marketingVersion, profile.marketingVersion);
  assert.equal(handoff.buildNumber, profile.buildNumber);
  assert.equal(handoff.distributionIntent, "internal-testflight-first");
});

test("Apple credentials are explicit inputs and never source-controlled payloads", () => {
  assert.equal(handoff.signing.credentials.sourceControlAllowed, false);
  assert.deepEqual(handoff.signing.credentials.requiredEnvironment, ["SHOTLAB_DEVELOPMENT_TEAM"]);
  assert.match(signingScript, /SHOTLAB_DEVELOPMENT_TEAM/);
  assert.match(signingScript, /\^\[A-Z0-9\]\{10\}\$/);
  assert.match(preflightScript, /SHOTLAB_DEVELOPMENT_TEAM/);
  assert.match(preflightScript, /SHOTLAB_DEVICE_UDID/);
  assert.doesNotMatch(project, /DEVELOPMENT_TEAM = [A-Z0-9]{10};/);
});

test("signed archive path keeps automatic provisioning and current production bundle sync", () => {
  assert.match(releaseScript, /syncReleaseBundle\(\)/);
  assert.match(releaseScript, /native:sync:ios/);
  assert.match(releaseScript, /-allowProvisioningUpdates/);
  assert.match(releaseScript, /-configuration", "Release"/);
  assert.match(releaseScript, /archiveRelease\(\)/);
});

test("physical iPhone and processed TestFlight installation remain hard closure gates", () => {
  assert.equal(handoff.physicalDevice.status, "pending");
  assert.equal(handoff.physicalDevice.evidenceRequired, true);
  assert.ok(handoff.physicalDevice.checks.includes("registered_coach_login_and_core_navigation"));
  assert.ok(handoff.physicalDevice.checks.includes("registered_player_login_and_core_navigation"));
  assert.ok(handoff.physicalDevice.checks.includes("offline_recovery_without_duplicate_data"));
  assert.equal(handoff.testFlight.firstAudience, "internal");
  assert.equal(handoff.testFlight.processedBuild, "pending");
  assert.equal(handoff.testFlight.installedFromTestFlight, "pending");
  assert.equal(handoff.testFlight.postInstallSmokeQa, "pending");
  assert.match(handoff.completionRule, /physical iPhone/i);
  assert.match(handoff.completionRule, /processed internal TestFlight build/i);
});

test("preflight separates static handoff readiness from Mac, team, and device requirements", () => {
  assert.match(preflightScript, /--require-macos/);
  assert.match(preflightScript, /--require-team/);
  assert.match(preflightScript, /--require-device/);
  assert.match(preflightScript, /security/);
  assert.match(preflightScript, /find-identity/);
  assert.match(preflightScript, /xctrace/);
  assert.match(preflightScript, /first-build-handoff\.json/);
});
