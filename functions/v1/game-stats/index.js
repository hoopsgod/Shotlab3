import { selectRows, upsertRows } from "../../_utils/supabase.js";
import { enforceRateLimit, getClientKey } from "../../_utils/security.js";
import { readAuthenticatedIdentity } from "../../_utils/legacySession.js";
import { collectTeamPriorityAccess } from "../team-priorities/index.js";
import { buildGameStatCsvPreview, normalizeDate } from "../../../src/lib/gameStatCsv.js";
import { buildGameStatIntelligence } from "../../../src/lib/gameStatAnalytics.js";

const DEMO_IDENTITIES = new Set(["coach.demo@shotlab.app", "demo@shotlab.app"]);
const READ_PAGE_SIZE = 5000;
const MAX_STAT_ROWS_PER_IMPORT = 20_000;
const clean = (value, max = 500) => String(value ?? "").trim().slice(0, max);
const normalizeIdentity = (value) => clean(value, 320).toLowerCase();

async function authenticate(request, env) {
  return readAuthenticatedIdentity({ env, request, allowDemo: true });
}

async function sha256Hex(value) {
  const bytes = new TextEncoder().encode(String(value ?? ""));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function stableHash(value) {
  const source = String(value ?? "");
  let h1 = 0xdeadbeef ^ source.length;
  let h2 = 0x41c6ce57 ^ source.length;
  for (let i = 0; i < source.length; i += 1) {
    const ch = source.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return `${(h2 >>> 0).toString(16).padStart(8, "0")}${(h1 >>> 0).toString(16).padStart(8, "0")}`;
}

async function loadRoster(env, teamId) {
  const [players, profiles] = await Promise.all([
    selectRows(env, "players", `select=id,email,name,role,team_id,hide_from_leaderboards&team_id=eq.${encodeURIComponent(teamId)}&role=eq.player&limit=1000`),
    selectRows(env, "player_profiles", `select=id,user_id,team_id,first_name,last_name,jersey_number,invited_email,invite_status&team_id=eq.${encodeURIComponent(teamId)}&limit=1000`),
  ]);
  const playerRows = Array.isArray(players) ? players : [];
  const profileRows = Array.isArray(profiles) ? profiles : [];
  const byIdentity = new Map();

  for (const player of playerRows) {
    const email = normalizeIdentity(player?.email);
    const id = clean(player?.id, 320);
    const key = email || normalizeIdentity(id);
    if (!key) continue;
    byIdentity.set(key, { ...player, player_id: id || email, email, name: clean(player?.name, 320), hide_from_leaderboards: player?.hide_from_leaderboards === true });
  }
  for (const profile of profileRows) {
    const email = normalizeIdentity(profile?.invited_email);
    const userId = clean(profile?.user_id, 320);
    const profileId = clean(profile?.id, 320);
    const candidateKeys = [email, normalizeIdentity(userId), normalizeIdentity(profileId)].filter(Boolean);
    const matchedKey = candidateKeys.find((key) => byIdentity.has(key));
    const existing = matchedKey ? byIdentity.get(matchedKey) : null;
    const name = clean([profile?.first_name, profile?.last_name].filter(Boolean).join(" "), 320);
    const merged = {
      ...(existing || {}),
      id: existing?.id || profileId || userId || email,
      player_id: existing?.player_id || userId || profileId || email,
      email: existing?.email || email,
      name: existing?.name || name,
      first_name: clean(profile?.first_name, 160),
      last_name: clean(profile?.last_name, 160),
      jersey_number: clean(profile?.jersey_number, 32),
      invited_email: email,
      user_id: userId,
      hide_from_leaderboards: existing?.hide_from_leaderboards === true,
    };
    const canonicalKey = normalizeIdentity(merged.email || merged.player_id || merged.id);
    if (canonicalKey) byIdentity.set(canonicalKey, merged);
    for (const key of candidateKeys) if (key && key !== canonicalKey) byIdentity.delete(key);
  }
  return [...byIdentity.values()];
}

async function loadActiveSeason(env, teamId) {
  const rows = await selectRows(env, "active_seasons", `select=id,team_id,name,lifecycle_status,created_at&team_id=eq.${encodeURIComponent(teamId)}&lifecycle_status=eq.active&order=created_at.desc&limit=1`);
  return Array.isArray(rows) ? rows[0] || null : null;
}

async function loadAllTeamStats(env, teamId) {
  const rows = [];
  for (let offset = 0; offset < 50_000; offset += READ_PAGE_SIZE) {
    const page = await selectRows(
      env,
      "player_game_stats",
      `select=id,team_id,season_id,season_label,import_id,import_kind,as_of_date,game_date,opponent,player_id,player_email,player_name,stat_key,stat_label,stat_value,aggregation,unit,source_provider,source_filename,file_sha256,uploaded_by,imported_at&team_id=eq.${encodeURIComponent(teamId)}&order=imported_at.asc&limit=${READ_PAGE_SIZE}&offset=${offset}`,
    );
    const pageRows = Array.isArray(page) ? page : [];
    rows.push(...pageRows);
    if (pageRows.length < READ_PAGE_SIZE) break;
  }
  return rows;
}

function hiddenRosterKeys(roster = []) {
  const keys = new Set();
  for (const row of roster) {
    if (row?.hide_from_leaderboards !== true) continue;
    [row?.id, row?.player_id, row?.email, row?.user_id].map(normalizeIdentity).filter(Boolean).forEach((key) => keys.add(key));
  }
  return keys;
}

function recentImports(rows = []) {
  const grouped = new Map();
  for (const row of rows) {
    const importId = clean(row?.import_id, 120);
    if (!importId) continue;
    const previous = grouped.get(importId) || {
      import_id: importId,
      filename: clean(row?.source_filename, 240),
      provider: clean(row?.source_provider, 80) || "CSV",
      import_kind: clean(row?.import_kind, 40),
      season_label: clean(row?.season_label, 160),
      imported_at: clean(row?.imported_at, 80),
      metric_rows: 0,
      players: new Set(),
    };
    previous.metric_rows += 1;
    previous.players.add(normalizeIdentity(row?.player_email || row?.player_id));
    if (clean(row?.imported_at, 80) > previous.imported_at) previous.imported_at = clean(row?.imported_at, 80);
    grouped.set(importId, previous);
  }
  return [...grouped.values()]
    .sort((a, b) => b.imported_at.localeCompare(a.imported_at))
    .slice(0, 8)
    .map((row) => ({ ...row, players: row.players.size }));
}

function trimLeaderboards(items = [], limit = 20) {
  return items.map((metric) => ({ ...metric, rows: (metric.rows || []).slice(0, limit) }));
}

async function buildTeamPayload(env, teamId, { requester = "", resolvedUuid = "", canWrite = false } = {}) {
  const [rows, roster, activeSeason] = await Promise.all([loadAllTeamStats(env, teamId), loadRoster(env, teamId), loadActiveSeason(env, teamId)]);
  const intelligence = buildGameStatIntelligence({
    rows,
    currentSeasonId: clean(activeSeason?.id, 160),
    currentSeasonLabel: clean(activeSeason?.name, 160),
    viewerEmail: requester,
    viewerPlayerId: normalizeIdentity(resolvedUuid),
    hiddenIdentityKeys: hiddenRosterKeys(roster),
  });
  return {
    ok: true,
    storage_mode: "signed_api",
    team_id: teamId,
    can_write: canWrite,
    current_season: activeSeason ? { id: activeSeason.id, name: activeSeason.name } : null,
    current_leaderboards: trimLeaderboards(intelligence.currentLeaderboards),
    program_leaderboards: trimLeaderboards(intelligence.programLeaderboards),
    my_current_stats: intelligence.currentPlayerStats,
    my_program_stats: intelligence.programPlayerStats,
    ...(canWrite ? { team_current_stats: intelligence.currentAggregates, recent_imports: recentImports(rows) } : {}),
  };
}

function previewResponse(preview, context = {}) {
  return {
    ok: true,
    storage_mode: "signed_api",
    action: "preview",
    team_id: context.teamId,
    import_kind: preview.importKind,
    season: context.season,
    filename: context.filename,
    total_rows: preview.totalRows,
    matched_rows: preview.matchedRows,
    can_commit: preview.canCommit,
    stat_definitions: preview.statDefinitions,
    detected_columns: preview.columns,
    unmatched_rows: preview.unmatchedRows,
    ambiguous_rows: preview.ambiguousRows,
    invalid_date_rows: preview.invalidDateRows,
    matched_players: [...new Map(preview.rows.filter((row) => row.match.status === "matched").map((row) => [row.match.player.playerId || row.match.player.email, { player_id: row.match.player.playerId, email: row.match.player.email, name: row.match.player.displayName }])).values()],
  };
}

export async function onRequestGet({ request, env }) {
  const auth = await authenticate(request, env);
  const requester = normalizeIdentity(auth?.identity);
  if (!requester) return Response.json({ error: "unauthorized" }, { status: 401 });
  const rate = enforceRateLimit({ key: `game_stats_get:${getClientKey(request, requester)}`, max: 50, windowMs: 60_000 });
  if (!rate.allowed) return Response.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  if (DEMO_IDENTITIES.has(requester)) return Response.json({ ok: true, storage_mode: "demo_local", can_write: requester.startsWith("coach."), current_leaderboards: [], program_leaderboards: [], my_current_stats: [], my_program_stats: [], team_current_stats: [], recent_imports: [] });

  try {
    const access = await collectTeamPriorityAccess(env, requester);
    const requestedTeamId = clean(new URL(request.url).searchParams.get("team_id"), 160);
    const teamId = requestedTeamId || [...access.readableTeamIds][0] || "";
    if (!teamId || !access.readableTeamIds.has(teamId)) return Response.json({ error: "forbidden" }, { status: 403 });
    return Response.json(await buildTeamPayload(env, teamId, { requester, resolvedUuid: access.resolvedUuid, canWrite: access.writableTeamIds.has(teamId) }));
  } catch (error) {
    console.error("game_stats_get_failed", { message: clean(error?.message, 180) });
    return Response.json({ error: "game_stat_load_failed" }, { status: 500 });
  }
}

export async function onRequestPost({ request, env }) {
  const auth = await authenticate(request, env);
  const requester = normalizeIdentity(auth?.identity);
  if (!requester) return Response.json({ error: "unauthorized" }, { status: 401 });
  const rate = enforceRateLimit({ key: `game_stats_post:${getClientKey(request, requester)}`, max: 12, windowMs: 60_000 });
  if (!rate.allowed) return Response.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });

  const body = await request.json().catch(() => null);
  if (!body) return Response.json({ error: "invalid_json" }, { status: 400 });
  const action = clean(body?.action, 20).toLowerCase() === "commit" ? "commit" : "preview";
  const teamId = clean(body?.team_id || body?.teamId, 160);
  const csvText = String(body?.csv_text ?? body?.csvText ?? "");
  const filename = clean(body?.filename, 240) || "stats.csv";
  const importKind = clean(body?.import_kind || body?.importKind, 40).toLowerCase() === "game" ? "game" : "season_total";
  const requestedSeasonLabel = clean(body?.season_label || body?.seasonLabel, 160);
  const requestedAsOfDate = normalizeDate(body?.as_of_date || body?.asOfDate) || new Date().toISOString().slice(0, 10);
  if (!teamId || !csvText.trim()) return Response.json({ error: "team_and_csv_required" }, { status: 400 });
  if (DEMO_IDENTITIES.has(requester)) return Response.json({ ok: true, storage_mode: "demo_local", action, team_id: teamId, can_commit: false, total_rows: 0, matched_rows: 0, stat_definitions: [], unmatched_rows: [], ambiguous_rows: [], invalid_date_rows: [] });

  try {
    const access = await collectTeamPriorityAccess(env, requester);
    if (!access.writableTeamIds.has(teamId)) return Response.json({ error: "coach_write_required" }, { status: 403 });
    const [roster, activeSeason] = await Promise.all([loadRoster(env, teamId), loadActiveSeason(env, teamId)]);
    const preview = buildGameStatCsvPreview({ csvText, roster, importKind });
    if (!preview.ok) return Response.json({ error: preview.error }, { status: 400 });
    const season = {
      id: clean(activeSeason?.id, 160) || null,
      name: requestedSeasonLabel || clean(activeSeason?.name, 160) || "Current Season",
    };
    if (action === "preview") return Response.json(previewResponse(preview, { teamId, season, filename }));
    if (!preview.canCommit) return Response.json({ error: "csv_roster_resolution_required", ...previewResponse(preview, { teamId, season, filename }) }, { status: 409 });

    const fileSha256 = await sha256Hex(csvText);
    const importId = `gsi_${fileSha256.slice(0, 28)}`;
    const importedAt = new Date().toISOString();
    const databaseRows = [];
    for (const row of preview.rows) {
      if (row.match.status !== "matched") continue;
      const player = row.match.player;
      const playerIdentity = normalizeIdentity(player.playerId || player.email);
      for (const stat of row.stats) {
        const identitySeed = importKind === "game"
          ? [teamId, season.id || season.name, playerIdentity, row.gameDate, clean(row.opponent, 160).toLowerCase(), stat.key].join("|")
          : [teamId, season.id || season.name, playerIdentity, importId, row.rowNumber, stat.key].join("|");
        databaseRows.push({
          id: `gs_${stableHash(identitySeed)}`,
          team_id: teamId,
          season_id: season.id,
          season_label: season.name,
          import_id: importId,
          import_kind: importKind,
          as_of_date: importKind === "season_total" ? requestedAsOfDate : null,
          game_date: importKind === "game" ? row.gameDate : null,
          opponent: importKind === "game" ? clean(row.opponent, 160) || null : null,
          player_id: clean(player.playerId || player.email, 320),
          player_email: normalizeIdentity(player.email),
          player_name: clean(player.displayName, 320),
          stat_key: clean(stat.key, 80),
          stat_label: clean(stat.label, 160),
          stat_value: stat.value,
          aggregation: stat.aggregation,
          unit: stat.unit,
          source_provider: clean(body?.source_provider || body?.sourceProvider, 80) || "CSV",
          source_filename: filename,
          file_sha256: fileSha256,
          uploaded_by: requester,
          imported_at: importedAt,
        });
      }
    }
    if (!databaseRows.length) return Response.json({ error: "no_stat_rows_to_import" }, { status: 400 });
    if (databaseRows.length > MAX_STAT_ROWS_PER_IMPORT) return Response.json({ error: "too_many_stat_values" }, { status: 400 });

    const saved = await upsertRows(env, "player_game_stats", databaseRows, "id");
    return Response.json({
      ok: true,
      storage_mode: "signed_api",
      action: "commit",
      import_id: importId,
      imported_values: Array.isArray(saved) ? saved.length : databaseRows.length,
      imported_players: preview.matchedRows,
      season,
      filename,
    });
  } catch (error) {
    console.error("game_stats_post_failed", { message: clean(error?.message, 180) });
    return Response.json({ error: "game_stat_import_failed" }, { status: 500 });
  }
}
