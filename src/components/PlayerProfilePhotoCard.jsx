import { useState } from "react";
import { savePlayerProfilePhoto } from "../lib/playerProfilePhotoService.js";
import "./PlayerProfilePhotoCard.css";

export default function PlayerProfilePhotoCard({player={}}){
 const[saved,setSaved]=useState(""),name=player.name||"Player",photo=saved||player.photoUrl||player.photo_url;
 async function upload(e){const file=e.target.files[0];if(!file)return;if(file.size>5242880)return setSaved(false);try{setSaved(await savePlayerProfilePhoto(player.email||"",file))}catch{setSaved(false)}}
 return <label data-testid="player-profile-photo-card" className="playerProfilePhotoCard"><span>{photo?<img src={photo} alt=""/>:name[0]}</span><strong>{photo?"Change photo":"Add photo"}</strong><input data-testid="player-profile-photo-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={upload} hidden/>{saved===false&&<small role="alert">Upload failed.</small>}</label>
}
