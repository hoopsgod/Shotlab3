import { readUserId, selectRows } from "../../_utils/supabase.js";

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

async function findLegacyPlayerProfile(env, { requester, teamId }) {
  try {
    const rows = await selectRows(
      env,
      "legacy_auth_profiles",
      `select=email,name,role,team_id&email=eq.${encodeURIComponent(requester)}&team_id=eq.${encodeURIComponent(teamId)}&role=eq.player&limit=1`,
    );
    const profile = Array.isArray(rows) ? rows[0] : null;
    if (profile) return { ok: true, result: "match:legacy_auth_profiles/team_id", profile };
  } catch (error) {
    if (!shouldTreatProfileProbeErrorAsNoMatch(error)) return { ok: false, fatal: error, result: "error:legacy_auth_profiles/team_id" };
  }

  try {
    const rows = await selectRows(env, "legacy_auth_profiles", `select=email,name,role,team_id,teamId&email=eq.${encodeURIComponent(requester)}`);
    const profiles = Array.isArray(rows) ? rows : [];
    const profile = profiles.find((row) => normalizeTeamId(row.team_id || row.teamId) === teamId && normalizeIdentity(row.role || "player") === "player");
    if (profile) return { ok: true, result: "match:legacy_auth_profiles/fallback", profile };
    return { ok: false, result: profiles.length ? "team_mismatch" : "0" };
  } catch (error) {
    if (!shouldTreatProfileProbeErrorAsNoMatch(error)) return { ok: false, fatal: error, result: "error:legacy_auth_profiles/fallback" };
    return { ok: false, result: "0" };
  }
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
