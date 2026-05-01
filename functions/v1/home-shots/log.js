import { callRpc, readUserId, selectRows, upsertRows } from "../../_utils/supabase.js";

function normalizeIdentity(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizePayload(body = {}) {
  const teamId = String(body.team_id ?? body.teamId ?? "").trim();
  const playerId = normalizeIdentity(body.player_id ?? body.playerId ?? body.email);
  const email = normalizeIdentity(body.email ?? body.player_id ?? body.playerId);
  const made = Number(body.made);
  const date = String(body.date || "").trim();
  return { teamId, playerId, email, made, date };
}

export async function onRequestPost({ request, env }) {
  const requester = normalizeIdentity(readUserId(request));
  if (!requester) return Response.json({ ok: false, error: "missing_user_identity" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { teamId, playerId, email, made, date } = normalizePayload(body);

  if (!teamId) return Response.json({ ok: false, error: "team_id_required" }, { status: 400 });
  if (!playerId && !email) return Response.json({ ok: false, error: "player_identity_required" }, { status: 400 });
  const submittedIdentity = normalizeIdentity(playerId || email);
  if (submittedIdentity !== requester) return Response.json({ ok: false, error: "identity_mismatch" }, { status: 403 });
  if (!Number.isFinite(made) || made < 0) return Response.json({ ok: false, error: "invalid_made" }, { status: 400 });
  if (!date) return Response.json({ ok: false, error: "date_required" }, { status: 400 });

  let resolvedUuid = "";
  try {
    const resolved = await callRpc(env, "resolve_app_user_uuid", { p_identifier: requester });
    const candidate = Array.isArray(resolved) ? resolved[0] : resolved;
    resolvedUuid = normalizeIdentity(candidate?.user_id || candidate?.resolved_user_id || candidate?.uuid || candidate);
  } catch (_error) {
    resolvedUuid = "";
  }

  const membershipFilters = [
    `user_id.eq.${encodeURIComponent(requester)}`,
    ...(resolvedUuid && resolvedUuid !== requester ? [`user_id.eq.${encodeURIComponent(resolvedUuid)}`] : []),
  ];
  const memberships = await selectRows(
    env,
    "team_memberships",
    `select=id,status&team_id=eq.${encodeURIComponent(teamId)}&status=eq.active&or=(${membershipFilters.join(",")})&limit=1`,
  );
  if (!Array.isArray(memberships) || memberships.length === 0) {
    return Response.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const row = {
    email: requester,
    name: String(body.name || "").trim() || requester,
    player_id: requester,
    team_id: teamId,
    made,
    date,
    ts: body.ts || new Date().toISOString(),
  };

  const inserted = await upsertRows(env, "shot_logs", row);
  return Response.json({ ok: true, shot_log: Array.isArray(inserted) ? inserted[0] || row : row }, { status: 200 });
}
