import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { spawnSync } from "node:child_process";

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const project = read("ios/App/App.xcodeproj/project.pbxproj");
const info = read("ios/App/App/Info.plist");
const packageJson = JSON.parse(read("package.json"));
const releaseProfile = JSON.parse(read("native/ios-release-profile.json"));
const releaseScript = read("scripts/ios-release.mjs");
const readinessScript = read("scripts/testflight-readiness.mjs");
const exists = (path) => fs.existsSync(new URL(`../${path}`, import.meta.url));

test("committed iOS project contains the finalized ShotLab identity", () => {
  assert.match(project, /PRODUCT_BUNDLE_IDENTIFIER = com\.shotlab\.training;/);
  assert.match(project, /MARKETING_VERSION = 1\.0;/);
  assert.match(project, /CURRENT_PROJECT_VERSION = 1;/);
  assert.match(project, /TARGETED_DEVICE_FAMILY = 1;/);
  assert.equal(releaseProfile.marketingVersion, "1.0");
  assert.equal(releaseProfile.buildNumber, 1);
});

test("initial native shell is portrait, iPhone-only, export-compliance explicit, and queued for real-device chrome review", () => {
  assert.match(info, /<key>UIUserInterfaceStyle<\/key>\s*<string>Dark<\/string>/);
  assert.match(info, /<string>UIInterfaceOrientationPortrait<\/string>/);
  assert.doesNotMatch(info, /UIInterfaceOrientationLandscape/);
  assert.match(info, /<key>ITSAppUsesNonExemptEncryption<\/key>\s*<false\/>/);
  assert.equal(releaseProfile.deviceFamily, "iPhone");
  assert.equal(releaseProfile.orientation, "portrait");
  assert.equal(releaseProfile.appearance, "light-first");
  assert.equal(releaseProfile.releaseRequirements.physicalDeviceQa, "pending");
});

test("production app icon and launch assets are deterministic", () => {
  for (const path of [
    "native/assets/app-icon-master.svg",
    "native/assets/launch-master.svg",
    "scripts/generate-ios-assets.mjs",
  ]) assert.equal(exists(path), true, `${path} should exist`);

  const result = spawnSync(process.execPath, ["scripts/generate-ios-assets.mjs"], {
    cwd: new URL("..", import.meta.url),
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  for (const path of [
    "ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png",
    "ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732.png",
  ]) {
    assert.equal(exists(path), true, `${path} should be generated`);
    assert.ok(fs.statSync(new URL(`../${path}`, import.meta.url)).size > 20000);
  }
});

test("signed-device commands are explicit, sync current web assets, enforce current Apple tooling, and keep secrets out of the repository", () => {
  assert.equal(packageJson.scripts["ios:configure-signing"], "node scripts/configure-ios-signing.mjs");
  assert.equal(packageJson.scripts["ios:device-build"], "node scripts/ios-release.mjs device");
  assert.equal(packageJson.scripts["ios:archive"], "node scripts/ios-release.mjs archive");
  assert.equal(packageJson.scripts["ios:generate-assets"], "node scripts/generate-ios-assets.mjs");
  assert.equal(packageJson.scripts["ios:release-readiness"], undefined);
  assert.equal(packageJson.scripts["ios:release-candidate"], undefined);
  assert.match(read("scripts/configure-ios-signing.mjs"), /SHOTLAB_DEVELOPMENT_TEAM/);
  assert.match(releaseScript, /case "release-candidate"/);
  assert.match(releaseScript, /syncReleaseBundle/);
  assert.match(releaseScript, /native:sync:ios/);
  assert.match(releaseScript, /verifyAppleToolchain/);
  assert.match(releaseScript, /submissionMinimums/);
  assert.match(releaseScript, /--require-signing/);
  assert.match(readinessScript, /--strict-owner/);
  assert.match(readinessScript, /--require-signing/);
  assert.doesNotMatch(project, /DEVELOPMENT_TEAM = [A-Z0-9]{10};/);
});
