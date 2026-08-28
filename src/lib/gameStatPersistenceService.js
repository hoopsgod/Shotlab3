import { buildApiIdentityHeaders } from "./apiIdentityHeaders.js";
import { installApiIdentityFetchBridge } from "./apiFetchBridge.js";

if (typeof window !== "undefined") installApiIdentityFetchBridge(window);

const clean = (value) => String(value ?? "").trim();
const normalizeIdentity = (value) => clean(value).toLowerCase();

function readSession(storage = globalThis?.localStorage) {
  try {
    const raw = storage?.getItem?.("sl:session");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed[0] || null : parsed;
  } catch { return null; }
}

async function readJson(response) {
  try { return await response.json(); } catch { return {}; }
}

function requestError(body, response, fallback) {
  const code = String(body?.error || fallback);
  const error = new Error(code);
  error.code = code;
  error.status = Number(response?.status || 0);
  error.body = body;
  return error;
}

export function createGameStatPersistenceService({ fetchImpl = globalThis?.fetch, storage = globalThis?.localStorage } = {}) {
  const requester = () => {
    const session = readSession(storage);
    return normalizeIdentity(session?.email || session?.userEmail || session?.user_id);
  };
  const headers = (extra = {}) => buildApiIdentityHeaders({ requester: requester(), storage, headers: extra });

  const loadGameStats = async ({ teamId = "" } = {}) => {
    if (typeof fetchImpl !== "function") return { ok: false, unavailable: true, data: null };
    const normalizedTeamId = clean(teamId);
    const query = normalizedTeamId ? `?team_id=${encodeURIComponent(normalizedTeamId)}` : "";
    const response = await fetchImpl(`/v1/game-stats${query}`, { method: "GET", headers: headers() });
    const body = await readJson(response);
    if (!response?.ok || body?.error) throw requestError(body, response, "game_stat_load_failed");
    return { ok: true, storageMode: String(body?.storage_mode || "signed_api"), data: body };
  };

  const submitCsv = async ({ teamId = "", csvText = "", filename = "stats.csv", importKind = "season_total", seasonLabel = "", asOfDate = "", sourceProvider = "CSV", action = "preview" } = {}) => {
    if (typeof fetchImpl !== "function") throw new Error("game_stat_api_unavailable");
    const response = await fetchImpl("/v1/game-stats", {
      method: "POST",
      headers: headers({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        action,
        team_id: clean(teamId),
        csv_text: String(csvText ?? ""),
        filename: clean(filename).slice(0, 240),
        import_kind: importKind === "game" ? "game" : "season_total",
        season_label: clean(seasonLabel).slice(0, 160),
        as_of_date: clean(asOfDate).slice(0, 20),
        source_provider: clean(sourceProvider).slice(0, 80) || "CSV",
      }),
    });
    const body = await readJson(response);
    if (!response?.ok || body?.error) throw requestError(body, response, action === "commit" ? "game_stat_import_failed" : "game_stat_preview_failed");
    return { ok: true, storageMode: String(body?.storage_mode || "signed_api"), data: body };
  };

  const previewCsv = (input) => submitCsv({ ...input, action: "preview" });
  const commitCsv = (input) => submitCsv({ ...input, action: "commit" });
  return { loadGameStats, previewCsv, commitCsv };
}
