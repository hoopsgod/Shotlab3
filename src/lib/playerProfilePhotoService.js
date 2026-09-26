import { buildApiIdentityHeaders } from "./apiIdentityHeaders.js";
import { isDemoAccount } from "./demoMode.js";

async function small(f){const i=await createImageBitmap(f),{width:w,height:h}=i,s=Math.min(w,h),c=document.createElement("canvas");c.width=c.height=512;c.getContext("2d").drawImage(i,(w-s)/2,(h-s)/2,s,s,0,0,512,512);return c.toDataURL("image/jpeg",.82)}
export async function savePlayerProfilePhoto(id,f){
 if(f.size>15728640)throw Error();
 if(isDemoAccount(id))return URL.createObjectURL(f);
 const b=new FormData;b.append("file",f);b.append("player_email",id);try{b.append("fallback_data_url",await small(f))}catch{}
 const d=await (await fetch("/v1/player-photo",{method:"POST",headers:buildApiIdentityHeaders(),body:b})).json();
 return d.photo_url||Promise.reject()
}
