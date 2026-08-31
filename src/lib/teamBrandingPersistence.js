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
  const teamId = clean(context.teamId);
  if (!requester || !teamId) {
    throw new Error("Coach team context is unavailable. Sign in again and retry.");
  }

  const localRows = readJson(storage, "sl:teams", []);
  const localTeam = (Array.isArray(localRows) ? localRows : []).find((row) => teamIdFor(row) === teamId) || null;

  let loadedRows = [];
  let loadError = null;
  try {
    const loaded = await service.loadTeams({ teamId });
    loadedRows = Array.isArray(loaded?.rows) ? loaded.rows : [];
  } catch (error) {
    loadError = error;
  }

  let remoteTeam = loadedRows.find((row) => teamIdFor(row) === teamId) || null;
  const baseTeam = localTeam || remoteTeam;
  if (!baseTeam) {
    throw loadError || new Error("The active team could not be loaded for branding persistence.");
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
};
