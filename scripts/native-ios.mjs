import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import process from "node:process";

const CAPACITOR_VERSION = "8.4.2";
const CAPACITOR_PACKAGES = [
  `@capacitor/core@${CAPACITOR_VERSION}`,
  `@capacitor/cli@${CAPACITOR_VERSION}`,
  `@capacitor/ios@${CAPACITOR_VERSION}`,
];
const command = process.argv[2] || "verify";
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const npxCommand = process.platform === "win32" ? "npx.cmd" : "npx";

function fail(message) {
  console.error(`\n[ShotLab native] ${message}`);
  process.exit(1);
}

function run(executable, args, options = {}) {
  console.log(`\n> ${executable} ${args.join(" ")}`);
  const result = spawnSync(executable, args, {
    cwd: process.cwd(),
    stdio: "inherit",
    env: process.env,
    ...options,
  });
  if (result.error) fail(result.error.message);
  if (result.status !== 0) fail(`${executable} exited with status ${result.status}.`);
}

function readJson(path) {
  if (!existsSync(path)) fail(`Missing required file: ${path}`);
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    fail(`Could not parse ${path}: ${error.message}`);
  }
}

function verifyConfig({ requireBuild = false, requireIos = false } = {}) {
  const config = readJson("capacitor.config.json");
  const profile = readJson("native/ios-release-profile.json");

  if (config.appName !== "ShotLab") fail("capacitor.config.json appName must remain ShotLab.");
  if (!/^([A-Za-z0-9-]+\.)+[A-Za-z0-9-]+$/.test(config.appId || "")) fail("Capacitor appId must be a reverse-DNS bundle identifier.");
  if (config.appId !== profile.bundleIdentifier) fail("Capacitor appId and release profile bundleIdentifier must match.");
  if (config.webDir !== "dist") fail("Capacitor webDir must remain dist for the Vite production build.");
  if (profile.capacitorVersion !== CAPACITOR_VERSION) fail(`Release profile must pin Capacitor ${CAPACITOR_VERSION}.`);
  if (profile.nativePackageManager !== "Swift Package Manager") fail("Capacitor 8 iOS releases must use Swift Package Manager unless a reviewed exception is documented.");
  if (requireBuild && !existsSync("dist/index.html")) fail("Missing dist/index.html. Run npm run build before native sync.");
  if (requireIos) {
    for (const path of ["ios/App/App.xcodeproj/project.pbxproj", "ios/App/App/capacitor.config.json"]) {
      if (!existsSync(path)) fail(`Generated iOS workspace is incomplete: ${path}`);
    }
  }

  console.log(`[ShotLab native] Configuration verified for ${config.appId}.`);
}

function installToolchain() {
  const major = Number(process.versions.node.split(".")[0]);
  if (!Number.isFinite(major) || major < 22) fail("Node.js 22 or newer is required for the pinned native toolchain.");
  run(npmCommand, [
    "install",
    "--no-save",
    "--package-lock=false",
    "--fund=false",
    "--audit=false",
    ...CAPACITOR_PACKAGES,
  ]);
}

function buildWeb() {
  run(npmCommand, ["run", "build"]);
  verifyConfig({ requireBuild: true });
}

function cap(args) {
  run(npxCommand, ["--no-install", "cap", ...args]);
}

if (command === "install") {
  verifyConfig();
  installToolchain();
  process.exit(0);
}

if (command === "prepare") {
  verifyConfig();
  installToolchain();
  buildWeb();
  if (existsSync("ios/App/App.xcodeproj/project.pbxproj")) cap(["sync", "ios"]);
  else cap(["add", "ios"]);
  verifyConfig({ requireBuild: true, requireIos: true });
  process.exit(0);
}

if (command === "sync") {
  verifyConfig();
  installToolchain();
  buildWeb();
  if (!existsSync("ios/App/App.xcodeproj/project.pbxproj")) fail("The iOS project has not been generated. Run npm run native:prepare:ios first.");
  cap(["sync", "ios"]);
  verifyConfig({ requireBuild: true, requireIos: true });
  process.exit(0);
}

if (command === "open") {
  if (process.platform !== "darwin") fail("Opening Xcode requires macOS.");
  installToolchain();
  verifyConfig({ requireIos: true });
  cap(["open", "ios"]);
  process.exit(0);
}

if (command === "verify") {
  verifyConfig({
    requireBuild: process.argv.includes("--require-build"),
    requireIos: process.argv.includes("--require-ios"),
  });
  process.exit(0);
}

fail(`Unknown command '${command}'. Use install, prepare, sync, verify, or open.`);
