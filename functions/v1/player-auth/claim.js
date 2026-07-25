import { enforceRateLimit, getClientKey } from "../../_utils/security.js";
import { callRpc } from "../../_utils/supabase.js";
import { hashLegacyPassword } from "../legacy-auth/_password.js";

const clean = (value) => String(value ?? "").trim();
const toHex = (bytes) => Array.from(bytes).map((byte) => byte.toString(16).padStart(2, "0")).join("");
const sha256Hex = async (value) => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return toHex(new Uint8Array(digest));
};

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => ({}));
  const token = clean(body?.setup_token || body?.token);
  const password = String(body?.new_password || body?.password || "");
  const rate = enforceRateLimit({ key: `player_invite_claim:${getClientKey(request, token.slice(0, 12))}`, max: 10, windowMs: 60_000 });
  if (!rate.allowed) return Response.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  if (token.length < 32 || password.length < 8) return Response.json({ error: "invalid_request" }, { status: 400 });

  const tokenHash = await sha256Hex(token);
  const saltHex = toHex(crypto.getRandomValues(new Uint8Array(16)));
  const passwordHash = await hashLegacyPassword(password, saltHex);
  try {
    const result = await callRpc(env, "claim_coach_player_invitation", {
      p_token_hash: tokenHash,
      p_password_hash: passwordHash,
      p_password_salt: saltHex,
    });
    const payload = Array.isArray(result) ? result[0] : result;
    return Response.json(payload && typeof payload === "object" ? payload : { ok: true }, { status: 200 });
  } catch (error) {
    const message = clean(error?.message || error?.details?.message).toUpperCase();
    if (message.includes("INVITATION_NOT_FOUND")) return Response.json({ error: "invitation_not_found" }, { status: 404 });
    if (message.includes("INVITATION_EXPIRED")) return Response.json({ error: "invitation_expired" }, { status: 410 });
    if (message.includes("INVITATION_NOT_ACTIVE")) return Response.json({ error: "invitation_not_active" }, { status: 409 });
    if (message.includes("ACCOUNT_TEAM_CONFLICT")) return Response.json({ error: "account_on_other_team" }, { status: 409 });
    if (message.includes("ACCOUNT_ROLE_CONFLICT")) return Response.json({ error: "account_role_conflict" }, { status: 409 });
    console.error("coach_player_invite_claim_failed", { message: clean(error?.message).slice(0, 160) });
    return Response.json({ error: "claim_failed" }, { status: 500 });
  }
}
