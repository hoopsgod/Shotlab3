import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  AFFILIATE_DISCLOSURE,
  TEAM_STORE_PROVIDERS,
  TEAM_STORE_REFERRALS_KEY,
  appendTeamStoreClick,
  buildSquadLockerCreationUrl,
  buildTeamStoreClick,
  buildTeamStoreReferralStart,
  getTeamStoreReferralStart,
  getStoreVisitMetrics,
  getTeamStoreForTeam,
  upsertTeamStoreReferralStart,
  upsertTeamStore,
  validateTeamStoreInput,
} from "../src/lib/teamStore.js";
import {
  TEAM_STORE_OPEN_EVENT,
  normalizeTeamStorePortalIdentity,
  openTeamStorePortal,
} from "../src/lib/teamStorePortalBridge.js";

const portalSource = fs.readFileSync(new URL("../src/components/TeamStorePortal.jsx", import.meta.url), "utf8");
const indexSource = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const appSource = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");

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

test("SquadLocker creation always starts through ShotLab attribution", () => {
  const url = new URL(buildSquadLockerCreationUrl());
  assert.equal(url.protocol, "https:");
  assert.equal(url.hostname, "www.squadlocker.com");
  assert.equal(url.pathname, "/partner/form");
  assert.equal(url.searchParams.get("utm_source"), "shotlab");
  assert.equal(url.searchParams.get("utm_medium"), "partner_referral");
  assert.equal(url.searchParams.get("utm_campaign"), "team_store_creation");
  assert.equal(url.searchParams.get("referral_partner_master"), "ShotLab");

  const configured = new URL(buildSquadLockerCreationUrl({
    baseUrl: "https://partner.example/shotlab?affiliate_id=abc123",
  }));
  assert.equal(configured.searchParams.get("affiliate_id"), "abc123");
  assert.equal(configured.searchParams.get("utm_source"), "shotlab");
  assert.equal(buildSquadLockerCreationUrl({ baseUrl: "http://example.com" }), "");
});

test("referral starts are team scoped and contain no coach identity", () => {
  assert.equal(TEAM_STORE_REFERRALS_KEY, "sl:team-store-referrals");
  const start = buildTeamStoreReferralStart({ teamId: "team-1" });
  assert.equal(start.teamId, "team-1");
  assert.equal(start.provider, "squadlocker");
  assert.equal(start.source, "shotlab_partner_link");
  assert.equal("email" in start, false);
  assert.equal("name" in start, false);

  const rows = upsertTeamStoreReferralStart([], start);
  assert.equal(getTeamStoreReferralStart(rows, "team-1")?.id, start.id);
  assert.equal(getTeamStoreReferralStart(rows, "team-2"), null);
});

test("portal exposes coach setup and player shopping with clear affiliate disclosure", () => {
  assert.match(portalSource, /PUBLISH STORE/);
  assert.match(portalSource, /SHOP TEAM STORE/);
  assert.match(portalSource, /Connect\. Preview\. Publish\./);
  assert.match(portalSource, /What players will see/);
  assert.match(portalSource, /Name players will see/);
  assert.match(portalSource, /Public store link/);
  assert.match(portalSource, /CREATE SQUADLOCKER STORE/);
  assert.match(portalSource, /partner link is built in/i);
  assert.match(portalSource, /STORE VISITS/);
  assert.match(portalSource, /Store link opens/);
  assert.match(portalSource, /ShotLab does not process orders, payments, shipping, returns, or sales tax/);
  assert.match(portalSource, /handles products, payments, shipping, returns, and support/);
  assert.match(portalSource, /required school or club approvals/);
  assert.match(portalSource, /AFFILIATE_DISCLOSURE/);
  assert.match(AFFILIATE_DISCLOSURE, /ShotLab may receive referral compensation/);
});

test("team store portal is mounted independently from the large App shell", () => {
  assert.match(indexSource, /id="team-store-root"/);
  assert.match(indexSource, /src="\/src\/teamStoreEntry\.jsx"/);
  assert.match(portalSource, /window\.open\(store\.storeUrl, "_blank", "noopener,noreferrer"\)/);
});

test("authenticated app navigation can open the portal with authoritative coach identity", () => {
  const events = [];
  class FakeCustomEvent {
    constructor(type, init) {
      this.type = type;
      this.detail = init.detail;
    }
  }
  const target = {
    CustomEvent: FakeCustomEvent,
    dispatchEvent(event) {
      events.push(event);
      return true;
    },
  };

  const identity = normalizeTeamStorePortalIdentity({
    email: " COACH@EXAMPLE.COM ",
    role: "coach",
    teamId: " team-1 ",
    teamName: " Varsity ",
  });

  assert.deepEqual(identity, {
    email: "coach@example.com",
    role: "coach",
    isCoach: true,
    teamId: "team-1",
    teamName: "Varsity",
  });
  assert.equal(openTeamStorePortal(identity, target), true);
  assert.equal(events.length, 1);
  assert.equal(events[0].type, TEAM_STORE_OPEN_EVENT);
  assert.deepEqual(events[0].detail, identity);
  assert.equal(normalizeTeamStorePortalIdentity({ email: "coach@example.com", role: "coach" }), null);
  assert.equal(openTeamStorePortal({ email: "coach@example.com", role: "coach" }, target), false);
  assert.equal(events.length, 1);
  assert.match(appSource, /getCoachNavItem\("team-store"/);
  assert.match(appSource, /if\(k==="team-store"\)/);
  assert.match(appSource, /openTeamStorePortal\(\{email:u\?\.email,role:"coach",isCoach:true/);
  assert.match(portalSource, /window\.addEventListener\(TEAM_STORE_OPEN_EVENT, handleNavigationOpen\)/);
});
