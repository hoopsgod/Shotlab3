import { useState } from "react";
import { savePlayerProfilePhoto } from "../lib/playerProfilePhotoService.js";

export default function PlayerProfilePhotoCard({ player = {} }) {
  const id = player.email || "", name = player.name || "Player";
  const [saved, setSaved] = useState("");
  const photo = saved || player.photoUrl || player.photo_url;
  async function upload(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5242880) return setSaved(false);
    try { setSaved(await savePlayerProfilePhoto(id, file)); } catch { setSaved(false); }
  }
  return <div data-testid="player-profile-photo-card" style={{display:"grid",justifyItems:"center",gap:11,minWidth:118}}>
    <div style={{width:76,height:76,borderRadius:"50%",overflow:"hidden",display:"grid",placeItems:"center",fontSize:26,fontWeight:800,color:"#fff",background:"var(--team-brand-primary,#24351d)",border:"2px solid color-mix(in srgb,var(--team-brand-primary,var(--accent,#c8ff1a)) 72%,white)",boxShadow:"0 8px 22px rgba(0,0,0,.22)"}}>{photo?<img src={photo} alt={name} width="76" height="76" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:name[0].toUpperCase()}</div>
    <label data-testid="player-profile-photo-action" style={{minHeight:44,display:"inline-flex",alignItems:"center",justifyContent:"center",padding:"0 16px",borderRadius:999,border:"1px solid color-mix(in srgb,var(--team-brand-primary,var(--accent,#c8ff1a)) 68%,white)",background:"rgba(255,255,255,.08)",color:"#fff",fontWeight:800,cursor:"pointer"}}>{photo?"Change photo":"Add photo"}<input data-testid="player-profile-photo-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={upload} hidden/></label>
    {saved===false&&<div role="alert" style={{fontSize:11,color:"#ffb5b5"}}>Upload failed.</div>}
  </div>;
}
