import { readUserId, selectRows, upsertRows } from "../../_utils/supabase.js";

const MAX_MADE = 10000;
const norm = value => String(value || "").trim().toLowerCase();
const safe = value => String(value || "unknown_error").trim().slice(0, 140) || "unknown_error";

function parseMade(value) {
  const raw = String(value ?? "").trim();
  if (!/^[0-9]+$/.test(raw)) return null;
  const n = Number(raw);
  return Number.isInteger(n) && Number.isSafeInteger(n) && n > 0 && n <= MAX_MADE ? n : null;
}

function toIso(value) {
  if (value == null || value === "") return new Date(Date.now()).toISOString();
  if (typeof value === "number" && Number.isFinite(value)) return new Date(value).toISOString();
  const raw = String(value).trim();
  if (/^[0-9]+$/.test(raw)) return new Date(Number(raw)).toISOString();
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? new Date(Date.now()).toISOString() : parsed.toISOString();
}

function isTolerableLookupError(error) {
  const status = Number(error?.status || 0);
  const message = safe(error?.message).toLowerCase();
  if (status >= 500) return false;
  return status === 400 || status === 404 || message.includes("column") || message.includes("schema cache") || message.includes("could not find");
}

function profileMatches(row, teamId) {
  return norm(row?.role || "player") === "player" && String(row?.team_id || row?.teamId || "").trim() === teamId;
}

async function findLegacyProfile(env, requester, teamId, diagnostic) {
  diagnostic.legacy_profile_query_attempted = "yes";
  const queries = [
    ["team_id_exact", `select=email,name,role,team_id&email=eq.${encodeURIComponent(requester)}&team_id=eq.${encodeURIComponent(teamId)}&role=eq.player&limit=1`],
    ["teamId_exact", `select=email,name,role,teamId&email=eq.${encodeURIComponent(requester)}&teamId=eq.${encodeURIComponent(teamId)}&role=eq.player&limit=1`],
    ["team_id_fallback", `select=email,name,role,team_id&email=eq.${encodeURIComponent(requester)}&limit=5`],
    ["teamId_fallback", `select=email,name,role,teamId&email=eq.${encodeURIComponent(requester)}&limit=5`],
  ];
  const notes = [];
  for (const [label, query] of queries) {
    try {
      const rows = await selectRows(env, "legacy_auth_profiles", query);
      const match = Array.isArray(rows) ? rows.find(row => profileMatches(row, teamId)) : null;
      if (match) {
        diagnostic.legacy_profile_query_result = `match:${label}`;
        return match;
      }
      if (Array.isArray(rows) && rows.length) diagnostic.legacy_profile_query_result = `team_mismatch:${label}`;
    } catch (error) {
      notes.push(`${label}:${safe(error?.message)}`);
      if (!isTolerableLookupError(error)) {
        diagnostic.legacy_profile_query_result = `error:${safe(error?.message)}`;
        return null;
      }
    }
  }
  diagnostic.legacy_profile_query_result = notes.length ? `0;errors=${notes.slice(0, 3).join("|")}` : (diagnostic.legacy_profile_query_result || "0");
  return null;
}

async function insertShot(env, row, diagnostic) {
  const omit = (source, keys) => Object.fromEntries(Object.entries(source).filter(([key]) => !keys.includes(key)));
  const variants = [
    ["full", row],
    ["without_client_id", omit(row, ["id"])],
    ["without_ts", omit(row, ["ts"])],
    ["without_client_id_or_ts", omit(row, ["id", "ts"])],
  ];
  const errors = [];
  for (const [label, payload] of variants) {
    try {
      const inserted = await upsertRows(env, "shot_logs", payload);
      diagnostic.shot_logs_insert_success = "yes";
      diagnostic.shot_logs_insert_error = "none";
      diagnostic.shot_logs_insert_variant = label;
      return Array.isArray(inserted) ? inserted[0] || payload : payload;
    } catch (error) {
      errors.push(`${label}:${safe(error?.message)}`);
    }
  }
  diagnostic.shot_logs_insert_success = "no";
  diagnostic.shot_logs_insert_error = errors.at(-1) || "persist_failed";
  diagnostic.shot_logs_insert_variants_failed = errors.slice(0, 4).join("|");
  return null;
}

function shouldHandle(request) {
  const path = new URL(request.url).pathname.replace(/\/+$/, "");
  return request.method === "POST" && path.endsWith("/v1/home-shots/log");
}

export async function onRequest(context) {
  const { request, env } = context;
  if (!shouldHandle(request)) return context.next();

  const requester = norm(readUserId(request));
  const diagnostic = {
    stage: "legacy_profile_home_shot_middleware",
    requester_present: requester ? "yes" : "no",
    submitted_team_id_present: "no",
    submitted_player_identity_matches_requester: "no",
    legacy_profile_query_attempted: "no",
    legacy_profile_query_result: "not_attempted",
    authorized_by: "none",
    shot_logs_insert_attempted: "no",
    shot_logs_insert_success: "no",
    shot_logs_insert_error: "none",
    shot_logs_insert_variant: "not_attempted",
  };

  if (!requester) return context.next();
  const body = await request.clone().json().catch(() => ({}));
  const teamId = String(body.team_id ?? body.teamId ?? "").trim();
  const submittedIdentity = norm(body.player_id ?? body.playerId ?? body.email);
  const made = parseMade(body.made);
  const date = String(body.date || "").trim();

  diagnostic.submitted_team_id_present = teamId ? "yes" : "no";
  diagnostic.submitted_player_identity_matches_requester = submittedIdentity === requester ? "yes" : "no";

  if (!teamId || !submittedIdentity || submittedIdentity !== requester || made == null || !date) return context.next();

  const profile = await findLegacyProfile(env, requester, teamId, diagnostic);
  if (!profile) return context.next();

  diagnostic.authorized_by = "legacy_profile";
  diagnostic.shot_logs_insert_attempted = "yes";

  const row = {
    id: String(body.id || "").trim() || `shotlog_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    email: requester,
    name: String(body.name || profile.name || requester).trim() || requester,
    player_id: requester,
    team_id: teamId,
    made,
    date,
    ts: toIso(body.ts),
  };

  const inserted = await insertShot(env, row, diagnostic);
  if (!inserted) return Response.json({ ok: false, error: "persist_failed", diagnostic }, { status: 500 });
  return Response.json({ ok: true, shot_log: inserted, diagnostic }, { status: 200 });
}
