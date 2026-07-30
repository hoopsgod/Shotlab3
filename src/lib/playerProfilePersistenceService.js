import { buildApiIdentityHeaders } from "./apiIdentityHeaders.js";

const normalizeIdentity = (value) => String(value || "").trim().toLowerCase();
const clean = (value) => String(value ?? "").trim();

function parseStored(storage, key, fallback) {
  try {
    const raw = storage?.getItem?.(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function readContext(storage = globalThis?.localStorage) {
  const rawSession = parseStored(storage, "sl:session", null);
  const session = Array.isArray(rawSession) ? rawSession[0] : rawSession;
  const requester = normalizeIdentity(session?.email || session?.userEmail || session?.user_id);
  const players = parseStored(storage, "sl:players", []);
  const actor = (Array.isArray(players) ? players : []).find((row) => normalizeIdentity(row?.email) === requester);
  const teamId = clean(session?.teamId || session?.team_id || actor?.teamId || actor?.team_id);
  return { requester, teamId, role: normalizeIdentity(session?.role || actor?.role) };
}

async function readJson(response) {
  try { return await response.json(); } catch { return {}; }
}

function requestError(body, response, fallback) {
  const error = new Error(String(body?.error || fallback));
  error.code = String(body?.error || fallback);
  error.status = Number(response?.status || 0);
  error.body = body;
  return error;
}

export function createPlayerProfilePersistenceService({
  fetchImpl = globalThis?.fetch,
  storage = globalThis?.localStorage,
} = {}) {
  const headers = (extra = {}) => {
    const context = readContext(storage);
    return buildApiIdentityHeaders({ requester: context.requester, storage, headers: extra });
  };

  const loadProfiles = async ({ teamId = "" } = {}) => {
    if (typeof fetchImpl !== "function") return { ok: false, unavailable: true, rows: [] };
    const context = readContext(storage);
    const activeTeamId = clean(teamId || context.teamId);
    const query = activeTeamId ? `?team_id=${encodeURIComponent(activeTeamId)}` : "";
    const response = await fetchImpl(`/v1/player-profiles${query}`, {
      method: "GET",
      headers: headers(),
    });
    const body = await readJson(response);
    if (!response?.ok || body?.error) throw requestError(body, response, "profile_load_failed");
    return {
      ok: true,
      storageMode: String(body?.storage_mode || "signed_api"),
      rows: Array.isArray(body?.profiles) ? body.profiles : [],
    };
  };

  const syncProfiles = async (profiles = [], { teamId = "" } = {}) => {
    if (typeof fetchImpl !== "function") throw new Error("profile_api_unavailable");
    const context = readContext(storage);
    const activeTeamId = clean(teamId || context.teamId || profiles?.[0]?.team_id || profiles?.[0]?.teamId);
    if (!activeTeamId) throw new Error("profile_team_required");
    const scopedProfiles = (Array.isArray(profiles) ? profiles : []).filter((row) => {
      const rowTeamId = clean(row?.team_id || row?.teamId);
      return !rowTeamId || rowTeamId === activeTeamId;
    });
    const response = await fetchImpl("/v1/player-profiles", {
      method: "POST",
      headers: headers({ "Content-Type": "application/json" }),
      body: JSON.stringify({ team_id: activeTeamId, profiles: scopedProfiles }),
    });
    const body = await readJson(response);
    if (!response?.ok || body?.error) throw requestError(body, response, "profile_sync_failed");
    return {
      ok: true,
      storageMode: String(body?.storage_mode || "signed_api"),
      rows: Array.isArray(body?.profiles) ? body.profiles : [],
      ignoredCount: Number(body?.ignored_count || 0),
    };
  };

  return {
    loadProfiles,
    syncProfiles,
    readContext: () => readContext(storage),
  };
}

export const __testUtils = { readContext };
