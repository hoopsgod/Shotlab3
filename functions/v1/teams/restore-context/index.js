import { callRpc, selectRows, upsertRows } from '../../../_utils/supabase.js';
import { enforceRateLimit, getClientKey, requireApiToken } from '../../../_utils/security.js';

const normalize = (v) => String(v || '').trim();
const normalizeEmail = (v) => normalize(v).toLowerCase();

async function resolveUserUuid(env, email) {
  const primary = await callRpc(env, 'resolve_app_user_uuid', { p_identifier: email }).catch(() => null);
  const value = String((Array.isArray(primary) ? primary[0] : primary) || '').trim();
  if (value) return value;
  const fallback = await callRpc(env, 'resolve_app_user_uuid', { p_identity: email }).catch(() => null);
  return String((Array.isArray(fallback) ? fallback[0] : fallback) || '').trim();
}

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
    const resolvedUuid = await resolveUserUuid(env, email);
    if (resolvedUuid) {
      const byUuid = await selectRows(env, 'team_memberships', `select=id&team_id=eq.${encodeURIComponent(teamId)}&status=eq.active&user_id=eq.${encodeURIComponent(resolvedUuid)}&limit=1`).catch(() => []);
      membershipMatch = Array.isArray(byUuid) && byUuid.length > 0;
    }
  }

  if (!profileTeamMatch && !membershipMatch) return Response.json({ error: 'forbidden' }, { status: 403 });

  let teamRows = await selectRows(env, 'teams', `select=id,name&id=eq.${encodeURIComponent(teamId)}&limit=1`).catch(() => []);
  if ((!Array.isArray(teamRows) || !teamRows[0]) && profileCoachMatch) {
    const teamCols = await selectRows(
      env,
      'information_schema.columns',
      `select=column_name,data_type,is_nullable&table_schema=eq.public&table_name=eq.teams&column_name=eq.coach_user_id&limit=1`,
    ).catch(() => []);
    const coachCol = Array.isArray(teamCols) ? teamCols[0] : null;
    const insertRow = { id: teamId, name: normalize(profile?.name) || 'Team' };

    if (coachCol?.column_name === 'coach_user_id') {
      const coachNullable = String(coachCol.is_nullable || 'YES').toUpperCase() !== 'NO';
      const coachType = String(coachCol.data_type || '').toLowerCase();
      if (coachType === 'uuid') {
        const coachUuid = await resolveUserUuid(env, email);
        if (!coachUuid && !coachNullable) {
          return Response.json({ error: 'TEAM_REPAIR_COACH_USER_REQUIRED' }, { status: 409 });
        }
        insertRow.coach_user_id = coachUuid || null;
      } else if (!coachNullable) {
        insertRow.coach_user_id = email;
      } else {
        insertRow.coach_user_id = null;
      }
    }

    await upsertRows(env, 'teams', insertRow, 'id').catch(() => null);
    teamRows = await selectRows(env, 'teams', `select=id,name&id=eq.${encodeURIComponent(teamId)}&limit=1`).catch(() => []);
  }

  const team = Array.isArray(teamRows) ? teamRows[0] : null;
  if (!team) return Response.json({ error: 'team_not_found' }, { status: 404 });

  const rpcRows = await callRpc(env, 'ensure_team_invite_code_for_legacy_restore', { p_team_id: teamId, p_requester_email: email });
  const inviteCode = String((Array.isArray(rpcRows) ? rpcRows[0]?.invite_code : '') || '').trim();
  if (!inviteCode) return Response.json({ error: 'invite_unavailable' }, { status: 409 });

  return Response.json({ ok: true, team: { id: String(team.id), name: String(team.name || 'Team'), joinCode: inviteCode } });
}
