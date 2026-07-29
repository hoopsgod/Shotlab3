import { insertRows, selectRows, updateRows } from "./supabase.js";

export const LEGACY_SESSION_COOKIE = "sl_legacy_session";
export const LEGACY_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

const DEMO_IDENTITIES = new Set(["coach.demo@shotlab.app", "demo@shotlab.app"]);
const normalizeIdentity = (value) => String(value || "").trim().toLowerCase();
const cleanText = (value, max = 500) => String(value ?? "").trim().slice(0, max);
const truthy = (value) => ["1", "true", "yes", "on"].includes(String(value || "").trim().toLowerCase());

function toHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function toBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "");
}

export async function hashLegacySessionToken(token) {
  const normalized = cleanText(token, 256);
  if (!normalized) return "";
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(normalized));
  return toHex(new Uint8Array(digest));
}

export function parseCookieHeader(header = "") {
  const cookies = new Map();
  for (const pair of String(header || "").split(";")) {
    const index = pair.indexOf("=");
    if (index < 1) continue;
    const key = pair.slice(0, index).trim();
    const value = pair.slice(index + 1).trim();
    if (key) cookies.set(key, value);
  }
  return cookies;
}

export function readLegacySessionToken(request) {
  return cleanText(parseCookieHeader(request?.headers?.get?.("cookie")).get(LEGACY_SESSION_COOKIE), 256);
}

function requestUrl(request) {
  try { return new URL(request?.url || "https://shotlab.invalid"); } catch { return new URL("https://shotlab.invalid"); }
}

function isSecureRequest(request) {
  return requestUrl(request).protocol === "https:";
}

function isDevelopmentHost(request) {
  const hostname = requestUrl(request).hostname.toLowerCase();
  return hostname === "localhost"
    || hostname === "127.0.0.1"
    || hostname === "::1"
    || hostname.endsWith(".test")
    || hostname.endsWith(".example.test");
}

function isShotLabDemoHost(request) {
  const hostname = requestUrl(request).hostname.toLowerCase();
  return hostname === "shotlab3.pages.dev" || hostname.endsWith(".shotlab3.pages.dev") || isDevelopmentHost(request);
}

export function isLegacyHeaderAuthAllowed(request, env = {}) {
  return truthy(env?.ALLOW_INSECURE_HEADER_AUTH) || isDevelopmentHost(request);
}

export function buildLegacySessionCookie(token, request, { maxAge = LEGACY_SESSION_MAX_AGE_SECONDS } = {}) {
  const expires = new Date(Date.now() + (Math.max(1, Number(maxAge) || LEGACY_SESSION_MAX_AGE_SECONDS) * 1000));
  const attributes = [
    `${LEGACY_SESSION_COOKIE}=${cleanText(token, 256)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${Math.max(1, Number(maxAge) || LEGACY_SESSION_MAX_AGE_SECONDS)}`,
    `Expires=${expires.toUTCString()}`,
  ];
  if (isSecureRequest(request)) attributes.push("Secure");
  return attributes.join("; ");
}

export function buildLegacySessionClearCookie(request) {
  const attributes = [
    `${LEGACY_SESSION_COOKIE}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
  ];
  if (isSecureRequest(request)) attributes.push("Secure");
  return attributes.join("; ");
}

export async function issueLegacySession({ env, request, profile, now = new Date() }) {
  const userEmail = normalizeIdentity(profile?.email);
  if (!userEmail) throw new Error("SESSION_EMAIL_REQUIRED");

  const random = new Uint8Array(32);
  crypto.getRandomValues(random);
  const token = toBase64Url(random);
  const tokenHash = await hashLegacySessionToken(token);
  const createdAt = new Date(now).toISOString();
  const expiresAt = new Date(new Date(now).getTime() + (LEGACY_SESSION_MAX_AGE_SECONDS * 1000)).toISOString();
  const role = ["coach", "assistant_coach"].includes(normalizeIdentity(profile?.role)) ? normalizeIdentity(profile.role) : "player";

  await insertRows(env, "legacy_auth_sessions", {
    token_hash: tokenHash,
    user_email: userEmail,
    user_role: role,
    team_id: cleanText(profile?.team_id || profile?.teamId, 160) || null,
    created_at: createdAt,
    last_seen_at: createdAt,
    expires_at: expiresAt,
    revoked_at: null,
  });

  return {
    token,
    tokenHash,
    userEmail,
    role,
    expiresAt,
    cookie: buildLegacySessionCookie(token, request),
  };
}

export async function readLegacySession({ env, request, now = new Date() }) {
  const token = readLegacySessionToken(request);
  if (!token) return null;
  const tokenHash = await hashLegacySessionToken(token);
  const rows = await selectRows(
    env,
    "legacy_auth_sessions",
    `select=token_hash,user_email,user_role,team_id,created_at,last_seen_at,expires_at,revoked_at&token_hash=eq.${encodeURIComponent(tokenHash)}&limit=1`,
  ).catch(() => []);
  const row = Array.isArray(rows) ? rows[0] : null;
  if (!row || row.revoked_at) return null;
  const expiresAt = Date.parse(row.expires_at || "");
  if (!Number.isFinite(expiresAt) || expiresAt <= new Date(now).getTime()) return null;
  return {
    tokenHash,
    userEmail: normalizeIdentity(row.user_email),
    role: normalizeIdentity(row.user_role) || "player",
    teamId: cleanText(row.team_id, 160) || null,
    expiresAt: new Date(expiresAt).toISOString(),
  };
}

export async function revokeLegacySession({ env, request, now = new Date() }) {
  const token = readLegacySessionToken(request);
  if (!token) return { revoked: false, cookie: buildLegacySessionClearCookie(request) };
  const tokenHash = await hashLegacySessionToken(token);
  const revokedAt = new Date(now).toISOString();
  await updateRows(
    env,
    "legacy_auth_sessions",
    `token_hash=eq.${encodeURIComponent(tokenHash)}&revoked_at=is.null`,
    { revoked_at: revokedAt, last_seen_at: revokedAt },
  );
  return { revoked: true, tokenHash, cookie: buildLegacySessionClearCookie(request) };
}

function bearerToken(request) {
  const header = String(request?.headers?.get?.("authorization") || "").trim();
  const match = header.match(/^Bearer\s+(.+)$/i);
  return cleanText(match?.[1], 8192);
}

export async function readSupabaseBearerIdentity({ env, request, fetchImpl = fetch }) {
  const token = bearerToken(request);
  const supabaseUrl = cleanText(env?.SUPABASE_URL || env?.VITE_SUPABASE_URL, 1000).replace(/\/$/, "");
  const anonKey = cleanText(env?.SUPABASE_ANON_KEY || env?.VITE_SUPABASE_ANON_KEY, 8192);
  if (!token || !supabaseUrl || !anonKey || typeof fetchImpl !== "function") return null;
  try {
    const response = await fetchImpl(`${supabaseUrl}/auth/v1/user`, {
      method: "GET",
      headers: { apikey: anonKey, Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return null;
    const user = await response.json().catch(() => null);
    const email = normalizeIdentity(user?.email);
    if (!email) return null;
    return { userEmail: email, userId: cleanText(user?.id, 160), role: "authenticated" };
  } catch {
    return null;
  }
}

function headerIdentity(request) {
  return normalizeIdentity(request?.headers?.get?.("x-user-id") || request?.headers?.get?.("x-user-email"));
}

export async function readAuthenticatedIdentity({ env, request, allowDemo = false }) {
  const session = await readLegacySession({ env, request }).catch(() => null);
  if (session?.userEmail) return { identity: session.userEmail, source: "legacy_session", session };

  const supabaseUser = await readSupabaseBearerIdentity({ env, request });
  if (supabaseUser?.userEmail) return { identity: supabaseUser.userEmail, source: "supabase_bearer", session: supabaseUser };

  const header = headerIdentity(request);
  if (allowDemo && DEMO_IDENTITIES.has(header) && isShotLabDemoHost(request)) {
    return { identity: header, source: "demo_header", session: null };
  }
  if (header && isLegacyHeaderAuthAllowed(request, env)) {
    return { identity: header, source: "development_header", session: null };
  }
  return { identity: "", source: "unauthenticated", session: null };
}
