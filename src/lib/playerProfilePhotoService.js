import { buildApiIdentityHeaders, normalizeIdentity } from "./apiIdentityHeaders.js";
import { isDemoAccount } from "./demoMode.js";

export async function savePlayerProfilePhoto(requester, file) {
  const id = normalizeIdentity(requester);
  const error = "Could not save the photo. Try again.";
  if (!id || !file) return { message: error };
  if (isDemoAccount(id)) return { photoUrl: URL.createObjectURL(file), message: "Photo updated for this demo session." };
  try {
    const form = new FormData();
    form.append("file", file);
    const response = await fetch("/v1/player-photo", { method: "POST", headers: buildApiIdentityHeaders({ requester: id }), body: form });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || !body?.photo_url) return { message: body?.message || error };
    return { photoUrl: body.photo_url, message: "Profile photo saved." };
  } catch { return { message: error }; }
}
