export const TEAM_STORE_STORAGE_KEY = "sl:team-stores";
export const TEAM_STORE_CLICKS_KEY = "sl:team-store-clicks";

export const TEAM_STORE_PROVIDERS = [
  { key: "squadlocker", label: "SquadLocker" },
  { key: "bsn", label: "BSN Sports" },
  { key: "other", label: "Other provider" },
];

export const AFFILIATE_DISCLOSURE =
  "ShotLab may earn a commission from purchases made through this store link. Your team may also receive fundraising proceeds.";

const clean = (value) => String(value ?? "").trim();

export function normalizeTeamStore(value = {}) {
  const provider = TEAM_STORE_PROVIDERS.some((item) => item.key === value.provider)
    ? value.provider
    : "other";
  return {
    id: clean(value.id),
    teamId: clean(value.teamId || value.team_id),
    provider,
    storeName: clean(value.storeName || value.store_name || "Official Team Store"),
    storeUrl: clean(value.storeUrl || value.store_url),
    status: value.status === "inactive" ? "inactive" : "active",
    createdAt: clean(value.createdAt || value.created_at),
    updatedAt: clean(value.updatedAt || value.updated_at),
  };
}

export function validateTeamStoreInput(value = {}) {
  const store = normalizeTeamStore(value);
  if (!store.teamId) return { ok: false, error: "A team is required." };
  if (!store.storeName) return { ok: false, error: "Enter a store name." };
  let parsed;
  try {
    parsed = new URL(store.storeUrl);
  } catch {
    return { ok: false, error: "Enter a valid https store URL." };
  }
  if (parsed.protocol !== "https:") {
    return { ok: false, error: "Team store links must use https." };
  }
  return { ok: true, store: { ...store, storeUrl: parsed.toString() } };
}

export function upsertTeamStore(rows = [], value = {}) {
  const now = new Date().toISOString();
  const normalized = normalizeTeamStore(value);
  const id = normalized.id || `team-store-${normalized.teamId}`;
  const next = {
    ...normalized,
    id,
    createdAt: normalized.createdAt || now,
    updatedAt: now,
  };
  const list = Array.isArray(rows) ? rows.map(normalizeTeamStore) : [];
  const index = list.findIndex((row) => row.teamId === next.teamId);
  if (index === -1) return [...list, next];
  return list.map((row, rowIndex) => (rowIndex === index ? next : row));
}

export function getTeamStoreForTeam(rows = [], teamId = "") {
  const key = clean(teamId);
  if (!key) return null;
  return (Array.isArray(rows) ? rows : [])
    .map(normalizeTeamStore)
    .find((row) => row.teamId === key && row.status === "active") || null;
}

export function buildTeamStoreClick({ store, userRole = "unknown", source = "team_store_portal" } = {}) {
  const normalized = normalizeTeamStore(store);
  return {
    id: `store-click-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    teamStoreId: normalized.id,
    teamId: normalized.teamId,
    provider: normalized.provider,
    userRole: clean(userRole) || "unknown",
    source: clean(source) || "team_store_portal",
    clickedAt: new Date().toISOString(),
  };
}

export function appendTeamStoreClick(rows = [], click = {}) {
  const list = Array.isArray(rows) ? rows : [];
  return [...list, click].slice(-2000);
}

export function getStoreVisitMetrics(rows = [], teamId = "") {
  const key = clean(teamId);
  const clicks = (Array.isArray(rows) ? rows : []).filter((row) => clean(row.teamId) === key);
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  return {
    total: clicks.length,
    today: clicks.filter((row) => now - new Date(row.clickedAt).getTime() <= day).length,
    week: clicks.filter((row) => now - new Date(row.clickedAt).getTime() <= 7 * day).length,
    month: clicks.filter((row) => now - new Date(row.clickedAt).getTime() <= 30 * day).length,
  };
}
