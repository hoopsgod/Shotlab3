import { enforceRateLimit, getClientKey } from "../../../_utils/security.js";
import { selectRows, upsertRows } from "../../../_utils/supabase.js";
import { hashLegacyPassword } from "../_password.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ENDPOINT = "/v1/legacy-auth/register";

const normalizeEmail = v => String(v || "").trim().toLowerCase();
const toHex = bytes => Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
const safeProfile = row => ({ email: row.email, name: row.name, role: row.role, team_id: row.team_id || null, hide_from_leaderboards: row.hide_from_leaderboards === true });

const CONFIG_ERROR_PATTERNS = ["SUPABASE_URL_MISSING", "SUPABASE_SERVICE_ROLE_KEY_MISSING"];
const TABLE_ERROR_PATTERNS = ["legacy_auth_profiles", "relation does not exist", "schema cache", "permission denied", "REST_legacy_auth_profiles_FAILED", "PGRST"];
const classifyLegacyAuthError = (error) => {
  const message = String(error?.message || "");
  const details = JSON.stringify(error?.details || {});
  const haystack = `${message} ${details}`.toLowerCase();
  if (CONFIG_ERROR_PATTERNS.some(p => haystack.includes(p.toLowerCase()))) return "config_error";
  if (TABLE_ERROR_PATTERNS.some(p => haystack.includes(p.toLowerCase()))) return "table_error";
  return "internal_error";
};
const sanitizeLegacyAuthMessage = (error) => {
  const raw = String(error?.message || "unexpected error");
  return raw
    .replace(/password_hash|password_salt|password|SUPABASE_SERVICE_ROLE_KEY|service_role|apikey|authorization|bearer|SUPABASE_URL/gi, "[redacted]")
    .slice(0, 180);
};
const logLegacyAuthError = ({ endpoint, stage, code, error }) => {
  console.error("[legacy-auth] endpoint failure", { endpoint, stage, code, message: sanitizeLegacyAuthMessage(error) });
};
const stageErrorResponse = ({ endpoint, stage, error }) => {
  const safeCode = classifyLegacyAuthError(error);
  logLegacyAuthError({ endpoint, stage, code: safeCode, error });
  return Response.json({ error: safeCode, stage }, { status: 500 });
};

export async function onRequestGet() { return Response.json({ ok: true, service: "legacy-auth-register" }); }
export async function onRequestPost({ request, env }) {
  let body = {};
  try {
    body = await request.json().catch(() => ({}));
  } catch (error) {
    return stageErrorResponse({ endpoint: ENDPOINT, stage: "parse_request", error });
  }

  const email = normalizeEmail(body?.email);
  const password = String(body?.password || "");
  const name = String(body?.name || "").trim();
  const role = String(body?.role || "").trim().toLowerCase();

  try {
    const rl = enforceRateLimit({ key: `legacy_register:${getClientKey(request, email)}`, max: 8, windowMs: 60_000 });
    if (!rl.allowed) return Response.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } });
    if (!EMAIL_RE.test(email) || !name || (role !== "coach" && role !== "player") || password.length < 8) {
      return Response.json({ error: "invalid_request" }, { status: 400 });
    }
  } catch (error) {
    return stageErrorResponse({ endpoint: ENDPOINT, stage: "validate_request", error });
  }

  let existing;
  try {
    existing = await selectRows(env, "legacy_auth_profiles", `select=email&email=eq.${encodeURIComponent(email)}&limit=1`);
  } catch (error) {
    return stageErrorResponse({ endpoint: ENDPOINT, stage: "select_existing_profile", error });
  }
  if (Array.isArray(existing) && existing.length > 0) return Response.json({ error: "account_exists" }, { status: 409 });

  let saltHex = "";
  try {
    saltHex = toHex(crypto.getRandomValues(new Uint8Array(16)));
  } catch (error) {
    return stageErrorResponse({ endpoint: ENDPOINT, stage: "generate_salt", error });
  }

  let hashHex = "";
  try {
    hashHex = await hashLegacyPassword(password, saltHex);
  } catch (error) {
    return stageErrorResponse({ endpoint: ENDPOINT, stage: "hash_password", error });
  }

  let inserted;
  try {
    inserted = await upsertRows(env, "legacy_auth_profiles", { email, password_hash: hashHex, password_salt: saltHex, name, role, team_id: null, hide_from_leaderboards: false }, "email");
  } catch (error) {
    return stageErrorResponse({ endpoint: ENDPOINT, stage: "insert_legacy_profile", error });
  }

  try {
    return Response.json({ profile: safeProfile(inserted?.[0] || { email, name, role, team_id: null, hide_from_leaderboards: false }) });
  } catch (error) {
    return stageErrorResponse({ endpoint: ENDPOINT, stage: "safe_profile_response", error });
  }
}
