import { createTeamPersistenceService } from "./teamPersistenceService.js";

const FIELDS = ["primaryColor", "secondaryColor", "accentColor", "textOnPrimary", "logoUrl", "logoMarkUrl", "textScale"];
export const brandingMatches = (expected = {}, actual = {}) => FIELDS.every((key) => String(actual?.[key] ?? "") === String(expected?.[key] ?? ""));

export async function persistCoachBranding({ nextBranding, appSave, serviceFactory = createTeamPersistenceService } = {}) {
  if (!nextBranding || typeof appSave !== "function") throw new Error("Branding save unavailable.");
  const local = await appSave(nextBranding);
  if (local?.ok === false) throw new Error(String(local?.err || local?.error || "Branding save failed."));

  const service = serviceFactory();
  const teamId = String(service.readContext?.()?.teamId || "").trim();
  if (!teamId) throw new Error("Coach team unavailable.");

  const synced = await service.syncTeams([{ id: teamId, branding: nextBranding }]);
  const saved = (synced?.rows || []).find((row) => String(row?.id || row?.teamId || row?.team_id || "").trim() === teamId);
  if (!saved || !brandingMatches(nextBranding, saved.branding)) throw new Error("Branding verification failed.");
  return { ok: true, team: saved, branding: saved.branding };
}
