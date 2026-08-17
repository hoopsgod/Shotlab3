import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("../src/components/CompactLeaderboardPreviewCard.jsx", import.meta.url), "utf8");

test("coach leaderboard previews never fabricate open ranking slots", () => {
  assert.match(source, /const reservedRows = isCoachMode\s*\? previewRows\.length/);
  assert.match(source, /const openRowCount = isCoachMode\s*\? 0/);
  assert.match(source, /data-viewer-role=\{mode\}/);
});
