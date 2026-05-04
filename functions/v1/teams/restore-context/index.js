import { callRpc, selectRows, upsertRows } from '../../../_utils/supabase.js';
import { enforceRateLimit, getClientKey, requireApiToken } from '../../../_utils/security.js';

const normalize = (v) => String(v || '').trim();
const normalizeEmail = (v) => normalize(v).toLowerCase();

export async function onRequestPost({ request, env }) {
  const auth = requireApiToken(request, env);
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status });

  const body = await request.json().catch(() => ({}));
  const email = normalizeEmail(body?.email);
  const teamId = normalize(body?.team_id || body?.teamId);
  if (!email || !teamId) return Response.json({ error: 'invalid_request' }, { status: 400 });

  const rate = enforceRateLimit({ key: `restore_context:${getClientKey(request, `${email}:${teamId}`)}`, max: 20, windowMs: 60_000 });
  if (!rate.allowed) return Response.json({ error: 'rate_limited' }, { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } });

  const profiles = await selectRows(env, 'legacy_auth_profiles', `select=email,role,team_id,name&email=eq.${encodeURIComponent(email)}&limit=1`).catch(() => []);
  const profile = Array.isArray(profiles) ? profiles[0] : null;
  const profileTeamMatch = profile && normalize(profile.team_id) === teamId;
  const profileCoachMatch = profileTeamMatch && normalize(profile.role) === 'coach';

  let membershipMatch = false;
  const byEmail = await selectRows(env, 'team_memberships', `select=id&team_id=eq.${encodeURIComponent(teamId)}&status=eq.active&user_id=eq.${encodeURIComponent(email)}&limit=1`).catch(() => []);
  membershipMatch = Array.isArray(byEmail) && byEmail.length > 0;
  if (!membershipMatch) {
    const resolvedUuidRows = await callRpc(env, 'resolve_app_user_uuid', { p_identity: email }).catch(() => []);
    const resolvedUuid = String((Array.isArray(resolvedUuidRows) ? resolvedUuidRows[0] : resolvedUuidRows) || '').trim();
    if (resolvedUuid) {
      const byUuid = await selectRows(env, 'team_memberships', `select=id&team_id=eq.${encodeURIComponent(teamId)}&status=eq.active&user_id=eq.${encodeURIComponent(resolvedUuid)}&limit=1`).catch(() => []);
      membershipMatch = Array.isArray(byUuid) && byUuid.length > 0;
    }
  }

  if (!profileTeamMatch && !membershipMatch) return Response.json({ error: 'forbidden' }, { status: 403 });

  let teamRows = await selectRows(env, 'teams', `select=id,name&id=eq.${encodeURIComponent(teamId)}&limit=1`).catch(() => []);
  if ((!Array.isArray(teamRows) || !teamRows[0]) && profileCoachMatch) {
    await upsertRows(env, 'teams', { id: teamId, name: normalize(profile?.name) || 'Team' }, 'id').catch(() => null);
    teamRows = await selectRows(env, 'teams', `select=id,name&id=eq.${encodeURIComponent(teamId)}&limit=1`).catch(() => []);
  }

  const team = Array.isArray(teamRows) ? teamRows[0] : null;
  if (!team) return Response.json({ error: 'team_not_found' }, { status: 404 });

  const rpcRows = await callRpc(env, 'ensure_team_invite_code_for_legacy_restore', { p_team_id: teamId, p_requester_email: email });
  const inviteCode = String((Array.isArray(rpcRows) ? rpcRows[0]?.invite_code : '') || '').trim();
  if (!inviteCode) return Response.json({ error: 'invite_unavailable' }, { status: 409 });

  return Response.json({ ok: true, team: { id: String(team.id), name: String(team.name || 'Team'), joinCode: inviteCode } });
}
