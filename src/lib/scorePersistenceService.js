import { normalizeIdentity, parseStored, readRequester, readSession, requestSignedBody, signedStorageMode, writeStored } from "./apiFetchBridge.js";

export const pendingId=(row)=>String(row?.id||"").trim(),pendingTeam=(row)=>String(row?.team_id||row?.teamId||"").trim(),pendingPlayer=(row)=>normalizeIdentity(row?.email||row?.player_email);
export const pendingOwner=(storage,key,requester="")=>{let marker;try{marker=String(storage?.getItem?.(key)||"")}catch{return null}const session=readSession(storage),identity=normalizeIdentity(requester)||readRequester(storage);return marker.startsWith(`${identity}\t`)&&(!session?.rp||marker.startsWith(`${session.rp}\t`))?marker.split("\t"):null};
export const savePending=(storage,key,parts)=>writeStored(storage,key,parts[2]?parts.join("\t"):null);
export const markPendingIds=(storage,key,rows=[])=>{const requester=readRequester(storage),teamId=pendingTeam(rows[0]),parts=pendingOwner(storage,key,requester);if(requester&&teamId)savePending(storage,key,[...new Set([...(parts?.[1]===teamId?parts:[requester,teamId]),...rows.map(pendingId).filter(Boolean)])])};

export function reconcilePendingIds({storage=globalThis?.localStorage,key,requester="",teamId="",localRows=[],remoteRows=[],own=false}={}){const remote=Array.isArray(remoteRows)?remoteRows:[],parts=pendingOwner(storage,key,requester);if(!parts||(teamId&&parts[1]!==String(teamId||"").trim()))return remote;const local=(Array.isArray(localRows)?localRows:[]).filter((row)=>{const rowId=pendingId(row);return parts.includes(rowId,2)&&!remote.some((item)=>pendingId(item)===rowId)&&pendingTeam(row)===parts[1]&&(!own||pendingPlayer(row)===parts[0])});savePending(storage,key,[parts[0],parts[1],...local.map(pendingId)]);return remote.concat(local)}

const KEY="sl:sp";
export const hasPendingScoreRows=(storage=globalThis?.localStorage,requester="")=>!!pendingOwner(storage,KEY,requester);
export function reconcilePendingScoreRows(options={}){return reconcilePendingIds({...options,key:KEY,own:true})}

export function createScorePersistenceService({fetchImpl=globalThis?.fetch,storage=globalThis?.localStorage}={}){
  const request=(method,data,teamId="")=>{if(typeof fetchImpl!=="function")throw new Error("score_api_unavailable");return requestSignedBody(fetchImpl,`/v1/scores${teamId?`?team_id=${encodeURIComponent(teamId)}`:""}`,method,storage,data,`score_${method==="GET"?"load":method==="POST"?"write":"delete"}_failed`)};
  const loadScores=async({teamId=""}={})=>{if(typeof fetchImpl!=="function")return{ok:false,unavailable:true,scores:[]};const body=await request("GET",null,String(teamId||"").trim());return{ok:true,storageMode:signedStorageMode(body),scores:reconcilePendingScoreRows({storage,requester:readRequester(storage),localRows:parseStored(storage,"sl:scores",[]),remoteRows:Array.isArray(body?.scores)?body.scores:[]})}};
  const upsertScores=async(scores=[])=>{const rows=Array.isArray(scores)?scores:[scores];if(!rows.length)return{ok:true,scores:[],storageMode:"local_only"};const identity=readRequester(storage);markPendingIds(storage,KEY,rows);const body=await request("POST",{scores:rows}),confirmed=Array.isArray(body?.scores)?body.scores:[];reconcilePendingScoreRows({storage,requester:identity,localRows:parseStored(storage,"sl:scores",rows),remoteRows:confirmed});return{ok:true,storageMode:signedStorageMode(body),scores:confirmed}};
  const deletePlayerScores=async({teamId="",playerIdentity=""}={})=>{const teamIdValue=String(teamId||"").trim(),player=normalizeIdentity(playerIdentity);if(!teamIdValue||!player)throw new Error("score_delete_identity_required");const body=await request("DELETE",{team_id:teamIdValue,player_identity:player});if(pendingOwner(storage,KEY,player)?.[1]===teamIdValue)savePending(storage,KEY,[]);return{ok:true,storageMode:signedStorageMode(body),deletedCount:Number(body?.deleted_count||0)}};
  return{loadScores,upsertScores,deletePlayerScores};
}
