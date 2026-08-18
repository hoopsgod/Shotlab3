import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const secondarySystemPath = path.join(root, "src/components/SecondaryPageSystem.jsx");
const playerCommitmentPath = path.join(root, "src/components/PlayerCommitmentCenter.jsx");
const appPath = path.join(root, "src/App.jsx");

const secondarySystem = readFileSync(secondarySystemPath, "utf8");
const playerCommitment = readFileSync(playerCommitmentPath, "utf8");
const appSource = readFileSync(appPath, "utf8");

for (const required of [
  'import TeamIdentityTitleStage from "./TeamIdentityTitleStage.jsx";',
  '<TeamIdentityTitleStage',
  'dataMobileStage="team-identity"',
]) {
  if (!secondarySystem.includes(required)) {
    throw new Error(`SecondaryPageSystem source-owned title contract missing: ${required}`);
  }
}

for (const required of [
  'import TeamIdentityTitleStage from "./TeamIdentityTitleStage.jsx";',
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

console.log("Verified source-owned secondary title architecture; no product composition mutation performed.");
