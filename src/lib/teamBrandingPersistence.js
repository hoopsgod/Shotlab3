import { createTeamPersistenceService } from "./teamPersistenceService.js";

const BRANDING_FIELDS = Object.freeze([
  "primaryColor",
  "secondaryColor",
  "accentColor",
  "textOnPrimary",
  "logoUrl",
  "logoMarkUrl",
  "textScale",
]);

const clean = (value) => String(value ?? "").trim();

function readJson(storage, key, fallback) {
  try {
    const raw = storage?.getItem?.(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

const teamIdFor = (row) => clean(row?.id || row?.teamId || row?.team_id);

export function brandingMatches(expected = {}, actual = {}) {
  return BRANDING_FIELDS.every((field) => clean(actual?.[field]) === clean(expected?.[field]));
}

function toLocalTeam(base = {}, remote = {}) {
  return {
    ...base,
    ...remote,
    id: teamIdFor(remote) || teamIdFor(base),
    ownerCoachId: clean(remote?.ownerCoachId || remote?.owner_coach_id || base?.ownerCoachId || base?.owner_coach_id),
    joinCode: clean(remote?.joinCode || remote?.join_code || base?.joinCode || base?.join_code),
    coachUserId: clean(remote?.coachUserId || remote?.coach_user_id || base?.coachUserId || base?.coach_user_id),
    createdAt: remote?.createdAt ?? remote?.created_at ?? base?.createdAt ?? base?.created_at ?? null,
    updatedAt: remote?.updatedAt ?? remote?.updated_at ?? base?.updatedAt ?? base?.updated_at ?? null,
    branding: remote?.branding || base?.branding || null,
  };
}

function cacheAuthoritativeTeam(storage, teamId, baseTeam, remoteTeam) {
  if (typeof storage?.setItem !== "function" || !remoteTeam) return;
  const localTeam = toLocalTeam(baseTeam, remoteTeam);
  if (teamIdFor(localTeam) !== clean(teamId)) return;
  storage.setItem("sl:teams", JSON.stringify([localTeam]));
}

function inferLocalTeamId(localRows = [], requester = "") {
  const rows = Array.isArray(localRows) ? localRows.filter((row) => teamIdFor(row)) : [];
  const normalizedRequester = clean(requester).toLowerCase();
  const owned = rows.find((row) => clean(row?.ownerCoachId || row?.owner_coach_id).toLowerCase() === normalizedRequester);
  if (owned) return teamIdFor(owned);
  const ids = [...new Set(rows.map(teamIdFor).filter(Boolean))];
  return ids.length === 1 ? ids[0] : "";
}

function inferRemoteTeamId(remoteRows = [], localRows = []) {
  const remoteIds = [...new Set((Array.isArray(remoteRows) ? remoteRows : []).map(teamIdFor).filter(Boolean))];
  if (remoteIds.length === 1) return remoteIds[0];
  const localIds = new Set((Array.isArray(localRows) ? localRows : []).map(teamIdFor).filter(Boolean));
  const matches = remoteIds.filter((id) => localIds.has(id));
  return matches.length === 1 ? matches[0] : "";
}

export async function persistCoachBranding({
  nextBranding,
  appSave,
  storage = globalThis?.localStorage,
  fetchImpl = globalThis?.fetch,
  serviceFactory = createTeamPersistenceService,
} = {}) {
  if (!nextBranding || typeof nextBranding !== "object" || Array.isArray(nextBranding)) {
    throw new Error("Team branding is missing.");
  }
  if (typeof appSave !== "function") {
    throw new Error("Team branding save is unavailable.");
  }

  const appResult = await appSave(nextBranding);
  if (appResult?.ok === false) {
    throw new Error(String(appResult?.err || appResult?.error || "Team branding could not be saved."));
  }

  const service = serviceFactory({ fetchImpl, storage });
  const context = service?.readContext?.() || {};
  const requester = clean(context.requester).toLowerCase();
  if (!requester) {
    throw new Error("Coach sign-in context is unavailable. Sign in again and retry.");
  }

  const localRowsRaw = readJson(storage, "sl:teams", []);
  const localRows = Array.isArray(localRowsRaw) ? localRowsRaw : [];
  let teamId = clean(context.teamId) || inferLocalTeamId(localRows, requester);
  let loadedRows = [];
  let loadError = null;

  try {
    const loaded = await service.loadTeams(teamId ? { teamId } : {});
    loadedRows = Array.isArray(loaded?.rows) ? loaded.rows : [];
  } catch (error) {
    loadError = error;
  }

  // A real legacy-coach shape can have sl:session={email} and a coach row in
  // sl:players whose team_id is null. In that state, the signed /v1/teams read is
  // the reliable authority. Resolve one unambiguous team from that response
  // instead of failing before the POST is ever attempted.
  if (!teamId) teamId = inferRemoteTeamId(loadedRows, localRows);
  if (!teamId) {
    if (loadError) throw loadError;
    throw new Error("The active coach team could not be resolved. Sign in again and retry.");
  }

  const localTeam = localRows.find((row) => teamIdFor(row) === teamId) || null;
  let remoteTeam = loadedRows.find((row) => teamIdFor(row) === teamId) || null;

  // If context resolution selected a team after the broad signed read but that
  // row was not present (for example after a cache transition), do one exact
  // authoritative read before attempting a write.
  if (!remoteTeam && !loadError) {
    try {
      const exact = await service.loadTeams({ teamId });
      const exactRows = Array.isArray(exact?.rows) ? exact.rows : [];
      remoteTeam = exactRows.find((row) => teamIdFor(row) === teamId) || null;
    } catch (error) {
      loadError = error;
    }
  }

  if (loadError && !remoteTeam) throw loadError;

  // The signed API row is authoritative for immutable ownership, creation, and
  // invite metadata. Local app rows can legitimately contain older legacy
  // shapes, so using them as the POST base can trigger immutable-field 409s even
  // when the coach is only changing branding.
  const baseTeam = remoteTeam || localTeam;
  if (!baseTeam) {
    throw new Error("The active team could not be loaded for branding persistence.");
  }

  const desiredBranding = {
    ...(baseTeam?.branding || {}),
    ...(nextBranding || {}),
  };

  let storageMode = "signed_api";
  if (!remoteTeam || !brandingMatches(desiredBranding, remoteTeam?.branding)) {
    const synced = await service.syncTeams([{
      ...baseTeam,
      id: teamId,
      branding: desiredBranding,
    }]);
    storageMode = String(synced?.storageMode || storageMode);
    const syncedRows = Array.isArray(synced?.rows) ? synced.rows : [];
    remoteTeam = syncedRows.find((row) => teamIdFor(row) === teamId) || null;
  }

  if (!remoteTeam || !brandingMatches(desiredBranding, remoteTeam?.branding)) {
    throw new Error("Team branding did not survive the server round trip. Please retry.");
  }

  cacheAuthoritativeTeam(storage, teamId, baseTeam, remoteTeam);
  return {
    ok: true,
    storageMode,
    team: remoteTeam,
    branding: remoteTeam.branding,
  };
}

export const __testUtils = {
  BRANDING_FIELDS,
  readJson,
  teamIdFor,
  toLocalTeam,
  inferLocalTeamId,
  inferRemoteTeamId,
};
