import { useState } from "react";
import { savePlayerProfilePhoto } from "../lib/playerProfilePhotoService.js";

export default function PlayerProfilePhotoCard({ player = {} }) {
  const id = player.email || player.userEmail || player.playerId || "";
  const name = player.name || String(id).split("@")[0] || "Player";
  const [photo, setPhoto] = useState(player.photoUrl || player.photo_url);
  const [error, setError] = useState("");

  async function upload({ target }) {
    const file = target.files?.[0];
    target.value = "";
    if (!file) return;
    if (file.size > 5242880) return setError("Choose an image smaller than 5 MB.");
    try {
      setPhoto(await savePlayerProfilePhoto(id, file));
      setError("");
    } catch (cause) {
      setError(cause?.message || "Could not save photo.");
    }
  }

  return <section data-testid="player-profile-photo-card" aria-label="Profile photo" style={{display:"flex",gap:12,alignItems:"center"}}>
    <div style={{width:64,height:64,borderRadius:"50%",overflow:"hidden",display:"grid",placeItems:"center"}}>{photo?<img src={photo} alt={name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:String(name)[0]?.toUpperCase()||"P"}</div>
    <div><strong>Profile photo</strong><br/>
      <input id="player-profile-photo-input" data-testid="player-profile-photo-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={upload} hidden/>
      <label data-testid="player-profile-photo-action" htmlFor="player-profile-photo-input" style={{display:"inline-flex",minHeight:44,alignItems:"center",padding:"0 14px",borderRadius:10,background:"#465717",color:"#fff",fontWeight:800,cursor:"pointer"}}>{photo?"Change photo":"Add photo"}</label>
      {error&&<div role="alert">{error}</div>}
    </div>
  </section>;
}
