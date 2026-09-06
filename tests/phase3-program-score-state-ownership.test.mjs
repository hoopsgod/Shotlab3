import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createProgramScorePersistenceService } from "../src/lib/programScorePersistenceService.js";
import { hydrateAuthenticatedCollectionsToStorage } from "../src/lib/legacySignedCollectionPersistence.js";

const row=(id,player="player@example.com",team="team-a")=>({id,team_id:team,player_id:player,player_email:player,drill_id:"program-1",drill_name:"Pressure FT",score:18,src:"program"});
class Storage{
  constructor(values={}){this.values=new Map(Object.entries(values))}
  getItem(key){return this.values.get(key)||null}
  setItem(key,value){this.values.set(key,String(value))}
  removeItem(key){this.values.delete(key)}
}
const storageFor=(email="player@example.com",teamId="team-a",extra={})=>new Storage({
  "sl:session":JSON.stringify({email,teamId,role:email.startsWith("coach")?"coach":"player"}),
  "sl:supabase-session":JSON.stringify({access_token:"token"}),
  "sl:players":JSON.stringify([{email,teamId,role:email.startsWith("coach")?"coach":"player"}]),
  ...extra,
});
const response=(program_scores=[],status=200)=>Response.json(status<400?{ok:true,storage_mode:"signed_api",program_scores}:{error:"program_score_write_failed"},{status});

test("failed player Program write survives stale remote hydration until confirmed retry",async()=>{
  const pending=row("pending-1"),storage=storageFor("player@example.com","team-a",{"sl:program-scores":JSON.stringify([pending])});
  let postFails=true,remote=[];
  const service=createProgramScorePersistenceService({storage,fetchImpl:async(_url,options)=>options.method==="POST"?(postFails?response([],503):response([pending])):response(remote)});
  await assert.rejects(()=>service.upsertProgramScores([pending]));
  assert.equal(storage.getItem("sl:pp"),"player@example.com\tteam-a\tpending-1");
  assert.deepEqual((await service.loadProgramScores()).programScores.map((item)=>item.id),["pending-1"]);
  postFails=false;
  await service.upsertProgramScores([pending]);
  assert.equal(storage.getItem("sl:pp"),null);
  remote=[];
  assert.deepEqual((await service.loadProgramScores()).programScores,[]);
});

test("coach pending ownership preserves a result recorded for another player",async()=>{
  const pending=row("coach-pending","player@example.com"),storage=storageFor("coach@example.com","team-a",{"sl:program-scores":JSON.stringify([pending])});
  const service=createProgramScorePersistenceService({storage,fetchImpl:async(_url,options)=>options.method==="POST"?response([],503):response([])});
  await assert.rejects(()=>service.upsertProgramScores([pending]));
  assert.equal(storage.getItem("sl:pp"),"coach@example.com\tteam-a\tcoach-pending");
  assert.deepEqual((await service.loadProgramScores()).programScores.map((item)=>item.id),["coach-pending"]);
});

test("pending marker from another requester or team has no hydration authority",async()=>{
  const local=row("foreign","player@example.com","team-b"),storage=storageFor("player@example.com","team-a",{
    "sl:program-scores":JSON.stringify([local]),
    "sl:pp":"other@example.com\tteam-b\tforeign",
  });
  const service=createProgramScorePersistenceService({storage,fetchImpl:async()=>response([])});
  assert.deepEqual((await service.loadProgramScores()).programScores,[]);
  storage.setItem("sl:pp","player@example.com\tteam-b\tforeign");
  assert.deepEqual((await service.loadProgramScores({teamId:"team-a"})).programScores,[]);
});

test("successful player delete clears only matching pending Program ids",async()=>{
  const a=row("pending-a","a@example.com"),b=row("pending-b","b@example.com"),storage=storageFor("coach@example.com","team-a",{
    "sl:program-scores":JSON.stringify([a,b]),
    "sl:pp":"coach@example.com\tteam-a\tpending-a\tpending-b",
  });
  const service=createProgramScorePersistenceService({storage,fetchImpl:async(_url,options)=>options.method==="DELETE"?Response.json({ok:true,storage_mode:"signed_api",deleted_count:1}):response([])});
  await service.deletePlayerProgramScores({teamId:"team-a",playerIdentity:"a@example.com"});
  assert.equal(storage.getItem("sl:pp"),"coach@example.com\tteam-a\tpending-b");
  assert.deepEqual((await service.loadProgramScores()).programScores.map((item)=>item.id),["pending-b"]);
  await service.deletePlayerProgramScores({teamId:"team-a",playerIdentity:"b@example.com"});
  assert.equal(storage.getItem("sl:pp"),null);
  assert.deepEqual((await service.loadProgramScores()).programScores,[]);
});

test("post-auth hydration preserves only exact pending Program ids",async()=>{
  const pending=row("hydrate-pending"),storage=storageFor("coach@example.com","team-a",{
    "sl:program-scores":JSON.stringify([pending]),
    "sl:pp":"coach@example.com\tteam-a\thydrate-pending",
  });
  const fetchImpl=async(url)=>{
    const path=new URL(String(url),"https://shotlab.test").pathname;
    if(path==="/v1/teams")return Response.json({ok:true,teams:[]});
    if(path==="/v1/players")return Response.json({ok:true,players:[{email:"coach@example.com",teamId:"team-a",role:"coach"}]});
    if(path==="/v1/player-profiles")return Response.json({ok:true,profiles:[]});
    if(path==="/v1/scores")return Response.json({ok:true,scores:[]});
    if(path==="/v1/program-scores")return Response.json({ok:true,program_scores:[]});
    if(path==="/v1/shot-logs")return Response.json({ok:true,shot_logs:[]});
    if(path==="/v1/events")return Response.json({ok:true,events:[]});
    if(path==="/v1/rsvps")return Response.json({ok:true,rsvps:[]});
    if(path==="/v1/strength-conditioning")return Response.json({ok:true,sessions:[],rsvps:[],logs:[]});
    return Response.json({ok:true});
  };
  const result=await hydrateAuthenticatedCollectionsToStorage({fetchImpl,storage,expectedIdentity:"coach@example.com",groupAttempts:1});
  assert.equal(result.ok,true);
  assert.deepEqual(JSON.parse(storage.getItem("sl:program-scores")).map((item)=>item.id),["hydrate-pending"]);
});

test("Program ownership stays isolated from the protected home-score contract",()=>{
  const program=fs.readFileSync(new URL("../src/lib/programScorePersistenceService.js",import.meta.url),"utf8");
  const legacy=fs.readFileSync(new URL("../src/lib/legacySignedCollectionPersistence.js",import.meta.url),"utf8");
  const score=fs.readFileSync(new URL("../src/lib/scorePersistenceService.js",import.meta.url),"utf8");
  assert.match(program,/sl:pp/);
  assert.match(legacy,/reconcilePendingProgramScoreRows/);
  assert.match(score,/sl:sp/);
  assert.match(score,/storageKey === "sl:scores"/);
});
