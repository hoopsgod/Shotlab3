import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";

const DEFAULT_REPORT_PATH = "artifacts/native-release-doctor.json";

const normalizeVersion = (value) => {
  const parts = String(value ?? "").trim().split(".").map((part) => Number(part));
  if (!parts.length || parts.some((part) => !Number.isInteger(part) || part < 0)) return "";
  while (parts.length > 1 && parts.at(-1) === 0) parts.pop();
  return parts.join(".");
};

const readText = (root, path) => readFileSync(join(root, path), "utf8");
const readJson = (root, path) => JSON.parse(readText(root, path));
const uniqueMatches = (source, pattern) => [...new Set([...source.matchAll(pattern)].map((match) => String(match[1]).trim()))];

function commandVersion(command, args = ["-version"]) {
  const executable = process.platform === "win32" ? `${command}.cmd` : command;
  const result = spawnSync(executable, args, { encoding: "utf8" });
  return result.status === 0 ? String(result.stdout || result.stderr || "").trim().split("\n")[0] : "";
}

export function evaluateNativeRelease({
  root = process.cwd(),
  platform = process.platform,
  nodeVersion = process.versions.node,
} = {}) {
  const checks = [];
  const add = (name, status, detail, category = "technical") => checks.push({ name, status, detail, category });
  const required = [
    "package.json",
    "capacitor.config.json",
    "native/ios-release-profile.json",
    "native/app-store-public-urls.json",
    "ios/App/App.xcodeproj/project.pbxproj",
    "ios/App/App/Info.plist",
    "ios/App/App/PrivacyInfo.xcprivacy",
    "ios/App/App/Assets.xcassets/AppIcon.appiconset/Contents.json",
  ];

  for (const path of required) add(`File: ${path}`, existsSync(join(root, path)) ? "pass" : "fail", path);
  const nodeMajor = Number(String(nodeVersion).split(".")[0]);
  add("Node.js", nodeMajor >= 22 ? "pass" : "fail", `v${nodeVersion}; native tooling requires v22+`);
  add(
    "Operating system",
    platform === "darwin" ? "pass" : "warn",
    platform === "darwin" ? "macOS can build, sign, and archive iOS" : `${platform} validates configuration but cannot sign or archive iOS`,
  );
  add("Production web build", existsSync(join(root, "dist/index.html")) ? "pass" : "warn", existsSync(join(root, "dist/index.html")) ? "dist/index.html present" : "run npm run build before native sync");

  let config;
  let profile;
  let packageJson;
  let publicUrls;
  let project = "";
  let infoPlist = "";
  let privacy = "";
  let iconCatalog;
  try {
    config = readJson(root, "capacitor.config.json");
    profile = readJson(root, "native/ios-release-profile.json");
    packageJson = readJson(root, "package.json");
    publicUrls = readJson(root, "native/app-store-public-urls.json");
    project = readText(root, "ios/App/App.xcodeproj/project.pbxproj");
    infoPlist = readText(root, "ios/App/App/Info.plist");
    privacy = readText(root, "ios/App/App/PrivacyInfo.xcprivacy");
    iconCatalog = readJson(root, "ios/App/App/Assets.xcassets/AppIcon.appiconset/Contents.json");
  } catch (error) {
    add("Native configuration parsing", "fail", error.message);
  }

  if (config && profile && packageJson && project) {
    add("Bundle identity", config.appId === profile.bundleIdentifier ? "pass" : "fail", `${config.appId || "missing"} / ${profile.bundleIdentifier || "missing"}`);
    add("Product name", config.appName === profile.productName ? "pass" : "fail", `${config.appName || "missing"} / ${profile.productName || "missing"}`);

    const projectVersions = uniqueMatches(project, /MARKETING_VERSION\s*=\s*([^;]+);/g);
    const buildNumbers = uniqueMatches(project, /CURRENT_PROJECT_VERSION\s*=\s*([^;]+);/g);
    const marketingAligned = projectVersions.length === 1 && normalizeVersion(projectVersions[0]) === normalizeVersion(profile.marketingVersion);
    add("Marketing version", marketingAligned ? "pass" : "fail", `Xcode ${projectVersions.join(", ") || "missing"}; profile ${profile.marketingVersion || "missing"}`);
    const buildAligned = buildNumbers.length === 1 && Number(buildNumbers[0]) === Number(profile.buildNumber);
    add("Build number", buildAligned ? "pass" : "fail", `Xcode ${buildNumbers.join(", ") || "missing"}; profile ${profile.buildNumber ?? "missing"}`);
    add("Package release version", normalizeVersion(packageJson.version) === normalizeVersion(profile.marketingVersion) ? "pass" : "fail", `package ${packageJson.version}; iOS ${profile.marketingVersion}`);
    add("Xcode bundle ID", project.includes(`PRODUCT_BUNDLE_IDENTIFIER = ${profile.bundleIdentifier};`) ? "pass" : "fail", profile.bundleIdentifier || "missing");
    add("Info.plist version wiring", infoPlist.includes("$(MARKETING_VERSION)") && infoPlist.includes("$(CURRENT_PROJECT_VERSION)") ? "pass" : "fail", "CFBundleShortVersionString and CFBundleVersion use Xcode settings");

    const bundledWeb = config.webDir === "dist" && !config.server?.url && profile.networkSecurity?.remoteServerUrl === false && (profile.networkSecurity?.allowNavigationDomains || []).length === 0;
    add("Bundled web runtime", bundledWeb ? "pass" : "fail", bundledWeb ? "dist is packaged locally; no remote runtime URL" : "remote runtime or navigation domains detected");
    const transportLocked = profile.networkSecurity?.allowsArbitraryLoads === false
      && profile.networkSecurity?.allowsArbitraryLoadsInWebContent === false
      && profile.networkSecurity?.allowsLocalNetworking === false
      && infoPlist.includes("NSAllowsArbitraryLoads")
      && infoPlist.includes("<false/>");
    add("Network security", transportLocked ? "pass" : "fail", transportLocked ? "arbitrary, web-content, and local networking loads disabled" : "network security settings are incomplete");

    const signingConfigured = /DEVELOPMENT_TEAM\s*=\s*[^;]+;/.test(project);
    add("Apple signing identity", signingConfigured ? "pass" : "warn", signingConfigured ? "Apple Team ID is present" : "Apple Team ID and signing certificate remain owner input", "owner");
  }

  if (project && privacy) {
    const included = project.includes("PrivacyInfo.xcprivacy in Resources") && project.includes("PrivacyInfo.xcprivacy");
    add("Privacy manifest inclusion", included ? "pass" : "fail", included ? "PrivacyInfo.xcprivacy is embedded in the app target" : "privacy manifest is not embedded");
    const noTracking = /<key>NSPrivacyTracking<\/key>\s*<false\/>/s.test(privacy) && /<key>NSPrivacyTrackingDomains<\/key>\s*<array\/>/s.test(privacy);
    add("Tracking declaration", noTracking ? "pass" : "fail", noTracking ? "tracking disabled and no tracking domains declared" : "tracking declaration is incomplete");
  }

  if (iconCatalog) {
    const icon = (iconCatalog.images || []).find((image) => image.platform === "ios" && image.size === "1024x1024" && image.filename);
    const iconPath = icon ? `ios/App/App/Assets.xcassets/AppIcon.appiconset/${icon.filename}` : "";
    add("App Store icon", icon && existsSync(join(root, iconPath)) ? "pass" : "fail", iconPath || "1024x1024 iOS icon entry missing");
  }

  if (publicUrls) {
    const routeContractsReady = Array.isArray(publicUrls.routes)
      && publicUrls.routes.length >= 5
      && publicUrls.routes.every((route) => route.sourceImplemented === true && route.directRouteTestedLocally === true && String(route.candidateUrl || "").startsWith("https://"));
    add("Public submission routes", routeContractsReady ? "pass" : "fail", routeContractsReady ? `${publicUrls.routes.length} HTTPS route contracts pass locally` : "public route contracts are incomplete");
    const liveVerified = publicUrls.routes?.every((route) => route.liveHttpsVerified === true) === true;
    add("Live public URL verification", liveVerified ? "pass" : "warn", liveVerified ? "all candidate URLs verified on production HTTPS" : "run the deployed public-route verifier before App Store submission", "owner");
    const mailboxReady = publicUrls.supportMailbox?.ownershipVerified === true && publicUrls.supportMailbox?.deliverabilityVerified === true;
    add("Support mailbox", mailboxReady ? "pass" : "warn", mailboxReady ? `${publicUrls.supportMailbox.addressInApp} ownership and delivery verified` : `${publicUrls.supportMailbox?.addressInApp || "support mailbox"} ownership and deliverability remain owner input`, "owner");
  }

  if (profile) {
    const reviewPending = ["coachReviewAccount", "playerReviewAccount"].filter((key) => profile.releaseRequirements?.[key] === "pending");
    add("App Review accounts", reviewPending.length ? "warn" : "pass", reviewPending.length ? `pending: ${reviewPending.join(", ")}` : "coach and player review accounts supplied", "owner");
  }

  if (platform === "darwin") {
    const xcode = commandVersion("xcodebuild");
    add("Xcode", xcode ? "pass" : "fail", xcode || "xcodebuild not found");
  }

  const technicalFailures = checks.filter((check) => check.category === "technical" && check.status === "fail");
  const technicalWarnings = checks.filter((check) => check.category === "technical" && check.status === "warn");
  const ownerBlockers = checks.filter((check) => check.category === "owner" && check.status !== "pass");
  const status = technicalFailures.length
    ? "technical_fail"
    : ownerBlockers.length
      ? "technical_pass_owner_input_pending"
      : "release_candidate_ready";

  return {
    schemaVersion: 2,
    generatedAt: new Date().toISOString(),
    status,
    checks,
    summary: {
      passed: checks.filter((check) => check.status === "pass").length,
      technicalWarnings: technicalWarnings.length,
      technicalFailures: technicalFailures.length,
      ownerBlockers: ownerBlockers.length,
    },
    technicalFailures: technicalFailures.map((check) => check.name),
    ownerBlockers: ownerBlockers.map((check) => ({ name: check.name, detail: check.detail })),
  };
}

export function writeNativeReleaseReport(report, { root = process.cwd(), outputPath = DEFAULT_REPORT_PATH } = {}) {
  const absolutePath = resolve(root, outputPath);
  mkdirSync(dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return absolutePath;
}

function printReport(report, reportPath) {
  const icons = { pass: "✓", warn: "!", fail: "×" };
  console.log("\nShotLab Native Release Doctor 2.0\n");
  for (const check of report.checks) {
    const suffix = check.category === "owner" ? " [owner]" : "";
    console.log(`${icons[check.status]} ${check.name}${suffix}: ${check.detail}`);
  }
  console.log(`\nStatus: ${report.status}`);
  console.log(`${report.summary.passed} passed, ${report.summary.technicalWarnings} technical warnings, ${report.summary.technicalFailures} technical failures, ${report.summary.ownerBlockers} owner blockers.`);
  console.log(`Report: ${reportPath}`);
}

const isCli = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  const report = evaluateNativeRelease();
  const reportPath = writeNativeReleaseReport(report);
  printReport(report, reportPath);
  if (report.summary.technicalFailures) process.exit(1);
}
