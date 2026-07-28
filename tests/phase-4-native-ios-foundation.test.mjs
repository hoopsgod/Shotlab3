import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
const capacitorConfig = JSON.parse(fs.readFileSync("capacitor.config.json", "utf8"));
const releaseProfile = JSON.parse(fs.readFileSync("native/ios-release-profile.json", "utf8"));
const nativeScript = fs.readFileSync("scripts/native-ios.mjs", "utf8");
const doctorScript = fs.readFileSync("scripts/native-release-doctor.mjs", "utf8");
const runbook = fs.readFileSync("docs/testflight-release-runbook.md", "utf8");
const workflow = fs.readFileSync(".github/workflows/phase-4-native-ios.yml", "utf8");

const REQUIRED_RELEASE_ITEMS = [
  "privacyPolicyUrl",
  "termsUrl",
  "supportUrl",
  "coachReviewAccount",
  "playerReviewAccount",
];

test("Capacitor identity is deterministic and aligned with the release profile", () => {
  assert.equal(capacitorConfig.appName, "ShotLab");
  assert.equal(capacitorConfig.appId, "com.shotlab.training");
  assert.equal(capacitorConfig.appId, releaseProfile.bundleIdentifier);
  assert.equal(capacitorConfig.webDir, "dist");
  assert.equal(capacitorConfig.server?.iosScheme, "https");
  assert.equal(releaseProfile.capacitorVersion, "8.4.2");
  assert.equal(releaseProfile.nativePackageManager, "Swift Package Manager");
});

test("native scripts expose a repeatable build, sync, verify, doctor, and Xcode workflow", () => {
  for (const script of [
    "native:doctor",
    "native:install:toolchain",
    "native:prepare:ios",
    "native:sync:ios",
    "native:verify:ios",
    "native:open:ios",
  ]) assert.equal(typeof packageJson.scripts?.[script], "string", `Missing ${script}`);

  assert.match(nativeScript, /CAPACITOR_VERSION = "8\.4\.2"/);
  assert.match(nativeScript, /@capacitor\/core@/);
  assert.match(nativeScript, /@capacitor\/cli@/);
  assert.match(nativeScript, /@capacitor\/ios@/);
  assert.match(nativeScript, /--package-lock=false/);
  assert.match(nativeScript, /cap\(\["add", "ios"\]\)/);
  assert.match(nativeScript, /cap\(\["sync", "ios"\]\)/);
  assert.match(nativeScript, /process\.platform !== "darwin"/);
  assert.match(doctorScript, /Node\.js/);
  assert.match(doctorScript, /App Store metadata/);
});

test("release readiness stays explicit instead of inventing submission metadata", () => {
  for (const key of REQUIRED_RELEASE_ITEMS) assert.equal(releaseProfile.releaseRequirements?.[key], "pending", `${key} should remain visibly pending`);
  assert.deepEqual(releaseProfile.capabilities, []);
  assert.deepEqual(releaseProfile.privacyUsageDescriptions, {});
  assert.match(runbook, /provisional bundle identifier/i);
  assert.match(runbook, /Do not submit the build for Apple review/i);
  assert.match(runbook, /npm run native:prepare:ios/);
  assert.match(runbook, /npm run native:sync:ios/);
});

test("native foundation does not add remote web loading or application data access", () => {
  for (const source of [nativeScript, doctorScript, JSON.stringify(capacitorConfig)]) {
    assert.doesNotMatch(source, /supabase|auth\.|fetch\(|XMLHttpRequest|server\s*\.\s*url/i);
  }
  assert.equal(capacitorConfig.server?.url, undefined);
});

test("CI builds the web app, generates the iOS workspace, verifies it, and publishes an artifact", () => {
  assert.match(workflow, /node-version:\s*22/);
  assert.match(workflow, /npm ci/);
  assert.match(workflow, /npm run build/);
  assert.match(workflow, /npm run native:prepare:ios/);
  assert.match(workflow, /native:verify:ios -- --require-build --require-ios/);
  assert.match(workflow, /actions\/upload-artifact@v4/);
  assert.match(workflow, /path:\s*ios/);
});
