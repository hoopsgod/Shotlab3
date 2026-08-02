import { enforceRateLimit, getClientKey } from "../../../_utils/security.js";
import { readUserId, selectRows } from "../../../_utils/supabase.js";

const clean = (value) => String(value ?? "").trim();
const emailKey = (value) => clean(value).toLowerCase();

export const parseActivityLimit = (value) => {
  const parsed = Number.parseInt(String(value ?? "25"), 10);
  if (!Number.isFinite(parsed)) return 25;
  return Math.max(1, Math.min(parsed, 50));
};

async function authorizeCoach(env, requester, teamId) {
  const profiles = await selectRows(env, "legacy_auth_profiles", `select=email,role,team_id&email=eq.${encodeURIComponent(requester)}&limit=1`).catch(() => []);
  const profile = Array.isArray(profiles) ? profiles[0] : null;
  if (profile?.role === "coach" && clean(profile?.team_id) === teamId) return true;
  const teams = await selectRows(env, "teams", `select=id,owner_coach_id&id=eq.${encodeURIComponent(teamId)}&limit=1`).catch(() => []);
  const team = Array.isArray(teams) ? teams[0] : null;
  return emailKey(team?.owner_coach_id) === requester;
}

const normalizeResult = (row = {}) => ({
  id: clean(row?.id),
  team_id: clean(row?.team_id || row?.teamId),
  player_id: clean(row?.player_id || row?.playerId || row?.email).toLowerCase(),
  player_email: emailKey(row?.email),
  player_name: clean(row?.name) || "Player",
  made: Math.max(0, Number(row?.made) || 0),
  date: clean(row?.date).slice(0, 10),
  observed_at: clean(row?.ts || row?.created_at || row?.date),
});

export async function onRequestGet({ request, env }) {
  const requester = emailKey(readUserId(request));
  const url = new URL(request.url);
  const teamId = clean(url.searchParams.get("team_id"));
  const limit = parseActivityLimit(url.searchParams.get("limit"));
  if (!requester) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (!teamId) return Response.json({ error: "team_id_required" }, { status: 400 });
  const rate = enforceRateLimit({ key: `coach_first_results:${getClientKey(request, `${requester}:${teamId}`)}`, max: 60, windowMs: 60_000 });
  if (!rate.allowed) return Response.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  if (!(await authorizeCoach(env, requester, teamId))) return Response.json({ error: "forbidden" }, { status: 403 });

  const rows = await selectRows(
    env,
    "shot_logs",
    `select=id,team_id,player_id,email,name,made,date,ts&team_id=eq.${encodeURIComponent(teamId)}&made=gt.0&order=ts.desc&limit=${limit}`,
  );
  const results = (Array.isArray(rows) ? rows : [])
    .map(normalizeResult)
    .filter((row) => row.team_id === teamId && row.made > 0 && (row.player_id || row.player_email));

  return Response.json(
    { ok: true, team_id: teamId, count: results.length, results },
    { status: 200, headers: { "Cache-Control": "private, no-store" } },
  );
}
