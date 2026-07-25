import { enforceRateLimit, getClientKey } from "../../../_utils/security.js";
import { insertRows, readUserId, selectRows, updateRows, upsertRows } from "../../../_utils/supabase.js";
import { sendPlayerSetupEmail } from "../../../_utils/transactionalEmail.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const clean = (value) => String(value ?? "").trim();
const emailKey = (value) => clean(value).toLowerCase();
const safeText = (value, max = 160) => clean(value).slice(0, max);

const bytesToBase64Url = (bytes) => {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "");
};
const randomToken = () => bytesToBase64Url(crypto.getRandomValues(new Uint8Array(32)));
const sha256Hex = async (value) => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
};

async function authorizeCoach(env, requester, teamId) {
  const profiles = await selectRows(env, "legacy_auth_profiles", `select=email,role,team_id&email=eq.${encodeURIComponent(requester)}&limit=1`);
  const profile = Array.isArray(profiles) ? profiles[0] : null;
  if (profile?.role === "coach" && clean(profile?.team_id) === teamId) return true;
  const teams = await selectRows(env, "teams", `select=id,owner_coach_id&id=eq.${encodeURIComponent(teamId)}&limit=1`);
  const team = Array.isArray(teams) ? teams[0] : null;
  return emailKey(team?.owner_coach_id) === requester;
}

async function findPlayerProfile(env, teamId, email) {
  const byUser = await selectRows(env, "player_profiles", `select=*&team_id=eq.${encodeURIComponent(teamId)}&user_id=eq.${encodeURIComponent(email)}&limit=1`).catch(() => []);
  if (Array.isArray(byUser) && byUser[0]) return byUser[0];
  const byInvite = await selectRows(env, "player_profiles", `select=*&team_id=eq.${encodeURIComponent(teamId)}&invited_email=eq.${encodeURIComponent(email)}&limit=1`).catch(() => []);
  return Array.isArray(byInvite) ? byInvite[0] || null : null;
}

async function ensurePlayerProfile(env, { teamId, email, firstName, lastName, jerseyNumber, active = false }) {
  const existing = await findPlayerProfile(env, teamId, email);
  const id = clean(existing?.id) || `pp-${crypto.randomUUID()}`;
  const row = {
    id,
    user_id: active ? email : existing?.user_id || null,
    team_id: teamId,
    first_name: firstName || existing?.first_name || "Player",
    last_name: lastName || existing?.last_name || "",
    jersey_number: jerseyNumber || existing?.jersey_number || "",
    created_at: Number(existing?.created_at || Date.now()),
    invited_email: email,
    invite_status: active ? "claimed" : "pending",
    invite_claimed_at: active ? new Date().toISOString() : existing?.invite_claimed_at || null,
  };
  const saved = await upsertRows(env, "player_profiles", row, "id");
  return Array.isArray(saved) ? saved[0] || row : row;
}

export async function onRequestGet({ request, env }) {
  const requester = emailKey(readUserId(request));
  const url = new URL(request.url);
  const teamId = clean(url.searchParams.get("team_id"));
  if (!requester) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (!teamId) return Response.json({ error: "invalid_team_id" }, { status: 400 });
  if (!(await authorizeCoach(env, requester, teamId))) return Response.json({ error: "forbidden" }, { status: 403 });
  const rows = await selectRows(env, "coach_player_invitations", `select=id,team_id,player_profile_id,player_email,player_name,jersey_number,setup_expires_at,status,email_sent_at,claimed_at,created_at&team_id=eq.${encodeURIComponent(teamId)}&order=created_at.desc&limit=100`);
  return Response.json({ ok: true, invitations: Array.isArray(rows) ? rows : [] });
}

export async function onRequestPost({ request, env }) {
  const requester = emailKey(readUserId(request));
  const body = await request.json().catch(() => ({}));
  const teamId = clean(body?.team_id || body?.teamId);
  const email = emailKey(body?.email);
  const firstName = safeText(body?.first_name || body?.firstName, 80);
  const lastName = safeText(body?.last_name || body?.lastName, 80);
  const jerseyNumber = safeText(body?.jersey_number || body?.jerseyNumber, 20);
  if (!requester) return Response.json({ error: "unauthorized" }, { status: 401 });
  const rate = enforceRateLimit({ key: `coach_player_provision:${getClientKey(request, requester)}`, max: 8, windowMs: 60_000 });
  if (!rate.allowed) return Response.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  if (!teamId || !EMAIL_RE.test(email) || !firstName) return Response.json({ error: "invalid_request" }, { status: 400 });
  if (!(await authorizeCoach(env, requester, teamId))) return Response.json({ error: "forbidden" }, { status: 403 });

  const displayName = `${firstName} ${lastName}`.trim();
  const accounts = await selectRows(env, "legacy_auth_profiles", `select=email,name,role,team_id&email=eq.${encodeURIComponent(email)}&limit=1`);
  const account = Array.isArray(accounts) ? accounts[0] : null;
  if (account) {
    if (account.role !== "player") return Response.json({ error: "account_role_conflict" }, { status: 409 });
    if (account.team_id && clean(account.team_id) !== teamId) return Response.json({ error: "account_on_other_team" }, { status: 409 });
    if (!account.team_id) await updateRows(env, "legacy_auth_profiles", `email=eq.${encodeURIComponent(email)}`, { team_id: teamId, updated_at: new Date().toISOString() });
    const profile = await ensurePlayerProfile(env, { teamId, email, firstName, lastName, jerseyNumber, active: true });
    return Response.json({ ok: true, status: "account_active", email_delivery_status: "not_needed", profile }, { status: 200 });
  }

  const profile = await ensurePlayerProfile(env, { teamId, email, firstName, lastName, jerseyNumber });
  await updateRows(env, "coach_player_invitations", `team_id=eq.${encodeURIComponent(teamId)}&player_email=eq.${encodeURIComponent(email)}&status=in.(pending,sent)`, { status: "revoked", revoked_at: new Date().toISOString(), updated_at: new Date().toISOString() }).catch(() => null);

  const token = randomToken();
  const tokenHash = await sha256Hex(token);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const inserted = await insertRows(env, "coach_player_invitations", {
    team_id: teamId,
    player_profile_id: profile.id,
    player_email: email,
    player_name: displayName,
    jersey_number: jerseyNumber || null,
    setup_token_hash: tokenHash,
    setup_expires_at: expiresAt,
    status: "pending",
    invited_by_email: requester,
  });
  const invite = Array.isArray(inserted) ? inserted[0] : inserted;

  const teams = await selectRows(env, "teams", `select=id,name,join_code&id=eq.${encodeURIComponent(teamId)}&limit=1`).catch(() => []);
  const team = Array.isArray(teams) ? teams[0] : null;
  const baseUrl = clean(env?.APP_BASE_URL || new URL(request.url).origin).replace(/\/$/, "");
  const setupUrl = `${baseUrl}/player-setup.html?token=${encodeURIComponent(token)}`;
  const delivery = await sendPlayerSetupEmail(env, {
    to: email,
    playerName: displayName,
    teamName: team?.name || "your team",
    teamCode: team?.join_code || "",
    setupUrl,
    expiresAt,
  });
  const sentAt = delivery.ok ? new Date().toISOString() : null;
  const status = delivery.ok ? "sent" : "pending";
  await updateRows(env, "coach_player_invitations", `id=eq.${encodeURIComponent(invite.id)}`, { status, email_sent_at: sentAt, updated_at: new Date().toISOString() });
  await updateRows(env, "player_profiles", `id=eq.${encodeURIComponent(profile.id)}`, { invite_id: invite.id, invite_status: status, invite_sent_at: sentAt });

  return Response.json({
    ok: true,
    status,
    invitation_id: invite.id,
    player_profile_id: profile.id,
    email_delivery_status: delivery.status,
    setup_url: setupUrl,
    expires_at: expiresAt,
    profile: { ...profile, invite_id: invite.id, invite_status: status, invite_sent_at: sentAt },
  }, { status: 201 });
}
