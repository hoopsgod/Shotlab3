import { normalizeIdentity, parseStored, readRequester, requestSignedBody, signedStorageMode } from "./apiFetchBridge.js";
import { markPendingIds, pendingOwner, reconcilePendingIds, savePending } from "./pendingIdPersistence.js";
const KEY="sl:sp";
export const hasPendingScoreRows=(storage=globalThis?.localStorage,requester="")=>!!pendingOwner(storage,KEY,requester);
export function reconcilePendingScoreRows(options={}){return reconcilePendingIds({...options,key:KEY,own:true})}
export function createScorePersistenceService({fetchImpl=globalThis?.fetch,storage=globalThis?.localStorage}={}){
 const request=(method,data,teamId="")=>{if(typeof fetchImpl!=="function")throw new Error("score_api_unavailable");return requestSignedBody(fetchImpl,`/v1/scores${teamId?`?team_id=${encodeURIComponent(teamId)}`:""}`,method,storage,data,`score_${method==="GET"?"load":method==="POST"?"write":"delete"}_failed`)};
 const loadScores=async({teamId=""}={})=>{if(typeof fetchImpl!=="function")return{ok:false,unavailable:true,scores:[]};const body=await request("GET",null,String(teamId||"").trim());return{ok:true,storageMode:signedStorageMode(body),scores:reconcilePendingScoreRows({storage,requester:readRequester(storage),localRows:parseStored(storage,"sl:scores",[]),remoteRows:Array.isArray(body?.scores)?body.scores:[]})}};
 const upsertScores=async(scores=[])=>{const rows=Array.isArray(scores)?scores:[scores];if(!rows.length)return{ok:true,scores:[],storageMode:"local_only"};const identity=readRequester(storage);markPendingIds(storage,KEY,rows);const body=await request("POST",{scores:rows}),confirmed=Array.isArray(body?.scores)?body.scores:[];reconcilePendingScoreRows({storage,requester:identity,localRows:parseStored(storage,"sl:scores",rows),remoteRows:confirmed});return{ok:true,storageMode:signedStorageMode(body),scores:confirmed}};
 const deletePlayerScores=async({teamId="",playerIdentity=""}={})=>{const t=String(teamId||"").trim(),p=normalizeIdentity(playerIdentity);if(!t||!p)throw new Error("score_delete_identity_required");const body=await request("DELETE",{team_id:t,player_identity:p});if(pendingOwner(storage,KEY,p)?.[1]===t)savePending(storage,KEY,[]);return{ok:true,storageMode:signedStorageMode(body),deletedCount:Number(body?.deleted_count||0)}};
 return{loadScores,upsertScores,deletePlayerScores};
}
