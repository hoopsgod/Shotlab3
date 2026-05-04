import { callRpc, selectRows } from "../../../_utils/supabase.js";
import { enforceRateLimit, getClientKey, requireApiToken } from "../../../_utils/security.js";

const normalizeEmail = (v) => String(v || "").trim().toLowerCase();

export async function onRequestPost({ request, env }) {
  const auth = requireApiToken(request, env);
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status });

  const body = await request.json().catch(() => ({}));
  const email = normalizeEmail(body?.email || body?.requester_email);
  const rate = enforceRateLimit({ key: `teams_restore_context:${getClientKey(request, email)}`, max: 20, windowMs: 60_000 });
  if (!rate.allowed) return Response.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  if (!email) return Response.json({ error: "invalid_request" }, { status: 400 });

  const membershipRows = await selectRows(
    env,
    "team_memberships",
    `select=team_id,user_id,role,status&user_id=eq.${encodeURIComponent(email)}&status=eq.active&limit=1`,
  ).catch(() => []);

  const membership = Array.isArray(membershipRows) ? membershipRows[0] : null;
  const teamId = String(body?.team_id || membership?.team_id || "").trim();
  if (!teamId) return Response.json({ error: "team_not_found" }, { status: 404 });

  const rows = await callRpc(env, "ensure_team_invite_code_for_legacy_restore", {
    p_team_id: teamId,
    p_requester_email: email,
  });

  const row = Array.isArray(rows) ? rows[0] : rows;
  const joinCode = String(row?.join_code || row?.ensure_team_invite_code_for_legacy_restore || row || "").trim();
  if (!joinCode) return Response.json({ error: "join_code_generation_failed" }, { status: 500 });

  return Response.json({ teamId, joinCode }, { status: 200 });
}
