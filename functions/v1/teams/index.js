import { selectRows, upsertRows } from "../../_utils/supabase.js";
import { enforceRateLimit, getClientKey } from "../../_utils/security.js";
import { readAuthenticatedIdentity } from "../../_utils/legacySession.js";
import { collectTeamPriorityAccess } from "../team-priorities/index.js";

const DEMO_IDENTITIES = new Set(["coach.demo@shotlab.app", "demo@shotlab.app"]);
const MAX_TEAMS_PER_REQUEST = 100;
const MAX_LOGO_SOURCE_LENGTH = 8_600_000;
const BRAND_COLOR_RE = /^#[0-9a-f]{6}$/i;
const DATA_IMAGE_RE = /^data:image\/(?:png|jpe?g|webp|svg\+xml);base64,/i;
const HTTP_URL_RE = /^https?:\/\//i;
const TEXT_SCALES = new Set(["standard", "large", "xl"]);

const normalizeIdentity = (value) => String(value || "").trim().toLowerCase();
const cleanText = (value, max = 500) => String(value ?? "").trim().slice(0, max);
const finiteNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

function cleanBrandColor(value) {
  const color = cleanText(value, 32);
  return BRAND_COLOR_RE.test(color) ? color : "";
}

function cleanLogoSource(value) {
  if (typeof value !== "string") return "";
  const source = value.trim();
  if (!source || source.length > MAX_LOGO_SOURCE_LENGTH) return "";
  if (DATA_IMAGE_RE.test(source) || HTTP_URL_RE.test(source) || /^\/(?!\/)/.test(source)) return source;
  return "";
}

export function sanitizeTeamBranding(value = null) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const branding = {};
  const primaryColor = cleanBrandColor(value.primaryColor);
  const secondaryColor = cleanBrandColor(value.secondaryColor);
  const accentColor = cleanBrandColor(value.accentColor);
  const textOnPrimary = cleanBrandColor(value.textOnPrimary);
  const logoUrl = cleanLogoSource(value.logoUrl);
  const logoMarkUrl = cleanLogoSource(value.logoMarkUrl);
  const textScale = cleanText(value.textScale, 24);
  const updatedAt = finiteNumber(value.updatedAt);
  const version = finiteNumber(value.version);

  if (primaryColor) branding.primaryColor = primaryColor;
  if (secondaryColor) branding.secondaryColor = secondaryColor;
  if (accentColor) branding.accentColor = accentColor;
  if (textOnPrimary) branding.textOnPrimary = textOnPrimary;
  if (logoUrl) branding.logoUrl = logoUrl;
  if (logoMarkUrl) branding.logoMarkUrl = logoMarkUrl;
  if (TEXT_SCALES.has(textScale)) branding.textScale = textScale;
  if (updatedAt != null && updatedAt >= 0) branding.updatedAt = updatedAt;
  if (value.updatedBy) branding.updatedBy = normalizeIdentity(value.updatedBy).slice(0, 320);
  if (version != null && version >= 1) branding.version = Math.floor(version);

  return Object.keys(branding).length ? branding : null;
}

export function sanitizeTeamRow(value = {}) {
  return {
    id: cleanText(value?.id, 180),
    name: cleanText(value?.name, 240),
    ownerCoachId: normalizeIdentity(value?.owner_coach_id || value?.ownerCoachId),
    joinCode: cleanText(value?.join_code || value?.joinCode, 80).toUpperCase(),
    createdAt: finiteNumber(value?.created_at ?? value?.createdAt),
    updatedAt: finiteNumber(value?.updated_at ?? value?.updatedAt),
    coachUserId: cleanText(value?.coach_user_id || value?.coachUserId, 80),
    school: cleanText(value?.school, 240),
    level: cleanText(value?.level, 120),
    branding: sanitizeTeamBranding(value?.branding),
  };
}

function toDatabase(row) {
  return {
    id: row.id,
    name: row.name || null,
    owner_coach_id: row.ownerCoachId || null,
    join_code: row.joinCode || null,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
    coach_user_id: row.coachUserId || null,
    school: row.school || null,
    level: row.level || null,
    ...(row.branding ? { branding: row.branding } : {}),
  };
}

function toResponse(value = {}) {
  const row = sanitizeTeamRow(value);
  return {
    id: row.id,
    name: row.name,
    owner_coach_id: row.ownerCoachId || null,
    join_code: row.joinCode || null,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
    coach_user_id: row.coachUserId || null,
    school: row.school,
    level: row.level,
    branding: row.branding,
  };
}

async function authenticate(request, env) {
  return readAuthenticatedIdentity({ env, request, allowDemo: true });
}

async function readTeam(env, teamId) {
  const rows = await selectRows(
    env,
    "teams",
    `select=id,name,owner_coach_id,join_code,created_at,updated_at,coach_user_id,school,level,branding&id=eq.${encodeURIComponent(teamId)}&limit=1`,
  );
  return Array.isArray(rows) ? rows[0] || null : null;
}

async function readTeams(env, teamIds) {
  const rows = [];
  for (const teamId of teamIds) {
    const team = await readTeam(env, teamId);
    if (team) rows.push(toResponse(team));
  }
  return rows;
}

async function joinCodeConflict(env, joinCode, teamId) {
  if (!joinCode) return false;
  const rows = await selectRows(
    env,
    "teams",
    `select=id,join_code&join_code=eq.${encodeURIComponent(joinCode)}&limit=10`,
  );
  return (Array.isArray(rows) ? rows : []).some((row) => cleanText(row?.id, 180) !== teamId);
}

function demoResponse(teams = []) {
  return Response.json({ ok: true, storage_mode: "demo_local", teams });
}

export async function onRequestGet({ request, env }) {
  const auth = await authenticate(request, env);
  const requester = normalizeIdentity(auth?.identity);
  if (!requester) return Response.json({ error: "unauthorized" }, { status: 401 });

  const rate = enforceRateLimit({ key: `teams_get:${getClientKey(request, requester)}`, max: 60, windowMs: 60_000 });
  if (!rate.allowed) return Response.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  if (DEMO_IDENTITIES.has(requester)) return demoResponse();

  try {
    const { readableTeamIds } = await collectTeamPriorityAccess(env, requester);
    const requestedTeamId = cleanText(new URL(request.url).searchParams.get("team_id"), 180);
    if (requestedTeamId && !readableTeamIds.has(requestedTeamId)) return Response.json({ error: "forbidden" }, { status: 403 });
    const teamIds = requestedTeamId ? [requestedTeamId] : [...readableTeamIds];
    return Response.json({ ok: true, storage_mode: "signed_api", teams: await readTeams(env, teamIds) });
  } catch (error) {
    console.error("teams_get_failed", { message: cleanText(error?.message, 180) });
    return Response.json({ error: "team_load_failed" }, { status: 500 });
  }
}

export async function onRequestPost({ request, env }) {
  const auth = await authenticate(request, env);
  const requester = normalizeIdentity(auth?.identity);
  if (!requester) return Response.json({ error: "unauthorized" }, { status: 401 });

  const rate = enforceRateLimit({ key: `teams_post:${getClientKey(request, requester)}`, max: 20, windowMs: 60_000 });
  if (!rate.allowed) return Response.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });

  const body = await request.json().catch(() => null);
  const inputRows = Array.isArray(body?.teams) ? body.teams : [];
  if (inputRows.length > MAX_TEAMS_PER_REQUEST) return Response.json({ error: "too_many_teams" }, { status: 400 });
  const rows = inputRows.map(sanitizeTeamRow);
  if (rows.some((row) => !row.id)) return Response.json({ error: "team_id_required" }, { status: 400 });
  if (new Set(rows.map((row) => row.id)).size !== rows.length) return Response.json({ error: "duplicate_team_id" }, { status: 400 });
  if (DEMO_IDENTITIES.has(requester)) return demoResponse(rows.map(toResponse));

  try {
    const { readableTeamIds, writableTeamIds } = await collectTeamPriorityAccess(env, requester);
    const upserts = [];
    let ignoredCount = 0;

    for (const row of rows) {
      const priorRaw = await readTeam(env, row.id);
      if (!priorRaw) return Response.json({ error: "team_creation_requires_create_route" }, { status: 409 });
      if (!writableTeamIds.has(row.id)) {
        ignoredCount += 1;
        continue;
      }
      const prior = sanitizeTeamRow(priorRaw);
      if (row.ownerCoachId && row.ownerCoachId !== prior.ownerCoachId) return Response.json({ error: "team_owner_immutable" }, { status: 409 });
      if (row.coachUserId && row.coachUserId !== prior.coachUserId) return Response.json({ error: "team_owner_uuid_immutable" }, { status: 409 });
      if (row.createdAt != null && prior.createdAt != null && row.createdAt !== prior.createdAt) return Response.json({ error: "team_created_at_immutable" }, { status: 409 });
      if (row.joinCode && row.joinCode !== prior.joinCode && await joinCodeConflict(env, row.joinCode, row.id)) {
        return Response.json({ error: "join_code_conflict" }, { status: 409 });
      }

      let branding = prior.branding;
      if (row.branding) {
        const requestedVersion = Number(row.branding.version || 0);
        const priorVersion = Number(prior.branding?.version || 0);
        branding = sanitizeTeamBranding({
          ...(prior.branding || {}),
          ...row.branding,
          updatedAt: Date.now(),
          updatedBy: requester,
          version: Math.max(priorVersion + 1, requestedVersion, 1),
        });
      }

      upserts.push(toDatabase({
        ...prior,
        name: row.name || prior.name,
        joinCode: row.joinCode || prior.joinCode,
        school: row.school,
        level: row.level,
        branding,
        updatedAt: Date.now(),
      }));
    }

    if (upserts.length) await upsertRows(env, "teams", upserts, "id");
    return Response.json({
      ok: true,
      storage_mode: "signed_api",
      teams: await readTeams(env, [...readableTeamIds]),
      ignored_count: ignoredCount,
    });
  } catch (error) {
    console.error("teams_post_failed", { message: cleanText(error?.message, 180) });
    return Response.json({ error: "team_sync_failed" }, { status: 500 });
  }
}
