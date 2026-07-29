import { enforceRateLimit, getClientKey } from "../../../_utils/security.js";
import { issueLegacySession } from "../../../_utils/legacySession.js";
import { selectRows } from "../../../_utils/supabase.js";
import { verifyLegacyPassword } from "../_password.js";

const normalizeEmail = (value) => String(value || "").trim().toLowerCase();
const safeProfile = (row) => ({
  email: row.email,
  name: row.name,
  role: row.role,
  team_id: row.team_id || null,
  hide_from_leaderboards: row.hide_from_leaderboards === true,
});
const CONFIG_ERROR_PATTERNS = ["SUPABASE_URL_MISSING", "SUPABASE_SERVICE_ROLE_KEY_MISSING"];
const TABLE_ERROR_PATTERNS = ["legacy_auth_profiles", "legacy_auth_sessions", "relation does not exist", "schema cache", "permission denied", "REST_legacy_auth_profiles_FAILED", "REST_legacy_auth_sessions_FAILED", "PGRST"];
const classifyLegacyAuthError = (error) => {
  const message = String(error?.message || "");
  const details = JSON.stringify(error?.details || {});
  const haystack = `${message} ${details}`.toLowerCase();
  if (CONFIG_ERROR_PATTERNS.some((pattern) => haystack.includes(pattern.toLowerCase()))) return "config_error";
  if (TABLE_ERROR_PATTERNS.some((pattern) => haystack.includes(pattern.toLowerCase()))) return "table_error";
  return "internal_error";
};
const sanitizeLegacyAuthMessage = (error) => String(error?.message || "unexpected error")
  .replace(/password_hash|password_salt|password|SUPABASE_SERVICE_ROLE_KEY|service_role|apikey|authorization|bearer|token_hash|session/gi, "[redacted]")
  .slice(0, 180);
const handleLegacyAuthError = (endpoint, error) => {
  const safeCode = classifyLegacyAuthError(error);
  const safeMessage = sanitizeLegacyAuthMessage(error);
  console.error("[legacy-auth] endpoint failure", { endpoint, status: "error", category: safeCode, safeCode, message: safeMessage });
  return Response.json({ error: safeCode }, { status: 500 });
};

export async function onRequestGet() {
  return Response.json({ ok: true, service: "legacy-auth-login" });
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = normalizeEmail(body?.email);
    const password = String(body?.password || "");
    const rate = enforceRateLimit({ key: `legacy_login:${getClientKey(request, email)}`, max: 12, windowMs: 60_000 });
    if (!rate.allowed) {
      return Response.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
    }

    const rows = await selectRows(
      env,
      "legacy_auth_profiles",
      `select=email,password_hash,password_salt,name,role,team_id,hide_from_leaderboards&email=eq.${encodeURIComponent(email)}&limit=1`,
    ).catch(() => []);
    const row = Array.isArray(rows) ? rows[0] : null;
    if (!row) return Response.json({ error: "invalid_credentials" }, { status: 401 });
    const valid = await verifyLegacyPassword(password, row.password_salt || "", row.password_hash || "");
    if (!valid) return Response.json({ error: "invalid_credentials" }, { status: 401 });

    const profile = safeProfile(row);
    const session = await issueLegacySession({ env, request, profile });
    return Response.json(
      { profile, session: { authenticated: true, expires_at: session.expiresAt } },
      { headers: { "Set-Cookie": session.cookie, "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return handleLegacyAuthError("/v1/legacy-auth/login", error);
  }
}
