import { useState } from "react";
import { savePlayerProfilePhoto } from "../lib/playerProfilePhotoService.js";

export default function PlayerProfilePhotoCard({ player = {} }) {
  const id = player.email || player.userEmail || "";
  const name = player.name || id.split("@")[0] || "Player";
  const [saved, setSaved] = useState("");
  const photo = saved || player.photoUrl || player.photo_url;

  async function upload({ target }) {
    const file = target.files?.[0];
    if (!file) return;
    if (file.size > 5242880) return setSaved(false);
    try { setSaved(await savePlayerProfilePhoto(id, file)); }
    catch { setSaved(false); }
  }

  return <section data-testid="player-profile-photo-card" aria-label="Profile photo" style={{display:"flex",gap:12,alignItems:"center"}}>
    <div style={{width:64,height:64,borderRadius:"50%",overflow:"hidden",display:"grid",placeItems:"center"}}>{photo?<img src={photo} alt={name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:name[0]?.toUpperCase()||"P"}</div>
    <div><strong>Profile photo</strong><br/>
      <label data-testid="player-profile-photo-action" className="cta-primary">{photo?"Change photo":"Add photo"}
        <input data-testid="player-profile-photo-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={upload} hidden/>
      </label>
      {saved===false&&<div role="alert">Upload failed.</div>}
    </div>
  </section>;
}
