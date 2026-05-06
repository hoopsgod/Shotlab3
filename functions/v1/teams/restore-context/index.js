import { callRpc, selectRows, upsertRows } from "../../../_utils/supabase.js";
import { enforceRateLimit, getClientKey, requireApiToken } from "../../../_utils/security.js";

const normalizeEmail = (value) => String(value || "").trim().toLowerCase();

function rpcScalar(json, key) {
  if (typeof json === "string") return json;
  if (Array.isArray(json)) return String(json[0]?.[key] || json[0] || "").trim();
  return String(json?.[key] || "").trim();
}

export async function onRequestPost({ request, env }) {
  const auth = requireApiToken(request, env);
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status });

  const body = await request.json().catch(() => ({}));
  const email = normalizeEmail(body?.email);
  const teamId = String(body?.team_id || body?.teamId || "").trim();
  if (!email || !teamId) return Response.json({ error: "invalid_request" }, { status: 400 });

  const rate = enforceRateLimit({ key: `restore_context:${getClientKey(request, `${email}:${teamId}`)}`, max: 20, windowMs: 60_000 });
  if (!rate.allowed) return Response.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });

  const resolvedUserUuid = rpcScalar(await callRpc(env, "resolve_app_user_uuid", { p_identifier: email }), "resolve_app_user_uuid");
  const coachProfiles = await selectRows(env, "legacy_auth_profiles", `select=email,team_id,role,name&email=eq.${encodeURIComponent(email)}&team_id=eq.${encodeURIComponent(teamId)}&role=eq.coach&limit=1`).catch(() => []);
  const membershipFilters = [`team_id=eq.${encodeURIComponent(teamId)}`, "status=eq.active", "role=in.(coach,player)"];
  if (resolvedUserUuid) membershipFilters.push(`user_id=eq.${encodeURIComponent(resolvedUserUuid)}`);
  const membershipsByUuid = resolvedUserUuid
    ? await selectRows(env, "team_memberships", `select=id,team_id,user_id,status&${membershipFilters.join("&")}&limit=1`).catch(() => [])
    : [];
  const membershipsByEmail = await selectRows(env, "team_memberships", `select=id,team_id,user_id,status&team_id=eq.${encodeURIComponent(teamId)}&status=eq.active&user_id=eq.${encodeURIComponent(email)}&limit=1`).catch(() => []);
  const authorized = Boolean((Array.isArray(coachProfiles) && coachProfiles[0]) || (Array.isArray(membershipsByUuid) && membershipsByUuid[0]) || (Array.isArray(membershipsByEmail) && membershipsByEmail[0]));
  if (!authorized) return Response.json({ error: "forbidden" }, { status: 403 });

  if (Array.isArray(coachProfiles) && coachProfiles[0] && resolvedUserUuid) {
    const teams = await selectRows(env, "teams", `select=id,name,coach_user_id&id=eq.${encodeURIComponent(teamId)}&limit=1`).catch(() => []);
    const existingTeam = Array.isArray(teams) ? teams[0] : null;
    if (!existingTeam) {
      await upsertRows(env, "teams", { id: teamId, name: String(coachProfiles[0].name || "Team").trim() || "Team", coach_user_id: resolvedUserUuid }, "id");
    } else if (!existingTeam.coach_user_id) {
      await upsertRows(env, "teams", { id: teamId, coach_user_id: resolvedUserUuid }, "id");
    }
  }

  const restored = await callRpc(env, "ensure_team_invite_code_for_legacy_restore", { p_team_id: teamId, p_requester_email: email });
  const row = Array.isArray(restored) ? restored[0] : restored;
  return Response.json({
    ok: true,
    team: {
      id: String(row?.team_id || teamId),
      name: String(row?.team_name || "Team"),
      joinCode: String(row?.join_code || ""),
    },
  });
}
