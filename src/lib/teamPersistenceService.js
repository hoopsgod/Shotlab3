import { cleanValue as clean, normalizeIdentity as identity, parseStored as stored, readActorContext, requestError, requestSignedJson } from "./apiIdentityHeaders.js";

const teamIdFor = (row) => clean(row?.id || row?.teamId || row?.team_id);

function readContext(storage = globalThis?.localStorage) {
  const context = readActorContext(storage);
  const teams = stored(storage, "sl:teams", []);
  const sole = Array.isArray(teams) && teams.length === 1 ? teams[0] : null;
  return {
    requester: context.requester,
    teamId: clean(context.teamId || teamIdFor(sole)),
    role: identity(context.role || (sole ? "coach" : "")),
  };
}

export function createTeamPersistenceService({ fetchImpl = globalThis?.fetch, storage = globalThis?.localStorage } = {}) {
  const loadTeams = async ({ teamId = "" } = {}) => {
    if (typeof fetchImpl !== "function") return { rows: [] };
    const active = clean(teamId || readContext(storage).teamId);
    const [body, response] = await requestSignedJson(fetchImpl, `/v1/teams${active ? `?team_id=${encodeURIComponent(active)}` : ""}`, "GET", storage);
    if (!response?.ok || body?.error) throw requestError(body, response, "team_load_failed");
    return { rows: Array.isArray(body?.teams) ? body.teams : [] };
  };

  const syncTeams = async (teams = []) => {
    if (typeof fetchImpl !== "function") throw new Error("team_api_unavailable");
    const [body, response] = await requestSignedJson(fetchImpl, "/v1/teams", "POST", storage, { teams: Array.isArray(teams) ? teams : [] });
    if (!response?.ok || body?.error) throw requestError(body, response, "team_sync_failed");
    return { rows: Array.isArray(body?.teams) ? body.teams : [] };
  };

  return { loadTeams, syncTeams, readContext: () => readContext(storage) };
}

export const __testUtils = { readContext, teamIdFor };
