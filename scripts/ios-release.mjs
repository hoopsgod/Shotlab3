import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const command = process.argv[2] || "help";
const root = process.cwd();
const project = path.join(root, "ios", "App", "App.xcodeproj");
const scheme = "App";
const archivePath = path.join(root, "build", "ShotLab.xcarchive");

function run(bin, args, options = {}) {
  const result = spawnSync(bin, args, { cwd: root, stdio: "inherit", ...options });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
function requireMac() {
  if (process.platform !== "darwin") {
    console.error("This command requires macOS with Xcode installed.");
    process.exit(1);
  }
  if (!fs.existsSync(project)) {
    console.error("Missing ios/App/App.xcodeproj.");
    process.exit(1);
  }
}

switch (command) {
  case "simulator":
    requireMac();
    run("xcodebuild", ["-project", project, "-scheme", scheme, "-configuration", "Debug", "-sdk", "iphonesimulator", "-destination", "generic/platform=iOS Simulator", "CODE_SIGNING_ALLOWED=NO", "build"]);
    break;
  case "device":
    requireMac();
    run("xcodebuild", ["-project", project, "-scheme", scheme, "-configuration", "Debug", "-destination", "generic/platform=iOS", "-allowProvisioningUpdates", "build"]);
    break;
  case "archive":
    requireMac();
    fs.mkdirSync(path.dirname(archivePath), { recursive: true });
    run("xcodebuild", ["-project", project, "-scheme", scheme, "-configuration", "Release", "-destination", "generic/platform=iOS", "-archivePath", archivePath, "-allowProvisioningUpdates", "archive"]);
    console.log(`Archive created at ${archivePath}`);
    break;
  case "validate":
    requireMac();
    run("xcodebuild", ["-project", project, "-scheme", scheme, "-showBuildSettings"]);
    break;
  default:
    console.log("Usage: node scripts/ios-release.mjs <simulator|device|archive|validate>");
}
