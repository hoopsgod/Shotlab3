import { useEffect, useMemo, useRef, useState } from "react";
import { normalizeIdentity } from "../lib/apiIdentityHeaders.js";
import { loadPlayerProfilePhoto, savePlayerProfilePhoto } from "../lib/playerProfilePhotoService.js";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export default function PlayerProfilePhotoCard({ player = {} }) {
  const inputRef = useRef(null);
  const requester = useMemo(() => normalizeIdentity(player?.email || player?.userEmail || player?.playerId), [player]);
  const displayName = String(player?.name || requester?.split("@")[0] || "Player").trim();
  const initialUrl = String(player?.photoUrl || player?.photo_url || "").trim();
  const [photoUrl, setPhotoUrl] = useState(initialUrl);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    if (!requester) return () => { active = false; };
    loadPlayerProfilePhoto({ requester, fallbackUrl: initialUrl }).then((result) => {
      if (!active || !result?.ok) return;
      const nextUrl = String(result?.photoUrl || "").trim();
      if (nextUrl) setPhotoUrl(nextUrl);
    });
    return () => { active = false; };
  }, [requester, initialUrl]);

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
      const result = await savePlayerProfilePhoto({ requester, file });
      if (!result?.ok || !result?.photoUrl) {
        setStatus(String(result?.message || "Could not save the photo. Check your connection and try again."));
        return;
      }
      setPhotoUrl(String(result.photoUrl));
      setStatus(String(result?.message || "Profile photo saved."));
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
