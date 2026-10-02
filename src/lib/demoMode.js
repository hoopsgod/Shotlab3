const DEMO_ACCOUNT_EMAILS = new Set(["demo@shotlab.app", "coach.demo@shotlab.app"]);
const DEMO_SESSION_KEY = "sl:demoSession";
const PENDING_DEMO_SESSION_KEY = "sl:pendingDemoSession";
const LEGACY_DEMO_KEY = "sl:demoMode";
const APP_SESSION_KEY = "sl:session";
const PENDING_DEMO_TTL_MS = 30_000;

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

export function isDemoPersistenceSession(options = {}) {
  const browserWindow = typeof window === "undefined" ? null : window;
  const localStorage = options.localStorage ?? browserWindow?.localStorage;
  const sessionStorage = options.sessionStorage ?? browserWindow?.sessionStorage;
  const location = options.location ?? browserWindow?.location;
  const now = Number(options.now ?? Date.now());
  const explicitDemo = new URLSearchParams(String(location?.search || "")).get("demo") === "1";
  if (explicitDemo) return true;

  let activeSession = null;
  try { activeSession = parseStoredSession(sessionStorage?.getItem?.(DEMO_SESSION_KEY)); } catch {}
  if (isDemoAccount(activeSession?.email)) return true;

  const durableSession = [localStorage, sessionStorage]
    .map((storage) => {
      try { return parseStoredSession(storage?.getItem?.(APP_SESSION_KEY)); } catch { return null; }
    })
    .find((session) => isDemoAccount(session?.email));
  if (durableSession) return true;

  let pendingSession = null;
  try { pendingSession = parseStoredSession(sessionStorage?.getItem?.(PENDING_DEMO_SESSION_KEY)); } catch {}
  const createdAt = Number(pendingSession?.createdAt);
  const age = now - createdAt;
  return isDemoAccount(pendingSession?.email)
    && Number.isFinite(createdAt)
    && age >= 0
    && age <= PENDING_DEMO_TTL_MS;
}

function inferPendingDemoEmail() {
  if (typeof window === "undefined") return "";
  const requestedDemo = String(new URLSearchParams(window.location.search).get("demo") || "").trim().toLowerCase();
  if (requestedDemo === "coach") return "coach.demo@shotlab.app";
  if (requestedDemo === "player") return "demo@shotlab.app";

  const active = document?.activeElement;
  const activeLabel = String(
    active?.getAttribute?.("aria-label")
    || active?.textContent
    || "",
  ).trim().toLowerCase();
  if (/\b(?:demo\s+coach|coach\s+demo)\b/.test(activeLabel)) return "coach.demo@shotlab.app";
  if (/\b(?:demo\s+player|player\s+demo)\b/.test(activeLabel)) return "demo@shotlab.app";
  return "";
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
  let activeSameTabDemo = false;
  try {
    activeSameTabDemo = isDemoAccount(
      parseStoredSession(window.sessionStorage?.getItem?.(DEMO_SESSION_KEY))?.email,
    );
  } catch {}

  // Legacy localStorage state must never bootstrap a demo. Only an explicit
  // demo URL or the active marker from this same browser tab may do so.
  window.localStorage.removeItem(LEGACY_DEMO_KEY);

  if (!explicitDemo && !activeSameTabDemo) clearPersistedDemoAuthSession();
  return explicitDemo || activeSameTabDemo;
}

export function setDemoMode(enabled, options = {}) {
  if (typeof window === "undefined") return;

  // Clear historical demo persistence first. Entry into demo mode is then pinned
  // to this browser tab only and therefore cannot leak into a fresh tab/session.
  window.localStorage.removeItem(LEGACY_DEMO_KEY);
  window.sessionStorage.removeItem(DEMO_SESSION_KEY);
  window.sessionStorage.removeItem(PENDING_DEMO_SESSION_KEY);

  if (enabled) {
    // Demo sign-in already knows the account identity. Prefer that explicit value
    // because the async auth sign-out boundary can move focus away from the button
    // before this function runs. Focus inference remains as a backwards-compatible fallback.
    const requestedEmail = typeof options === "string" ? options : options?.email;
    const normalizedRequestedEmail = String(requestedEmail || "").trim().toLowerCase();
    const pendingEmail = isDemoAccount(normalizedRequestedEmail)
      ? normalizedRequestedEmail
      : inferPendingDemoEmail();
    if (isDemoAccount(pendingEmail)) {
      window.sessionStorage.setItem(DEMO_SESSION_KEY, JSON.stringify({ email: pendingEmail }));
      window.sessionStorage.setItem(PENDING_DEMO_SESSION_KEY, JSON.stringify({
        email: pendingEmail,
        createdAt: Date.now(),
      }));
    }
    return;
  }

  clearPersistedDemoAuthSession();
  const url = new URL(window.location.href);
  url.searchParams.delete("demo");
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
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
