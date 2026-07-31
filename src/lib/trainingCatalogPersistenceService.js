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

function isCustomDrill(row) {
  return row && row.isDefaultDemo !== true;
}

export function splitTrainingCatalog(rows = []) {
  const homeDrills = [];
  const programDrills = [];
  for (const row of Array.isArray(rows) ? rows : []) {
    if (row?.mode === "program") programDrills.push(row);
    else if (row?.mode === "home") homeDrills.push(row);
  }
  return { homeDrills, programDrills };
}

export function customTrainingCatalog(homeDrills = [], programDrills = []) {
  return [
    ...(Array.isArray(homeDrills) ? homeDrills : [])
      .filter(isCustomDrill)
      .map((row, sortOrder) => ({ ...row, mode: "home", sortOrder })),
    ...(Array.isArray(programDrills) ? programDrills : [])
      .filter(isCustomDrill)
      .map((row, sortOrder) => ({ ...row, mode: "program", sortOrder })),
  ];
}

export function createTrainingCatalogPersistenceService({
  fetchImpl = (...args) => globalThis.fetch(...args),
  storage = globalThis?.localStorage,
} = {}) {
  const headers = (extra = {}) => {
    const context = readContext(storage);
    return buildApiIdentityHeaders({ requester: context.requester, storage, headers: extra });
  };

  const loadCatalog = async ({ teamId = "" } = {}) => {
    if (typeof fetchImpl !== "function") return { ok: false, unavailable: true, rows: [], homeDrills: [], programDrills: [] };
    const context = readContext(storage);
    const activeTeamId = clean(teamId || context.teamId);
    const query = activeTeamId ? `?team_id=${encodeURIComponent(activeTeamId)}` : "";
    const response = await fetchImpl(`/v1/training-catalog${query}`, {
      method: "GET",
      headers: headers(),
    });
    const body = await readJson(response);
    if (!response?.ok || body?.ok !== true || !Array.isArray(body?.drills) || body?.error) {
      throw requestError(body, response, "training_catalog_load_failed");
    }
    const rows = body.drills;
    return {
      ok: true,
      storageMode: String(body?.storage_mode || "signed_api"),
      teamId: clean(body?.team_id || activeTeamId),
      canWrite: body?.can_write === true,
      rows,
      ...splitTrainingCatalog(rows),
    };
  };

  const syncCatalog = async ({ teamId = "", homeDrills = [], programDrills = [] } = {}) => {
    if (typeof fetchImpl !== "function") throw new Error("training_catalog_api_unavailable");
    const context = readContext(storage);
    const activeTeamId = clean(teamId || context.teamId);
    if (!activeTeamId) throw new Error("training_catalog_team_required");
    const drills = customTrainingCatalog(homeDrills, programDrills);
    const response = await fetchImpl("/v1/training-catalog", {
      method: "POST",
      headers: headers({ "Content-Type": "application/json" }),
      body: JSON.stringify({ team_id: activeTeamId, drills }),
    });
    const body = await readJson(response);
    if (!response?.ok || body?.ok !== true || !Array.isArray(body?.drills) || body?.error) {
      throw requestError(body, response, "training_catalog_sync_failed");
    }
    const rows = body.drills;
    return {
      ok: true,
      storageMode: String(body?.storage_mode || "signed_api"),
      teamId: clean(body?.team_id || activeTeamId),
      rows,
      deletedCount: Number(body?.deleted_count || 0),
      ...splitTrainingCatalog(rows),
    };
  };

  const hydrateCatalog = async ({ teamId = "", localHomeDrills = [], localProgramDrills = [] } = {}) => {
    const loaded = await loadCatalog({ teamId });
    if (loaded.storageMode === "demo_local") {
      return {
        ...loaded,
        useRemote: false,
        homeDrills: Array.isArray(localHomeDrills) ? localHomeDrills.filter(isCustomDrill) : [],
        programDrills: Array.isArray(localProgramDrills) ? localProgramDrills.filter(isCustomDrill) : [],
      };
    }
    const localRows = customTrainingCatalog(localHomeDrills, localProgramDrills);
    if (!loaded.rows.length && loaded.canWrite && localRows.length) {
      const promoted = await syncCatalog({
        teamId: loaded.teamId || teamId,
        homeDrills: localHomeDrills,
        programDrills: localProgramDrills,
      });
      return { ...promoted, canWrite: true, useRemote: true, promotedLocalCatalog: true };
    }
    return { ...loaded, useRemote: true, promotedLocalCatalog: false };
  };

  return {
    loadCatalog,
    syncCatalog,
    hydrateCatalog,
    readContext: () => readContext(storage),
  };
}

export const __testUtils = { readContext, isCustomDrill };
