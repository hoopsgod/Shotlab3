import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const css = fs.readFileSync(new URL("../src/components/TeamStoreIndustrial.css", import.meta.url), "utf8");
const entry = fs.readFileSync(new URL("../src/teamStoreEntry.jsx", import.meta.url), "utf8");

test("Team Store loads the industrial design layer after the portal", () => {
  assert.match(entry, /TeamStorePortal\.jsx/);
  assert.match(entry, /TeamStoreIndustrial\.css/);
  assert.ok(entry.indexOf("TeamStorePortal.jsx") < entry.indexOf("TeamStoreIndustrial.css"));
});

test("Team Store uses the shared warm light product language", () => {
  assert.match(css, /--ts-canvas:\s*#f5f4ef/);
  assert.match(css, /--ts-surface:\s*#ffffff/);
  assert.match(css, /\.ts-panel[\s\S]*var\(--ts-canvas\)/);
  assert.match(css, /\.ts-header[\s\S]*rgba\(245, 244, 239/);
  assert.doesNotMatch(css, /linear-gradient\(155deg,\s*#171a20/);
});

test("coach setup and player storefront retain distinct premium surfaces", () => {
  assert.match(css, /\.ts-form-card/);
  assert.match(css, /\.ts-preview-panel/);
  assert.match(css, /\.ts-partner-start/);
  assert.match(css, /\.ts-player-intro/);
  assert.match(css, /\.ts-live-banner/);
});

test("Team Store preserves accessibility and mobile product behavior", () => {
  assert.match(css, /focus-visible/);
  assert.match(css, /min-height:\s*48px/);
  assert.match(css, /@media \(max-width:\s*720px\)/);
  assert.match(css, /safe-area-inset-bottom/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
});

test("industrial design layer contains no persistence, navigation, or referral writes", () => {
  assert.doesNotMatch(css, /localStorage|storageSet|window\.open|fetch\(|TEAM_STORE_/);
  assert.doesNotMatch(entry, /localStorage|storageSet|window\.open|fetch\(|TEAM_STORE_/);
});
