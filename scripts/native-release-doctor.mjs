import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import process from "node:process";

const checks = [];
const add = (name, status, detail) => checks.push({ name, status, detail });
const commandOutput = (command, args = ["--version"]) => {
  const executable = process.platform === "win32" ? `${command}.cmd` : command;
  const result = spawnSync(executable, args, { encoding: "utf8" });
  if (result.error || result.status !== 0) return "";
  return String(result.stdout || result.stderr || "").trim();
};
const major = (value) => Number.parseInt(String(value || "").match(/\d+/)?.[0] || "0", 10);

const nodeMajor = Number(process.versions.node.split(".")[0]);
add("Node.js", nodeMajor >= 22 ? "pass" : "fail", `v${process.versions.node}; native tooling requires v22+`);
add("Operating system", process.platform === "darwin" ? "pass" : "warn", process.platform === "darwin" ? "macOS can build and archive iOS" : `${process.platform} can validate configuration but cannot compile or archive an iOS app`);

const configPath = "capacitor.config.json";
const profilePath = "native/ios-release-profile.json";
add("Capacitor config", existsSync(configPath) ? "pass" : "fail", configPath);
add("Release profile", existsSync(profilePath) ? "pass" : "fail", profilePath);
add("Production build", existsSync("dist/index.html") ? "pass" : "warn", existsSync("dist/index.html") ? "dist/index.html present" : "run npm run build before sync");
add("Generated iOS project", existsSync("ios/App/App.xcodeproj/project.pbxproj") ? "pass" : "warn", existsSync("ios/App/App.xcodeproj/project.pbxproj") ? "Xcode project present" : "run npm run native:prepare:ios");

let profile;
if (existsSync(configPath) && existsSync(profilePath)) {
  try {
    const config = JSON.parse(readFileSync(configPath, "utf8"));
    profile = JSON.parse(readFileSync(profilePath, "utf8"));
    add("Release profile schema", Number(profile.schemaVersion) >= 3 ? "pass" : "fail", `schema ${profile.schemaVersion ?? "missing"}; release-readiness phase requires schema 3+`);
    add("Bundle identity", config.appId === profile.bundleIdentifier ? "pass" : "fail", `${config.appId || "missing"} / ${profile.bundleIdentifier || "missing"}`);
    const pending = Object.entries(profile.releaseRequirements || {}).filter(([, value]) => value === "pending").map(([key]) => key);
    add("App Store submission inputs", pending.length ? "warn" : "pass", pending.length ? `pending: ${pending.join(", ")}` : "owner, device, privacy, and TestFlight inputs supplied");
    add("Apple upload floor", profile.submissionMinimums?.xcodeMajor >= 26 && profile.submissionMinimums?.iosSdkMajor >= 26 ? "pass" : "fail", `Xcode ${profile.submissionMinimums?.xcodeMajor ?? "?"}+ / iOS SDK ${profile.submissionMinimums?.iosSdkMajor ?? "?"}+`);
  } catch (error) {
    add("Native JSON", "fail", error.message);
  }
}

if (process.platform === "darwin") {
  const xcode = commandOutput("xcodebuild", ["-version"]);
  const xcodeVersion = xcode.match(/^Xcode\s+([^\s]+)/m)?.[1] || "0";
  const requiredXcode = Number(profile?.submissionMinimums?.xcodeMajor || 26);
  add("Xcode", xcode && major(xcodeVersion) >= requiredXcode ? "pass" : "fail", xcode ? `Xcode ${xcodeVersion}; requires ${requiredXcode}+` : "xcodebuild not found");

  const sdk = commandOutput("xcrun", ["--sdk", "iphoneos", "--show-sdk-version"]);
  const requiredSdk = Number(profile?.submissionMinimums?.iosSdkMajor || 26);
  add("iOS SDK", sdk && major(sdk) >= requiredSdk ? "pass" : "fail", sdk ? `${sdk}; requires ${requiredSdk}+` : "iphoneos SDK not found");
}

const icons = { pass: "✓", warn: "!", fail: "×" };
console.log("\nShotLab Native Release Doctor\n");
for (const check of checks) console.log(`${icons[check.status]} ${check.name}: ${check.detail}`);

const failures = checks.filter((check) => check.status === "fail");
const warnings = checks.filter((check) => check.status === "warn");
console.log(`\n${checks.length - failures.length - warnings.length} passed, ${warnings.length} warnings, ${failures.length} failures.`);
if (failures.length) process.exit(1);
