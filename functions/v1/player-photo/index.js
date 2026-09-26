import { selectRows, updateRows } from "../../_utils/supabase.js";
import { enforceRateLimit, getClientKey } from "../../_utils/security.js";
import { readAuthenticatedIdentity } from "../../_utils/legacySession.js";

const BUCKET = "player-avatars";
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const COACH_ROLES = new Set(["coach", "assistant_coach"]);

const normalizeIdentity = (value) => String(value || "").trim().toLowerCase();
const cleanText = (value, max = 500) => String(value ?? "").trim().slice(0, max);

function storageConfig(env) {
  const baseUrl = cleanText(env?.SUPABASE_URL || env?.VITE_SUPABASE_URL, 1000).replace(/\/$/, "");
  const serviceRoleKey = cleanText(env?.SUPABASE_SERVICE_ROLE_KEY, 8192);
  if (!baseUrl) throw new Error("SUPABASE_URL_MISSING");
  if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY_MISSING");
  return { baseUrl, serviceRoleKey };
}

async function profileForIdentity(env, identity) {
  const email = normalizeIdentity(identity);
  if (!email) return null;
  const rows = await selectRows(
    env,
    "players",
    `select=id,email,role,team_id,photo_url&email=eq.${encodeURIComponent(email)}&limit=1`,
  );
  return Array.isArray(rows) ? rows[0] || null : null;
}

async function authorizePhotoTarget(request, env, requestedTarget = "") {
  const auth = await readAuthenticatedIdentity({ env, request, allowDemo: false });
  const requester = normalizeIdentity(auth?.identity);
  if (!requester) return { response: Response.json({ error: "unauthorized" }, { status: 401 }) };

  const actor = await profileForIdentity(env, requester);
  if (!actor) return { response: Response.json({ error: "profile_required" }, { status: 403 }) };

  const targetEmail = normalizeIdentity(requestedTarget || requester);
  const target = await profileForIdentity(env, targetEmail);
  if (!target || normalizeIdentity(target?.role) !== "player") {
    return { response: Response.json({ error: "player_profile_required" }, { status: 404 }) };
  }

  const actorRole = normalizeIdentity(actor?.role);
  const actorTeamId = cleanText(actor?.team_id, 180);
  const targetTeamId = cleanText(target?.team_id, 180);
  const playerOwnsTarget = actorRole === "player" && requester === targetEmail;
  const coachOwnsTarget = COACH_ROLES.has(actorRole) && actorTeamId && actorTeamId === targetTeamId;
  if (!playerOwnsTarget && !coachOwnsTarget) {
    return { response: Response.json({ error: "player_photo_target_forbidden" }, { status: 403 }) };
  }

  return { requester, actor, target, targetEmail };
}

async function opaquePlayerKey(identity) {
  const bytes = new TextEncoder().encode(normalizeIdentity(identity));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url);
    const auth = await authorizePhotoTarget(request, env, url.searchParams.get("player_email") || "");
    if (auth.response) return auth.response;
    const rate = enforceRateLimit({
      key: `player_photo_get:${getClientKey(request, auth.requester)}`,
      max: 60,
      windowMs: 60_000,
    });
    if (!rate.allowed) return Response.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
    return Response.json({ ok: true, storage_mode: "signed_api", photo_url: cleanText(auth.target?.photo_url, 2000) || null });
  } catch (error) {
    console.error("player_photo_get_failed", { message: cleanText(error?.message, 180) });
    return Response.json({ error: "player_photo_load_failed" }, { status: 500 });
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const form = await request.formData().catch(() => null);
    const file = form?.get?.("file");
    const auth = await authorizePhotoTarget(request, env, form?.get?.("player_email") || "");
    if (auth.response) return auth.response;
    const rate = enforceRateLimit({
      key: `player_photo_post:${getClientKey(request, auth.requester)}`,
      max: 10,
      windowMs: 60_000,
    });
    if (!rate.allowed) return Response.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });

    if (!file || typeof file.arrayBuffer !== "function") {
      return Response.json({ error: "profile_photo_required" }, { status: 400 });
    }
    const contentType = cleanText(file.type, 100).toLowerCase();
    if (!ALLOWED_TYPES.has(contentType)) {
      return Response.json({ error: "profile_photo_type_invalid", message: "Use a JPG, PNG, or WebP image." }, { status: 415 });
    }
    const size = Number(file.size || 0);
    if (!Number.isFinite(size) || size <= 0 || size > MAX_BYTES) {
      return Response.json({ error: "profile_photo_size_invalid", message: "Profile photos must be 5 MB or smaller." }, { status: 413 });
    }

    const { baseUrl, serviceRoleKey } = storageConfig(env);
    const playerKey = await opaquePlayerKey(auth.targetEmail);
    const objectPath = `${playerKey}/avatar`;
    const objectUrl = `${baseUrl}/storage/v1/object/${BUCKET}/${objectPath}`;
    const bytes = await file.arrayBuffer();
    const upload = await fetch(objectUrl, {
      method: "POST",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": contentType,
        "cache-control": "3600",
        "x-upsert": "true",
      },
      body: bytes,
    });
    if (!upload.ok) {
      const detail = await upload.text().catch(() => "");
      console.error("player_photo_storage_failed", { status: upload.status, detail: cleanText(detail, 240) });
      return Response.json({ error: "profile_photo_storage_failed" }, { status: 502 });
    }

    const photoUrl = `${baseUrl}/storage/v1/object/public/${BUCKET}/${objectPath}?v=${Date.now()}`;
    const updated = await updateRows(
      env,
      "players",
      `email=eq.${encodeURIComponent(auth.targetEmail)}&role=eq.player`,
      { photo_url: photoUrl },
    );
    if (!Array.isArray(updated) || updated.length !== 1) {
      return Response.json({ error: "profile_photo_identity_update_failed" }, { status: 409 });
    }

    return Response.json({ ok: true, storage_mode: "signed_api", photo_url: photoUrl });
  } catch (error) {
    console.error("player_photo_post_failed", { message: cleanText(error?.message, 180) });
    return Response.json({ error: "profile_photo_save_failed" }, { status: 500 });
  }
}
