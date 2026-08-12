import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const commandCenter = readFileSync("src/components/CoachCommandCenter.jsx", "utf8");
const phase5CoachIntelligenceApplied = commandCenter.includes("const unresolvedRsvps =")
  && commandCenter.includes('label: "Review RSVPs"')
  && commandCenter.includes('eyebrow: "Today at a glance"');

if (phase5CoachIntelligenceApplied) {
  console.log("Phase 5A Coach intelligence already applied; legacy finish-v9 enhancer is already represented and will not be replayed.");
  process.exit(0);
}

const result = spawnSync(process.execPath, ["scripts/finish-v9-route-enhancers.mjs"], {
  stdio: "inherit",
  env: process.env,
});

if (result.error) throw result.error;
process.exit(result.status ?? 1);
