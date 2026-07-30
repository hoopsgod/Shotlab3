import { insertRows, selectRows } from "../../_utils/supabase.js";
import { readAuthenticatedIdentity } from "../../_utils/legacySession.js";
import { enforceRateLimit, getClientKey } from "../../_utils/security.js";
import { collectTeamPriorityAccess } from "../team-priorities/index.js";

const normalizeIdentity = (value) => String(value || "").trim().toLowerCase();
const cleanText = (value) => String(value ?? "").trim();
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_SNAPSHOT_BYTES = 2_500_000;
const DEMO_COACH_EMAIL = "coach.demo@shotlab.app";
const DEMO_IDENTITIES = new Set([DEMO_COACH_EMAIL, "demo@shotlab.app"]);

function isDemoCoach(requester) {
  return normalizeIdentity(requester) === DEMO_COACH_EMAIL;
}

function safeErrorCode(error) {
  return cleanText(error?.details?.code || error?.code || "").toLowerCase();
}

function isDuplicateError(error) {
  const code = safeErrorCode(error);
  const text = [error?.message, error?.details?.message, error?.details?.details]
    .map((value) => String(value || "").toLowerCase())
    .join(" ");
  return code === "23505" || text.includes("duplicate key") || text.includes("unique constraint");
}

function validIsoDate(value) {
  if (!ISO_DATE.test(cleanText(value))) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

async function sha256(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function validateArchiveInput(body = {}, requester = "") {
  const archiveInput = body?.archive;
  if (!archiveInput || typeof archiveInput !== "object" || Array.isArray(archiveInput)) {
    return { ok: false, error: "invalid_archive_snapshot" };
  }

  const teamId = cleanText(body?.team_id || body?.teamId || archiveInput?.teamId);
  const archiveTeamId = cleanText(archiveInput?.teamId);
  const id = cleanText(archiveInput?.id);
  const seasonName = cleanText(archiveInput?.seasonName);
  const seasonStartDate = cleanText(archiveInput?.seasonStartDate);
  const seasonEndDate = cleanText(archiveInput?.seasonEndDate);
  const version = Number(archiveInput?.version || 2);

  if (!teamId || teamId !== archiveTeamId) return { ok: false, error: "team_mismatch" };
  if (!id || id.length > 220) return { ok: false, error: "invalid_archive_id" };
  if (!seasonName || seasonName.length > 120) return { ok: false, error: "invalid_season_name" };
  if (!validIsoDate(seasonStartDate) || !validIsoDate(seasonEndDate) || seasonStartDate > seasonEndDate) {
    return { ok: false, error: "invalid_season_range" };
  }
  if (!Number.isInteger(version) || version < 1 || version > 20) return { ok: false, error: "invalid_archive_version" };

  const createdAt = new Date().toISOString();
  const archive = JSON.parse(JSON.stringify({
    ...archiveInput,
    teamId,
    seasonName,
    seasonStartDate,
    seasonEndDate,
    createdAt,
    version,
    archivedBy: {
      ...(archiveInput?.archivedBy && typeof archiveInput.archivedBy === "object" ? archiveInput.archivedBy : {}),
      email: normalizeIdentity(requester),
      role: "coach",
    },
  }));
  const serialized = JSON.stringify(archive);
  if (new TextEncoder().encode(serialized).byteLength > MAX_SNAPSHOT_BYTES) {
    return { ok: false, error: "archive_snapshot_too_large" };
  }

  return { ok: true, teamId, archive, serialized };
}

function rowToArchive(row = {}) {
  const snapshot = row?.snapshot && typeof row.snapshot === "object" ? row.snapshot : {};
  return {
    ...snapshot,
    id: cleanText(row?.id || snapshot?.id),
    teamId: cleanText(row?.team_id || snapshot?.teamId),
    seasonName: cleanText(row?.season_name || snapshot?.seasonName),
    seasonStartDate: cleanText(row?.season_start_date || snapshot?.seasonStartDate),
    seasonEndDate: cleanText(row?.season_end_date || snapshot?.seasonEndDate),
    createdAt: cleanText(row?.created_at || snapshot?.createdAt),
    version: Number(row?.archive_version || snapshot?.version || 2),
  };
}

function archiveIdentityTokens(row = {}) {
  return [
    row.email,
    row.player_email,
    row.playerEmail,
    row.userId,
    row.user_id,
    row.playerId,
    row.player_id,
  ].map(normalizeIdentity).filter(Boolean);
}

function rowBelongsToPlayer(row = {}, requester = "", resolvedUuid = "") {
  const allowed = new Set([normalizeIdentity(requester), normalizeIdentity(resolvedUuid)].filter(Boolean));
  return archiveIdentityTokens(row).some((token) => allowed.has(token));
}

function playerArchiveProjection(archive = {}, requester = "", resolvedUuid = "") {
  const ownRows = (rows) => (Array.isArray(rows) ? rows : [])
    .filter((row) => rowBelongsToPlayer(row, requester, resolvedUuid))
    .map((row) => JSON.parse(JSON.stringify(row)));
  const playerSeasonSummaries = ownRows(archive.playerSeasonSummaries);
  const homeScoresSnapshot = ownRows(archive.homeScoresSnapshot);
  const programScoresSnapshot = ownRows(archive.programScoresSnapshot);
  const shotLogsSnapshot = ownRows(archive.shotLogsSnapshot);
  const eventRsvpSnapshot = ownRows(archive.eventRsvpSnapshot);
  const scRsvpSnapshot = ownRows(archive.scRsvpSnapshot);
  const scLogSnapshot = ownRows(archive.scLogSnapshot);
  const hasPlayerHistory = [
    playerSeasonSummaries,
    homeScoresSnapshot,
    programScoresSnapshot,
    shotLogsSnapshot,
    eventRsvpSnapshot,
    scRsvpSnapshot,
    scLogSnapshot,
  ].some((rows) => rows.length);
  if (!hasPlayerHistory) return null;
  return {
    id: cleanText(archive.id),
    teamId: cleanText(archive.teamId),
    seasonName: cleanText(archive.seasonName),
    seasonStartDate: cleanText(archive.seasonStartDate),
    seasonEndDate: cleanText(archive.seasonEndDate),
    createdAt: cleanText(archive.createdAt),
    version: Number(archive.version || 2),
    accessMode: "player_self",
    playerSeasonSummaries,
    homeScoresSnapshot,
    programScoresSnapshot,
    shotLogsSnapshot,
    eventRsvpSnapshot,
    scRsvpSnapshot,
    scLogSnapshot,
  };
}

async function authenticate(request, env) {
  return readAuthenticatedIdentity({ env, request, allowDemo: true });
}

export async function onRequestGet({ request, env }) {
  const auth = await authenticate(request, env);
  const requester = normalizeIdentity(auth?.identity);
  if (!requester) return Response.json({ error: "unauthorized" }, { status: 401 });

  const rate = enforceRateLimit({
    key: `season_archives_get:${getClientKey(request, requester)}`,
    max: 60,
    windowMs: 60_000,
  });
  if (!rate.allowed) {
    return Response.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  }

  // Demo archives intentionally live only in browser storage. A non-2xx response
  // makes the client retain its local cache instead of replacing it with server data.
  if (auth.source === "demo_header" && DEMO_IDENTITIES.has(requester)) {
    return Response.json({ error: "demo_local_only", local_only: true }, { status: 409 });
  }

  try {
    const { readableTeamIds, writableTeamIds, resolvedUuid } = await collectTeamPriorityAccess(env, requester);
    if (!readableTeamIds.size) return Response.json({ error: "forbidden" }, { status: 403 });
    const requestedTeamId = cleanText(new URL(request.url).searchParams.get("team_id"));
    const teamIds = requestedTeamId
      ? (readableTeamIds.has(requestedTeamId) ? [requestedTeamId] : [])
      : [...readableTeamIds];
    if (requestedTeamId && !teamIds.length) return Response.json({ error: "forbidden" }, { status: 403 });
    const archives = [];
    for (const teamId of teamIds) {
      const rows = await selectRows(
        env,
        "season_archives",
        `select=id,team_id,season_name,season_start_date,season_end_date,created_at,archive_version,snapshot&team_id=eq.${encodeURIComponent(teamId)}&order=created_at.asc`,
      );
      for (const row of Array.isArray(rows) ? rows : []) {
        const archive = rowToArchive(row);
        if (writableTeamIds.has(teamId)) {
          archives.push(archive);
          continue;
        }
        const projection = playerArchiveProjection(archive, requester, resolvedUuid);
        if (projection) archives.push(projection);
      }
    }
    archives.sort((a, b) => String(a.createdAt || "").localeCompare(String(b.createdAt || "")));
    return Response.json({ ok: true, archives });
  } catch (error) {
    console.error("season_archives_get_failed", { message: cleanText(error?.message).slice(0, 160) });
    return Response.json({ error: "archive_load_failed" }, { status: 500 });
  }
}

export async function onRequestPost({ request, env }) {
  const auth = await authenticate(request, env);
  const requester = normalizeIdentity(auth?.identity);
  if (!requester) return Response.json({ error: "unauthorized" }, { status: 401 });

  const rate = enforceRateLimit({
    key: `season_archives_post:${getClientKey(request, requester)}`,
    max: 8,
    windowMs: 60_000,
  });
  if (!rate.allowed) {
    return Response.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  }

  const body = await request.json().catch(() => null);
  const validated = validateArchiveInput(body || {}, requester);
  if (!validated.ok) return Response.json({ error: validated.error }, { status: 400 });

  // Demo Coach has no production membership. Return the validated snapshot without
  // writing it server-side; createSeasonArchive will cache it locally and mark it read-only.
  if (auth.source === "demo_header" && isDemoCoach(requester)) {
    return Response.json({
      ok: true,
      archive: {
        ...validated.archive,
        storageMode: "demo_local",
        demoLocalOnly: true,
      },
    }, { status: 201 });
  }

  try {
    const { writableTeamIds, resolvedUuid } = await collectTeamPriorityAccess(env, requester);
    if (!writableTeamIds.has(validated.teamId)) return Response.json({ error: "forbidden" }, { status: 403 });

    const row = {
      id: validated.archive.id,
      team_id: validated.teamId,
      season_name: validated.archive.seasonName,
      season_start_date: validated.archive.seasonStartDate,
      season_end_date: validated.archive.seasonEndDate,
      created_at: validated.archive.createdAt,
      created_by: requester,
      created_by_user_id: resolvedUuid || null,
      archive_version: validated.archive.version,
      snapshot: validated.archive,
      snapshot_hash: await sha256(validated.serialized),
    };

    const inserted = await insertRows(env, "season_archives", row);
    const saved = Array.isArray(inserted) && inserted[0] ? rowToArchive(inserted[0]) : validated.archive;
    return Response.json({ ok: true, archive: saved }, { status: 201 });
  } catch (error) {
    if (isDuplicateError(error)) return Response.json({ error: "duplicate_archive" }, { status: 409 });
    console.error("season_archive_create_failed", { message: cleanText(error?.message).slice(0, 160) });
    return Response.json({ error: "archive_write_failed" }, { status: 500 });
  }
}
