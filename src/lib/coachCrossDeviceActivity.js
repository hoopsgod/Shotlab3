const clean = (value) => String(value ?? "").trim();
const key = (value) => clean(value).toLowerCase();
const safeArray = (value) => (Array.isArray(value) ? value : []);

const readJson = (storage, storageKey, fallback) => {
  try {
    const value = storage?.getItem?.(storageKey);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

export function resolveCoachActivityContext({ storage = globalThis?.localStorage, joinCode = "" } = {}) {
  const session = readJson(storage, "sl:session", {});
  const players = safeArray(readJson(storage, "sl:players", []));
  const teams = safeArray(readJson(storage, "sl:teams", []));
  const requester = key(session?.email || session?.user?.email);
  if (!requester) return { ok: false, requester: "", teamId: "" };

  const coach = players.find((row) => key(row?.email) === requester && key(row?.role || (row?.isCoach ? "coach" : "")) === "coach");
  const requestedCode = key(joinCode);
  const teamByCode = requestedCode ? teams.find((row) => key(row?.joinCode || row?.join_code) === requestedCode) : null;
  const teamByOwner = teams.find((row) => key(row?.ownerCoachId || row?.owner_coach_id) === requester);
  const teamId = clean(coach?.teamId || coach?.team_id || teamByCode?.id || teamByOwner?.id);
  return { ok: Boolean(teamId), requester, teamId };
}

const normalizeObservedAt = (row = {}) => {
  const raw = clean(row?.observed_at || row?.ts || row?.date);
  const parsed = Date.parse(raw.length === 10 ? `${raw}T12:00:00Z` : raw);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : "";
};

export function normalizeCoachRemoteResult(row = {}) {
  const made = Math.max(0, Number(row?.made) || 0);
  const name = clean(row?.player_name || row?.name) || "Player";
  const date = clean(row?.date).slice(0, 10);
  const observedAt = normalizeObservedAt(row);
  const identity = key(row?.player_email || row?.player_id || row?.email || name);
  return {
    id: clean(row?.id) || `remote-result:${identity}:${observedAt || date}:${made}`,
    identity,
    name,
    detail: `Home shots · ${made} make${made === 1 ? "" : "s"}`,
    meta: date || "Recent",
    date,
    observedAt,
    made,
    source: "remote-first-result",
  };
}

export function mergeCoachActivityItems({ localItems = [], remoteItems = [] } = {}) {
  const combined = [
    ...safeArray(remoteItems).map((item) => ({ ...item, observedAt: item?.observedAt || normalizeObservedAt(item) })),
    ...safeArray(localItems).map((item) => ({ ...item, observedAt: item?.observedAt || normalizeObservedAt(item) })),
  ];
  const seen = new Set();
  return combined
    .filter((item) => {
      const signature = clean(item?.id) || [key(item?.identity || item?.name || item?.title), clean(item?.date || item?.meta), clean(item?.detail)].join("|");
      if (!signature || seen.has(signature)) return false;
      seen.add(signature);
      return true;
    })
    .sort((a, b) => Date.parse(b?.observedAt || 0) - Date.parse(a?.observedAt || 0));
}

export function getRemoteActiveNamesToday(items = [], today = new Date().toISOString().slice(0, 10)) {
  return new Set(safeArray(items).filter((item) => clean(item?.date) === today).map((item) => key(item?.name)).filter(Boolean));
}

export async function loadCoachCrossDeviceActivity({
  storage = globalThis?.localStorage,
  joinCode = "",
  fetchImpl = globalThis?.fetch,
  limit = 25,
} = {}) {
  const context = resolveCoachActivityContext({ storage, joinCode });
  if (!context.ok || typeof fetchImpl !== "function") return { ok: false, items: [], context };
  try {
    const response = await fetchImpl(`/v1/coach/activity/first-results?team_id=${encodeURIComponent(context.teamId)}&limit=${Math.max(1, Math.min(Number(limit) || 25, 50))}`, {
      headers: { "x-user-id": context.requester },
      cache: "no-store",
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) return { ok: false, items: [], context, code: body?.error || "activity_load_failed" };
    return { ok: true, items: safeArray(body?.results).map(normalizeCoachRemoteResult), context };
  } catch {
    return { ok: false, items: [], context, code: "network_error" };
  }
}
