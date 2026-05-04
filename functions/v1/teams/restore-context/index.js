import { callRpc, selectRows } from "../../../_utils/supabase.js";
import { enforceRateLimit, getClientKey, requireApiToken } from "../../../_utils/security.js";

const normalizeEmail = (v) => String(v || "").trim().toLowerCase();
const safe = (v) => String(v || "").trim();

async function resolveUserUuid(env, email) {
  try {
    const rows = await callRpc(env, "resolve_app_user_uuid", { p_identifier: email });
    if (typeof rows === "string") return safe(rows);
    if (Array.isArray(rows)) return safe(rows[0]?.resolve_app_user_uuid || rows[0]?.resolved_user_uuid || rows[0]?.user_id || rows[0]);
    if (rows && typeof rows === "object") return safe(rows.resolve_app_user_uuid || rows.resolved_user_uuid || rows.user_id);
    return safe(rows);
  } catch {
    return "";
  }
}

export async function onRequestPost({ request, env }) {
  const auth = requireApiToken(request, env);
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status });

  const body = await request.json().catch(() => ({}));
  const email = normalizeEmail(body?.email || body?.requester_email);
  const requestedTeamId = safe(body?.team_id);
  const rate = enforceRateLimit({ key: `teams_restore_context:${getClientKey(request, email)}`, max: 20, windowMs: 60_000 });
  if (!rate.allowed) return Response.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  if (!email) return Response.json({ error: "invalid_request" }, { status: 400 });

  const profileRows = await selectRows(
    env,
    "legacy_auth_profiles",
    `select=email,role,team_id&email=eq.${encodeURIComponent(email)}&limit=1`,
  ).catch(() => []);
  const profile = Array.isArray(profileRows) ? profileRows[0] : null;
  const resolvedUuid = await resolveUserUuid(env, email);

  const membershipClauses = [
    `and=(status.eq.active,team_id.eq.${encodeURIComponent(requestedTeamId || safe(profile?.team_id))})`,
  ];
  const userOr = [
    `user_id.eq.${encodeURIComponent(email)}`,
    resolvedUuid ? `user_id.eq.${encodeURIComponent(resolvedUuid)}` : "",
  ].filter(Boolean).join(",");

  const membershipRows = userOr
    ? await selectRows(env, "team_memberships", `select=team_id,user_id,role,status&or=(${userOr})&${membershipClauses[0]}&limit=1`).catch(() => [])
    : [];
  const membership = Array.isArray(membershipRows) ? membershipRows[0] : null;

  const coachAuthorizedTeamId = profile?.role === "coach" && safe(profile?.team_id) ? safe(profile.team_id) : "";
  const membershipAuthorizedTeamId = safe(membership?.team_id);

  const teamId = requestedTeamId || coachAuthorizedTeamId || membershipAuthorizedTeamId;
  if (!teamId) return Response.json({ error: "team_not_found" }, { status: 404 });

  const authorizedByCoach = profile?.role === "coach" && coachAuthorizedTeamId === teamId;
  const authorizedByMembership = membershipAuthorizedTeamId === teamId;
  if (!authorizedByCoach && !authorizedByMembership) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const inviteRows = await callRpc(env, "ensure_team_invite_code_for_legacy_restore", {
    p_team_id: teamId,
    p_requester_email: email,
  });
  const inviteRow = Array.isArray(inviteRows) ? inviteRows[0] : inviteRows;
  const joinCode = safe(inviteRow?.join_code || inviteRow?.ensure_team_invite_code_for_legacy_restore || inviteRow);
  if (!joinCode) return Response.json({ error: "join_code_generation_failed" }, { status: 500 });

  const teamRows = await selectRows(env, "teams", `select=id,name&id=eq.${encodeURIComponent(teamId)}&limit=1`).catch(() => []);
  const team = Array.isArray(teamRows) ? teamRows[0] : null;

  return Response.json({ ok: true, team: { id: teamId, name: safe(team?.name) || "Team", joinCode } }, { status: 200 });
}
