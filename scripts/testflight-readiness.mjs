import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const strictOwner = process.argv.includes("--strict-owner");
const requireMac = process.argv.includes("--require-macos");
const requireSigning = process.argv.includes("--require-signing");
const reportPath = path.join(root, "artifacts", "testflight", "readiness.json");

const paths = {
  capacitor: "capacitor.config.json",
  profile: "native/ios-release-profile.json",
  listing: "native/app-store-listing.json",
  privacy: "native/app-store-connect-privacy.json",
  project: "ios/App/App.xcodeproj/project.pbxproj",
  info: "ios/App/App/Info.plist",
  manifest: "ios/App/App/PrivacyInfo.xcprivacy",
  nativeCapacitor: "ios/App/App/capacitor.config.json",
};

const checks = [];
const add = (name, status, detail, data = undefined) => checks.push({ name, status, detail, ...(data === undefined ? {} : { data }) });
const exists = (file) => fs.existsSync(path.join(root, file));
const text = (file) => fs.readFileSync(path.join(root, file), "utf8");
const json = (file) => JSON.parse(text(file));
const major = (value) => Number.parseInt(String(value || "").match(/\d+/)?.[0] || "0", 10);

function run(executable, args) {
  const result = spawnSync(executable, args, { cwd: root, encoding: "utf8" });
  return {
    ok: result.status === 0 && !result.error,
    status: result.status,
    stdout: String(result.stdout || "").trim(),
    stderr: String(result.stderr || "").trim(),
    error: result.error?.message || "",
  };
}

function extractBuildValues(project, key) {
  return [...project.matchAll(new RegExp(`${key} = ([^;]+);`, "g"))].map((match) => match[1].replace(/^"|"$/g, "").trim());
}

function checkAllEqual(name, values, expected) {
  const normalized = [...new Set(values)];
  const ok = values.length > 0 && normalized.length === 1 && normalized[0] === String(expected);
  add(name, ok ? "pass" : "fail", ok ? String(expected) : `expected ${expected}; found ${normalized.join(", ") || "none"}`);
}

for (const [name, file] of Object.entries(paths)) {
  add(`File: ${name}`, exists(file) ? "pass" : "fail", file);
}

let config;
let profile;
let listing;
let privacy;
let project;
let info;
let manifest;
let nativeConfig;

try {
  config = json(paths.capacitor);
  profile = json(paths.profile);
  listing = json(paths.listing);
  privacy = json(paths.privacy);
  project = text(paths.project);
  info = text(paths.info);
  manifest = text(paths.manifest);
  nativeConfig = json(paths.nativeCapacitor);
} catch (error) {
  add("Release metadata parsing", "fail", error.message);
}

if (config && profile && listing && privacy && project && info && manifest && nativeConfig) {
  add("Node.js release toolchain", major(process.versions.node) >= 22 ? "pass" : "fail", `v${process.versions.node}; requires Node 22+`);

  const identityMatch = config.appId === profile.bundleIdentifier && nativeConfig.appId === profile.bundleIdentifier;
  add("Bundle identity", identityMatch ? "pass" : "fail", `${config.appId} / ${nativeConfig.appId} / ${profile.bundleIdentifier}`);
  add("Product name", config.appName === "ShotLab" && profile.productName === "ShotLab" && listing.productName === "ShotLab" ? "pass" : "fail", `${config.appName} / ${profile.productName} / ${listing.productName}`);
  add("Native web bundle mode", config.webDir === "dist" && nativeConfig.webDir === "dist" ? "pass" : "fail", `root webDir=${config.webDir}; native webDir=${nativeConfig.webDir ?? "missing"}`);
  add("Capacitor release pin", profile.capacitorVersion === "8.4.2" ? "pass" : "fail", profile.capacitorVersion);
  add("Native dependency manager", profile.nativePackageManager === "Swift Package Manager" ? "pass" : "fail", profile.nativePackageManager);

  add("2026 Apple submission floor", profile.submissionMinimums?.xcodeMajor >= 26 && profile.submissionMinimums?.iosSdkMajor >= 26 ? "pass" : "fail", `Xcode ${profile.submissionMinimums?.xcodeMajor}+ / iOS SDK ${profile.submissionMinimums?.iosSdkMajor}+; verified ${profile.submissionMinimums?.verifiedOn || "unknown"}`);

  checkAllEqual("Xcode bundle identifier", extractBuildValues(project, "PRODUCT_BUNDLE_IDENTIFIER"), profile.bundleIdentifier);
  checkAllEqual("Xcode marketing version", extractBuildValues(project, "MARKETING_VERSION"), profile.marketingVersion);
  checkAllEqual("Xcode build number", extractBuildValues(project, "CURRENT_PROJECT_VERSION"), profile.buildNumber);
  checkAllEqual("iPhone-only target family", extractBuildValues(project, "TARGETED_DEVICE_FAMILY"), 1);

  const deploymentTargets = extractBuildValues(project, "IPHONEOS_DEPLOYMENT_TARGET").map(Number).filter(Number.isFinite);
  const minimumTarget = Number(profile.minimumDeploymentTarget || 0);
  const deploymentOk = deploymentTargets.length > 0 && deploymentTargets.every((value) => value >= minimumTarget);
  add("Deployment target", deploymentOk ? "pass" : "fail", `${[...new Set(deploymentTargets)].join(", ") || "none"}; profile minimum ${profile.minimumDeploymentTarget}`);

  const orientations = [...info.matchAll(/<string>(UIInterfaceOrientation[^<]+)<\/string>/g)].map((match) => match[1]);
  add("Portrait-only iPhone release", orientations.length === 1 && orientations[0] === "UIInterfaceOrientationPortrait" ? "pass" : "fail", orientations.join(", ") || "no orientation declared");
  add("App Transport Security", /<key>NSAllowsArbitraryLoads<\/key>\s*<false\/>/.test(info) && /<key>NSAllowsArbitraryLoadsInWebContent<\/key>\s*<false\/>/.test(info) && /<key>NSAllowsLocalNetworking<\/key>\s*<false\/>/.test(info) ? "pass" : "fail", "arbitrary, web-content, and local-network loads must remain disabled");
  add("Export compliance declaration", /<key>ITSAppUsesNonExemptEncryption<\/key>\s*<false\/>/.test(info) ? "pass" : "fail", "ITSAppUsesNonExemptEncryption=false");
  add("Privacy manifest bundled contract", /NSPrivacyTracking<\/key>\s*<false\/>/.test(manifest) && /NSPrivacyCollectedDataTypes/.test(manifest) && /NSPrivacyAccessedAPITypes/.test(manifest) ? "pass" : "fail", paths.manifest);
  add("Privacy inventory alignment", privacy.tracking === false && profile.appStorePrivacyProfile === paths.privacy ? "pass" : "fail", `${privacy.collectedData?.length || 0} declared data types`);
  add("App Store listing profile", profile.appStoreListingProfile === paths.listing ? "pass" : "fail", profile.appStoreListingProfile || "missing");

  const allowed69Portrait = new Set(["1260x2736", "1290x2796", "1320x2868"]);
  const screenshotSpec = `${listing.screenshots?.width}x${listing.screenshots?.height}`;
  const screenshotItems = listing.screenshots?.items || [];
  const screenshotCount = Number(listing.screenshots?.count || 0);
  const screenshotOk = listing.screenshots?.display === "iPhone 6.9-inch"
    && allowed69Portrait.has(screenshotSpec)
    && screenshotCount >= 1
    && screenshotCount <= 10
    && screenshotItems.length === screenshotCount
    && ["jpeg", "jpg", "png"].includes(String(listing.screenshots?.format || "").toLowerCase());
  add("App Store screenshot specification", screenshotOk ? "pass" : "fail", `${listing.screenshots?.display || "unknown"} ${screenshotSpec}; ${screenshotCount} ${listing.screenshots?.format || "unknown"} files`);

  const pendingRequirements = Object.entries(profile.releaseRequirements || {})
    .filter(([, value]) => value === "pending")
    .map(([key]) => key);
  const ownerState = pendingRequirements.length ? (strictOwner ? "fail" : "warn") : "pass";
  add("Submission owner/device inputs", ownerState, pendingRequirements.length ? `pending: ${pendingRequirements.join(", ")}` : "all release requirements supplied", pendingRequirements);

  const privacyPending = Object.entries(privacy.ownerInputRequired || {})
    .filter(([, value]) => value === "pending" || String(value).startsWith("verify"))
    .map(([key]) => key);
  add("Privacy submission inputs", privacyPending.length ? (strictOwner ? "fail" : "warn") : "pass", privacyPending.length ? `pending/verify: ${privacyPending.join(", ")}` : "privacy inputs supplied", privacyPending);

  const signingTeams = extractBuildValues(project, "DEVELOPMENT_TEAM").filter(Boolean);
  const signingConfigured = signingTeams.length > 0 && signingTeams.every((team) => /^[A-Z0-9]{10}$/.test(team));
  add("Apple signing team", signingConfigured ? "pass" : (requireSigning ? "fail" : "warn"), signingConfigured ? [...new Set(signingTeams)].join(", ") : "not committed; configure with npm run ios:configure-signing before a signed device/archive build");

  if (process.platform === "darwin") {
    const xcode = run("xcodebuild", ["-version"]);
    const xcodeVersion = xcode.stdout.match(/^Xcode\s+([^\s]+)/m)?.[1] || "0";
    add("Xcode upload minimum", xcode.ok && major(xcodeVersion) >= profile.submissionMinimums.xcodeMajor ? "pass" : "fail", xcode.ok ? `Xcode ${xcodeVersion}; requires ${profile.submissionMinimums.xcodeMajor}+` : xcode.error || xcode.stderr || "xcodebuild unavailable");

    const sdk = run("xcrun", ["--sdk", "iphoneos", "--show-sdk-version"]);
    add("iOS SDK upload minimum", sdk.ok && major(sdk.stdout) >= profile.submissionMinimums.iosSdkMajor ? "pass" : "fail", sdk.ok ? `iOS SDK ${sdk.stdout}; requires ${profile.submissionMinimums.iosSdkMajor}+` : sdk.error || sdk.stderr || "iphoneos SDK unavailable");
  } else {
    add("macOS/Xcode environment", requireMac ? "fail" : "warn", `${process.platform}; static release validation is available, but iOS compilation/archive requires macOS`);
  }
}

const failures = checks.filter((check) => check.status === "fail");
const warnings = checks.filter((check) => check.status === "warn");
const status = failures.length ? "blocked" : warnings.length ? "code_ready_with_external_blockers" : "submit_ready";
const report = {
  generatedAt: new Date().toISOString(),
  status,
  strictOwner,
  requireMac,
  requireSigning,
  summary: {
    passed: checks.filter((check) => check.status === "pass").length,
    warnings: warnings.length,
    failures: failures.length,
  },
  checks,
};
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

const symbol = { pass: "✓", warn: "!", fail: "×" };
console.log("\nShotLab TestFlight Readiness\n");
for (const check of checks) console.log(`${symbol[check.status]} ${check.name}: ${check.detail}`);
console.log(`\nStatus: ${status}`);
console.log(`Report: ${path.relative(root, reportPath)}`);

if (failures.length) process.exit(1);
