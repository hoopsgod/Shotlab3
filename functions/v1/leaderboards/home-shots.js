import { callRpc, readUserId } from "../../_utils/supabase.js";
import { enforceRateLimit, getClientKey, requireApiToken } from "../../_utils/security.js";
import { LEADERBOARD_EVENTS, recordLeaderboardEvent } from "../../_utils/leaderboardTelemetry.js";

function normalizeRequesterUserId(raw) {
  const value = String(raw || "").trim().toLowerCase();
  if (!value || value.length > 254) return "";
  if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(value)) return "";
  return value;
}

function maskRequesterUserId(userId) {
  const normalized = normalizeRequesterUserId(userId);
  if (!normalized.includes("@")) return "unknown";
  const [local, domain] = normalized.split("@");
  const localPreview = local.length <= 2 ? `${local[0] || "*"}*` : `${local.slice(0, 2)}***`;
  return `${localPreview}@${domain}`;
}

function parseLimit(raw) {
  const parsed = Number.parseInt(String(raw || "10"), 10);
  if (!Number.isFinite(parsed)) return 10;
  return Math.max(1, Math.min(parsed, 10));
}

function parseScope(raw) {
  const value = String(raw || "players").trim().toLowerCase();
  if (!value) return "players";
  if (value === "players" || value === "coaches" || value === "all") return value;
  return "";
}

function mapLeaderboardError(error) {
  const message = String(error?.message || "").toUpperCase();
  if (message.includes("TEAM_ID_REQUIRED")) return { status: 400, code: "team_id_required" };
  if (message.includes("REQUESTER_REQUIRED")) return { status: 401, code: "unauthorized" };
  if (message.includes("NOT_AUTHORIZED_FOR_TEAM")) return { status: 403, code: "forbidden" };
  if (message.includes("SCOPE_INVALID")) return { status: 400, code: "invalid_scope" };
  return { status: 500, code: "internal_error" };
}

export { parseLimit, parseScope, mapLeaderboardError };

function sanitizeRpcError(error) {
  return {
    code: String(error?.code || ""),
    message: String(error?.message || "unknown_error"),
  };
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const requestId = request.headers.get("cf-ray") || null;
  const auth = requireApiToken(request, env);
  if (!auth.ok) {
    recordLeaderboardEvent(LEADERBOARD_EVENTS.AUTH_FAILURE, {
      requestId,
      reason: auth.error,
      status: auth.status,
    });
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  const userId = normalizeRequesterUserId(readUserId(request));
  if (!userId) {
    recordLeaderboardEvent(LEADERBOARD_EVENTS.AUTH_FAILURE, {
      requestId,
      reason: "unauthorized",
      status: 401,
    });
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const teamId = String(url.searchParams.get("team_id") || "").trim();
  const limit = parseLimit(url.searchParams.get("limit"));
  const scope = parseScope(url.searchParams.get("scope"));
  const rate = enforceRateLimit({ key: getClientKey(request, `${userId}:${teamId}`), max: 40, windowMs: 60_000 });
  if (!rate.allowed) {
    return Response.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  }

  if (!teamId) return Response.json({ error: "team_id_required" }, { status: 400 });
  if (!scope) return Response.json({ error: "invalid_scope" }, { status: 400 });

  const rpcName = "get_team_home_shots_leaderboard";
  const rpcArgs = {
    p_team_id: teamId,
    p_requester_user_id: userId,
    p_limit: limit,
    p_scope: scope,
  };

  const startedAt = Date.now();
  recordLeaderboardEvent(LEADERBOARD_EVENTS.QUERY_START, {
    requestId,
    requesterUserId: maskRequesterUserId(userId),
    teamId,
    limit,
    scope,
  });

  try {
    const rows = await callRpc(env, rpcName, rpcArgs);

    const leaderboard = (Array.isArray(rows) ? rows : []).map((row) => Object.fromEntries(Object.entries({
      rank: row.rank,
      player_id: row.player_id || row.playerId || row.email || undefined,
      email: row.email || row.player_email || row.player_id || row.playerId || undefined,
      player_display_name: row.player_display_name,
      total_home_shots: row.total_home_shots,
    }).filter(([, value]) => value !== undefined && value !== null && value !== "")));

    const event = leaderboard.length === 0 ? LEADERBOARD_EVENTS.QUERY_EMPTY : LEADERBOARD_EVENTS.QUERY_SUCCESS;
    recordLeaderboardEvent(event, {
      requestId,
      requesterUserId: maskRequesterUserId(userId),
      teamId,
      limit,
      scope,
      rows: leaderboard.length,
      durationMs: Date.now() - startedAt,
    });

    return Response.json(
      {
        team_id: teamId,
        limit,
        scope,
        count: leaderboard.length,
        leaderboard,
      },
      { status: 200 },
    );
  } catch (error) {
    const mapped = mapLeaderboardError(error);
    recordLeaderboardEvent(LEADERBOARD_EVENTS.QUERY_FAILURE, {
      requestId,
      requesterUserId: maskRequesterUserId(userId),
      teamId,
      limit,
      scope,
      durationMs: Date.now() - startedAt,
      errorCode: mapped.code,
      errorMessage: String(error?.message || "unknown_error"),
    });
    const safeRpcError = sanitizeRpcError(error);
    const diagnostics = {
      requester_identity_present: userId ? "yes" : "no",
      team_id_present: teamId ? "yes" : "no",
      scope,
      rpc_name_called: rpcName,
      rpc_arguments: { ...rpcArgs },
      rpc_success: "no",
      rpc_error: safeRpcError,
      rpc_exists_detectable: /function[\s_]+get_team_home_shots_leaderboard|does not exist/i.test(safeRpcError.message) ? "no" : "unknown",
      requester_resolved_uuid_available: /requester_uuid|resolved.*uuid/i.test(safeRpcError.message) ? "yes" : "unknown",
    };
    return Response.json({ error: mapped.code, diagnostics }, { status: mapped.status });
  }
}
