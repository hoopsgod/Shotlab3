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
  return { requester, teamId };
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

export function createSchedulePersistenceService({
  fetchImpl = globalThis?.fetch,
  storage = globalThis?.localStorage,
} = {}) {
  const headers = (extra = {}) => {
    const context = readContext(storage);
    return buildApiIdentityHeaders({ requester: context.requester, storage, headers: extra });
  };

  const loadCollection = async (resource, field, teamId = "") => {
    if (typeof fetchImpl !== "function") return { ok: false, unavailable: true, rows: [] };
    const context = readContext(storage);
    const activeTeamId = clean(teamId || context.teamId);
    const query = activeTeamId ? `?team_id=${encodeURIComponent(activeTeamId)}` : "";
    const response = await fetchImpl(`/v1/${resource}${query}`, {
      method: "GET",
      headers: headers(),
    });
    const body = await readJson(response);
    if (!response?.ok || body?.error) throw requestError(body, response, `${resource}_load_failed`);
    return {
      ok: true,
      storageMode: String(body?.storage_mode || "signed_api"),
      rows: Array.isArray(body?.[field]) ? body[field] : [],
    };
  };

  const syncCollection = async (resource, field, rows = [], teamId = "") => {
    if (typeof fetchImpl !== "function") throw new Error(`${resource}_api_unavailable`);
    const context = readContext(storage);
    const activeTeamId = clean(teamId || context.teamId || rows?.[0]?.team_id || rows?.[0]?.teamId);
    if (!activeTeamId) throw new Error(`${resource}_team_required`);
    const response = await fetchImpl(`/v1/${resource}`, {
      method: "POST",
      headers: headers({ "Content-Type": "application/json" }),
      body: JSON.stringify({ team_id: activeTeamId, [field]: Array.isArray(rows) ? rows : [] }),
    });
    const body = await readJson(response);
    if (!response?.ok || body?.error) throw requestError(body, response, `${resource}_sync_failed`);
    return {
      ok: true,
      storageMode: String(body?.storage_mode || "signed_api"),
      rows: Array.isArray(body?.[field]) ? body[field] : [],
      deletedCount: Number(body?.deleted_count || 0),
    };
  };

  return {
    loadEvents: ({ teamId = "" } = {}) => loadCollection("events", "events", teamId),
    syncEvents: (events, { teamId = "" } = {}) => syncCollection("events", "events", events, teamId),
    loadRsvps: ({ teamId = "" } = {}) => loadCollection("rsvps", "rsvps", teamId),
    syncRsvps: (rsvps, { teamId = "" } = {}) => syncCollection("rsvps", "rsvps", rsvps, teamId),
    readContext: () => readContext(storage),
  };
}

export const __testUtils = { readContext };
