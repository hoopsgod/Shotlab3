import test from "node:test";
import assert from "node:assert/strict";
import { onRequestPost } from "../functions/v1/teams/restore-context/index.js";

const ENV = { SUPABASE_URL: "https://example.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "service-role-key", INTERNAL_API_TOKEN: "token" };
const makeContext = (body) => ({ request: new Request("https://shotlab.test/v1/teams/restore-context", { method: "POST", headers: { "Content-Type": "application/json", "x-internal-api-token": "token" }, body: JSON.stringify(body) }), env: ENV });

test("restore-context uses resolve_app_user_uuid with p_identifier", async () => {
  const calls = [];
  const original = global.fetch;
  global.fetch = async (url, init) => {
    const u = String(url); const b = init?.body ? JSON.parse(init.body) : null; calls.push({ u, b });
    if (u.endsWith("/rpc/resolve_app_user_uuid")) return new Response(JSON.stringify("uuid-1"), { status: 200 });
    if (u.includes("/rest/v1/legacy_auth_profiles")) return new Response(JSON.stringify([{ email: "coach@test.com", team_id: "team_1", role: "coach", name: "Coach" }]), { status: 200 });
    if (u.includes("/rest/v1/team_memberships")) return new Response(JSON.stringify([]), { status: 200 });
    if (u.includes("/rest/v1/teams?select=")) return new Response(JSON.stringify([{ id: "team_1", name: "T", coach_user_id: "uuid-1" }]), { status: 200 });
    if (u.endsWith("/rpc/ensure_team_invite_code_for_legacy_restore")) return new Response(JSON.stringify([{ team_id: "team_1", team_name: "T", join_code: "ABCDEFGH" }]), { status: 200 });
    throw new Error(`unexpected ${u}`);
  };
  try {
    const res = await onRequestPost(makeContext({ email: "coach@test.com", team_id: "team_1" }));
    assert.equal(res.status, 200);
    const resolveCall = calls.find((c) => c.u.endsWith("/rpc/resolve_app_user_uuid"));
    assert.equal(resolveCall.b.p_identifier, "coach@test.com");
  } finally { global.fetch = original; }
});

test("restore-context rejects unauthorized email + team_id", async () => {
  const original = global.fetch;
  global.fetch = async (url) => {
    const u = String(url);
    if (u.endsWith("/rpc/resolve_app_user_uuid")) return new Response(JSON.stringify(""), { status: 200 });
    if (u.includes("/rest/v1/legacy_auth_profiles")) return new Response(JSON.stringify([]), { status: 200 });
    if (u.includes("/rest/v1/team_memberships")) return new Response(JSON.stringify([]), { status: 200 });
    throw new Error(`unexpected ${u}`);
  };
  try {
    const res = await onRequestPost(makeContext({ email: "nope@test.com", team_id: "team_1" }));
    assert.equal(res.status, 403);
  } finally { global.fetch = original; }
});
