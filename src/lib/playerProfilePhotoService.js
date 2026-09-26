import { buildApiIdentityHeaders } from "./apiIdentityHeaders.js";
import { isDemoAccount } from "./demoMode.js";

const read=f=>new Promise((r,j)=>{const x=new FileReader;x.onload=()=>r(x.result);x.onerror=j;x.readAsDataURL(f)});
async function small(f){const i=await createImageBitmap(f),s=Math.min(i.width,i.height),c=document.createElement("canvas");c.width=c.height=512;c.getContext("2d").drawImage(i,(i.width-s)/2,(i.height-s)/2,s,s,0,0,512,512);return c.toDataURL("image/jpeg",.82)}
export async function savePlayerProfilePhoto(id,f){
 if(f.size>15728640)throw Error();
 if(isDemoAccount(id))return URL.createObjectURL(f);
 let x="";try{x=await small(f)}catch{try{x=await read(f)}catch{}}
 const b=new FormData;b.append("file",f);b.append("player_email",id);if(x.length<=2e6)b.append("fallback_data_url",x);
 const d=await (await fetch("/v1/player-photo",{method:"POST",headers:buildApiIdentityHeaders(),body:b})).json();
 if(!d.photo_url)throw Error(d.message);
 return d.photo_url
}
