import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const requireMac = process.argv.includes("--require-macos");
const requireTeam = process.argv.includes("--require-team");
const requireDevice = process.argv.includes("--require-device");
const reportPath = path.join(root, "artifacts", "testflight", "first-build-handoff.json");
const handoffPath = path.join(root, "native", "first-testflight-handoff.json");
const profilePath = path.join(root, "native", "ios-release-profile.json");
const capacitorPath = path.join(root, "capacitor.config.json");
const projectPath = path.join(root, "ios", "App", "App.xcodeproj", "project.pbxproj");

const checks = [];
const add = (name, status, detail) => checks.push({ name, status, detail });
const failState = (required) => required ? "fail" : "warn";
const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const run = (bin, args) => {
  const result = spawnSync(bin, args, { cwd: root, encoding: "utf8" });
  return {
    ok: !result.error && result.status === 0,
    stdout: String(result.stdout || "").trim(),
    stderr: String(result.stderr || "").trim(),
    error: result.error?.message || "",
  };
};
const major = (value) => Number.parseInt(String(value || "").match(/\d+/)?.[0] || "0", 10);

for (const file of [handoffPath, profilePath, capacitorPath, projectPath]) {
  if (!fs.existsSync(file)) add(`File ${path.relative(root, file)}`, "fail", "missing");
}

let handoff;
let profile;
let capacitor;
let project = "";
try {
  handoff = readJson(handoffPath);
  profile = readJson(profilePath);
  capacitor = readJson(capacitorPath);
  project = fs.readFileSync(projectPath, "utf8");
} catch (error) {
  add("Release handoff metadata", "fail", error.message);
}

if (handoff && profile && capacitor && project) {
  const identityOk = handoff.bundleIdentifier === profile.bundleIdentifier
    && capacitor.appId === profile.bundleIdentifier
    && handoff.marketingVersion === profile.marketingVersion
    && Number(handoff.buildNumber) === Number(profile.buildNumber);
  add("Release identity alignment", identityOk ? "pass" : "fail", `${handoff.bundleIdentifier} · ${handoff.marketingVersion} (${handoff.buildNumber})`);
  add("First distribution intent", handoff.distributionIntent === "internal-testflight-first" ? "pass" : "fail", handoff.distributionIntent);
  add("Credential source-control policy", handoff.signing?.credentials?.sourceControlAllowed === false ? "pass" : "fail", "signing credentials must never be committed");
  add("Physical-device evidence remains required", handoff.physicalDevice?.evidenceRequired === true && handoff.physicalDevice?.status === "pending" ? "pass" : "fail", handoff.physicalDevice?.status || "missing");
  add("Processed TestFlight install remains required", handoff.testFlight?.processedBuild === "pending" && handoff.testFlight?.installedFromTestFlight === "pending" ? "pass" : "fail", "first processed internal build must be installed before closure");

  const teamId = String(process.env.SHOTLAB_DEVELOPMENT_TEAM || "").trim();
  const validTeam = /^[A-Z0-9]{10}$/.test(teamId);
  add("Apple Developer Team ID input", validTeam ? "pass" : failState(requireTeam), validTeam ? "valid 10-character Team ID supplied" : "set SHOTLAB_DEVELOPMENT_TEAM with the real Apple Developer Team ID");

  const projectTeams = [...project.matchAll(/DEVELOPMENT_TEAM = ([^;]+);/g)].map((match) => match[1].replace(/^"|"$/g, "").trim()).filter(Boolean);
  if (validTeam) {
    const configured = projectTeams.length > 0 && projectTeams.every((value) => value === teamId);
    add("Xcode project signing team", configured ? "pass" : failState(requireTeam), configured ? "project is aligned with supplied team" : "run SHOTLAB_DEVELOPMENT_TEAM=… npm run ios:configure-signing before signed build/archive");
  } else {
    add("Xcode project signing team", projectTeams.length ? "warn" : "pass", projectTeams.length ? "a team is committed but owner input was not supplied for comparison" : "no Apple team is committed to source control");
  }

  if (process.platform === "darwin") {
    const xcode = run("xcodebuild", ["-version"]);
    const xcodeVersion = xcode.stdout.match(/^Xcode\s+([^\s]+)/m)?.[1] || "0";
    add("Xcode submission toolchain", xcode.ok && major(xcodeVersion) >= Number(profile.submissionMinimums?.xcodeMajor || 26) ? "pass" : "fail", xcode.ok ? `Xcode ${xcodeVersion}` : xcode.error || xcode.stderr || "xcodebuild unavailable");

    const sdk = run("xcrun", ["--sdk", "iphoneos", "--show-sdk-version"]);
    add("iPhoneOS SDK", sdk.ok && major(sdk.stdout) >= Number(profile.submissionMinimums?.iosSdkMajor || 26) ? "pass" : "fail", sdk.ok ? `iOS SDK ${sdk.stdout}` : sdk.error || sdk.stderr || "iphoneos SDK unavailable");

    const identities = run("security", ["find-identity", "-v", "-p", "codesigning"]);
    const hasIdentity = identities.ok && /Apple (Development|Distribution)|iPhone (Developer|Distribution)/.test(identities.stdout);
    add("Local code-signing identity", hasIdentity ? "pass" : failState(requireTeam), hasIdentity ? "Apple code-signing identity is available in the keychain" : "no usable Apple code-signing identity detected yet");

    const deviceUdid = String(process.env.SHOTLAB_DEVICE_UDID || "").trim();
    if (!deviceUdid) {
      add("Physical iPhone target", failState(requireDevice), "set SHOTLAB_DEVICE_UDID after connecting and trusting the release iPhone");
    } else {
      const devices = run("xcrun", ["xctrace", "list", "devices"]);
      const line = devices.stdout.split("\n").find((value) => value.includes(deviceUdid));
      const physical = devices.ok && Boolean(line) && !/Simulator/i.test(line);
      add("Physical iPhone target", physical ? "pass" : "fail", physical ? "connected physical iPhone found" : "the supplied device identifier was not found as a physical device");
    }
  } else {
    add("macOS signing environment", failState(requireMac), `${process.platform}; Apple signing and physical-device validation require macOS/Xcode`);
  }
}

const failures = checks.filter((check) => check.status === "fail");
const warnings = checks.filter((check) => check.status === "warn");
const status = failures.length ? "blocked" : warnings.length ? "handoff_ready_with_owner_inputs_pending" : "signed_device_preflight_ready";
const report = {
  generatedAt: new Date().toISOString(),
  status,
  requireMac,
  requireTeam,
  requireDevice,
  summary: {
    passed: checks.filter((check) => check.status === "pass").length,
    warnings: warnings.length,
    failures: failures.length
  },
  checks
};
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

const symbol = { pass: "✓", warn: "!", fail: "×" };
console.log("\nShotLab Apple Signing / First Build Preflight\n");
for (const check of checks) console.log(`${symbol[check.status]} ${check.name}: ${check.detail}`);
console.log(`\nStatus: ${status}`);
console.log(`Report: ${path.relative(root, reportPath)}`);
if (failures.length) process.exit(1);
