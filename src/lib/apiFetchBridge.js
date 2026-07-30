import { buildApiIdentityHeaders } from "./apiIdentityHeaders.js";

const BRIDGE_MARKER = Symbol.for("shotlab.apiIdentityFetchBridge");

function readRequester(storage = globalThis?.localStorage) {
  try {
    const raw = storage?.getItem?.("sl:session");
    if (!raw) return "";
    const parsed = JSON.parse(raw);
    const session = Array.isArray(parsed) ? parsed[0] : parsed;
    return String(session?.email || session?.userEmail || session?.user_id || "").trim().toLowerCase();
  } catch {
    return "";
  }
}

function apiPathFor(input, target = globalThis) {
  try {
    const raw = typeof input === "string" || input instanceof URL ? String(input) : String(input?.url || "");
    if (!raw) return "";
    if (raw.startsWith("/v1/")) return raw;
    const base = target?.location?.origin || "https://shotlab.invalid";
    const url = new URL(raw, base);
    if (target?.location?.origin && url.origin !== target.location.origin) return "";
    return url.pathname.startsWith("/v1/") ? `${url.pathname}${url.search}` : "";
  } catch {
    return "";
  }
}

export function installApiIdentityFetchBridge(target = globalThis) {
  if (!target || typeof target.fetch !== "function") return null;
  if (target.fetch?.[BRIDGE_MARKER]) return target.fetch;

  const originalFetch = target.fetch.bind(target);
  const wrappedFetch = async (input, init = {}) => {
    if (!apiPathFor(input, target)) return originalFetch(input, init);

    const currentHeaders = new Headers(
      init?.headers || (typeof input === "object" && input?.headers ? input.headers : undefined),
    );
    const identityHeaders = buildApiIdentityHeaders({
      requester: readRequester(target?.localStorage),
      storage: target?.localStorage,
    });
    for (const [key, value] of Object.entries(identityHeaders)) {
      if (value && !currentHeaders.has(key)) currentHeaders.set(key, value);
    }
    return originalFetch(input, { ...init, headers: currentHeaders });
  };
  Object.defineProperty(wrappedFetch, BRIDGE_MARKER, { value: true });
  target.fetch = wrappedFetch;
  return wrappedFetch;
}

export const __testUtils = { apiPathFor, readRequester, BRIDGE_MARKER };
