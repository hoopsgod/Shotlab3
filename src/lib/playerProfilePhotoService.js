import { buildApiIdentityHeaders } from "./apiIdentityHeaders.js";
import { isDemoAccount } from "./demoMode.js";

const MAX=15*1024*1024;
const read=f=>new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result||""));r.onerror=reject;r.readAsDataURL(f)});

async function fallbackPhoto(file){
  const src=await read(file),img=new Image();
  await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;img.src=src});
  const w=img.naturalWidth||img.width,h=img.naturalHeight||img.height,s=Math.min(w,h),c=document.createElement("canvas"),g=c.getContext("2d");
  if(!g)throw Error();
  c.width=c.height=512;
  g.drawImage(img,(w-s)/2,(h-s)/2,s,s,0,0,512,512);
  return c.toDataURL("image/jpeg",.82);
}

export async function savePlayerProfilePhoto(id,file){
  if(!file?.type?.startsWith("image/")||!file.size||file.size>MAX)throw Error("Choose an image under 15 MB.");
  if(isDemoAccount(id))return URL.createObjectURL(file);
  let fallback="";
  try{fallback=await fallbackPhoto(file)}catch{try{fallback=await read(file)}catch{}}
  const body=new FormData();
  body.append("file",file);body.append("player_email",id);
  if(fallback&&fallback.length<=2e6)body.append("fallback_data_url",fallback);
  const response=await fetch("/v1/player-photo",{method:"POST",headers:buildApiIdentityHeaders(),body});
  const data=await response.json().catch(()=>({}));
  if(!response.ok||!data.photo_url)throw Error(data?.message||"Upload failed.");
  return data.photo_url;
}
