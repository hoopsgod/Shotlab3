import { buildApiIdentityHeaders } from "./apiIdentityHeaders.js";

const identity = (value) => String(value || "").trim().toLowerCase();
const clean = (value) => String(value ?? "").trim();
const teamIdFor = (row) => clean(row?.id || row?.teamId || row?.team_id);

function stored(storage, key, fallback) {
  try {
    const raw = storage?.getItem?.(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function readContext(storage = globalThis?.localStorage) {
  const raw = stored(storage, "sl:session", null);
  const session = Array.isArray(raw) ? raw[0] : raw;
  const requester = identity(session?.email || session?.userEmail || session?.user_id);
  const players = stored(storage, "sl:players", []);
  const actor = (Array.isArray(players) ? players : []).find((row) => identity(row?.email) === requester);
  const teams = stored(storage, "sl:teams", []);
  const sole = Array.isArray(teams) && teams.length === 1 ? teams[0] : null;
  return {
    requester,
    teamId: clean(session?.teamId || session?.team_id || actor?.teamId || actor?.team_id || teamIdFor(sole)),
    role: identity(session?.role || actor?.role || (sole ? "coach" : "")),
  };
}

async function json(response) {
  try { return await response.json(); } catch { return {}; }
}

function failure(body, response, fallback) {
  const error = new Error(String(body?.error || fallback));
  error.code = String(body?.error || fallback);
  error.status = Number(response?.status || 0);
  error.body = body;
  return error;
}

export function createTeamPersistenceService({ fetchImpl = globalThis?.fetch, storage = globalThis?.localStorage } = {}) {
  const headers = (extra = {}) => buildApiIdentityHeaders({ requester: readContext(storage).requester, storage, headers: extra });

  const loadTeams = async ({ teamId = "" } = {}) => {
    if (typeof fetchImpl !== "function") return { rows: [] };
    const active = clean(teamId || readContext(storage).teamId);
    const response = await fetchImpl(`/v1/teams${active ? `?team_id=${encodeURIComponent(active)}` : ""}`, { method: "GET", headers: headers() });
    const body = await json(response);
    if (!response?.ok || body?.error) throw failure(body, response, "team_load_failed");
    return { rows: Array.isArray(body?.teams) ? body.teams : [] };
  };

  const syncTeams = async (teams = []) => {
    if (typeof fetchImpl !== "function") throw new Error("team_api_unavailable");
    const response = await fetchImpl("/v1/teams", {
      method: "POST",
      headers: headers({ "Content-Type": "application/json" }),
      body: JSON.stringify({ teams: Array.isArray(teams) ? teams : [] }),
    });
    const body = await json(response);
    if (!response?.ok || body?.error) throw failure(body, response, "team_sync_failed");
    return { rows: Array.isArray(body?.teams) ? body.teams : [] };
  };

  return { loadTeams, syncTeams, readContext: () => readContext(storage) };
}

export const __testUtils = { readContext, teamIdFor };
