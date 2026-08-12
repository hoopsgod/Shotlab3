import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const repoRoot = process.cwd();
const projectPath = path.join(repoRoot, "ios", "App", "App.xcodeproj", "project.pbxproj");
const configPath = path.join(repoRoot, "capacitor.config.json");
const profilePath = path.join(repoRoot, "native", "ios-release-profile.json");
const teamId = String(process.env.SHOTLAB_DEVELOPMENT_TEAM || process.argv[2] || "").trim();

function fail(message) {
  console.error(`[ShotLab iOS signing] ${message}`);
  process.exit(1);
}

for (const file of [projectPath, configPath, profilePath]) {
  if (!fs.existsSync(file)) fail(`Missing required file: ${path.relative(repoRoot, file)}`);
}

const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
const profile = JSON.parse(fs.readFileSync(profilePath, "utf8"));
if (config.appId !== profile.bundleIdentifier) {
  fail(`Capacitor appId (${config.appId}) and release profile bundleIdentifier (${profile.bundleIdentifier}) must match before signing is configured.`);
}

const requestedBundleId = String(process.env.SHOTLAB_BUNDLE_ID || profile.bundleIdentifier || "").trim();
if (requestedBundleId !== profile.bundleIdentifier) {
  fail("SHOTLAB_BUNDLE_ID cannot override release metadata by itself. Update capacitor.config.json and native/ios-release-profile.json together first, then rerun signing configuration.");
}

if (!/^[A-Z0-9]{10}$/.test(teamId)) {
  fail("Provide a 10-character Apple Developer Team ID with SHOTLAB_DEVELOPMENT_TEAM or as the first argument.");
}
if (!/^[A-Za-z0-9.-]+$/.test(requestedBundleId) || !requestedBundleId.includes(".")) {
  fail("The release bundle identifier must be a valid reverse-DNS identifier.");
}

let source = fs.readFileSync(projectPath, "utf8");
source = source.replace(/PRODUCT_BUNDLE_IDENTIFIER = [^;]+;/g, `PRODUCT_BUNDLE_IDENTIFIER = ${requestedBundleId};`);
if (/DEVELOPMENT_TEAM = [^;]*;/.test(source)) {
  source = source.replace(/DEVELOPMENT_TEAM = [^;]*;/g, `DEVELOPMENT_TEAM = ${teamId};`);
} else {
  source = source.replace(/CODE_SIGN_STYLE = Automatic;/g, `CODE_SIGN_STYLE = Automatic;\n\t\t\t\tDEVELOPMENT_TEAM = ${teamId};`);
}
fs.writeFileSync(projectPath, source);
console.log(`Configured automatic signing for ${requestedBundleId} with Apple Team ${teamId}.`);
