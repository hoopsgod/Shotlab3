import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (file) => fs.readFileSync(file, "utf8");
const json = (file) => JSON.parse(read(file));

const manifestPath = "ios/App/App/PrivacyInfo.xcprivacy";
const projectPath = "ios/App/App.xcodeproj/project.pbxproj";
const infoPlistPath = "ios/App/App/Info.plist";
const capacitorPath = "ios/App/App/capacitor.config.json";
const privacyProfilePath = "native/app-store-connect-privacy.json";
const releaseProfilePath = "native/ios-release-profile.json";
const reviewPackagePath = "docs/app-store-review-package.md";

const manifest = read(manifestPath);
const project = read(projectPath);
const infoPlist = read(infoPlistPath);
const capacitor = json(capacitorPath);
const privacyProfile = json(privacyProfilePath);
const releaseProfile = json(releaseProfilePath);
const reviewPackage = read(reviewPackagePath);
const analyticsSource = read("src/lib/analytics.js");
const configuratorSource = read("scripts/configure-ios-privacy-readiness.mjs");

const manifestDataTypes = [...manifest.matchAll(/<string>(NSPrivacyCollectedDataType[^<]+)<\/string>/g)]
  .map((match) => match[1])
  .filter((value) => !value.startsWith("NSPrivacyCollectedDataTypePurpose"));

test("native privacy manifest is validly shaped and explicitly disables tracking", () => {
  assert.match(manifest, /<key>NSPrivacyTracking<\/key>\s*<false\/>/);
  assert.match(manifest, /<key>NSPrivacyTrackingDomains<\/key>\s*<array\/>/);
  assert.match(manifest, /<key>NSPrivacyCollectedDataTypes<\/key>\s*<array>/);
  assert.match(manifest, /<key>NSPrivacyAccessedAPITypes<\/key>\s*<array\/>/);
  assert.doesNotMatch(manifest, /<key>NSPrivacyTracking<\/key>\s*<true\/>/);
  assert.doesNotMatch(manifest, /NSPrivacyCollectedDataTypePurposeThirdPartyAdvertising|NSPrivacyCollectedDataTypePurposeDeveloperAdvertising/);
});

test("manifest covers ShotLab account, training, content, and conditional analytics data", () => {
  const required = [
    "NSPrivacyCollectedDataTypeName",
    "NSPrivacyCollectedDataTypeEmailAddress",
    "NSPrivacyCollectedDataTypeUserID",
    "NSPrivacyCollectedDataTypeFitness",
    "NSPrivacyCollectedDataTypeOtherUserContent",
    "NSPrivacyCollectedDataTypeDeviceID",
    "NSPrivacyCollectedDataTypeProductInteraction",
  ];
  required.forEach((value) => assert.ok(manifestDataTypes.includes(value), `${value} missing from privacy manifest`));
  assert.match(manifest, /NSPrivacyCollectedDataTypePurposeAppFunctionality/);
  assert.match(manifest, /NSPrivacyCollectedDataTypePurposeAnalytics/);
});

test("App Store privacy inventory and native manifest remain aligned", () => {
  assert.equal(privacyProfile.tracking, false);
  assert.deepEqual(privacyProfile.trackingDomains, []);
  assert.equal(privacyProfile.releaseAssertions.usesAdvertisingTracking, false);
  assert.equal(privacyProfile.releaseAssertions.usesThirdPartyAdvertising, false);
  const profileTypes = privacyProfile.collectedData.map((item) => item.manifestValue).sort();
  assert.deepEqual([...manifestDataTypes].sort(), profileTypes);
  assert.equal(privacyProfile.ownerInputRequired.privacyPolicyUrl, "pending");
  assert.equal(privacyProfile.ownerInputRequired.coachReviewAccount, "pending");
  assert.equal(privacyProfile.ownerInputRequired.playerReviewAccount, "pending");
});

test("privacy manifest belongs to the iOS app target resources", () => {
  assert.match(project, /PrivacyInfo\.xcprivacy \*\/ = \{isa = PBXFileReference/);
  assert.match(project, /PrivacyInfo\.xcprivacy in Resources \*\/ = \{isa = PBXBuildFile/);
  assert.match(project, /PrivacyInfo\.xcprivacy in Resources \*\//);
  assert.match(project, /PrivacyInfo\.xcprivacy \*\//);
});

test("native network and WebView configuration fail closed", () => {
  assert.match(infoPlist, /<key>NSAppTransportSecurity<\/key>/);
  assert.match(infoPlist, /<key>NSAllowsArbitraryLoads<\/key>\s*<false\/>/);
  assert.match(infoPlist, /<key>NSAllowsArbitraryLoadsInWebContent<\/key>\s*<false\/>/);
  assert.match(infoPlist, /<key>NSAllowsLocalNetworking<\/key>\s*<false\/>/);
  assert.doesNotMatch(infoPlist, /<key>NSAllowsArbitraryLoads(?:InWebContent)?<\/key>\s*<true\/>/);
  assert.equal(capacitor.server?.url, undefined);
  assert.ok(!Array.isArray(capacitor.server?.allowNavigation) || capacitor.server.allowNavigation.length === 0);
  assert.equal(capacitor.server?.iosScheme, "https");
});

test("release profile records privacy readiness without hiding owner blockers", () => {
  assert.equal(releaseProfile.schemaVersion, 2);
  assert.equal(releaseProfile.privacyManifest, manifestPath);
  assert.equal(releaseProfile.appStorePrivacyProfile, privacyProfilePath);
  assert.equal(releaseProfile.networkSecurity.allowsArbitraryLoads, false);
  assert.equal(releaseProfile.networkSecurity.remoteServerUrl, false);
  assert.equal(releaseProfile.releaseStatus, "prepared_owner_input_pending");
  const pending = Object.entries(releaseProfile.releaseRequirements).filter(([, value]) => value === "pending").map(([key]) => key).sort();
  assert.deepEqual(pending, ["coachReviewAccount", "playerReviewAccount", "privacyPolicyUrl", "supportUrl", "termsUrl"]);
});

test("review handoff is explicit about analytics and unresolved submission inputs", () => {
  assert.match(analyticsSource, /VITE_ANALYTICS_ENDPOINT/);
  assert.match(analyticsSource, /sl:analytics-device-id/);
  assert.match(reviewPackage, /Device ID/);
  assert.match(reviewPackage, /Product Interaction/);
  assert.match(reviewPackage, /Privacy policy URL: pending/);
  assert.match(reviewPackage, /Coach App Review account: pending/);
  assert.match(reviewPackage, /does not claim that App Store Connect metadata has been entered/i);
});

test("iOS privacy configurator is deterministic and guarded", () => {
  assert.match(configuratorSource, /PRIVACY_FILE_REF/);
  assert.match(configuratorSource, /PRIVACY_BUILD_FILE/);
  assert.match(configuratorSource, /NSAppTransportSecurity/);
  assert.match(configuratorSource, /server\.allowNavigation/);
  assert.match(configuratorSource, /remote server\.url is not allowed/i);
});
