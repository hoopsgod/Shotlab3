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

  const result = await revokeLegacySession({ env, request }).catch(() => ({ revoked: false }));
  return Response.json(
    { ok: true, revoked: result.revoked === true },
    { headers: { "Set-Cookie": result.cookie || buildLegacySessionClearCookie(request), "Cache-Control": "no-store" } },
  );
}
