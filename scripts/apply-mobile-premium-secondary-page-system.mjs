import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const secondarySystemPath = path.join(root, "src/components/SecondaryPageSystem.jsx");
const playerCommitmentPath = path.join(root, "src/components/PlayerCommitmentCenter.jsx");
const appPath = path.join(root, "src/App.jsx");

const secondarySystem = readFileSync(secondarySystemPath, "utf8");
const playerCommitment = readFileSync(playerCommitmentPath, "utf8");
const appSource = readFileSync(appPath, "utf8");

const hasCanonicalTitleImport = (source) =>
  /import\s+TeamIdentityTitleStage(?:\s*,\s*\{[\s\S]*?\})?\s+from\s+["']\.\/TeamIdentityTitleStage\.jsx["']\s*;?/.test(source);

for (const [source, label] of [
  [secondarySystem, "SecondaryPageSystem"],
  [playerCommitment, "Player commitment"],
]) {
  if (!hasCanonicalTitleImport(source)) {
    throw new Error(`${label} source-owned title contract missing canonical TeamIdentityTitleStage import.`);
  }
}

for (const required of [
  '<TeamIdentityTitleStage',
  'variant="editorial"',
  'dataMobileStage="editorial"',
  'brandTreatment={brandTreatment}',
  'BRAND_TREATMENT_BY_ICON',
  'training:"signature"',
  'calendar:"compact"',
  'strength:"watermark"',
  'trophy:"none"',
  'team:"signature"',
]) {
  if (!secondarySystem.includes(required)) {
    throw new Error(`SecondaryPageSystem semantic brand hierarchy contract missing: ${required}`);
  }
}

for (const required of [
  '<TeamIdentityTitleStage',
  'testId={`player-commitment-route-header-${mode}`}',
  'dataMobileStage="team-identity"',
]) {
  if (!playerCommitment.includes(required)) {
    throw new Error(`Player commitment source-owned title contract missing: ${required}`);
  }
}

if (/className=\{styles\.routeHeader\}/.test(playerCommitment)) {
  throw new Error("Legacy Player commitment route header still competes with TeamIdentityTitleStage.");
}

for (const obsolete of [
  'title="Drills Dashboard"',
  'title="Strength & Conditioning Dashboard"',
  'title="Activity Dashboard"',
  'title="Leaderboards Dashboard"',
]) {
  if (appSource.includes(obsolete)) {
    throw new Error(`Legacy Coach page-purpose title remains in source: ${obsolete}`);
  }
}

console.log("Verified source-owned secondary title architecture and semantic team-brand hierarchy; no product composition mutation performed.");
