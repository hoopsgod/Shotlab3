import { readUserId, selectRows, upsertRows } from "../../_utils/supabase.js";

const clean = (value) => String(value ?? "").trim();

function normalizePayload(body = {}) {
  const id = clean(body.id);
  const email = clean(body.email).toLowerCase();
  const playerId = clean(body.player_id || body.playerId || email);
  const teamId = clean(body.team_id || body.teamId);
  const name = clean(body.name);
  const date = clean(body.date);
  const madeRaw = Number(body.made);
  const tsRaw = Number(body.ts);

  if (!teamId) return { ok: false, error: "team_id_required" };
  if (!email || !playerId) return { ok: false, error: "player_identity_required" };
  if (!Number.isFinite(madeRaw) || madeRaw < 0) return { ok: false, error: "invalid_made" };

  const row = {
    id: id || `shotlog_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    email,
    player_id: playerId,
    team_id: teamId,
    made: madeRaw,
    ...(name ? { name } : {}),
    ...(date ? { date } : {}),
    ts: Number.isFinite(tsRaw) ? tsRaw : Date.now(),
  };

  return { ok: true, row };
}

const norm = (value) => clean(value).toLowerCase();

async function isActiveTeamMember(env, teamId, requester) {
  const query = `select=user_id,subject_key,status,team_id&team_id=eq.${encodeURIComponent(teamId)}&status=eq.active&limit=200`;
  const rows = await selectRows(env, "team_memberships", query);
  const wanted = norm(requester);
  return (Array.isArray(rows) ? rows : []).some((row) => {
    const userId = norm(row?.user_id);
    const subjectKey = norm(row?.subject_key);
    return userId === wanted || subjectKey === wanted;
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const requester = norm(readUserId(request));
  if (!requester) return Response.json({ ok: false, error: "player_identity_required" }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const normalized = normalizePayload(body);
  if (!normalized.ok) return Response.json({ ok: false, error: normalized.error }, { status: 400 });
  if (norm(normalized.row.email) !== requester) return Response.json({ ok: false, error: "forbidden" }, { status: 403 });

  try {
    const isMember = await isActiveTeamMember(env, normalized.row.team_id, requester);
    if (!isMember) return Response.json({ ok: false, error: "forbidden" }, { status: 403 });

    const [saved] = await upsertRows(env, "shot_logs", normalized.row, "id");
    return Response.json({ ok: true, row: saved || normalized.row }, { status: 200 });
  } catch (error) {
    return Response.json({ ok: false, error: "persist_failed", diagnostic: String(error?.message || "unknown_error") }, { status: 500 });
  }
}

export { normalizePayload, isActiveTeamMember };
