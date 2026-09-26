import { useState } from "react";
import { savePlayerProfilePhoto } from "../lib/playerProfilePhotoService.js";

export default function PlayerProfilePhotoCard({player={}}){
 const[saved,setSaved]=useState(""),name=player.name||"Player",photo=saved||player.photoUrl||player.photo_url;
 async function upload(e){const file=e.target.files[0];if(!file)return;if(file.size>5242880)return setSaved(false);try{setSaved(await savePlayerProfilePhoto(player.email||"",file))}catch{setSaved(false)}}
 return <section className="premiumSummaryPanel"><div className="coachRosterCard__initials">{photo?<img className="coachRosterCard__photo" src={photo} alt=""/>:name[0]}</div><label className="btn-v cta-primary">{photo?"Change photo":"Add photo"}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={upload} hidden/></label>{saved===false&&<small role="alert">Upload failed.</small>}</section>
}
