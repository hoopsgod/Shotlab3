import { readFileSync, writeFileSync } from "node:fs";

const path = "tests/e2e/performance-decomposition.spec.mjs";
const source = readFileSync(path, "utf8");

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
if (!next.includes(afterProfile)) {
  if (!next.includes(beforeProfile)) throw new Error("Player profile resource contract was not found");
  next = next.replace(beforeProfile, afterProfile);
}

if (next !== source) writeFileSync(path, next);
