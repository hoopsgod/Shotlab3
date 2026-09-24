import { buildApiIdentityHeaders, normalizeIdentity } from "./apiIdentityHeaders.js";
import { isDemoAccount } from "./demoMode.js";

export async function loadPlayerProfilePhoto(requester, fallback = "") {
  const id = normalizeIdentity(requester);
  if (!id || isDemoAccount(id)) return { ok: true, photoUrl: fallback };
  try {
    const response = await fetch("/v1/player-photo", { headers: buildApiIdentityHeaders({ requester: id }) });
    const body = await response.json().catch(() => ({}));
    return response.ok && body?.ok ? { ok: true, photoUrl: body.photo_url || fallback } : { ok: false, photoUrl: fallback };
  } catch { return { ok: false, photoUrl: fallback }; }
}

export async function savePlayerProfilePhoto(requester, file) {
  const id = normalizeIdentity(requester);
  const error = "Could not save the photo. Try again.";
  if (!id || !file) return { ok: false, message: error };
  if (isDemoAccount(id)) return { ok: true, photoUrl: URL.createObjectURL(file), message: "Profile photo updated for this demo session." };
  try {
    const form = new FormData();
    form.append("file", file);
    const response = await fetch("/v1/player-photo", { method: "POST", headers: buildApiIdentityHeaders({ requester: id }), body: form });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || !body?.ok || !body?.photo_url) return { ok: false, message: body?.message || error };
    return { ok: true, photoUrl: body.photo_url, message: "Profile photo saved. Coaches will see it on the roster." };
  } catch { return { ok: false, message: error }; }
}
