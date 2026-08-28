import { readFileSync, writeFileSync } from "node:fs";

const path = "tests/e2e/performance-decomposition.spec.mjs";
const source = readFileSync(path, "utf8");
const lineEnding = source.includes("\r\n") ? "\r\n" : "\n";

const beforeProfile = `const playerProfileLoaded = (page) => routeChunkLoaded(
  page,
  ['PlayerProfileWorkspaces', 'ShotLabCharts', 'PlayerCareerHistory', 'PlayerCoachAssignmentCard'],
  ['DeferredShotLabCharts', 'DeferredPlayerCareerHistory'],
)`;

const afterProfile = `const playerProfileLoaded = (page) => routeChunkLoaded(
  page,
  ['PlayerProfileWorkspaces', 'ShotLabCharts', 'PlayerCareerHistory'],
  ['DeferredShotLabCharts', 'DeferredPlayerCareerHistory'],
)`;

let next = source;
const normalizedSource = source.replace(/\r\n/g, "\n");
if (!normalizedSource.includes(afterProfile)) {
  if (!normalizedSource.includes(beforeProfile)) throw new Error("Player profile resource contract was not found");
  next = normalizedSource.replace(beforeProfile, afterProfile).replace(/\n/g, lineEnding);
}

if (next !== source) writeFileSync(path, next);
