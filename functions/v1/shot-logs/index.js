import { selectRows } from "../../_utils/supabase.js";
import { enforceRateLimit, getClientKey } from "../../_utils/security.js";
import { readAuthenticatedIdentity } from "../../_utils/legacySession.js";
import { collectTeamPriorityAccess } from "../team-priorities/index.js";

const DEMO_IDENTITIES = new Set(["coach.demo@shotlab.app", "demo@shotlab.app"]);
const MAX_ROWS_PER_TEAM = 10000;

const normalizeIdentity = (value) => String(value || "").trim().toLowerCase();
const cleanText = (value, max = 500) => String(value ?? "").trim().slice(0, max);

function finiteNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

export function sanitizeShotLogRow(value = {}) {
  return {
    id: cleanText(value?.id, 160),
    email: normalizeIdentity(value?.email).slice(0, 320),
    playerId: normalizeIdentity(value?.player_id || value?.playerId || value?.email).slice(0, 320),
    teamId: cleanText(value?.team_id || value?.teamId, 160),
    name: cleanText(value?.name, 320),
    made: finiteNumber(value?.made),
    date: cleanText(value?.date, 40),
    ts: cleanText(value?.ts, 120),
    attemptedShots: value?.attempted_shots == null ? null : finiteNumber(value.attempted_shots),
    drillId: cleanText(value?.drill_id || value?.drillId, 160),
    sessionId: cleanText(value?.session_id || value?.sessionId, 160),
    createdAt: cleanText(value?.created_at || value?.createdAt, 120),
  };
}

function rowToResponse(row = {}) {
  const normalized = sanitizeShotLogRow(row);
  return {
    id: normalized.id,
    email: normalized.email,
    player_id: normalized.playerId,
    team_id: normalized.teamId,
    name: normalized.name,
    made: normalized.made,
    date: normalized.date,
    ts: normalized.ts,
    attempted_shots: normalized.attemptedShots,
    drill_id: normalized.drillId || null,
    session_id: normalized.sessionId || null,
    created_at: normalized.createdAt || null,
  };
}

function demoResponse() {
  return Response.json({ ok: true, storage_mode: "demo_local", shot_logs: [] });
}

export async function onRequestGet({ request, env }) {
  const auth = await readAuthenticatedIdentity({ env, request, allowDemo: true });
  const requester = normalizeIdentity(auth?.identity);
  if (!requester) return Response.json({ error: "unauthorized" }, { status: 401 });

  const rate = enforceRateLimit({
    key: `shot_logs_get:${getClientKey(request, requester)}`,
    max: 60,
    windowMs: 60_000,
  });
  if (!rate.allowed) {
    return Response.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  }

  if (DEMO_IDENTITIES.has(requester)) return demoResponse();

  try {
    const { readableTeamIds } = await collectTeamPriorityAccess(env, requester);
    if (!readableTeamIds.size) return Response.json({ error: "forbidden" }, { status: 403 });

    const requestedTeamId = cleanText(new URL(request.url).searchParams.get("team_id"), 160);
    const teamIds = requestedTeamId
      ? (readableTeamIds.has(requestedTeamId) ? [requestedTeamId] : [])
      : [...readableTeamIds];
    if (requestedTeamId && !teamIds.length) return Response.json({ error: "forbidden" }, { status: 403 });

    const shotLogs = [];
    for (const teamId of teamIds) {
      const rows = await selectRows(
        env,
        "shot_logs",
        `select=id,email,player_id,team_id,name,made,date,ts,attempted_shots,drill_id,session_id,created_at&team_id=eq.${encodeURIComponent(teamId)}&order=ts.asc&limit=${MAX_ROWS_PER_TEAM}`,
      );
      for (const row of Array.isArray(rows) ? rows : []) shotLogs.push(rowToResponse(row));
    }

    return Response.json({ ok: true, storage_mode: "signed_api", shot_logs: shotLogs });
  } catch (error) {
    console.error("shot_logs_get_failed", { message: cleanText(error?.message, 180) });
    return Response.json({ error: "shot_log_load_failed" }, { status: 500 });
  }
}
