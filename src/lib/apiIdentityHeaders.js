const normalizeIdentity = (value) => String(value || "").trim().toLowerCase();

const readStorage = (storage, key) => {
  try { return storage?.getItem?.(key) || ""; } catch { return ""; }
};

const readJson = (storage, key) => {
  try {
    const raw = readStorage(storage, key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export function readSupabaseAccessToken(storage = globalThis?.localStorage) {
  const session = readJson(storage, "sl:supabase-session");
  return String(session?.access_token || readStorage(storage, "sl:supabase-access-token") || "").trim();
}

export function buildApiIdentityHeaders({
  requester = "",
  storage = globalThis?.localStorage,
  headers = {},
} = {}) {
  const token = readSupabaseAccessToken(storage);
  return {
    ...headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(normalizeIdentity(requester) ? { "x-user-id": normalizeIdentity(requester) } : {}),
  };
}
