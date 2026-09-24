import { useEffect, useMemo, useRef, useState } from "react";
import { buildApiIdentityHeaders, normalizeIdentity } from "../lib/apiIdentityHeaders.js";
import { isDemoAccount } from "../lib/demoMode.js";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

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

export default function PlayerProfilePhotoCard({ player = {} }) {
  const inputRef = useRef(null);
  const requester = useMemo(() => normalizeIdentity(player?.email || player?.userEmail || player?.playerId), [player]);
  const displayName = String(player?.name || requester?.split("@")[0] || "Player").trim();
  const initialUrl = String(player?.photoUrl || player?.photo_url || "").trim();
  const [photoUrl, setPhotoUrl] = useState(initialUrl);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const demo = isDemoAccount(requester);

  useEffect(() => {
    let active = true;
    if (!requester || demo) return () => { active = false; };
    (async () => {
      try {
        const response = await fetch("/v1/player-photo", {
          headers: buildApiIdentityHeaders({ requester }),
        });
        const body = await response.json().catch(() => ({}));
        if (!active || !response.ok || !body?.ok) return;
        const nextUrl = String(body?.photo_url || "").trim();
        if (nextUrl) {
          setPhotoUrl(nextUrl);
          persistPhotoLocally(requester, nextUrl);
        }
      } catch {}
    })();
    return () => { active = false; };
  }, [requester, demo]);

  const chooseFile = () => inputRef.current?.click();

  const upload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!ALLOWED_TYPES.has(file.type)) {
      setStatus("Use a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setStatus("Choose an image smaller than 5 MB.");
      return;
    }

    setBusy(true);
    setStatus("");
    try {
      if (demo) {
        const localPreview = await fileToDataUrl(file);
        setPhotoUrl(localPreview);
        setStatus("Demo preview updated. Registered players can save the photo to their profile.");
        return;
      }

      const form = new FormData();
      form.append("file", file, file.name || "profile-photo");
      const response = await fetch("/v1/player-photo", {
        method: "POST",
        headers: buildApiIdentityHeaders({ requester }),
        body: form,
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body?.ok || !body?.photo_url) {
        throw new Error(String(body?.message || body?.error || "photo_upload_failed"));
      }
      const nextUrl = String(body.photo_url);
      setPhotoUrl(nextUrl);
      persistPhotoLocally(requester, nextUrl);
      setStatus("Profile photo saved. Coaches will see it on the roster.");
    } catch {
      setStatus("Could not save the photo. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  const initials = displayName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "P";

  return (
    <section data-testid="player-profile-photo-card" aria-label="Profile photo" style={{
      display: "grid",
      gridTemplateColumns: "84px minmax(0,1fr)",
      gap: 14,
      alignItems: "center",
      padding: "15px 16px",
      marginBottom: 12,
      border: "1px solid color-mix(in srgb,var(--accent,#617900) 18%,rgba(7,24,32,.14))",
      borderRadius: 16,
      background: "linear-gradient(135deg,color-mix(in srgb,var(--accent,#617900) 8%,#fff),#fff 58%)",
      color: "#071820",
    }}>
      <div style={{ width: 84, height: 84, borderRadius: "50%", overflow: "hidden", display: "grid", placeItems: "center", background: "color-mix(in srgb,var(--accent,#617900) 13%,#eef2e9)", border: "2px solid color-mix(in srgb,var(--accent,#617900) 36%,#fff)", fontSize: 24, fontWeight: 850 }}>
        {photoUrl ? <img src={photoUrl} alt={`${displayName} profile`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /> : initials}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".11em", textTransform: "uppercase", color: "#68766c" }}>Player identity</div>
        <h2 style={{ margin: "2px 0 4px", fontFamily: "'Barlow Condensed','Arial Narrow',sans-serif", fontSize: 23, lineHeight: 1, textTransform: "uppercase" }}>Profile photo</h2>
        <p style={{ margin: "0 0 10px", fontSize: 12, lineHeight: 1.35, color: "#536159" }}>This photo appears on your profile and on the coach roster.</p>
        <input ref={inputRef} data-testid="player-profile-photo-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={upload} hidden />
        <button type="button" data-testid="player-profile-photo-action" onClick={chooseFile} disabled={busy} style={{ minHeight: 44, padding: "0 14px", borderRadius: 10, border: "1px solid #465717", background: "#465717", color: "#fff", fontWeight: 800, cursor: busy ? "wait" : "pointer" }}>
          {busy ? "Saving…" : photoUrl ? "Change photo" : "Add photo"}
        </button>
        {status ? <div role="status" style={{ marginTop: 8, fontSize: 11, lineHeight: 1.35, color: "#59665f" }}>{status}</div> : null}
      </div>
    </section>
  );
}
