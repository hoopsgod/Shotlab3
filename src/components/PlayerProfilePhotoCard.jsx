import { useState } from "react";
import { savePlayerProfilePhoto } from "../lib/playerProfilePhotoService.js";

export default function PlayerProfilePhotoCard({ player = {} }) {
  const [saved, setSaved] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const photo = saved || player.photoUrl || player.photo_url;

  async function upload(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError("");
    setBusy(true);
    try {
      setSaved(await savePlayerProfilePhoto(player.email || "", file));
    } catch (uploadError) {
      setError(String(uploadError?.message || "Upload failed. Try another photo."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="premiumSummaryPanel" aria-busy={busy}>
      {photo && <img src={photo} alt="Player profile" width="80" height="80" style={{ borderRadius: "50%", objectFit: "cover" }} />}
      <label className="btn-v cta-primary" aria-disabled={busy}>
        {busy ? "Preparing photo…" : photo ? "Change photo" : "Add photo"}
        <input type="file" accept="image/*" onChange={upload} disabled={busy} hidden />
      </label>
      {error && <small role="alert">{error}</small>}
    </section>
  );
}
