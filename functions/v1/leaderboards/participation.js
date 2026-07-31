import { selectRows } from "../../_utils/supabase.js";
import { readAuthenticatedIdentity } from "../../_utils/legacySession.js";
import { enforceRateLimit, getClientKey } from "../../_utils/security.js";
import { collectTeamPriorityAccess } from "../team-priorities/index.js";
import {
  buildAllTimeEventParticipationLeaderboardRows,
  buildAllTimeStrengthParticipationLeaderboardRows,
  buildCurrentEventParticipationLeaderboardRows,
  buildCurrentStrengthParticipationLeaderboardRows,
} from "../../../src/lib/seasonLeaderboardAnalytics.js";

const DEMO_IDENTITIES = new Set(["coach.demo@shotlab.app", "demo@shotlab.app"]);
const normalizeIdentity = (value) => String(value || "").trim().toLowerCase();
const cleanText = (value, max = 500) => String(value ?? "").trim().slice(0, max);

const archiveFromRow = (row = {}) => {
  const snapshot = row?.snapshot && typeof row.snapshot === "object" && !Array.isArray(row.snapshot)
    ? row.snapshot
    : {};
  return {
    ...snapshot,
    id: cleanText(row?.id || snapshot?.id, 220),
    teamId: cleanText(row?.team_id || snapshot?.teamId, 180),
    seasonName: cleanText(row?.season_name || snapshot?.seasonName, 120),
    seasonStartDate: cleanText(row?.season_start_date || snapshot?.seasonStartDate, 40),
    seasonEndDate: cleanText(row?.season_end_date || snapshot?.seasonEndDate, 40),
  };
};

const publicRow = (row = {}, selfIdentities = new Set()) => {
  const rowIdentities = [
    row?.email,
    row?.playerId,
    row?.player_id,
    row?.userId,
    row?.user_id,
    row?.profileId,
    row?.profile_id,
  ].map(normalizeIdentity).filter(Boolean);
  const playerId = cleanText(row?.playerId || row?.player_id || row?.email, 320);
  const displayName = cleanText(
    row?.player_display_name || row?.displayName || row?.name || (playerId.includes("@") ? playerId.split("@")[0] : playerId) || "Player",
    240,
  );
  return {
    rank: Number(row?.rank) || 0,
    player_id: playerId,
    player_display_name: displayName,
    total: Number(row?.metricValue ?? row?.total ?? row?.score) || 0,
    metric: cleanText(row?.metric, 80),
    time_scope: cleanText(row?.timeScope, 40),
    is_current_user: rowIdentities.some((identity) => selfIdentities.has(identity)),
  };
};

async function readTeamParticipationState(env, teamId) {
  const encodedTeamId = encodeURIComponent(teamId);
  const [players, events, rsvps, scSessions, scLogs, archiveRows] = await Promise.all([
    selectRows(env, "players", `select=id,email,name,role,team_id,hide_from_leaderboards&team_id=eq.${encodedTeamId}&limit=1000`),
    selectRows(env, "events", `select=id,team_id,date&team_id=eq.${encodedTeamId}&limit=1000`),
    selectRows(env, "rsvps", `select=id,email,player_id,name,event_id,team_id,attended,ts&team_id=eq.${encodedTeamId}&limit=5000`),
    selectRows(env, "sc_sessions", `select=id,team_id,date&team_id=eq.${encodedTeamId}&limit=1000`),
    selectRows(env, "sc_logs", `select=id,team_id,session_id,player_id,email,name,date,time,place,sport,ts&team_id=eq.${encodedTeamId}&limit=5000`),
    selectRows(env, "season_archives", `select=id,team_id,season_name,season_start_date,season_end_date,snapshot&team_id=eq.${encodedTeamId}&order=created_at.asc&limit=100`),
  ]);
  return {
    players: Array.isArray(players) ? players : [],
    events: Array.isArray(events) ? events : [],
    rsvps: Array.isArray(rsvps) ? rsvps : [],
    scSessions: Array.isArray(scSessions) ? scSessions : [],
    scLogs: Array.isArray(scLogs) ? scLogs : [],
    seasonArchives: (Array.isArray(archiveRows) ? archiveRows : []).map(archiveFromRow),
  };
}

export async function onRequestGet({ request, env }) {
  const auth = await readAuthenticatedIdentity({ env, request, allowDemo: true });
  const requester = normalizeIdentity(auth?.identity);
  if (!requester) return Response.json({ error: "unauthorized" }, { status: 401 });

  const rate = enforceRateLimit({
    key: `participation_leaderboards_get:${getClientKey(request, requester)}`,
    max: 60,
    windowMs: 60_000,
  });
  if (!rate.allowed) {
    return Response.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  }

  const teamId = cleanText(new URL(request.url).searchParams.get("team_id"), 180);
  if (!teamId) return Response.json({ error: "team_id_required" }, { status: 400 });
  if (auth.source === "demo_header" && DEMO_IDENTITIES.has(requester)) {
    return Response.json({ ok: true, storage_mode: "demo_local", team_id: teamId, leaderboards: null });
  }

  try {
    const { readableTeamIds, resolvedUuid } = await collectTeamPriorityAccess(env, requester);
    if (!readableTeamIds.has(teamId)) return Response.json({ error: "forbidden" }, { status: 403 });
    const state = await readTeamParticipationState(env, teamId);
    const shared = {
      seasonArchives: state.seasonArchives,
      teamId,
      players: state.players,
      limit: 10,
    };
    const selfIdentities = new Set([requester, normalizeIdentity(resolvedUuid)].filter(Boolean));
    const leaderboards = {
      event_participation: {
        current: buildCurrentEventParticipationLeaderboardRows({ ...shared, events: state.events, rsvps: state.rsvps }).map((row) => publicRow(row, selfIdentities)),
        all_time: buildAllTimeEventParticipationLeaderboardRows({ ...shared, events: state.events, rsvps: state.rsvps }).map((row) => publicRow(row, selfIdentities)),
      },
      strength_conditioning_participation: {
        current: buildCurrentStrengthParticipationLeaderboardRows({ ...shared, scSessions: state.scSessions, scLogs: state.scLogs }).map((row) => publicRow(row, selfIdentities)),
        all_time: buildAllTimeStrengthParticipationLeaderboardRows({ ...shared, scSessions: state.scSessions, scLogs: state.scLogs }).map((row) => publicRow(row, selfIdentities)),
      },
    };
    return Response.json({ ok: true, storage_mode: "signed_api", team_id: teamId, leaderboards });
  } catch (error) {
    console.error("participation_leaderboards_get_failed", {
      teamId,
      message: cleanText(error?.message, 180),
    });
    return Response.json({ error: "participation_leaderboard_load_failed" }, { status: 500 });
  }
}
