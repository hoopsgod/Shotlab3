import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  AFFILIATE_DISCLOSURE,
  TEAM_STORE_PROVIDERS,
  appendTeamStoreClick,
  buildTeamStoreClick,
  getStoreVisitMetrics,
  getTeamStoreForTeam,
  upsertTeamStore,
  validateTeamStoreInput,
} from "../src/lib/teamStore.js";

const portalSource = fs.readFileSync(new URL("../src/components/TeamStorePortal.jsx", import.meta.url), "utf8");
const indexSource = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");

test("team store model stays provider-neutral and requires secure URLs", () => {
  assert.deepEqual(TEAM_STORE_PROVIDERS.map((item) => item.key), ["squadlocker", "bsn", "other"]);
  assert.equal(validateTeamStoreInput({ teamId: "t1", storeName: "Store", storeUrl: "http://example.com" }).ok, false);
  const result = validateTeamStoreInput({ teamId: "t1", provider: "squadlocker", storeName: "Store", storeUrl: "https://example.com/shop" });
  assert.equal(result.ok, true);
  assert.equal(result.store.storeUrl, "https://example.com/shop");
});

test("one active team store is upserted per team", () => {
  const first = upsertTeamStore([], { teamId: "team-1", provider: "squadlocker", storeName: "First", storeUrl: "https://example.com/first" });
  const second = upsertTeamStore(first, { teamId: "team-1", provider: "bsn", storeName: "Updated", storeUrl: "https://example.com/updated" });
  assert.equal(second.length, 1);
  assert.equal(getTeamStoreForTeam(second, "team-1")?.storeName, "Updated");
});

test("click analytics are team scoped and contain no shopper identity", () => {
  const store = upsertTeamStore([], { teamId: "team-1", provider: "other", storeName: "Store", storeUrl: "https://example.com" })[0];
  const click = buildTeamStoreClick({ store, userRole: "player", source: "player_portal" });
  assert.equal("email" in click, false);
  assert.equal("name" in click, false);
  const rows = appendTeamStoreClick([], click);
  const metrics = getStoreVisitMetrics(rows, "team-1");
  assert.equal(metrics.total, 1);
  assert.equal(metrics.today, 1);
});

test("portal exposes coach setup and player shopping with clear affiliate disclosure", () => {
  assert.match(portalSource, /PUBLISH STORE/);
  assert.match(portalSource, /SHOP TEAM STORE/);
  assert.match(portalSource, /ShotLab does not process orders, payments, shipping, returns, or sales tax/);
  assert.match(portalSource, /required school or club approvals/);
  assert.match(portalSource, /AFFILIATE_DISCLOSURE/);
  assert.match(AFFILIATE_DISCLOSURE, /ShotLab may earn a commission/);
});

test("team store portal is mounted independently from the large App shell", () => {
  assert.match(indexSource, /id="team-store-root"/);
  assert.match(indexSource, /src="\/src\/teamStoreEntry\.jsx"/);
  assert.match(portalSource, /window\.open\(store\.storeUrl, "_blank", "noopener,noreferrer"\)/);
});
