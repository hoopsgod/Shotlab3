import test from "node:test";
import assert from "node:assert/strict";
import { onRequestPost as logoutPost } from "../functions/v1/legacy-auth/logout/index.js";

const ENV = {
  SUPABASE_URL: "https://project.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-test-key",
};

test("logout clears the cookie but reports failure when server revocation cannot persist", async () => {
  const originalFetch = globalThis.fetch;
  const originalError = console.error;
  console.error = () => {};
  globalThis.fetch = async () => new Response(JSON.stringify({ message: "database unavailable" }), {
    status: 503,
    headers: { "Content-Type": "application/json" },
  });

  try {
    const response = await logoutPost({
      env: ENV,
      request: new Request("https://shotlab3.pages.dev/v1/legacy-auth/logout", {
        method: "POST",
        headers: { Cookie: "sl_legacy_session=revocation-failure-token" },
      }),
    });
    const payload = await response.json();
    assert.equal(response.status, 503);
    assert.equal(payload.ok, false);
    assert.equal(payload.error, "session_revoke_failed");
    assert.match(response.headers.get("set-cookie"), /Max-Age=0/);
    assert.match(response.headers.get("set-cookie"), /HttpOnly/);
  } finally {
    globalThis.fetch = originalFetch;
    console.error = originalError;
  }
});
