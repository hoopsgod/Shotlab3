import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const projectPath = path.join(root, "ios/App/App.xcodeproj/project.pbxproj");
const infoPlistPath = path.join(root, "ios/App/App/Info.plist");
const privacyManifestPath = path.join(root, "ios/App/App/PrivacyInfo.xcprivacy");
const capacitorConfigPath = path.join(root, "ios/App/App/capacitor.config.json");

const PRIVACY_FILE_REF = "A11F5A002E0A000100000001";
const PRIVACY_BUILD_FILE = "A11F5A002E0A000100000002";

function fail(message) {
  throw new Error(`[ios-privacy-readiness] ${message}`);
}

function requireFile(filePath) {
  if (!fs.existsSync(filePath)) fail(`Missing required file: ${path.relative(root, filePath)}`);
}

function insertOnce(source, anchor, insertion, label) {
  if (!source.includes(anchor)) fail(`Could not find ${label} anchor.`);
  return source.replace(anchor, `${anchor}${insertion}`);
}

function configureProject() {
  requireFile(projectPath);
  let project = fs.readFileSync(projectPath, "utf8");

  if (!project.includes(`${PRIVACY_BUILD_FILE} /* PrivacyInfo.xcprivacy in Resources */`)) {
    project = insertOnce(
      project,
      "/* Begin PBXBuildFile section */\n",
      `\t\t${PRIVACY_BUILD_FILE} /* PrivacyInfo.xcprivacy in Resources */ = {isa = PBXBuildFile; fileRef = ${PRIVACY_FILE_REF} /* PrivacyInfo.xcprivacy */; };\n`,
      "PBXBuildFile",
    );
  }

  if (!project.includes(`${PRIVACY_FILE_REF} /* PrivacyInfo.xcprivacy */ =`)) {
    project = insertOnce(
      project,
      "/* Begin PBXFileReference section */\n",
      `\t\t${PRIVACY_FILE_REF} /* PrivacyInfo.xcprivacy */ = {isa = PBXFileReference; lastKnownFileType = text.plist.xml; path = PrivacyInfo.xcprivacy; sourceTree = \"<group>\"; };\n`,
      "PBXFileReference",
    );
  }

  if (!project.includes(`\t\t\t\t${PRIVACY_FILE_REF} /* PrivacyInfo.xcprivacy */,`)) {
    const anchor = "\t\t\t\t504EC3131FED79650016851F /* Info.plist */,\n";
    if (!project.includes(anchor)) fail("Could not locate the App group Info.plist entry.");
    project = project.replace(anchor, `\t\t\t\t${PRIVACY_FILE_REF} /* PrivacyInfo.xcprivacy */,\n${anchor}`);
  }

  if (!project.includes(`\t\t\t\t${PRIVACY_BUILD_FILE} /* PrivacyInfo.xcprivacy in Resources */,`)) {
    const anchor = "\t\t\tfiles = (\n";
    const resourcesStart = project.indexOf("/* Begin PBXResourcesBuildPhase section */");
    const resourcesEnd = project.indexOf("/* End PBXResourcesBuildPhase section */");
    if (resourcesStart < 0 || resourcesEnd < 0) fail("Could not locate PBXResourcesBuildPhase.");
    const block = project.slice(resourcesStart, resourcesEnd);
    if (!block.includes(anchor)) fail("Could not locate the Resources files list.");
    const nextBlock = block.replace(anchor, `${anchor}\t\t\t\t${PRIVACY_BUILD_FILE} /* PrivacyInfo.xcprivacy in Resources */,\n`);
    project = `${project.slice(0, resourcesStart)}${nextBlock}${project.slice(resourcesEnd)}`;
  }

  fs.writeFileSync(projectPath, project);
}

function configureInfoPlist() {
  requireFile(infoPlistPath);
  let plist = fs.readFileSync(infoPlistPath, "utf8");
  if (!plist.includes("<key>NSAppTransportSecurity</key>")) {
    const anchor = "\t<key>ITSAppUsesNonExemptEncryption</key>\n";
    if (!plist.includes(anchor)) fail("Could not locate the Info.plist encryption declaration.");
    const ats = [
      "\t<key>NSAppTransportSecurity</key>",
      "\t<dict>",
      "\t\t<key>NSAllowsArbitraryLoads</key>",
      "\t\t<false/>",
      "\t\t<key>NSAllowsArbitraryLoadsInWebContent</key>",
      "\t\t<false/>",
      "\t\t<key>NSAllowsLocalNetworking</key>",
      "\t\t<false/>",
      "\t</dict>",
      "",
    ].join("\n");
    plist = plist.replace(anchor, `${ats}${anchor}`);
  }
  fs.writeFileSync(infoPlistPath, plist);
}

function verifyCapacitorContainment() {
  requireFile(capacitorConfigPath);
  const config = JSON.parse(fs.readFileSync(capacitorConfigPath, "utf8"));
  if (config?.server?.url) fail("A remote server.url is not allowed in the native release build.");
  if (Array.isArray(config?.server?.allowNavigation) && config.server.allowNavigation.length) {
    fail("server.allowNavigation must remain empty for the native release build.");
  }
  if (config?.server?.iosScheme !== "https") fail("The native iOS scheme must remain https.");
}

function verifyManifestBasics() {
  requireFile(privacyManifestPath);
  const manifest = fs.readFileSync(privacyManifestPath, "utf8");
  const required = [
    "NSPrivacyTracking",
    "NSPrivacyCollectedDataTypes",
    "NSPrivacyAccessedAPITypes",
    "NSPrivacyCollectedDataTypeFitness",
    "NSPrivacyCollectedDataTypeEmailAddress",
    "NSPrivacyCollectedDataTypeUserID",
  ];
  required.forEach((token) => {
    if (!manifest.includes(token)) fail(`Privacy manifest is missing ${token}.`);
  });
  if (!manifest.includes("<key>NSPrivacyTracking</key>\n\t<false/>")) {
    fail("Privacy tracking must be explicitly disabled.");
  }
}

configureProject();
configureInfoPlist();
verifyCapacitorContainment();
verifyManifestBasics();

console.log("[ios-privacy-readiness] Xcode target, ATS, navigation containment, and privacy manifest are configured.");
