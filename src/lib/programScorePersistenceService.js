import { normalizeIdentity, parseStored, readRequester, readSession, requestSignedBody, signedStorageMode, writeStored } from "./apiFetchBridge.js";

const id=(row)=>String(row?.id||"").trim(),team=(row)=>String(row?.team_id||row?.teamId||"").trim(),player=(row)=>normalizeIdentity(row?.player_email||row?.playerEmail||row?.player_id||row?.playerId||row?.email);
const owner=(storage,requester="")=>{let marker;try{marker=String(storage?.getItem?.("sl:pp")||"")}catch{return null}const session=readSession(storage),identity=normalizeIdentity(requester)||readRequester(storage);return marker.startsWith(`${identity}\t`)&&(!session?.rp||marker.startsWith(`${session.rp}\t`))?marker.split("\t"):null};
const save=(storage,parts)=>writeStored(storage,"sl:pp",parts[2]?parts.join("\t"):null);

export function reconcilePendingProgramScoreRows({storage=globalThis?.localStorage,requester="",teamId="",localRows=[],remoteRows=[]}={}){
  const remote=Array.isArray(remoteRows)?remoteRows:[],parts=owner(storage,requester);
  if(!parts||(teamId&&parts[1]!==String(teamId||"").trim()))return remote;
  const local=(Array.isArray(localRows)?localRows:[]).filter((row)=>{const rowId=id(row);return parts.includes(rowId,2)&&!remote.some((item)=>id(item)===rowId)&&team(row)===parts[1]});
  save(storage,[parts[0],parts[1],...local.map(id)]);
  return remote.concat(local);
}

export function createProgramScorePersistenceService({fetchImpl=globalThis?.fetch,storage=globalThis?.localStorage}={}){
  const request=(method,data,teamId="")=>{if(typeof fetchImpl!=="function")throw new Error("program_score_api_unavailable");return requestSignedBody(fetchImpl,`/v1/program-scores${teamId?`?team_id=${encodeURIComponent(teamId)}`:""}`,method,storage,data,`program_score_${method==="GET"?"load":method==="POST"?"write":"delete"}_failed`)};
  const loadProgramScores=async({teamId=""}={})=>{
    const local=parseStored(storage,"sl:program-scores",[]);
    if(typeof fetchImpl!=="function")return{ok:false,unavailable:true,programScores:reconcilePendingProgramScoreRows({storage,requester:readRequester(storage),teamId,localRows:local,remoteRows:[]})};
    const body=await request("GET",null,String(teamId||"").trim());
    return{ok:true,storageMode:signedStorageMode(body),programScores:reconcilePendingProgramScoreRows({storage,requester:readRequester(storage),teamId,localRows:local,remoteRows:Array.isArray(body?.program_scores)?body.program_scores:[]})};
  };
  const upsertProgramScores=async(programScores=[])=>{
    const rows=Array.isArray(programScores)?programScores:[programScores];
    if(!rows.length)return{ok:true,programScores:[],storageMode:"local_only"};
    const identity=readRequester(storage),teamId=team(rows[0]),parts=owner(storage,identity);
    if(identity&&teamId)save(storage,[...new Set([...(parts?.[1]===teamId?parts:[identity,teamId]),...rows.filter((row)=>team(row)===teamId).map(id).filter(Boolean)])]);
    const body=await request("POST",{program_scores:rows}),confirmed=Array.isArray(body?.program_scores)?body.program_scores:[];
    reconcilePendingProgramScoreRows({storage,requester:identity,localRows:parseStored(storage,"sl:program-scores",rows),remoteRows:confirmed});
    return{ok:true,storageMode:signedStorageMode(body),programScores:confirmed};
  };
  const deletePlayerProgramScores=async({teamId="",playerIdentity=""}={})=>{
    const teamIdValue=String(teamId||"").trim(),playerIdentityValue=normalizeIdentity(playerIdentity);
    if(!teamIdValue||!playerIdentityValue)throw new Error("program_score_delete_identity_required");
    const body=await request("DELETE",{team_id:teamIdValue,player_identity:playerIdentityValue}),parts=owner(storage);
    if(parts?.[1]===teamIdValue){
      const local=parseStored(storage,"sl:program-scores",[]),keep=(Array.isArray(local)?local:[]).filter((row)=>parts.includes(id(row),2)&&team(row)===teamIdValue&&player(row)!==playerIdentityValue).map(id);
      save(storage,[parts[0],parts[1],...keep]);
    }
    return{ok:true,storageMode:signedStorageMode(body),deletedCount:Number(body?.deleted_count||0)};
  };
  return{loadProgramScores,upsertProgramScores,deletePlayerProgramScores};
}
