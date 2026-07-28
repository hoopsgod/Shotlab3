import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const profile = JSON.parse(fs.readFileSync("native/app-store-public-urls.json", "utf8"));
const redirects = fs.readFileSync("public/_redirects", "utf8");
const headers = fs.readFileSync("public/_headers", "utf8");
const appSource = fs.readFileSync("src/App.jsx", "utf8");
const browserSpec = fs.readFileSync("tests/e2e/public-submission-routes.spec.mjs", "utf8");

test("candidate App Store URLs are HTTPS, production-scoped, and not falsely verified", () => {
  assert.equal(profile.productionOrigin, "https://shotlab3.pages.dev");
  assert.equal(profile.status, "deployment_contract_ready_live_verification_pending");
  assert.ok(profile.routes.length >= 5);
  for (const route of profile.routes) {
    const url = new URL(route.candidateUrl);
    assert.equal(url.protocol, "https:");
    assert.equal(url.origin, profile.productionOrigin);
    assert.equal(url.pathname, route.path);
    assert.equal(route.sourceImplemented, true);
    assert.equal(route.directRouteTestedLocally, true);
    assert.equal(route.liveHttpsVerified, false);
    assert.match(appSource, new RegExp(route.path.replaceAll("/", "\\/")));
  }
});

test("Cloudflare Pages fallback preserves direct client-side routes", () => {
  assert.equal(redirects.trim(), "/* /index.html 200");
  assert.doesNotMatch(redirects, /https?:\/\//i);
});

test("public route headers fail closed without blocking normal HTTPS assets", () => {
  assert.match(headers, /X-Content-Type-Options:\s*nosniff/i);
  assert.match(headers, /Referrer-Policy:\s*strict-origin-when-cross-origin/i);
  assert.match(headers, /X-Frame-Options:\s*DENY/i);
  assert.match(headers, /Permissions-Policy:.*camera=\(\).*microphone=\(\).*geolocation=\(\)/i);
  assert.match(headers, /Cross-Origin-Opener-Policy:\s*same-origin/i);
  assert.match(headers, /\/assets\/\*/);
  assert.match(headers, /immutable/i);
  assert.doesNotMatch(headers, /Access-Control-Allow-Origin:\s*\*/i);
});

test("browser coverage opens every candidate route directly without login", () => {
  for (const route of profile.routes) {
    assert.match(browserSpec, new RegExp(route.path.replaceAll("/", "\\/")));
    assert.match(browserSpec, new RegExp(route.expectedHeading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(browserSpec, /mobile-navigation-dock/);
  assert.match(browserSpec, /Demo Player/);
});

test("support mailbox and metadata promotion remain owner-gated", () => {
  assert.equal(profile.supportMailbox.status, "owner_verification_pending");
  assert.equal(profile.supportMailbox.ownershipVerified, false);
  assert.equal(profile.supportMailbox.deliverabilityVerified, false);
  assert.match(profile.promotionRule, /Do not copy candidateUrl values into App Store Connect/i);
});
