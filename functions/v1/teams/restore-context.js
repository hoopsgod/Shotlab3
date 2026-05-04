import { callRpc, selectRows, upsertRows } from '../../_utils/supabase.js';
import { enforceRateLimit, getClientKey, requireApiToken } from '../../_utils/security.js';

const normalizeEmail = (v) => String(v || '').trim().toLowerCase();

async function findLegacyProfile(env, email, teamId) {
  const rows = await selectRows(env, 'legacy_auth_profiles', `select=email,name,role,team_id&email=eq.${encodeURIComponent(email)}&team_id=eq.${encodeURIComponent(teamId)}&limit=1`).catch(() => []);
  return Array.isArray(rows) ? rows[0] || null : null;
}

async function hasMembershipAccess(env, email, teamId) {
  const normalized = normalizeEmail(email);
  const direct = await selectRows(env, 'team_memberships', `select=id&team_id=eq.${encodeURIComponent(teamId)}&status=eq.active&user_id=eq.${encodeURIComponent(normalized)}&limit=1`).catch(() => []);
  if (Array.isArray(direct) && direct.length) return true;
  const resolved = await callRpc(env, 'resolve_app_user_uuid', { p_identifier: normalized }).catch(() => null);
  const resolvedUuid = String((Array.isArray(resolved) ? resolved[0] : resolved)?.resolve_app_user_uuid || resolved || '').trim();
  if (!resolvedUuid) return false;
  const byUuid = await selectRows(env, 'team_memberships', `select=id&team_id=eq.${encodeURIComponent(teamId)}&status=eq.active&user_id=eq.${encodeURIComponent(resolvedUuid)}&limit=1`).catch(() => []);
  return Array.isArray(byUuid) && byUuid.length > 0;
}

export async function onRequestPost({ request, env }) {
  const auth = requireApiToken(request, env);
  if (!auth.ok) return Response.json({ ok: false, error: auth.error || 'unauthorized' }, { status: auth.status || 401 });

  const body = await request.json().catch(() => ({}));
  const email = normalizeEmail(body?.email);
  const teamId = String(body?.team_id || '').trim();
  if (!email || !teamId) return Response.json({ ok: false, error: 'invalid_request' }, { status: 400 });

  const rate = enforceRateLimit({ key: `restore_context:${getClientKey(request, `${email}:${teamId}`)}`, max: 15, windowMs: 60_000 });
  if (!rate.allowed) return Response.json({ ok: false, error: 'rate_limited' }, { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } });

  const legacyProfile = await findLegacyProfile(env, email, teamId);
  const authorized = Boolean(legacyProfile) || (await hasMembershipAccess(env, email, teamId));
  if (!authorized) return Response.json({ ok: false, error: 'forbidden' }, { status: 403 });

  let teamRows = await selectRows(env, 'teams', `select=id,name&id=eq.${encodeURIComponent(teamId)}&limit=1`).catch(() => []);
  let team = Array.isArray(teamRows) ? teamRows[0] : null;

  if (!team && legacyProfile && String(legacyProfile.role || '').toLowerCase() === 'coach') {
    const repaired = {
      id: teamId,
      name: String(legacyProfile.name || 'Team').trim() || 'Team',
    };
    await upsertRows(env, 'teams', repaired, 'id').catch(() => []);
    teamRows = await selectRows(env, 'teams', `select=id,name&id=eq.${encodeURIComponent(teamId)}&limit=1`).catch(() => []);
    team = Array.isArray(teamRows) ? (teamRows[0] || repaired) : repaired;
  }

  if (!team) return Response.json({ ok: false, error: 'team_not_found' }, { status: 404 });

  const inviteRows = await callRpc(env, 'ensure_team_invite_code_for_legacy_restore', { p_team_id: teamId, p_requester_email: email });
  const inviteCode = String((Array.isArray(inviteRows) ? inviteRows[0] : inviteRows)?.invite_code || '').trim();
  if (!inviteCode) return Response.json({ ok: false, error: 'invite_code_unavailable' }, { status: 500 });

  return Response.json({ ok: true, team: { id: String(team.id), name: String(team.name || ''), joinCode: inviteCode } });
}
