import { createTeamPersistenceService } from "./teamPersistenceService.js";

const BRANDING_FIELDS = [
  "primaryColor",
  "secondaryColor",
  "accentColor",
  "textOnPrimary",
  "logoUrl",
  "logoMarkUrl",
  "textScale",
];
const clean = (value) => String(value ?? "").trim();
const teamIdFor = (row) => clean(row?.id || row?.teamId || row?.team_id);

export function brandingMatches(expected = {}, actual = {}) {
  return BRANDING_FIELDS.every((field) => clean(actual?.[field]) === clean(expected?.[field]));
}

export async function persistCoachBranding({
  nextBranding,
  appSave,
  storage = globalThis?.localStorage,
  fetchImpl = globalThis?.fetch,
  serviceFactory = createTeamPersistenceService,
} = {}) {
  if (!nextBranding || typeof nextBranding !== "object" || Array.isArray(nextBranding)) throw new Error("Team branding is missing.");
  if (typeof appSave !== "function") throw new Error("Team branding save is unavailable.");

  const appResult = await appSave(nextBranding);
  if (appResult?.ok === false) throw new Error(String(appResult?.err || appResult?.error || "Team branding could not be saved."));

  const service = serviceFactory({ fetchImpl, storage });
  const context = service?.readContext?.() || {};
  if (!clean(context.requester)) throw new Error("Coach sign-in context is unavailable. Sign in again and retry.");

  let teamId = clean(context.teamId);
  const loaded = await service.loadTeams(teamId ? { teamId } : {});
  const rows = Array.isArray(loaded?.rows) ? loaded.rows : [];
  if (!teamId) {
    const ids = [...new Set(rows.map(teamIdFor).filter(Boolean))];
    if (ids.length === 1) teamId = ids[0];
  }
  const remoteTeam = rows.find((row) => teamIdFor(row) === teamId) || null;
  if (!teamId || !remoteTeam) throw new Error("The active coach team could not be resolved. Sign in again and retry.");

  const desiredBranding = { ...(remoteTeam.branding || {}), ...nextBranding };
  if (brandingMatches(desiredBranding, remoteTeam.branding)) {
    return { ok: true, storageMode: String(loaded?.storageMode || "signed_api"), team: remoteTeam, branding: remoteTeam.branding };
  }

  const synced = await service.syncTeams([{ ...remoteTeam, id: teamId, branding: desiredBranding }]);
  const savedTeam = (Array.isArray(synced?.rows) ? synced.rows : []).find((row) => teamIdFor(row) === teamId) || null;
  if (!savedTeam || !brandingMatches(desiredBranding, savedTeam.branding)) {
    throw new Error("Team branding did not survive the server round trip. Please retry.");
  }

  return {
    ok: true,
    storageMode: String(synced?.storageMode || "signed_api"),
    team: savedTeam,
    branding: savedTeam.branding,
  };
}

export const __testUtils = { BRANDING_FIELDS, teamIdFor };
