const DEMO_ACCOUNT_EMAILS = new Set(["demo@shotlab.app", "coach.demo@shotlab.app"]);

export function isDemoAccount(userOrEmail) {
  const email = typeof userOrEmail === "string" ? userOrEmail : userOrEmail?.email;
  return DEMO_ACCOUNT_EMAILS.has(String(email || "").trim().toLowerCase());
}

export function isDemoMode() {
  if (typeof window === "undefined") return false;
  const search = window.location.search;
  // Demo mode is enabled with /?demo=1.
  const fromQuery = new URLSearchParams(search).get("demo") === "1";
  const fromStickyFlag = window.localStorage.getItem("sl:demoMode") === "true";
  return fromQuery || fromStickyFlag;
}

export function setDemoMode(enabled) {
  if (typeof window === "undefined") return;
  if (enabled) window.localStorage.setItem("sl:demoMode", "true");
  else window.localStorage.removeItem("sl:demoMode");
}
