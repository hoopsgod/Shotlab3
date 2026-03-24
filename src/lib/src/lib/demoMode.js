// File: src/lib/demoMode.js
export function isDemoMode() {
  // 1) build-time flag (if you ever set it later)
  const env = String(import.meta?.env?.VITE_DEMO_MODE ?? "").toLowerCase();
  if (env === "true") return true;

  // 2) URL flag: https://yoursite?demo=1
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.get("demo") === "1") return true;
  } catch {
    // ignore
  }

  // 3) sticky flag: localStorage.setItem("sl:demoMode","true")
  return window.localStorage.getItem("sl:demoMode") === "true";
}

export function setDemoMode(enabled) {
  if (enabled) window.localStorage.setItem("sl:demoMode", "true");
  else window.localStorage.removeItem("sl:demoMode");
}
