import test from "node:test";
import assert from "node:assert/strict";
import { onRequestPost as registerPost } from "../functions/v1/legacy-auth/register/index.js";

const ENV = {
  SUPABASE_URL: "https://project.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-test-key",
};

test("legacy registration creates the profile and an HttpOnly session in one flow", async () => {
  const originalFetch = globalThis.fetch;
  let insertedProfile = null;
  let insertedSession = null;
  globalThis.fetch = async (url, options = {}) => {
    const target = String(url);
    if (target.includes("/rest/v1/legacy_auth_profiles") && options.method === "GET") {
      return new Response(JSON.stringify([]), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    if (target.includes("/rest/v1/legacy_auth_profiles") && options.method === "POST") {
      insertedProfile = JSON.parse(options.body)[0];
      return new Response(JSON.stringify([insertedProfile]), { status: 201, headers: { "Content-Type": "application/json" } });
    }
    if (target.includes("/rest/v1/legacy_auth_sessions") && options.method === "POST") {
      insertedSession = JSON.parse(options.body)[0];
      return new Response(JSON.stringify([insertedSession]), { status: 201, headers: { "Content-Type": "application/json" } });
    }
    throw new Error(`Unexpected fetch: ${target}`);
  };

  try {
    const response = await registerPost({
      env: ENV,
      request: new Request("https://shotlab3.pages.dev/v1/legacy-auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "newcoach@example.com",
          password: "strong-password",
          name: "New Coach",
          role: "coach",
        }),
      }),
    });

    assert.equal(response.status, 200);
    const payload = await response.json();
    const cookie = response.headers.get("set-cookie");
    assert.equal(insertedProfile.email, "newcoach@example.com");
    assert.equal(insertedSession.user_email, "newcoach@example.com");
    assert.equal(insertedSession.user_role, "coach");
    assert.equal(insertedSession.token_hash.length, 64);
    assert.match(cookie, /^sl_legacy_session=/);
    assert.match(cookie, /HttpOnly/);
    assert.match(cookie, /SameSite=Lax/);
    assert.match(cookie, /Secure/);
    assert.equal(payload.profile.email, "newcoach@example.com");
    assert.equal(payload.session.authenticated, true);
    assert.equal(Object.prototype.hasOwnProperty.call(payload, "token"), false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
