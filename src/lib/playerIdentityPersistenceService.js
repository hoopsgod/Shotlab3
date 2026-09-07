import { cleanValue as clean, filterPlayerRows, parseStored, readActorContext as readContext, readStorage, requestSignedBody, writeStored } from "./apiIdentityHeaders.js";

const KEY="sl:ip",bodyRows=(body)=>Array.isArray(body?.players)?body.players:[];
export const readPendingPlayerRows=(storage=globalThis?.localStorage,teamId="")=>{
  const context=readContext(storage);context.teamId=clean(teamId||context.teamId);
  return context.requester&&readStorage(storage,KEY)===`${context.requester}\t${context.teamId}`?filterPlayerRows(parseStored(storage,"sl:players",[]),context):null;
};

export function createPlayerIdentityPersistenceService({fetchImpl=globalThis?.fetch,storage=globalThis?.localStorage}={}){
  const loadPlayers=async({teamId=""}={})=>{
    const pending=readPendingPlayerRows(storage,teamId);
    if(pending!==null||typeof fetchImpl!=="function")return{rows:pending||[]};
    const activeTeamId=clean(teamId||readContext(storage).teamId);
    return{rows:bodyRows(await requestSignedBody(fetchImpl,`/v1/players${activeTeamId?`?team_id=${encodeURIComponent(activeTeamId)}`:""}`,"GET",storage,null,"player_load_failed"))};
  };
  const syncPlayers=async(players=[])=>{
    if(typeof fetchImpl!=="function")throw new Error("player_api_unavailable");
    const context=readContext(storage);
    if(context.requester)writeStored(storage,KEY,`${context.requester}\t${context.teamId}`);
    const body=await requestSignedBody(fetchImpl,"/v1/players","POST",storage,{players:Array.isArray(players)?players:[],replace:true},"player_sync_failed");
    writeStored(storage,KEY,"");
    return{rows:bodyRows(body)};
  };
  return{loadPlayers,syncPlayers};
}
