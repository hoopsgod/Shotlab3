import { useState } from "react";
import { savePlayerProfilePhoto } from "../lib/playerProfilePhotoService.js";

export default function PlayerProfilePhotoCard({player={}}){
 const[saved,setSaved]=useState(""),name=player.name||"Player",photo=saved||player.photoUrl||player.photo_url;
 async function upload(e){const file=e.target.files[0];if(!file)return;if(file.size>5242880)return setSaved(false);try{setSaved(await savePlayerProfilePhoto(player.email||"",file))}catch{setSaved(false)}}
 return <label data-testid="player-profile-photo-card" style={{display:"grid",justifyItems:"center",gap:8,cursor:"pointer"}}><span style={{width:72,height:72,borderRadius:"50%",overflow:"hidden",display:"grid",placeItems:"center",background:"var(--team-brand-primary,#24351d)"}}>{photo?<img src={photo} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:name[0]}</span><strong>{photo?"Change photo":"Add photo"}</strong><input type="file" accept="image/jpeg,image/png,image/webp" onChange={upload} hidden/>{saved===false&&<small role="alert">Upload failed.</small>}</label>
}
