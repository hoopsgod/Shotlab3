import { useState } from "react";
import { savePlayerProfilePhoto } from "../lib/playerProfilePhotoService.js";

export default function PlayerProfilePhotoCard({player={}}){
 const[s,set]=useState(""),photo=s||player.photoUrl||player.photo_url,busy=s===0;
 async function upload(e){const f=e.target.files?.[0];e.target.value="";if(!f)return;set(0);try{set(await savePlayerProfilePhoto(player.email||"",f))}catch{set(false)}}
 return <section className="premiumSummaryPanel" aria-busy={busy}>{photo&&<img src={photo} alt="" width="80" height="80" style={{borderRadius:"50%",objectFit:"cover"}}/>}<label className="btn-v cta-primary" aria-disabled={busy}>{busy?"Preparing photo…":photo?"Change photo":"Add photo"}<input type="file" accept="image/*" onChange={upload} disabled={busy} hidden/></label>{s===false&&<small role="alert">Upload failed. Try another photo.</small>}</section>
}
