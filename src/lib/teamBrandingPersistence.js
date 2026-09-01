import { createTeamPersistenceService } from "./teamPersistenceService.js";

const FIELDS = ["primaryColor", "secondaryColor", "accentColor", "textOnPrimary", "logoUrl", "logoMarkUrl", "textScale"];
const clean = (value) => String(value ?? "").trim();
const teamIdFor = (row) => clean(row?.id || row?.teamId || row?.team_id);
export const brandingMatches = (expected = {}, actual = {}) => FIELDS.every((field) => clean(actual?.[field]) === clean(expected?.[field]));

export async function persistCoachBranding({ nextBranding, appSave, serviceFactory = createTeamPersistenceService } = {}) {
  if (!nextBranding || typeof appSave !== "function") throw new Error("Branding save unavailable.");
  const local = await appSave(nextBranding);
  if (local?.ok === false) throw new Error(String(local?.err || local?.error || "Branding save failed."));

  const service = serviceFactory();
  const contextId = clean(service?.readContext?.()?.teamId);
  const loaded = await service.loadTeams(contextId ? { teamId: contextId } : {});
  const rows = Array.isArray(loaded?.rows) ? loaded.rows : [];
  const remote = rows.find((row) => teamIdFor(row) === contextId) || (!contextId && rows.length === 1 ? rows[0] : null);
  if (!remote) throw new Error("Coach team unavailable. Sign in again.");

  const teamId = teamIdFor(remote);
  const desired = { ...(remote.branding || {}), ...nextBranding };
  if (brandingMatches(desired, remote.branding)) return { ok: true, team: remote, branding: remote.branding };
  const synced = await service.syncTeams([{ ...remote, id: teamId, branding: desired }]);
  const saved = (Array.isArray(synced?.rows) ? synced.rows : []).find((row) => teamIdFor(row) === teamId);
  if (!saved || !brandingMatches(desired, saved.branding)) throw new Error("Branding verification failed. Retry.");
  return { ok: true, team: saved, branding: saved.branding };
}
