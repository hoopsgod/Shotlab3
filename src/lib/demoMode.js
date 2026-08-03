const DEMO_ACCOUNT_EMAILS = new Set(["demo@shotlab.app", "coach.demo@shotlab.app"]);
const DEMO_SESSION_KEY = "sl:demoSession";
const LEGACY_DEMO_KEY = "sl:demoMode";

export function isDemoAccount(userOrEmail) {
  const email = typeof userOrEmail === "string" ? userOrEmail : userOrEmail?.email;
  return DEMO_ACCOUNT_EMAILS.has(String(email || "").trim().toLowerCase());
}

export function isDemoMode() {
  if (typeof window === "undefined") return false;
  const fromQuery = new URLSearchParams(window.location.search).get("demo") === "1";
  const fromCurrentSession = window.sessionStorage.getItem(DEMO_SESSION_KEY) === "true";

  // Remove the former persistent flag so a past demo visit can never bypass login.
  window.localStorage.removeItem(LEGACY_DEMO_KEY);

  if (fromQuery) window.sessionStorage.setItem(DEMO_SESSION_KEY, "true");
  return fromQuery || fromCurrentSession;
}

export function setDemoMode(enabled) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(LEGACY_DEMO_KEY);
  if (enabled) window.sessionStorage.setItem(DEMO_SESSION_KEY, "true");
  else window.sessionStorage.removeItem(DEMO_SESSION_KEY);
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
