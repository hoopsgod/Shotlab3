import test from "node:test";
import assert from "node:assert/strict";

import { onRequestPost } from "../functions/v1/coach-signup/bootstrap.js";

const ENV = {
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
};

function makeContext({ body = {}, headers = {}, env = ENV } = {}) {
  return {
    request: new Request("https://shotlab.test/v1/coach-signup/bootstrap", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
    }),
    env,
  };
}

test("coach signup bootstrap accepts browser request without internal API token and calls shared RPC", async () => {
  const calls = [];
  const originalFetch = global.fetch;
  global.fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return new Response(
      JSON.stringify([{ team_id: "team-1", invite_id: "invite-1", invite_code: "ABCD1234", invite_expires_at: null }]),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };

  try {
    const res = await onRequestPost(
      makeContext({
        body: { team_name: "Titans" },
        headers: { "x-user-id": "coach@shotlab.app" },
        env: { ...ENV, INTERNAL_API_TOKEN: "configured-but-not-required-for-browser-flow" },
      }),
    );

    assert.equal(res.status, 201);
    const payload = await res.json();
    assert.equal(payload.team_id, "team-1");
    assert.equal(payload.invite_code, "ABCD1234");

    assert.equal(calls.length, 1);
    assert.match(calls[0].url, /\/rest\/v1\/rpc\/coach_signup_create_team_and_invite$/);
    const rpcBody = JSON.parse(calls[0].init.body);
    assert.equal(rpcBody.p_coach_user_id, "coach@shotlab.app");
    assert.equal(rpcBody.p_team_name, "Titans");
  } finally {
    global.fetch = originalFetch;
  }
});

test("coach signup bootstrap requires user identity header", async () => {
  const res = await onRequestPost(makeContext({ body: { team_name: "Titans" } }));
  assert.equal(res.status, 401);
  assert.deepEqual(await res.json(), { error: "unauthorized" });
});

test("coach signup bootstrap surfaces env configuration mismatch", async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY_MISSING");
  };

  try {
    const res = await onRequestPost(
      makeContext({ body: { team_name: "Titans" }, headers: { "x-user-id": "coach@shotlab.app" }, env: { SUPABASE_URL: "https://example.supabase.co" } }),
    );
    assert.equal(res.status, 500);
    assert.deepEqual(await res.json(), {
      error: "env_config_mismatch",
      diagnostic_code: "env_config_mismatch",
      diagnostic_message: null,
    });
  } finally {
    global.fetch = originalFetch;
  }
});

test("coach signup bootstrap maps missing rpc to missing_rpc diagnostic", async () => {
  const originalFetch = global.fetch;
  global.fetch = async () =>
    new Response(
      JSON.stringify({
        code: "PGRST202",
        message: "Could not find the function public.coach_signup_create_team_and_invite(...) in schema cache",
      }),
      { status: 404, headers: { "Content-Type": "application/json" } },
    );

  try {
    const res = await onRequestPost(
      makeContext({ body: { team_name: "Titans" }, headers: { "x-user-id": "coach@shotlab.app" } }),
    );
    assert.equal(res.status, 500);
    assert.deepEqual(await res.json(), {
      error: "missing_rpc",
      diagnostic_code: "missing_rpc",
      diagnostic_message: "coach_signup_create_team_and_invite is not available in Supabase.",
    });
  } finally {
    global.fetch = originalFetch;
  }
});

test("coach signup bootstrap maps invalid service key failures", async () => {
  const originalFetch = global.fetch;
  global.fetch = async () =>
    new Response(
      JSON.stringify({
        message: "Invalid API key",
      }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );

  try {
    const res = await onRequestPost(
      makeContext({ body: { team_name: "Titans" }, headers: { "x-user-id": "coach@shotlab.app" } }),
    );
    assert.equal(res.status, 500);
    assert.deepEqual(await res.json(), {
      error: "invalid_service_key",
      diagnostic_code: "invalid_service_key",
      diagnostic_message: "Supabase service role key is invalid for RPC access.",
    });
  } finally {
    global.fetch = originalFetch;
  }
});

test("coach signup bootstrap maps uuid/type mismatch to rpc_argument_mismatch", async () => {
  const originalFetch = global.fetch;
  global.fetch = async () =>
    new Response(
      JSON.stringify({
        code: "22P02",
        message: "invalid input syntax for type uuid: \"coach@shotlab.app\"",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );

  try {
    const res = await onRequestPost(
      makeContext({ body: { team_name: "Titans" }, headers: { "x-user-id": "coach@shotlab.app" } }),
    );
    assert.equal(res.status, 500);
    assert.deepEqual(await res.json(), {
      error: "rpc_argument_mismatch",
      diagnostic_code: "rpc_argument_mismatch",
      diagnostic_message: "RPC arguments do not match expected types (coach id must match backend type).",
    });
  } finally {
    global.fetch = originalFetch;
  }
});

test("coach signup bootstrap maps unresolved coach identity to coach_user_not_found", async () => {
  const originalFetch = global.fetch;
  global.fetch = async () =>
    new Response(
      JSON.stringify({
        message: "COACH_USER_NOT_FOUND",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );

  try {
    const res = await onRequestPost(
      makeContext({ body: { team_name: "Titans" }, headers: { "x-user-id": "coach@shotlab.app" } }),
    );
    assert.equal(res.status, 404);
    assert.deepEqual(await res.json(), {
      error: "coach_user_not_found",
      diagnostic_code: "coach_user_not_found",
      diagnostic_message: "Coach user could not be resolved to a backend UUID.",
    });
  } finally {
    global.fetch = originalFetch;
  }
});
