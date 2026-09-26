import { useState } from "react";
import { savePlayerProfilePhoto } from "../lib/playerProfilePhotoService.js";

export default function PlayerProfilePhotoCard({player={}}){
 const[state,setState]=useState({}),photo=state.photo||player.photoUrl||player.photo_url;
 async function upload(e){
  const f=e.target.files?.[0];e.target.value="";if(!f)return;
  setState({busy:true});
  try{setState({photo:await savePlayerProfilePhoto(player.email||"",f)})}
  catch(error){setState({error:error?.message||"Upload failed. Try another photo."})}
 }
 return <section className="premiumSummaryPanel" aria-busy={state.busy}>{photo&&<img src={photo} alt="Player profile" width="80" height="80" style={{borderRadius:"50%",objectFit:"cover"}}/>}<label className="btn-v cta-primary" aria-disabled={state.busy}>{state.busy?"Preparing photo…":photo?"Change photo":"Add photo"}<input type="file" accept="image/*" onChange={upload} disabled={state.busy} hidden/></label>{state.error&&<small role="alert">{state.error}</small>}</section>
}
