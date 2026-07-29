import { enforceRateLimit, getClientKey } from "../../../_utils/security.js";
import { buildLegacySessionClearCookie, revokeLegacySession } from "../../../_utils/legacySession.js";

export async function onRequestGet() {
  return Response.json({ ok: true, service: "legacy-auth-logout" });
}

export async function onRequestPost({ request, env }) {
  const rate = enforceRateLimit({
    key: `legacy_logout:${getClientKey(request, "session")}`,
    max: 30,
    windowMs: 60_000,
  });
  if (!rate.allowed) {
    return Response.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  }

  try {
    const result = await revokeLegacySession({ env, request });
    return Response.json(
      { ok: true, revoked: result.revoked === true },
      { headers: { "Set-Cookie": result.cookie, "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("legacy_session_revoke_failed", { message: String(error?.message || "revocation failed").slice(0, 120) });
    return Response.json(
      { ok: false, error: "session_revoke_failed" },
      { status: 503, headers: { "Set-Cookie": buildLegacySessionClearCookie(request), "Cache-Control": "no-store" } },
    );
  }
}
