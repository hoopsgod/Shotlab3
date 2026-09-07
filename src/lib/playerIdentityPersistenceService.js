import { cleanValue as clean, filterPlayerRows, parseStored, readActorContext as readContext, readStorage, requestSignedBody, writeStored } from "./apiIdentityHeaders.js";

const KEY="sl:ip";
export const readPendingPlayerRows=(storage=globalThis?.localStorage,teamId="")=>{
  const context=readContext(storage);context.teamId=clean(teamId||context.teamId);
  if(!context.requester||readStorage(storage,KEY)!==`${context.requester}\t${context.teamId}`)return null;
  return filterPlayerRows(parseStored(storage,"sl:players",[]),context);
};

export function createPlayerIdentityPersistenceService({fetchImpl=globalThis?.fetch,storage=globalThis?.localStorage}={}){
  const loadPlayers=async({teamId=""}={})=>{
    const pending=readPendingPlayerRows(storage,teamId);
    if(pending!==null)return{rows:pending};
    if(typeof fetchImpl!=="function")return{rows:[]};
    const activeTeamId=clean(teamId||readContext(storage).teamId),query=activeTeamId?`?team_id=${encodeURIComponent(activeTeamId)}`:"",body=await requestSignedBody(fetchImpl,`/v1/players${query}`,"GET",storage,null,"player_load_failed");
    return{rows:Array.isArray(body?.players)?body.players:[]};
  };
  const syncPlayers=async(players=[])=>{
    if(typeof fetchImpl!=="function")throw new Error("player_api_unavailable");
    const context=readContext(storage);
    if(context.requester)writeStored(storage,KEY,`${context.requester}\t${context.teamId}`);
    const body=await requestSignedBody(fetchImpl,"/v1/players","POST",storage,{players:Array.isArray(players)?players:[],replace:true},"player_sync_failed");
    writeStored(storage,KEY,"");
    return{rows:Array.isArray(body?.players)?body.players:[]};
  };
  return{loadPlayers,syncPlayers};
}
