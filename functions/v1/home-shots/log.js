import { readUserId, selectRows, upsertRows } from "../../_utils/supabase.js";
import { requireApiToken } from "../../_utils/security.js";

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

  if (!id || !email || !playerId || !teamId) return { ok: false, error: "invalid_payload" };
  if (!Number.isFinite(madeRaw) || madeRaw < 0) return { ok: false, error: "invalid_payload" };

  const row = {
    id,
    email,
    player_id: playerId,
    team_id: teamId,
    made: madeRaw,
    ...(name ? { name } : {}),
    ...(date ? { date } : {}),
    ...(Number.isFinite(tsRaw) ? { ts: tsRaw } : {}),
  };

  return { ok: true, row };
}

async function isTeamMember(env, teamId, userId) {
  const query = `select=id&team_id=eq.${encodeURIComponent(teamId)}&user_id=eq.${encodeURIComponent(userId)}&status=eq.active&limit=1`;
  const rows = await selectRows(env, "team_memberships", query);
  return Array.isArray(rows) && rows.length > 0;
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const auth = requireApiToken(request, env);
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status });

  const requester = clean(readUserId(request)).toLowerCase();
  if (!requester) return Response.json({ error: "unauthorized" }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const normalized = normalizePayload(body);
  if (!normalized.ok) return Response.json({ error: normalized.error }, { status: 400 });
  if (normalized.row.email !== requester) return Response.json({ error: "forbidden" }, { status: 403 });

  try {
    const allowed = await isTeamMember(env, normalized.row.team_id, requester);
    if (!allowed) return Response.json({ error: "forbidden" }, { status: 403 });

    const [saved] = await upsertRows(env, "shot_logs", normalized.row, "id");
    return Response.json({ ok: true, row: saved || normalized.row }, { status: 200 });
  } catch (error) {
    return Response.json({ error: "persist_failed", diagnostic: String(error?.message || "unknown_error") }, { status: 500 });
  }
}

export { normalizePayload };
