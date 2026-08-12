import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const command = process.argv[2] || "help";
const root = process.cwd();
const project = path.join(root, "ios", "App", "App.xcodeproj");
const profilePath = path.join(root, "native", "ios-release-profile.json");
const scheme = "App";
const archivePath = path.join(root, "build", "ShotLab.xcarchive");
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const nodeCommand = process.execPath;

function fail(message) {
  console.error(`[ShotLab iOS release] ${message}`);
  process.exit(1);
}

function runResult(bin, args, options = {}) {
  return spawnSync(bin, args, { cwd: root, encoding: "utf8", ...options });
}

function run(bin, args, options = {}) {
  const result = spawnSync(bin, args, { cwd: root, stdio: "inherit", ...options });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function requireMac() {
  if (process.platform !== "darwin") fail("This command requires macOS with Xcode installed.");
  if (!fs.existsSync(project)) fail("Missing ios/App/App.xcodeproj.");
  if (!fs.existsSync(profilePath)) fail("Missing native/ios-release-profile.json.");
}

function releaseProfile() {
  return JSON.parse(fs.readFileSync(profilePath, "utf8"));
}

function major(value) {
  return Number.parseInt(String(value || "").match(/\d+/)?.[0] || "0", 10);
}

function verifyAppleToolchain() {
  const profile = releaseProfile();
  const requiredXcode = Number(profile.submissionMinimums?.xcodeMajor || 26);
  const requiredSdk = Number(profile.submissionMinimums?.iosSdkMajor || 26);

  const xcode = runResult("xcodebuild", ["-version"]);
  if (xcode.error || xcode.status !== 0) fail(xcode.error?.message || xcode.stderr || "xcodebuild is unavailable.");
  const xcodeVersion = String(xcode.stdout || "").match(/^Xcode\s+([^\s]+)/m)?.[1] || "0";
  if (major(xcodeVersion) < requiredXcode) fail(`Xcode ${xcodeVersion} is below the App Store upload minimum. Xcode ${requiredXcode}+ is required.`);

  const sdk = runResult("xcrun", ["--sdk", "iphoneos", "--show-sdk-version"]);
  if (sdk.error || sdk.status !== 0) fail(sdk.error?.message || sdk.stderr || "The iPhoneOS SDK is unavailable.");
  const sdkVersion = String(sdk.stdout || "").trim();
  if (major(sdkVersion) < requiredSdk) fail(`iOS SDK ${sdkVersion} is below the App Store upload minimum. iOS SDK ${requiredSdk}+ is required.`);

  console.log(`[ShotLab iOS release] Apple toolchain verified: Xcode ${xcodeVersion}, iOS SDK ${sdkVersion}.`);
}

function verifyReadiness({ requireSigning = false } = {}) {
  const args = ["scripts/testflight-readiness.mjs", "--require-macos"];
  if (requireSigning) args.push("--require-signing");
  run(nodeCommand, args);
}

function syncReleaseBundle() {
  console.log("[ShotLab iOS release] Rebuilding and syncing the current production web bundle before native compilation.");
  run(npmCommand, ["run", "native:sync:ios"]);
}

function simulatorBuild() {
  run("xcodebuild", [
    "-project", project,
    "-scheme", scheme,
    "-configuration", "Debug",
    "-sdk", "iphonesimulator",
    "-destination", "generic/platform=iOS Simulator",
    "CODE_SIGNING_ALLOWED=NO",
    "build",
  ]);
}

function deviceBuild() {
  run("xcodebuild", [
    "-project", project,
    "-scheme", scheme,
    "-configuration", "Debug",
    "-destination", "generic/platform=iOS",
    "-allowProvisioningUpdates",
    "build",
  ]);
}

function archiveRelease() {
  fs.mkdirSync(path.dirname(archivePath), { recursive: true });
  run("xcodebuild", [
    "-project", project,
    "-scheme", scheme,
    "-configuration", "Release",
    "-destination", "generic/platform=iOS",
    "-archivePath", archivePath,
    "-allowProvisioningUpdates",
    "archive",
  ]);
  console.log(`[ShotLab iOS release] Archive created at ${archivePath}`);
}

switch (command) {
  case "validate":
    requireMac();
    verifyAppleToolchain();
    verifyReadiness();
    run("xcodebuild", ["-project", project, "-scheme", scheme, "-showBuildSettings"]);
    break;
  case "simulator":
    requireMac();
    verifyAppleToolchain();
    syncReleaseBundle();
    verifyReadiness();
    simulatorBuild();
    break;
  case "device":
    requireMac();
    verifyAppleToolchain();
    syncReleaseBundle();
    verifyReadiness({ requireSigning: true });
    deviceBuild();
    break;
  case "archive":
  case "release-candidate":
    requireMac();
    verifyAppleToolchain();
    syncReleaseBundle();
    verifyReadiness({ requireSigning: true });
    archiveRelease();
    console.log("[ShotLab iOS release] Release candidate archive is ready for Xcode Organizer validation and TestFlight upload.");
    break;
  default:
    console.log("Usage: node scripts/ios-release.mjs <validate|simulator|device|archive|release-candidate>");
}
