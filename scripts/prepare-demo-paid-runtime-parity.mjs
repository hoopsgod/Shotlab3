import { readFileSync, writeFileSync } from "node:fs";

const path = "tests/e2e/demo-paid-runtime-parity.spec.mjs";
let source = readFileSync(path, "utf8");

const helperMarker = "async function closeImmersiveTeamStore(page)";
const helperAnchor = "async function captureFingerprint(page, role, kind, key) {";
const routeCapture = "    routes[key] = await captureFingerprint(page, role, kind, key);";
const lifecycleCapture = `${routeCapture}\n    if (key === \"team-store\") await closeImmersiveTeamStore(page);`;

if (!source.includes(helperMarker)) {
  const count = source.split(helperAnchor).length - 1;
  if (count !== 1) throw new Error(`Expected one runtime parity fingerprint anchor, found ${count}.`);
  const helper = `async function closeImmersiveTeamStore(page) {\n  const storeOpen = page.locator(\"html.team-store-portal-open\");\n  if (!(await storeOpen.count())) return;\n  await expect(page.getByTestId(\"mobile-navigation-dock\"), \"Team Store must exclusively own the mobile viewport while open\").not.toBeVisible();\n  await page.getByRole(\"button\", { name: /close team store/i }).click();\n  await expect(storeOpen, \"Team Store close must remove the immersive document state\").toHaveCount(0);\n  await expect(page.getByTestId(\"mobile-navigation-dock\"), \"Closing Team Store must restore mobile navigation\").toBeVisible();\n  await settle(page);\n}\n\n`;
  source = source.replace(helperAnchor, `${helper}${helperAnchor}`);
}

if (!source.includes(lifecycleCapture)) {
  const count = source.split(routeCapture).length - 1;
  if (count !== 1) throw new Error(`Expected one runtime parity route-capture anchor, found ${count}.`);
  source = source.replace(routeCapture, lifecycleCapture);
}

for (const required of [
  helperMarker,
  "Team Store must exclusively own the mobile viewport while open",
  "Closing Team Store must restore mobile navigation",
  'if (key === "team-store") await closeImmersiveTeamStore(page);',
]) {
  if (!source.includes(required)) throw new Error(`Runtime parity lifecycle preparation missing: ${required}`);
}

writeFileSync(path, source);
console.log("Prepared runtime parity harness to capture immersive Team Store and verify close/restoration before continuing navigation.");
