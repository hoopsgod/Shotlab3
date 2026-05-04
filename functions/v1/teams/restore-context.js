import { callRpc, selectRows, upsertRows } from "../../_utils/supabase.js";

const normalizeEmail = (value) => String(value || "").trim().toLowerCase();
const normalizeTeamId = (value) => String(value || "").trim();

const safeTeam = (teamRow, joinCode = "") => ({
  id: String(teamRow?.id || ""),
  name: String(teamRow?.name || "Team"),
  joinCode: String(joinCode || ""),
  school: teamRow?.school || "",
  level: teamRow?.level || "",
  branding: teamRow?.branding || null,
});

async function getMembershipColumns(env) {
  const rows = await selectRows(
    env,
    "information_schema.columns",
    "select=column_name&table_schema=eq.public&table_name=eq.team_memberships",
  ).catch(() => []);
  return new Set((Array.isArray(rows) ? rows : []).map((row) => String(row?.column_name || "").toLowerCase()));
}

async function hasActiveMembership(env, { email, teamId }) {
  const columns = await getMembershipColumns(env);
  const subjectColumn = columns.has("subject_key") ? "subject_key" : columns.has("user_email") ? "user_email" : null;
  if (subjectColumn) {
    const rows = await selectRows(
      env,
      "team_memberships",
      `select=id&team_id=eq.${encodeURIComponent(teamId)}&${subjectColumn}=eq.${encodeURIComponent(email)}&status=eq.active&limit=1`,
    ).catch(() => []);
    if (Array.isArray(rows) && rows.length > 0) return true;
  }

  const candidates = [email];
  const uuidRows = await callRpc(env, "resolve_app_user_uuid", { p_identifier: email }).catch(() => null);
  const resolvedUuid = Array.isArray(uuidRows) ? String(uuidRows[0]?.resolve_app_user_uuid || uuidRows[0] || "") : String(uuidRows || "");
  if (resolvedUuid) candidates.unshift(resolvedUuid);

  for (const identifier of candidates) {
    const rows = await selectRows(
      env,
      "team_memberships",
      `select=id&team_id=eq.${encodeURIComponent(teamId)}&user_id=eq.${encodeURIComponent(identifier)}&status=eq.active&limit=1`,
    ).catch(() => []);
    if (Array.isArray(rows) && rows.length > 0) return true;
  }
  return false;
}

async function ensureInviteCode(env, { teamId, email }) {
  const rpcRows = await callRpc(env, "ensure_team_invite_code_for_legacy_restore", {
    p_team_id: teamId,
    p_requester_email: email,
  }).catch(() => null);
  const rpcCode = Array.isArray(rpcRows)
    ? String(rpcRows[0]?.invite_code || rpcRows[0]?.ensure_team_invite_code_for_legacy_restore || "").trim()
    : String(rpcRows || "").trim();
  if (rpcCode) return rpcCode;
  return "";
}

export async function onRequestGet() {
  return Response.json({ ok: true, service: "teams-restore-context" });
}

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => ({}));
  const email = normalizeEmail(body?.email);
  const teamId = normalizeTeamId(body?.team_id || body?.teamId);
  if (!email || !teamId) return Response.json({ error: "invalid_request" }, { status: 400 });

  const profiles = await selectRows(env, "legacy_auth_profiles", `select=email,role,team_id&email=eq.${encodeURIComponent(email)}&limit=1`).catch(() => []);
  const profile = Array.isArray(profiles) ? profiles[0] : null;
  const isProfileOwner = Boolean(profile && String(profile.team_id || "") === teamId);
  const isCoach = String(profile?.role || "") === "coach";

  const authorized = isProfileOwner || (await hasActiveMembership(env, { email, teamId }));
  if (!authorized) return Response.json({ error: "forbidden" }, { status: 403 });

  let teamRow = (await selectRows(env, "teams", `select=id,name,school,level,branding&id=eq.${encodeURIComponent(teamId)}&limit=1`).catch(() => []))?.[0] || null;
  if (!teamRow && isCoach && isProfileOwner) {
    const repaired = await upsertRows(env, "teams", { id: teamId, name: "Team", created_at: new Date().toISOString() }, "id").catch(() => []);
    teamRow = Array.isArray(repaired) ? repaired[0] : { id: teamId, name: "Team" };
  }
  if (!teamRow) return Response.json({ error: "team_not_found" }, { status: 404 });

  const joinCode = await ensureInviteCode(env, { teamId, email });
  if (!joinCode) return Response.json({ error: "invite_restore_failed" }, { status: 500 });

  return Response.json({ ok: true, team: safeTeam(teamRow, joinCode) });
}
