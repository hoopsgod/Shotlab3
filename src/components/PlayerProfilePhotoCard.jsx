import { useEffect, useState } from "react";
import { normalizeIdentity } from "../lib/apiIdentityHeaders.js";
import { loadPlayerProfilePhoto, savePlayerProfilePhoto } from "../lib/playerProfilePhotoService.js";

export default function PlayerProfilePhotoCard({ player = {} }) {
  const requester = normalizeIdentity(player?.email || player?.userEmail || player?.playerId);
  const name = String(player?.name || requester?.split("@")[0] || "Player").trim();
  const fallback = String(player?.photoUrl || player?.photo_url || "").trim();
  const [photoUrl, setPhotoUrl] = useState(fallback);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!requester) return;
    loadPlayerProfilePhoto(requester, fallback).then((result) => {
      if (result?.ok && result.photoUrl) setPhotoUrl(String(result.photoUrl));
    });
  }, [requester, fallback]);

  async function upload(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return setStatus("Use a JPG, PNG, or WebP image.");
    if (file.size > 5 * 1024 * 1024) return setStatus("Choose an image smaller than 5 MB.");
    setBusy(true); setStatus("");
    const result = await savePlayerProfilePhoto(requester, file);
    setBusy(false);
    if (result?.photoUrl) setPhotoUrl(String(result.photoUrl));
    setStatus(String(result?.message || "Could not save the photo. Try again."));
  }

  const initials = name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "P";
  const inputId = "player-profile-photo-input";

  return <section data-testid="player-profile-photo-card" aria-label="Profile photo" style={{display:"grid",gridTemplateColumns:"76px minmax(0,1fr)",gap:14,alignItems:"center",padding:14,border:"1px solid #d9dfd5",borderRadius:16,background:"color-mix(in srgb,var(--accent,#617900) 7%,#fff)"}}>
    <div style={{width:76,height:76,borderRadius:"50%",overflow:"hidden",display:"grid",placeItems:"center",background:"#eef2e9",fontWeight:850,fontSize:22}}>{photoUrl?<img src={photoUrl} alt={`${name} profile`} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:initials}</div>
    <div><strong>Profile photo</strong><p style={{margin:"4px 0 8px",fontSize:12}}>Appears on your profile and the coach roster.</p>
      <input id={inputId} data-testid="player-profile-photo-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={upload} hidden/>
      <label data-testid="player-profile-photo-action" htmlFor={inputId} aria-disabled={busy} style={{display:"inline-flex",minHeight:44,alignItems:"center",padding:"0 14px",borderRadius:10,background:"#465717",color:"#fff",fontWeight:800,cursor:busy?"wait":"pointer"}}>{busy?"Saving…":photoUrl?"Change photo":"Add photo"}</label>
      {status?<div role="status" style={{marginTop:6,fontSize:11}}>{status}</div>:null}
    </div>
  </section>;
}
