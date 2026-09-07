import { cleanValue as clean, parseStored, readActorContext as readContext, requestSignedBody, signedStorageMode } from "./apiIdentityHeaders.js";

const KEY="sl:ip",setPending=(storage,value)=>{try{storage?.setItem?.(KEY,value)}catch{}};
export const readPendingPlayerRows=(storage=globalThis?.localStorage,teamId="")=>{
  const context=readContext(storage);context.teamId=clean(teamId||context.teamId);let marker="";try{marker=storage?.getItem?.(KEY)||""}catch{}
  if(!context.requester||marker!==`${context.requester}\t${context.teamId}`)return null;
  const rows=parseStored(storage,"sl:players",[]);
  return Array.isArray(rows)?rows.filter((row)=>clean(row?.email).toLowerCase()===context.requester||((context.role==="coach"||context.role==="assistant_coach")&&clean(row?.team_id??row?.teamId)===context.teamId)):[];
};

export function createPlayerIdentityPersistenceService({fetchImpl=globalThis?.fetch,storage=globalThis?.localStorage}={}){
  const loadPlayers=async({teamId=""}={})=>{
    const pending=readPendingPlayerRows(storage,teamId);
    if(pending!==null)return{ok:true,storageMode:"local_pending",rows:pending};
    if(typeof fetchImpl!=="function")return{ok:false,unavailable:true,rows:[]};
    const activeTeamId=clean(teamId||readContext(storage).teamId),query=activeTeamId?`?team_id=${encodeURIComponent(activeTeamId)}`:"",body=await requestSignedBody(fetchImpl,`/v1/players${query}`,"GET",storage,null,"player_load_failed");
    return{ok:true,storageMode:signedStorageMode(body),rows:Array.isArray(body?.players)?body.players:[]};
  };
  const syncPlayers=async(players=[],{replace=true}={})=>{
    if(typeof fetchImpl!=="function")throw new Error("player_api_unavailable");
    const context=readContext(storage),isReplace=replace===true;
    if(isReplace&&context.requester)setPending(storage,`${context.requester}\t${clean(context.teamId)}`);
    const body=await requestSignedBody(fetchImpl,"/v1/players","POST",storage,{players:Array.isArray(players)?players:[],replace:isReplace},"player_sync_failed");
    setPending(storage,"");
    return{ok:true,storageMode:signedStorageMode(body),rows:Array.isArray(body?.players)?body.players:[],ignoredCount:Number(body?.ignored_count||0),deletedSelf:body?.deleted_self===true};
  };
  return{loadPlayers,syncPlayers,readContext:()=>readContext(storage)};
}
