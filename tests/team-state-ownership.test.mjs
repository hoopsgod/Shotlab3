import test from "node:test";
import assert from "node:assert/strict";
import { createTeamPersistenceService, pendingTeamRows } from "../src/lib/teamPersistenceService.js";
import { hydrateAuthenticatedCollectionsToStorage, requestLegacySignedCollection } from "../src/lib/legacySignedCollectionPersistence.js";

const COACH="coach@example.com",TEAM="team-a";
const DESIRED={primaryColor:"#112233",secondaryColor:"#445566",accentColor:"#778899",textOnPrimary:"#ffffff",logoUrl:"/local-logo.png",logoMarkUrl:"/local-mark.svg",textScale:"large"};
const STALE={primaryColor:"#64748B",secondaryColor:"#CBD5E1",accentColor:"#475569",textOnPrimary:"#F1F5F9",logoUrl:"/remote-old.png",logoMarkUrl:"/remote-old.svg",textScale:"standard"};
const LOCAL={id:TEAM,name:"Local Team",joinCode:"LOCAL1",school:"Local School",level:"Varsity",branding:DESIRED};
const REMOTE={id:TEAM,name:"Remote Team",join_code:"REMOTE1",school:"Remote School",level:"JV",branding:STALE};
const PLAYER={id:"coach-row",email:COACH,role:"coach",team_id:TEAM};

function memoryStorage(entries=[]){const values=new Map(entries);return{getItem:key=>values.has(key)?values.get(key):null,setItem:(key,value)=>values.set(key,String(value)),removeItem:key=>values.delete(key),json(key){const raw=values.get(key);return raw?JSON.parse(raw):null}}}
function storageFor({email=COACH,role="coach",teamId=TEAM,team=LOCAL}={}){return memoryStorage([["sl:session",JSON.stringify({email,role,teamId})],["sl:players",JSON.stringify([{...PLAYER,email,role,team_id:teamId}])],["sl:teams",JSON.stringify([team])]])}
const response=(payload,status=200)=>Response.json(payload,{status});

async function failSync(storage,row){const service=createTeamPersistenceService({storage,fetchImpl:async()=>response({error:"team_sync_failed"},500)});await assert.rejects(service.syncTeams([row]),/team_sync_failed/);return service}

test("failed branding upsert preserves only pending branding while fresh remote team metadata still wins",async()=>{
 const storage=storageFor();await failSync(storage,{id:TEAM,branding:DESIRED});
 const service=createTeamPersistenceService({storage,fetchImpl:async()=>response({ok:true,storage_mode:"signed_api",teams:[structuredClone(REMOTE)]})});
 const row=(await service.loadTeams()).rows[0];
 assert.deepEqual(row.branding,DESIRED);assert.equal(row.name,"Remote Team");assert.equal(row.school,"Remote School");assert.equal(row.level,"JV");assert.equal(row.join_code,"REMOTE1");
});

test("failed metadata upsert preserves only submitted metadata fields and leaves remote branding authoritative",async()=>{
 const storage=storageFor();await failSync(storage,{id:TEAM,name:LOCAL.name,school:LOCAL.school});
 const rows=pendingTeamRows(storage,[structuredClone(REMOTE)]);
 assert.equal(rows[0].name,"Local Team");assert.equal(rows[0].school,"Local School");assert.equal(rows[0].level,"JV");assert.deepEqual(rows[0].branding,STALE);
});

test("successful retry clears pending field ownership and restores remote authority",async()=>{
 const storage=storageFor();let fail=true;
 const service=createTeamPersistenceService({storage,fetchImpl:async(_input,init={})=>String(init.method||"GET").toUpperCase()==="POST"?(fail?response({error:"team_sync_failed"},500):response({ok:true,teams:[{...REMOTE,branding:DESIRED}]})):response({ok:true,teams:[structuredClone(REMOTE)]})});
 await assert.rejects(service.syncTeams([{id:TEAM,branding:DESIRED}]),/team_sync_failed/);fail=false;await service.syncTeams([{id:TEAM,branding:DESIRED}]);
 assert.equal(pendingTeamRows(storage,[]),null);assert.deepEqual((await service.loadTeams()).rows[0].branding,STALE);
});

test("pending team ownership is requester/team scoped and cannot be created by a Player session",async()=>{
 const storage=storageFor();await failSync(storage,{id:TEAM,branding:DESIRED});
 storage.setItem("sl:session",JSON.stringify({email:"other@example.com",role:"coach",teamId:"team-b"}));storage.setItem("sl:players",JSON.stringify([{id:"other",email:"other@example.com",role:"coach",team_id:"team-b"}]));storage.setItem("sl:teams",JSON.stringify([{...LOCAL,id:"team-b"}]));
 assert.equal(pendingTeamRows(storage,[{...REMOTE,id:"team-b"}]),null);
 const playerStorage=storageFor({email:"player@example.com",role:"player"});
 await assert.rejects(createTeamPersistenceService({storage:playerStorage,fetchImpl:async()=>response({error:"offline"},500)}).syncTeams([{id:TEAM,branding:DESIRED}]),/offline/);
 assert.equal(playerStorage.getItem("sl:tp"),null);
});

test("legacy signed team reads preserve pending fields while accepting fresh remote fields",async()=>{
 const storage=storageFor();await failSync(storage,{id:TEAM,branding:DESIRED});
 const result=await requestLegacySignedCollection({table:"teams",storage,fetchImpl:async()=>response({ok:true,storage_mode:"signed_api",teams:[structuredClone(REMOTE)]})});
 assert.equal(result.storageMode,"local_pending");assert.deepEqual(result.data[0].branding,DESIRED);assert.equal(result.data[0].school,"Remote School");
});

test("post-auth hydration applies the same field-level pending team policy",async()=>{
 const storage=storageFor();await failSync(storage,{id:TEAM,branding:DESIRED});
 const fetchImpl=async(input)=>{const path=String(input).split("?")[0];if(path==="/v1/teams")return response({ok:true,teams:[structuredClone(REMOTE)]});if(path==="/v1/players")return response({ok:true,players:[PLAYER]});if(path==="/v1/player-profiles")return response({ok:true,profiles:[]});if(path==="/v1/scores")return response({ok:true,scores:[]});if(path==="/v1/program-scores")return response({ok:true,program_scores:[]});if(path==="/v1/shot-logs")return response({ok:true,shot_logs:[]});if(path==="/v1/events")return response({ok:true,events:[]});if(path==="/v1/rsvps")return response({ok:true,rsvps:[]});if(path==="/v1/strength-conditioning")return response({ok:true,sessions:[],rsvps:[],logs:[]});throw Error(`unexpected:${path}`)};
 const result=await hydrateAuthenticatedCollectionsToStorage({fetchImpl,storage,expectedIdentity:COACH,groupAttempts:1});
 assert.equal(result.ok,true);assert.equal(result.pending.includes("sl:teams"),true);const row=storage.json("sl:teams")[0];assert.deepEqual(row.branding,DESIRED);assert.equal(row.school,"Remote School");
});
