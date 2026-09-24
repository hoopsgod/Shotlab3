import { buildApiIdentityHeaders, normalizeIdentity } from "./apiIdentityHeaders.js";
import { isDemoAccount } from "./demoMode.js";

const readPlayers = () => {
  try {
    const rows = JSON.parse(window.localStorage?.getItem("sl:players") || "[]");
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
};

const persistPhotoLocally = (email, photoUrl) => {
  const identity = normalizeIdentity(email);
  if (!identity) return;
  const rows = readPlayers();
  const next = rows.map((row) => normalizeIdentity(row?.email) === identity
    ? { ...row, photo_url: photoUrl || null, photoUrl: photoUrl || null }
    : row);
  try { window.localStorage?.setItem("sl:players", JSON.stringify(next)); } catch {}
  window.dispatchEvent(new CustomEvent("shotlab:player-photo-updated", { detail: { email: identity, photoUrl: photoUrl || "" } }));
};

const fileToDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result || ""));
  reader.onerror = () => reject(new Error("preview_failed"));
  reader.readAsDataURL(file);
});

export async function loadPlayerProfilePhoto({ requester, fallbackUrl = "" } = {}) {
  const identity = normalizeIdentity(requester);
  if (!identity) return { ok: false, photoUrl: String(fallbackUrl || "") };
  if (isDemoAccount(identity)) return { ok: true, photoUrl: String(fallbackUrl || "") };

  try {
    const response = await fetch("/v1/player-photo", {
      headers: buildApiIdentityHeaders({ requester: identity }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || !body?.ok) return { ok: false, photoUrl: String(fallbackUrl || "") };
    const photoUrl = String(body?.photo_url || fallbackUrl || "").trim();
    if (photoUrl) persistPhotoLocally(identity, photoUrl);
    return { ok: true, photoUrl };
  } catch {
    return { ok: false, photoUrl: String(fallbackUrl || "") };
  }
}

export async function savePlayerProfilePhoto({ requester, file } = {}) {
  const identity = normalizeIdentity(requester);
  if (!identity || !file) return { ok: false, message: "Could not save the photo. Check your connection and try again." };

  if (isDemoAccount(identity)) {
    try {
      const photoUrl = await fileToDataUrl(file);
      persistPhotoLocally(identity, photoUrl);
      return {
        ok: true,
        photoUrl,
        message: "Profile photo updated for this demo session.",
      };
    } catch {
      return { ok: false, message: "Could not save the photo. Check your connection and try again." };
    }
  }

  try {
    const form = new FormData();
    form.append("file", file, file.name || "profile-photo");
    const response = await fetch("/v1/player-photo", {
      method: "POST",
      headers: buildApiIdentityHeaders({ requester: identity }),
      body: form,
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || !body?.ok || !body?.photo_url) {
      return { ok: false, message: String(body?.message || "Could not save the photo. Check your connection and try again.") };
    }
    const photoUrl = String(body.photo_url);
    persistPhotoLocally(identity, photoUrl);
    return {
      ok: true,
      photoUrl,
      message: "Profile photo saved. Coaches will see it on the roster.",
    };
  } catch {
    return { ok: false, message: "Could not save the photo. Check your connection and try again." };
  }
}
