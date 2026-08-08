import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const commandCenter = readFileSync("src/components/CoachCommandCenter.jsx", "utf8");
const phase5DailyBriefApplied = commandCenter.includes('aria-label="Coach daily brief"')
  && commandCenter.includes('label: "Review RSVPs"')
  && !/\bteamPanel\b/.test(commandCenter);

if (phase5DailyBriefApplied) {
  console.log("Phase 5A daily intelligence already applied; legacy finish-v9 enhancer is already represented and will not be replayed.");
  process.exit(0);
}

const result = spawnSync(process.execPath, ["scripts/finish-v9-route-enhancers.mjs"], {
  stdio: "inherit",
  env: process.env,
});

if (result.error) throw result.error;
process.exit(result.status ?? 1);
