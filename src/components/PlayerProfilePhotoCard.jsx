import { useState } from "react";
import { savePlayerProfilePhoto } from "../lib/playerProfilePhotoService.js";

export default function PlayerProfilePhotoCard({player={}}){
 const[s,set]=useState(),photo=s||player.photoUrl;
 function upload(e){const f=e.target.files[0];if(!f)return;set(0);savePlayerProfilePhoto(player.email,f).then(set,()=>set(false))}
 return <section className="premiumSummaryPanel">{photo&&<img className="slp" src={photo} alt="" width="80" height="80"/>}<label className="btn-v cta-primary">{s===0?"Preparing photo…":photo?"Change photo":"Add photo"}<input type="file" accept="image/*" onChange={upload} disabled={s===0} hidden/></label>{s===false&&<small role="alert">Upload failed.</small>}</section>
}
