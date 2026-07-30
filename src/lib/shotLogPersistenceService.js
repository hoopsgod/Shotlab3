import { buildApiIdentityHeaders } from "./apiIdentityHeaders.js";

const normalizeIdentity = (value) => String(value || "").trim().toLowerCase();

function readSession(storage = globalThis?.localStorage) {
  try {
    const raw = storage?.getItem?.("sl:session");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed[0] || null : parsed;
  } catch {
    return null;
  }
}

async function readJson(response) {
  try { return await response.json(); } catch { return {}; }
}

export function createShotLogPersistenceService({
  fetchImpl = globalThis?.fetch,
  storage = globalThis?.localStorage,
} = {}) {
  const requester = () => {
    const session = readSession(storage);
    return normalizeIdentity(session?.email || session?.userEmail || session?.user_id);
  };

  const loadShotLogs = async ({ teamId = "" } = {}) => {
    if (typeof fetchImpl !== "function") return { ok: false, unavailable: true, shotLogs: [] };
    const query = String(teamId || "").trim() ? `?team_id=${encodeURIComponent(String(teamId).trim())}` : "";
    const response = await fetchImpl(`/v1/shot-logs${query}`, {
      method: "GET",
      headers: buildApiIdentityHeaders({ requester: requester(), storage }),
    });
    const body = await readJson(response);
    if (!response?.ok || body?.error) {
      const error = new Error(String(body?.error || "shot_log_load_failed"));
      error.code = String(body?.error || "shot_log_load_failed");
      error.status = Number(response?.status || 0);
      error.body = body;
      throw error;
    }
    return {
      ok: true,
      storageMode: String(body?.storage_mode || "signed_api"),
      shotLogs: Array.isArray(body?.shot_logs) ? body.shot_logs : [],
    };
  };

  return { loadShotLogs };
}
