import { buildApiIdentityHeaders } from "./apiIdentityHeaders.js";

export const normalizeSignedIdentity = (value) => String(value || "").trim().toLowerCase();

export function readSignedStorageJson(storage, key) {
  try {
    const raw = storage?.getItem?.(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function createSignedScoreApi({ endpoint, payloadField, kind, fetchImpl, storage }) {
  const requester = () => {
    const value = readSignedStorageJson(storage, "sl:session");
    const session = Array.isArray(value) ? value[0] || null : value;
    return normalizeSignedIdentity(session?.email || session?.userEmail || session?.user_id);
  };

  const request = async (method, payload, query = "") => {
    const response = await fetchImpl(`${endpoint}${query}`, {
      method,
      headers: buildApiIdentityHeaders({
        requester: requester(),
        storage,
        headers: method === "GET" ? {} : { "Content-Type": "application/json" },
      }),
      ...(payload ? { body: JSON.stringify(payload) } : {}),
    });
    let body = {};
    try { body = await response.json(); } catch {}
    if (!response?.ok || body?.error) {
      const operation = method === "GET" ? "load" : method === "POST" ? "write" : "delete";
      const code = String(body?.error || `${kind}_${operation}_failed`);
      throw Object.assign(new Error(code), { code, status: Number(response?.status || 0), body });
    }
    return body;
  };

  return {
    available: typeof fetchImpl === "function",
    requester,
    load: (teamId = "") => {
      const value = String(teamId || "").trim();
      return request("GET", null, value ? `?team_id=${encodeURIComponent(value)}` : "");
    },
    upsert: (rows) => request("POST", { [payloadField]: rows }),
    remove: (teamId, playerIdentity) => request("DELETE", { team_id: teamId, player_identity: playerIdentity }),
  };
}
