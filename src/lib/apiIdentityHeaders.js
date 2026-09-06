export const normalizeIdentity = (value) => String(value || "").trim().toLowerCase();
export const cleanValue = (value) => String(value ?? "").trim();

const readStorage = (storage, key) => {
  try { return storage?.getItem?.(key) || ""; } catch { return ""; }
};

export function parseStored(storage, key, fallback) {
  try {
    const raw = readStorage(storage, key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function readSession(storage = globalThis?.localStorage) {
  const parsed = parseStored(storage, "sl:session", null);
  return Array.isArray(parsed) ? parsed[0] : parsed;
}

export function readRequester(storage = globalThis?.localStorage) {
  const session = readSession(storage);
  return normalizeIdentity(session?.email || session?.userEmail || session?.user_id);
}

export function readActorContext(storage = globalThis?.localStorage) {
  const session = readSession(storage);
  const requester = normalizeIdentity(session?.email || session?.userEmail || session?.user_id);
  const players = parseStored(storage, "sl:players", []);
  const actor = (Array.isArray(players) ? players : []).find((row) => normalizeIdentity(row?.email) === requester);
  return {
    requester,
    role: normalizeIdentity(session?.role || actor?.role),
    teamId: cleanValue(session?.teamId || session?.team_id || actor?.teamId || actor?.team_id),
  };
}

export function readSupabaseAccessToken(storage = globalThis?.localStorage) {
  const session = parseStored(storage, "sl:supabase-session", null);
  return cleanValue(session?.access_token || readStorage(storage, "sl:supabase-access-token"));
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

const readJson = async (response) => {
  try { return await response.json(); } catch { return {}; }
};

export function requestError(body, response, fallback) {
  const code = String(body?.error || fallback);
  const error = new Error(code);
  error.code = code;
  error.status = Number(response?.status || 0);
  error.body = body;
  return error;
}

export async function requestSignedJson(fetchImpl, path, method, storage, data = null) {
  const response = await fetchImpl(path, {
    method,
    headers: buildApiIdentityHeaders({ requester: readRequester(storage), storage, headers: data == null ? {} : { "Content-Type": "application/json" } }),
    ...(data == null ? {} : { body: JSON.stringify(data) }),
  });
  return [await readJson(response), response];
}

export async function requestSignedBody(fetchImpl, path, method, storage, data, fallback) {
  const [body, response] = await requestSignedJson(fetchImpl, path, method, storage, data);
  if (!response?.ok || body?.ok === false || body?.error) throw requestError(body, response, fallback);
  return body;
}

export const signedStorageMode = (body) => String(body?.storage_mode || "signed_api");
