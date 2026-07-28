import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const listing = JSON.parse(fs.readFileSync("native/app-store-listing.json", "utf8"));
const handoff = fs.readFileSync("docs/app-store-presentation-package.md", "utf8");
const byteLength = (value) => Buffer.byteLength(String(value || ""), "utf8");

test("App Store listing copy respects current field limits", () => {
  assert.equal(listing.locale, "en-US");
  assert.equal(listing.platform, "ios");
  assert.ok(listing.name.length > 0 && listing.name.length <= 30);
  assert.ok(listing.subtitle.length > 0 && listing.subtitle.length <= 30);
  assert.ok(listing.promotionalText.length > 0 && listing.promotionalText.length <= 170);
  assert.ok(listing.description.length > 0 && listing.description.length <= 4000);
  assert.ok(byteLength(listing.keywords) > 0 && byteLength(listing.keywords) <= 100);
  assert.equal(listing.primaryCategory, "Sports");
});

test("listing copy describes only implemented Coach and Player capabilities", () => {
  const text = `${listing.promotionalText}\n${listing.description}`;
  for (const required of [
    "Daily Training Command Center",
    "at-home shots",
    "program drills",
    "events",
    "strength and conditioning",
    "leaderboards",
    "invite players",
    "archive seasons",
  ]) assert.match(text, new RegExp(required, "i"));
  assert.doesNotMatch(text, /AI coach|live video|medical advice|guaranteed improvement|automatic messaging/i);
});

test("owner-controlled listing fields remain explicitly unresolved", () => {
  assert.equal(listing.copyright, "pending_owner_legal_name");
  assert.equal(listing.pricing, "pending_owner_decision");
  assert.equal(listing.ageRating, "pending_app_store_questionnaire");
  assert.equal(listing.urls.privacyPolicy.publicUrl, "pending_owner_verified_url");
  assert.equal(listing.urls.terms.publicUrl, "pending_owner_verified_url");
  assert.equal(listing.urls.support.publicUrl, "pending_owner_verified_url");
  assert.equal(listing.review.coachAccount, "pending_owner_review_account");
  assert.equal(listing.review.playerAccount, "pending_owner_review_account");
  assert.doesNotMatch(JSON.stringify(listing.review), /demo1234|password\s*[:=]/i);
});

test("launch screenshot plan is complete, ordered, and dimensionally exact", () => {
  const screenshots = listing.screenshots;
  assert.equal(screenshots.display, "iPhone 6.9-inch");
  assert.equal(screenshots.width, 1290);
  assert.equal(screenshots.height, 2796);
  assert.equal(screenshots.format, "jpeg");
  assert.equal(screenshots.count, 6);
  assert.equal(screenshots.items.length, screenshots.count);
  assert.deepEqual(screenshots.items.map((item) => item.order), [1, 2, 3, 4, 5, 6]);
  assert.equal(new Set(screenshots.items.map((item) => item.file)).size, screenshots.count);
  assert.equal(screenshots.items.filter((item) => item.role === "player").length, 3);
  assert.equal(screenshots.items.filter((item) => item.role === "coach").length, 3);
  for (const item of screenshots.items) {
    assert.match(item.file, /^\d{2}-[a-z0-9-]+\.jpg$/);
    assert.ok(item.headline.length >= 18 && item.headline.length <= 44);
    assert.ok(item.subheadline.length >= 30 && item.subheadline.length <= 90);
  }
});

test("presentation handoff is honest about artifact and owner status", () => {
  assert.match(handoff, /does not claim that metadata has been entered/i);
  assert.match(handoff, /CI artifacts rather than committed binary files/i);
  assert.match(handoff, /1290 × 2796/);
  assert.match(handoff, /Public legal\/support URLs/i);
  assert.match(handoff, /App Review credentials remain owner-supplied/i);
});
