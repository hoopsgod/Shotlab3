export function isDemoMode() {
  const search = typeof window !== "undefined" ? window.location.search : "";
  // Demo mode is enabled with /?demo=1.
  return new URLSearchParams(search).get("demo") === "1";
}
