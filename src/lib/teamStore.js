export const TEAM_STORE_STORAGE_KEY = "sl:team-stores";
export const TEAM_STORE_CLICKS_KEY = "sl:team-store-clicks";
export const TEAM_STORE_REFERRALS_KEY = "sl:team-store-referrals";
export const SQUADLOCKER_PARTNER_SIGNUP_URL = "https://www.squadlocker.com/partner/form";

export const TEAM_STORE_PROVIDERS = [
  { key: "squadlocker", label: "SquadLocker" },
  { key: "bsn", label: "BSN Sports" },
  { key: "other", label: "Other provider" },
];

export const AFFILIATE_DISCLOSURE =
  "ShotLab may receive referral compensation when a qualifying organization starts with an apparel partner through our partner link.";

const clean = (value) => String(value ?? "").trim();

export function buildSquadLockerCreationUrl({ baseUrl, source = "coach_team_store" } = {}) {
  const configuredUrl = clean(baseUrl) || clean(import.meta.env?.VITE_SQUADLOCKER_PARTNER_URL);
  let parsed;
  try {
    parsed = new URL(configuredUrl || SQUADLOCKER_PARTNER_SIGNUP_URL);
  } catch {
    return "";
  }
  if (parsed.protocol !== "https:") return "";
  parsed.searchParams.set("utm_source", "shotlab");
  parsed.searchParams.set("utm_medium", "partner_referral");
  parsed.searchParams.set("utm_campaign", "team_store_creation");
  parsed.searchParams.set("utm_content", clean(source) || "coach_team_store");
  if (!parsed.searchParams.has("referral_partner_master")) {
    parsed.searchParams.set("referral_partner_master", "ShotLab");
  }
  return parsed.toString();
}

function normalizeTeamStoreReferralStart(value = {}) {
  return {
    id: clean(value.id),
    teamId: clean(value.teamId || value.team_id),
    provider: value.provider === "squadlocker" ? "squadlocker" : "other",
    source: clean(value.source) || "shotlab_partner_link",
    startedAt: clean(value.startedAt || value.started_at),
  };
}

export function buildTeamStoreReferralStart({ teamId, provider = "squadlocker" } = {}) {
  const normalizedTeamId = clean(teamId);
  return normalizeTeamStoreReferralStart({
    id: `store-referral-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    teamId: normalizedTeamId,
    provider,
    source: "shotlab_partner_link",
    startedAt: new Date().toISOString(),
  });
}

export function upsertTeamStoreReferralStart(rows = [], value = {}) {
  const next = normalizeTeamStoreReferralStart(value);
  if (!next.teamId || !next.startedAt) return Array.isArray(rows) ? rows : [];
  const list = (Array.isArray(rows) ? rows : [])
    .map(normalizeTeamStoreReferralStart)
    .filter((row) => row.teamId && row.teamId !== next.teamId);
  return [...list, next].slice(-500);
}

export function getTeamStoreReferralStart(rows = [], teamId = "") {
  const key = clean(teamId);
  if (!key) return null;
  return [...(Array.isArray(rows) ? rows : [])]
    .reverse()
    .map(normalizeTeamStoreReferralStart)
    .find((row) => row.teamId === key) || null;
}

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
