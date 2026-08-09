import { readFileSync } from "node:fs";

const fail = (message) => { throw new Error(`[phase4f-browser-contracts] ${message}`); };
const app = readFileSync("src/App.jsx", "utf8");

for (const marker of [
  'testId="coach-administration-workspace"',
  'id="coach-roster-operations"',
  'onOpenArchives={()=>setTab("settings")}',
]) {
  if (!app.includes(marker)) fail(`Coach information architecture is missing ${marker}`);
}

const browserContracts = [
  "tests/e2e/coach-player-invitation.spec.mjs",
  "tests/e2e/coach-player-assignment-delivery.spec.mjs",
  "tests/e2e/coach-player-cross-device-first-result.spec.mjs",
];

for (const path of browserContracts) {
  const source = readFileSync(path, "utf8");
  if (/coach-player-(?:account-activation|roster-management|season-tools)/.test(source)) {
    fail(`${path} still targets a retired Coach Players disclosure`);
  }
}

const invitation = readFileSync(browserContracts[0], "utf8");
if (!invitation.includes('getByTestId("coach-player-invite-form")')) fail("Coach invitation flow no longer targets the visible invite form");

const assignment = readFileSync(browserContracts[1], "utf8");
if (!assignment.includes('locator("#coach-roster-operations")')) fail("Coach assignment flow no longer targets the roster workspace");

const crossDevice = readFileSync(browserContracts[2], "utf8");
for (const marker of ['requestUrl.includes("/rest/v1/events")', 'commonSeed["sl:events"]', 'name: "Respond now"', 'name: /RSVP NOW/']) {
  if (!crossDevice.includes(marker)) fail(`cross-device contract is missing ${marker}`);
}

console.log("Verified Phase 4F browser contracts against the current Coach information architecture.");
