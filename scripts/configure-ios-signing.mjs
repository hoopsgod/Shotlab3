import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const projectPath = path.join(repoRoot, "ios", "App", "App.xcodeproj", "project.pbxproj");
const teamId = String(process.env.SHOTLAB_DEVELOPMENT_TEAM || process.argv[2] || "").trim();
const bundleId = String(process.env.SHOTLAB_BUNDLE_ID || "com.shotlab.training").trim();

if (!/^[A-Z0-9]{10}$/.test(teamId)) {
  console.error("Provide a 10-character Apple Developer Team ID with SHOTLAB_DEVELOPMENT_TEAM or as the first argument.");
  process.exit(1);
}
if (!/^[A-Za-z0-9.-]+$/.test(bundleId) || !bundleId.includes(".")) {
  console.error("SHOTLAB_BUNDLE_ID must be a valid reverse-DNS identifier.");
  process.exit(1);
}
if (!fs.existsSync(projectPath)) {
  console.error("Missing committed iOS project. Run npm run native:prepare:ios first.");
  process.exit(1);
}

let source = fs.readFileSync(projectPath, "utf8");
source = source.replace(/PRODUCT_BUNDLE_IDENTIFIER = [^;]+;/g, `PRODUCT_BUNDLE_IDENTIFIER = ${bundleId};`);
if (/DEVELOPMENT_TEAM = [^;]*;/.test(source)) {
  source = source.replace(/DEVELOPMENT_TEAM = [^;]*;/g, `DEVELOPMENT_TEAM = ${teamId};`);
} else {
  source = source.replace(/CODE_SIGN_STYLE = Automatic;/g, `CODE_SIGN_STYLE = Automatic;\n\t\t\t\tDEVELOPMENT_TEAM = ${teamId};`);
}
fs.writeFileSync(projectPath, source);
console.log(`Configured automatic signing for ${bundleId} with Apple Team ${teamId}.`);
