import { cleanValue, readActorContext, requestError, requestSignedJson, signedStorageMode } from "./apiIdentityHeaders.js";

const readContext = (storage = globalThis?.localStorage) => {
  const { requester, teamId } = readActorContext(storage);
  return { requester, teamId };
};

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
  const loadCatalog = async ({ teamId = "" } = {}) => {
    if (typeof fetchImpl !== "function") return { ok: false, unavailable: true, rows: [], homeDrills: [], programDrills: [] };
    const activeTeamId = cleanValue(teamId || readContext(storage).teamId);
    const [body, response] = await requestSignedJson(fetchImpl, `/v1/training-catalog${activeTeamId ? `?team_id=${encodeURIComponent(activeTeamId)}` : ""}`, "GET", storage);
    if (!response?.ok || body?.ok !== true || !Array.isArray(body?.drills) || body?.error) {
      throw requestError(body, response, "training_catalog_load_failed");
    }
    const rows = body.drills;
    return {
      ok: true,
      storageMode: signedStorageMode(body),
      teamId: cleanValue(body?.team_id || activeTeamId),
      canWrite: body?.can_write === true,
      rows,
      ...splitTrainingCatalog(rows),
    };
  };

  const syncCatalog = async ({ teamId = "", homeDrills = [], programDrills = [] } = {}) => {
    if (typeof fetchImpl !== "function") throw new Error("training_catalog_api_unavailable");
    const activeTeamId = cleanValue(teamId || readContext(storage).teamId);
    if (!activeTeamId) throw new Error("training_catalog_team_required");
    const [body, response] = await requestSignedJson(fetchImpl, "/v1/training-catalog", "POST", storage, {
      team_id: activeTeamId,
      drills: customTrainingCatalog(homeDrills, programDrills),
    });
    if (!response?.ok || body?.ok !== true || !Array.isArray(body?.drills) || body?.error) {
      throw requestError(body, response, "training_catalog_sync_failed");
    }
    const rows = body.drills;
    return {
      ok: true,
      storageMode: signedStorageMode(body),
      teamId: cleanValue(body?.team_id || activeTeamId),
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

    // Successful registered hydration is read-only. Remote truth, including an
    // intentionally empty catalog, must never trigger a write that resurrects
    // stale local drills. Explicit coach saves remain the only sync authority.
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
