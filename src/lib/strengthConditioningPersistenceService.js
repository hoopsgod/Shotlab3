import { readActorContext as readContext, requestError, requestSignedJson } from "./apiIdentityHeaders.js";

export const scPendingMask=(s=globalThis?.localStorage,n)=>{
  const c=readContext(s);if(!c.requester||!c.teamId)return 0;
  const p=`${c.requester}\t${c.teamId}\t`,r=s?.getItem?.("sl:scp")||"",m=r.startsWith(p)?+r.slice(p.length)||0:0;
  if(n===undefined)return m;
  try{n?s.setItem("sl:scp",p+n):r.startsWith(p)&&s.removeItem("sl:scp")}catch{}
  return 0;
};

export function createStrengthConditioningPersistenceService({fetchImpl=globalThis?.fetch,storage=globalThis?.localStorage}={}){
  const loadState=async()=>{
    if(typeof fetchImpl!=="function")return{ok:false,unavailable:true,sessions:[],rsvps:[],logs:[]};
    const team=readContext(storage).teamId,query=team?`?team_id=${encodeURIComponent(team)}`:"",[body,response]=await requestSignedJson(fetchImpl,`/v1/strength-conditioning${query}`,"GET",storage);
    if(!response?.ok||body?.ok!==true||body?.error||![body?.sessions,body?.rsvps,body?.logs].every(Array.isArray))throw requestError(body,response,"strength_conditioning_load_failed");
    return body;
  };
  const sync=async(resource,rows=[])=>{
    const bit={sessions:1,rsvps:2,logs:4}[resource]||0;
    if(!bit)throw new Error("strength_conditioning_resource_invalid");
    if(typeof fetchImpl!=="function")throw new Error("strength_conditioning_api_unavailable");
    const team=readContext(storage).teamId;
    if(!team)throw new Error("strength_conditioning_team_required");
    scPendingMask(storage,scPendingMask(storage)|bit);
    const [body,response]=await requestSignedJson(fetchImpl,"/v1/strength-conditioning","POST",storage,{team_id:team,resource,rows:Array.isArray(rows)?rows:[]});
    if(!response?.ok||body?.ok!==true||!Array.isArray(body?.rows)||body?.error)throw requestError(body,response,"strength_conditioning_sync_failed");
    scPendingMask(storage,scPendingMask(storage)&~bit);
    return body;
  };
  return{loadState,sync};
}
