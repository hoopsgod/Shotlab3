import { buildSeasonRolloverPlan } from "./seasonRollover.js";

const SESSION_STORAGE_KEY = "sl:session";
const ACTIVE_SEASONS_CACHE_KEY = "sl:active-seasons";
const normalize = (value) => String(value ?? "").trim();
const normalizeKey = (value) => normalize(value).toLowerCase();
const toArray = (value) => (Array.isArray(value) ? value : []);

const parseJson = (value, fallback) => {
  try { return value ? JSON.parse(value) : fallback; } catch { return fallback; }
};

export const currentSessionEmail = () => {
  if (typeof window === "undefined") return "";
  const session = parseJson(window.localStorage?.getItem(SESSION_STORAGE_KEY), null);
  return normalizeKey(session?.email);
};

const cacheSeasons = (seasons) => {
  if (typeof window === "undefined") return;
  try { window.localStorage?.setItem(ACTIVE_SEASONS_CACHE_KEY, JSON.stringify(toArray(seasons))); } catch {}
};

const cachedSeasons = () => {
  if (typeof window === "undefined") return [];
  return toArray(parseJson(window.localStorage?.getItem(ACTIVE_SEASONS_CACHE_KEY), []));
};

const errorMessage = (code, status = 0) => {
  if (status === 401 || code === "unauthorized") return "Sign in again before starting a new season.";
  if (status === 403 || code === "forbidden") return "Only an authorized coach for this team can start a new season.";
  if (status === 404 || code === "source_archive_not_found") return "The selected archive is no longer available.";
  if (status === 409 || code === "active_season_exists") return "This team already has an active season.";
  if (status === 429 || code === "rate_limited") return "Too many attempts. Wait briefly and try again.";
  if (code === "network_error") return "The new season could not be created because the server could not be reached.";
  return "The new season could not be created. No roster or results were changed.";
};

export async function loadActiveSeasons({ requesterEmail = currentSessionEmail(), fetchImpl = globalThis.fetch } = {}) {
  const requester = normalizeKey(requesterEmail);
  if (!requester || typeof fetchImpl !== "function") return { ok: false, error: "unauthorized", seasons: cachedSeasons() };
  try {
    const response = await fetchImpl("/v1/seasons", { headers: { "x-user-id": requester } });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) return { ok: false, error: body?.error || "season_load_failed", seasons: cachedSeasons() };
    const seasons = toArray(body?.seasons);
    cacheSeasons(seasons);
    return { ok: true, seasons, demoLocalOnly: body?.demoLocalOnly === true };
  } catch {
    return { ok: false, error: "network_error", seasons: cachedSeasons() };
  }
}

export async function persistSeasonRolloverPlan({ plan, coach, fetchImpl = globalThis.fetch } = {}) {
  const requester = normalizeKey(coach?.email || currentSessionEmail());
  if (!requester || typeof fetchImpl !== "function") return { ok: false, code: "unauthorized", error: errorMessage("unauthorized", 401) };
  try {
    const response = await fetchImpl("/v1/seasons", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": requester },
      body: JSON.stringify({ plan }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) return { ok: false, code: body?.error || "season_rollover_failed", error: errorMessage(body?.error, response.status) };
    return { ok: true, ...body };
  } catch {
    return { ok: false, code: "network_error", error: errorMessage("network_error") };
  }
}

export async function createNewSeason(input = {}) {
  const built = buildSeasonRolloverPlan(input);
  if (!built.ok) return built;
  const persist = typeof input.persistPlan === "function" ? input.persistPlan : persistSeasonRolloverPlan;
  const saved = await persist({ plan: built.plan, coach: input.coach, fetchImpl: input.fetchImpl });
  if (!saved?.ok) return saved;
  const season = {
    id: saved.seasonId,
    teamId: built.plan.activeSeason.teamId,
    name: built.plan.activeSeason.name,
    startDate: built.plan.activeSeason.startDate,
    projectedEndDate: built.plan.activeSeason.projectedEndDate,
    sourceArchiveId: built.plan.activeSeason.sourceArchiveId,
    lifecycleStatus: "active",
    reusableStructure: built.plan.reusableStructure,
    createdAt: built.plan.createdAt,
    demoLocalOnly: saved.demoLocalOnly === true,
  };
  const existing = toArray(input.existingActiveSeasons);
  const next = existing.some((row) => normalize(row.id) === normalize(season.id)) ? existing : [season, ...existing];
  cacheSeasons(next);
  return { ok: true, season, activeSeasons: next, idempotent: saved.idempotent === true, plan: built.plan };
}
