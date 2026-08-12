import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (file) => fs.readFileSync(file, "utf8");
const json = (file) => JSON.parse(read(file));

const packageJson = json("package.json");
const profile = json("native/ios-release-profile.json");
const listing = json("native/app-store-listing.json");
const project = read("ios/App/App.xcodeproj/project.pbxproj");
const info = read("ios/App/App/Info.plist");
const readiness = read("scripts/testflight-readiness.mjs");
const release = read("scripts/ios-release.mjs");
const runbook = read("docs/testflight-release-runbook.md");

test("2026 Apple submission floor is explicit in code and metadata", () => {
  assert.equal(profile.submissionMinimums.xcodeMajor, 26);
  assert.equal(profile.submissionMinimums.iosSdkMajor, 26);
  assert.match(profile.submissionMinimums.verifiedOn, /^2026-/);
  assert.match(readiness, /Xcode upload minimum/);
  assert.match(readiness, /iOS SDK upload minimum/);
  assert.match(release, /verifyAppleToolchain/);
  assert.match(runbook, /Xcode 26/);
  assert.match(runbook, /iOS 26 SDK/);
});

test("native identity, version, build, deployment target, and device family stay aligned", () => {
  assert.equal(profile.bundleIdentifier, "com.shotlab.training");
  assert.equal(profile.marketingVersion, "1.0");
  assert.equal(profile.buildNumber, 1);
  assert.equal(profile.minimumDeploymentTarget, "15.0");
  assert.match(project, /PRODUCT_BUNDLE_IDENTIFIER = com\.shotlab\.training;/);
  assert.match(project, /MARKETING_VERSION = 1\.0;/);
  assert.match(project, /CURRENT_PROJECT_VERSION = 1;/);
  assert.match(project, /IPHONEOS_DEPLOYMENT_TARGET = 15\.0;/);
  assert.match(project, /TARGETED_DEVICE_FAMILY = 1;/);
});

test("release archive path cannot bypass production web rebuild and native sync", () => {
  assert.equal(packageJson.scripts["ios:release-candidate"], undefined);
  assert.equal(packageJson.scripts["ios:release-readiness"], undefined);
  assert.match(release, /syncReleaseBundle\(\)/);
  assert.match(release, /npmCommand, \["run", "native:sync:ios"\]/);
  assert.match(release, /case "archive":\s*\n\s*case "release-candidate":/);
  assert.match(release, /verifyReadiness\(\{ requireSigning: true \}\)/);
  assert.match(release, /archiveRelease\(\)/);
  assert.match(runbook, /node scripts\/ios-release\.mjs release-candidate/);
});

test("release profile distinguishes code readiness from external submission readiness", () => {
  assert.equal(profile.releaseStatus, "code_ready_owner_and_device_input_pending");
  for (const key of [
    "appleDeveloperTeamId",
    "appStoreConnectRecord",
    "privacyPolicyUrl",
    "supportUrl",
    "copyright",
    "pricing",
    "ageRatingQuestionnaire",
    "appPrivacyAnswers",
    "coachReviewAccount",
    "playerReviewAccount",
    "physicalDeviceQa",
    "internalTestFlightBuild",
  ]) assert.equal(profile.releaseRequirements[key], "pending", `${key} must remain visible until completed`);
  assert.match(readiness, /--strict-owner/);
  assert.match(readiness, /code_ready_with_external_blockers/);
  assert.match(readiness, /submit_ready/);
});

test("App Store screenshot package uses a currently accepted 6.9-inch portrait size", () => {
  assert.equal(listing.screenshots.display, "iPhone 6.9-inch");
  assert.equal(listing.screenshots.width, 1290);
  assert.equal(listing.screenshots.height, 2796);
  assert.equal(listing.screenshots.format, "jpeg");
  assert.equal(listing.screenshots.count, listing.screenshots.items.length);
  assert.ok(listing.screenshots.count >= 1 && listing.screenshots.count <= 10);
  assert.match(readiness, /1260x2736/);
  assert.match(readiness, /1290x2796/);
  assert.match(readiness, /1320x2868/);
});

test("physical-device status-bar and safe-area review remains an explicit gate rather than a guessed CSS fix", () => {
  assert.match(info, /<key>UIUserInterfaceStyle<\/key>/);
  assert.equal(profile.releaseRequirements.physicalDeviceQa, "pending");
  assert.match(runbook, /status-bar text remains legible/i);
  assert.match(runbook, /dark native seam/i);
  assert.match(runbook, /Do not mark `physicalDeviceQa` complete from simulator or browser screenshots alone/i);
});
