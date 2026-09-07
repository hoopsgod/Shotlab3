import { cleanValue as clean, normalizeIdentity as identity, parseStored, readActorContext as readContext, readStorage, requestError, requestSignedJson, signedStorageMode, writeStored } from "./apiIdentityHeaders.js";

const KEY="sl:pp",pendingIds=(storage,teamId="")=>{const context=readContext(storage),parts=readStorage(storage,KEY).split("\t");context.teamId=clean(teamId||context.teamId);return context.requester&&parts[0]===context.requester&&parts[1]===context.teamId?{context,ids:parts.slice(2).filter(Boolean)}:null};
export const hasPendingProfileRows=(storage=globalThis?.localStorage,teamId="")=>Boolean(pendingIds(storage,teamId));
export const reconcilePendingProfileRows=(storage=globalThis?.localStorage,remote=[],teamId="")=>{const pending=pendingIds(storage,teamId);if(!pending)return Array.isArray(remote)?remote:[];const local=parseStored(storage,"sl:player-profiles",[]).filter((row)=>pending.ids.includes(clean(row?.id))&&clean(row?.team_id||row?.teamId)===pending.context.teamId&&(pending.context.role!=="player"||identity(row?.user_id||row?.userId||row?.email||row?.player_email)===pending.context.requester)),ids=new Set(local.map((row)=>clean(row?.id)));return[...(Array.isArray(remote)?remote:[]).filter((row)=>!ids.has(clean(row?.id))),...local]};
const mark=(storage,context,ids)=>{if(!context.requester||!ids.length)return;const prior=pendingIds(storage,context.teamId)?.ids||[];writeStored(storage,KEY,[context.requester,context.teamId,...new Set([...prior,...ids])].join("\t"))};
const clear=(storage,context,ids)=>{const left=(pendingIds(storage,context.teamId)?.ids||[]).filter((id)=>!ids.includes(id));writeStored(storage,KEY,left.length?[context.requester,context.teamId,...left].join("\t"):"")};

export function createPlayerProfilePersistenceService({fetchImpl=globalThis?.fetch,storage=globalThis?.localStorage}={}){
  const loadProfiles=async({teamId=""}={})=>{
    if(typeof fetchImpl!=="function")return{ok:false,unavailable:true,rows:reconcilePendingProfileRows(storage,[],teamId)};
    const context=readContext(storage),activeTeamId=clean(teamId||context.teamId),query=activeTeamId?`?team_id=${encodeURIComponent(activeTeamId)}`:"";
    const [body,response]=await requestSignedJson(fetchImpl,`/v1/player-profiles${query}`,"GET",storage);
    if(!response?.ok||body?.error)throw requestError(body,response,"profile_load_failed");
    return{ok:true,storageMode:hasPendingProfileRows(storage,activeTeamId)?"local_pending":signedStorageMode(body),rows:reconcilePendingProfileRows(storage,Array.isArray(body?.profiles)?body.profiles:[],activeTeamId)};
  };
  const syncProfiles=async(profiles=[],{teamId=""}={})=>{
    if(typeof fetchImpl!=="function")throw new Error("profile_api_unavailable");
    const context=readContext(storage),activeTeamId=clean(teamId||context.teamId||profiles?.[0]?.team_id||profiles?.[0]?.teamId);
    if(!activeTeamId)throw new Error("profile_team_required");context.teamId=activeTeamId;
    const scopedProfiles=(Array.isArray(profiles)?profiles:[]).filter((row)=>{const rowTeamId=clean(row?.team_id||row?.teamId);return!rowTeamId||rowTeamId===activeTeamId}),ids=scopedProfiles.map((row)=>clean(row?.id)).filter(Boolean);mark(storage,context,ids);
    const [body,response]=await requestSignedJson(fetchImpl,"/v1/player-profiles","POST",storage,{team_id:activeTeamId,profiles:scopedProfiles});
    if(!response?.ok||body?.error)throw requestError(body,response,"profile_sync_failed");clear(storage,context,ids);
    return{ok:true,storageMode:signedStorageMode(body),rows:Array.isArray(body?.profiles)?body.profiles:[],ignoredCount:Number(body?.ignored_count||0)};
  };
  return{loadProfiles,syncProfiles,readContext:()=>readContext(storage)};
}
