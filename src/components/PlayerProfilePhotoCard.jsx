import { useState } from "react";
import { savePlayerProfilePhoto } from "../lib/playerProfilePhotoService.js";

export default function PlayerProfilePhotoCard({ player = {} }) {
  const id = player.email || "";
  const name = player.name || "Player";
  const [saved, setSaved] = useState("");
  const photo = saved || player.photoUrl || player.photo_url;

  async function upload(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5242880) return setSaved(false);
    try { setSaved(await savePlayerProfilePhoto(id, file)); }
    catch { setSaved(false); }
  }

  return <section data-testid="player-profile-photo-card" style={{display:"flex",gap:12}}>
    <div style={{width:64,height:64,borderRadius:"50%",overflow:"hidden",display:"grid",placeItems:"center"}}>{photo?<img src={photo} alt={name} width={64} height={64} style={{objectFit:"cover"}}/>:name[0].toUpperCase()}</div>
    <div><strong>Profile photo</strong><br/>
      <label data-testid="player-profile-photo-action" className="cta-primary">{photo?"Change photo":"Add photo"}
        <input data-testid="player-profile-photo-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={upload} hidden/>
      </label>
      {saved===false&&<div role="alert">Upload failed.</div>}
    </div>
  </section>;
}
