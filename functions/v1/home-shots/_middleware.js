import { readUserId, selectRows } from "../../_utils/supabase.js";

const LEGACY_PROFILE_TEAM_COLUMNS = ["team_id", "teamId"];

function normalizeIdentity(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeTeamId(value) {
  return String(value || "").trim();
}

function shouldTreatProfileProbeErrorAsNoMatch(error) {
  const status = Number(error?.status || 0);
  const message = String(error?.message || error?.details?.message || "").toLowerCase();
  if (status >= 500) return false;
  return status === 400 || status === 404 || message.includes("column") || message.includes("schema cache") || message.includes("could not find");
}

function normalizePayload(body = {}) {
  const teamId = normalizeTeamId(body.team_id ?? body.teamId);
  const submittedIdentity = normalizeIdentity(body.player_id ?? body.playerId ?? body.email);
  return { teamId, submittedIdentity };
}

async function selectLegacyProfilesByColumn(env, { requester, teamId, teamColumn, exact = false }) {
  const teamFilter = exact ? `&${teamColumn}=eq.${encodeURIComponent(teamId)}&role=eq.player&limit=1` : "";
  return selectRows(
    env,
    "legacy_auth_profiles",
    `select=email,name,role,${teamColumn}&email=eq.${encodeURIComponent(requester)}${teamFilter}`,
  );
}

async function findLegacyPlayerProfile(env, { requester, teamId }) {
  for (const teamColumn of LEGACY_PROFILE_TEAM_COLUMNS) {
    try {
      const rows = await selectLegacyProfilesByColumn(env, { requester, teamId, teamColumn, exact: true });
      const profile = Array.isArray(rows) ? rows[0] : null;
      if (profile) return { ok: true, result: `match:legacy_auth_profiles/${teamColumn}`, profile };
    } catch (error) {
      if (!shouldTreatProfileProbeErrorAsNoMatch(error)) return { ok: false, fatal: error, result: `error:legacy_auth_profiles/${teamColumn}` };
    }
  }

  let foundAnyProfile = false;
  const teamIds = [];
  for (const teamColumn of LEGACY_PROFILE_TEAM_COLUMNS) {
    try {
      const rows = await selectLegacyProfilesByColumn(env, { requester, teamId, teamColumn });
      const profiles = Array.isArray(rows) ? rows : [];
      if (profiles.length) foundAnyProfile = true;
      const profile = profiles.find((row) => normalizeTeamId(row[teamColumn]) === teamId && normalizeIdentity(row.role || "player") === "player");
      if (profile) return { ok: true, result: `match:legacy_auth_profiles/${teamColumn}/fallback`, profile };
      teamIds.push(...profiles.map((row) => normalizeTeamId(row[teamColumn])).filter(Boolean));
    } catch (error) {
      if (!shouldTreatProfileProbeErrorAsNoMatch(error)) return { ok: false, fatal: error, result: `error:legacy_auth_profiles/${teamColumn}/fallback` };
    }
  }
  return { ok: false, result: foundAnyProfile ? `team_mismatch:${teamIds.slice(0, 3).join(",") || "none"}` : "0" };
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method !== "POST") return context.next();

  const requester = normalizeIdentity(readUserId(request));
  const body = await request.clone().json().catch(() => ({}));
  const { teamId, submittedIdentity } = normalizePayload(body);

  if (requester && teamId && submittedIdentity === requester) {
    const fallback = await findLegacyPlayerProfile(env, { requester, teamId });
    if (fallback.ok) {
      context.data = {
        ...(context.data || {}),
        homeShotLegacyProfileFallback: {
          verified: true,
          result: fallback.result,
        },
      };
    }
  }

  return context.next();
}

export { findLegacyPlayerProfile };
