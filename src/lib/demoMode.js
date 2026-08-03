const DEMO_ACCOUNT_EMAILS = new Set(["demo@shotlab.app", "coach.demo@shotlab.app"]);
const DEMO_SESSION_KEY = "sl:demoSession";
const LEGACY_DEMO_KEY = "sl:demoMode";
const APP_SESSION_KEY = "sl:session";

export function isDemoAccount(userOrEmail) {
  const email = typeof userOrEmail === "string" ? userOrEmail : userOrEmail?.email;
  return DEMO_ACCOUNT_EMAILS.has(String(email || "").trim().toLowerCase());
}

function parseStoredSession(raw) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === "string") return { email: parsed };
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function clearPersistedDemoAuthSession() {
  if (typeof window === "undefined") return;

  const candidates = [
    window.localStorage?.getItem(APP_SESSION_KEY),
    window.sessionStorage?.getItem(APP_SESSION_KEY),
  ];
  const hasDemoSession = candidates.some((raw) => isDemoAccount(parseStoredSession(raw)?.email));
  if (!hasDemoSession) return;

  window.localStorage?.removeItem(APP_SESSION_KEY);
  window.sessionStorage?.removeItem(APP_SESSION_KEY);

  // Some builds expose an async storage bridge used by App hydration. Clear the
  // same key there before the normal unauthenticated route is evaluated.
  try {
    const result = window.storage?.set?.(APP_SESSION_KEY, "null", true);
    result?.catch?.(() => {});
  } catch {}
}

export function isDemoMode() {
  if (typeof window === "undefined") return false;

  const explicitDemo = new URLSearchParams(window.location.search).get("demo") === "1";

  // Demo mode is explicit and query-only. Stored demo state must never bypass login.
  window.localStorage.removeItem(LEGACY_DEMO_KEY);
  window.sessionStorage.removeItem(DEMO_SESSION_KEY);

  if (!explicitDemo) clearPersistedDemoAuthSession();
  return explicitDemo;
}

export function setDemoMode(enabled) {
  if (typeof window === "undefined") return;

  // Clear all historical demo persistence. Entry into demo mode must happen through
  // an explicit demo URL or route, never through browser storage.
  window.localStorage.removeItem(LEGACY_DEMO_KEY);
  window.sessionStorage.removeItem(DEMO_SESSION_KEY);

  if (!enabled) {
    clearPersistedDemoAuthSession();
    const url = new URL(window.location.href);
    url.searchParams.delete("demo");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  }
}

export function isDemoPlayerSessionShotLog(row = {}, { teamId = '' } = {}) {
  const rowEmail = String(row?.email || row?.player_email || row?.playerId || row?.player_id || '').trim().toLowerCase();
  const rowTeamId = String(row?.teamId || row?.team_id || '').trim();
  const syncSource = String(row?.syncSource || row?.sync_source || '').trim().toLowerCase();
  const syncState = String(row?.syncState || row?.sync_state || '').trim().toLowerCase();
  const hasDemoMarker = row?.demo === true || syncSource === 'demo' || syncSource === 'local' || syncState === 'local_pending';
  const teamMatches = !teamId || !rowTeamId || rowTeamId === String(teamId).trim();
  return rowEmail === 'demo@shotlab.app' && teamMatches && hasDemoMarker;
}
