import { readUserId, upsertRows } from "../../_utils/supabase.js";
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

export async function onRequestPost(context) {
  const { request, env } = context;
  const auth = requireApiToken(request, env);
  if (!auth.ok) return Response.json({ ok: false, error: auth.error }, { status: auth.status });

  const requester = clean(readUserId(request)).toLowerCase();
  if (!requester) return Response.json({ ok: false, error: "player_identity_required" }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const normalized = normalizePayload(body);
  if (!normalized.ok) return Response.json({ ok: false, error: normalized.error }, { status: 400 });
  if (normalized.row.email !== requester) return Response.json({ ok: false, error: "forbidden" }, { status: 403 });

  try {
    const [saved] = await upsertRows(env, "shot_logs", normalized.row, "id");
    return Response.json({ ok: true, row: saved || normalized.row }, { status: 200 });
  } catch (error) {
    return Response.json({ ok: false, error: "persist_failed", diagnostic: String(error?.message || "unknown_error") }, { status: 500 });
  }
}

export { normalizePayload };
