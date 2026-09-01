import { createTeamPersistenceService } from "./teamPersistenceService.js";

const FIELDS = ["primaryColor", "secondaryColor", "accentColor", "textOnPrimary", "logoUrl", "logoMarkUrl", "textScale"];
const clean = (value) => String(value ?? "").trim();
const teamIdFor = (row) => clean(row?.id || row?.teamId || row?.team_id);

export const brandingMatches = (expected = {}, actual = {}) => FIELDS.every((field) => clean(actual?.[field]) === clean(expected?.[field]));

export async function persistCoachBranding({ nextBranding, appSave, serviceFactory = createTeamPersistenceService } = {}) {
  if (!nextBranding || typeof nextBranding !== "object" || Array.isArray(nextBranding)) throw new Error("Team branding is missing.");
  if (typeof appSave !== "function") throw new Error("Team branding save is unavailable.");
  const local = await appSave(nextBranding);
  if (local?.ok === false) throw new Error(String(local?.err || local?.error || "Team branding could not be saved."));

  const service = serviceFactory();
  let teamId = clean(service?.readContext?.()?.teamId);
  const loaded = await service.loadTeams(teamId ? { teamId } : {});
  const rows = Array.isArray(loaded?.rows) ? loaded.rows : [];
  if (!teamId && rows.length === 1) teamId = teamIdFor(rows[0]);
  const remote = rows.find((row) => teamIdFor(row) === teamId);
  if (!remote) throw new Error("The active coach team could not be resolved. Sign in again and retry.");

  const desired = { ...(remote.branding || {}), ...nextBranding };
  if (brandingMatches(desired, remote.branding)) return { ok: true, team: remote, branding: remote.branding };

  const synced = await service.syncTeams([{ ...remote, id: teamId, branding: desired }]);
  const saved = (Array.isArray(synced?.rows) ? synced.rows : []).find((row) => teamIdFor(row) === teamId);
  if (!saved || !brandingMatches(desired, saved.branding)) throw new Error("Team branding did not survive the server round trip. Please retry.");
  return { ok: true, team: saved, branding: saved.branding };
}
