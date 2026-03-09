import { DEMO_PLAYER } from "./demoAccounts";
import { DEMO_SEED_PLAYERS } from "./demoSeedPlayers";
import { isoDaysAgo, withTs, distributeTotal } from "../../../shared/utils/coreUtils";

function buildDemoSeed(teamId){
const createdAt=Date.now();
const drillSeed={
1:[4,5,6,6,7,8,7,9,8,9,10,9],
2:[3,4,5,6,5,7,6,8,7,8,9,8],
};
const scoreRows=[];
Object.entries(drillSeed).forEach(([drillId,vals])=>{
vals.forEach((score,idx)=>{const day=idx+1;scoreRows.push({
email:DEMO_PLAYER.email,playerId:DEMO_PLAYER.email,teamId,name:DEMO_PLAYER.name,drillId:Number(drillId),score,date:isoDaysAgo(day),ts:withTs(day,idx)
})});
});
const shotRows=[18,24,21,27,19,26,23,20].map((made,idx)=>({
email:DEMO_PLAYER.email,playerId:DEMO_PLAYER.email,teamId,name:DEMO_PLAYER.name,made,date:isoDaysAgo(idx+1),ts:withTs(idx+1,300+idx)
}));
const eventRows=[
{id:9001,title:"Early Workout",date:isoDaysAgo(76),time:"6:00 AM",location:"Main Gym — Court 1",desc:"Small-group form shooting before school.",type:"clinic",teamId,createdAt},
{id:9002,title:"JV/Varsity Skills Block",date:isoDaysAgo(61),time:"4:15 PM",location:"Training Facility — Bay 3",desc:"Position-based skill stations and finishing reps.",type:"clinic",teamId,createdAt},
{id:9003,title:"Open Run",date:isoDaysAgo(49),time:"6:30 PM",location:"Main Gym — Court 2",desc:"Competitive 5v5 with capped rotations.",type:"run",teamId,createdAt},
{id:9004,title:"Pressure FT Ladder",date:isoDaysAgo(36),time:"5:45 PM",location:"Main Gym — Court 2",desc:"Timed free-throw ladder and accountability chart.",type:"challenge",teamId,createdAt},
{id:9005,title:"Film + Mobility",date:isoDaysAgo(23),time:"3:00 PM",location:"Film Room",desc:"Opponent clips, then guided recovery and mobility.",type:"recovery",teamId,createdAt},
{id:9006,title:"Saturday Scrimmage",date:isoDaysAgo(12),time:"10:00 AM",location:"Community Center",desc:"Live officiated scrimmage to prep for league play.",type:"game",teamId,createdAt},
{id:9007,title:"Sprint & Change-of-Direction",date:isoDaysAgo(6),time:"6:00 PM",location:"Training Turf",desc:"Acceleration work and defensive slide intervals.",type:"run",teamId,createdAt},
{id:9008,title:"Game-Week Shootaround",date:isoDaysAgo(2),time:"5:00 PM",location:"Main Gym — Court 1",desc:"Short high-focus session before weekend games.",type:"clinic",teamId,createdAt},
];
const rsvpEmails=[DEMO_PLAYER.email,"jordan.m@shotlab.app","tyler.r@shotlab.app","chris.w@shotlab.app"];
const rsvpRows=[];
const attendancePlan=[
[DEMO_PLAYER.email,"jordan.m@shotlab.app","tyler.r@shotlab.app"],
[DEMO_PLAYER.email,"jordan.m@shotlab.app","chris.w@shotlab.app"],
["jordan.m@shotlab.app","tyler.r@shotlab.app","chris.w@shotlab.app"],
[DEMO_PLAYER.email,"chris.w@shotlab.app"],
[DEMO_PLAYER.email,"jordan.m@shotlab.app","tyler.r@shotlab.app","chris.w@shotlab.app"],
[DEMO_PLAYER.email,"jordan.m@shotlab.app"],
];
eventRows.slice(0,attendancePlan.length).forEach((ev,idx)=>{attendancePlan[idx].forEach((email,order)=>{if(!rsvpEmails.includes(email))return;const name=email===DEMO_PLAYER.email?DEMO_PLAYER.name:DEMO_SEED_PLAYERS.find(p=>p.email===email)?.name||email;rsvpRows.push({eventId:ev.id,email,playerId:email,teamId,name,ts:withTs(80-idx*9,order)});});});
const scRows=[
{id:8101,title:"Upper Body Power",date:isoDaysAgo(14),time:"6:00 AM",location:"Weight Room — Bay A",desc:"Bench, push press, rows.",teamId},
{id:8102,title:"Lower Body Strength",date:isoDaysAgo(13),time:"6:00 AM",location:"Weight Room — Bay A",desc:"Squats and posterior-chain focus.",teamId},
{id:8103,title:"Core & Conditioning",date:isoDaysAgo(12),time:"6:30 AM",location:"Training Facility — Turf",desc:"Core stability and conditioning work.",teamId},
{id:8104,title:"Explosive Circuit",date:isoDaysAgo(11),time:"6:15 AM",location:"Weight Room — Bay B",desc:"Power circuit + mobility.",teamId},
{id:8105,title:"Olympic Lifts",date:isoDaysAgo(10),time:"6:00 AM",location:"Weight Room — Platform",desc:"Clean progressions and pulls.",teamId},
{id:8106,title:"Recovery Lift",date:isoDaysAgo(9),time:"7:00 AM",location:"Recovery Suite",desc:"Lighter movement and activation.",teamId},
{id:8107,title:"Full Body Circuit",date:isoDaysAgo(8),time:"6:00 AM",location:"Weight Room — Bay B",desc:"High-intensity full body block.",teamId},
{id:8108,title:"Strength Endurance",date:isoDaysAgo(7),time:"6:30 AM",location:"Weight Room — Bay A",desc:"Strength endurance ladder.",teamId},
{id:8109,title:"Athletic Movement",date:isoDaysAgo(6),time:"6:15 AM",location:"Training Turf",desc:"Footwork and acceleration patterns.",teamId},
];
const scRsvpRows=[0,1,3,4,7].map((sessionIdx,idx)=>({sessionId:scRows[sessionIdx].id,email:DEMO_PLAYER.email,playerId:DEMO_PLAYER.email,teamId,name:DEMO_PLAYER.name,ts:withTs(16-sessionIdx,500+idx)}));
const challengeRows=[
{id:7001,teamId,playerId:DEMO_PLAYER.email,from:DEMO_PLAYER.email,fromName:DEMO_PLAYER.name,to:"chris.w@shotlab.app",toName:"Chris W.",drillId:1,drillName:"FORM SHOOTING",score:7,max:10,status:"lost",respScore:8,respTs:withTs(4,2),ts:withTs(5,1)},
{id:7002,teamId,playerId:"jordan.m@shotlab.app",from:"jordan.m@shotlab.app",fromName:"Jordan M.",to:DEMO_PLAYER.email,toName:DEMO_PLAYER.name,drillId:2,drillName:"FREE THROWS",score:8,max:10,status:"won",respScore:9,respTs:withTs(4,2),ts:withTs(4,1)},
{id:7003,teamId,playerId:DEMO_PLAYER.email,from:DEMO_PLAYER.email,fromName:DEMO_PLAYER.name,to:"aiden.t@shotlab.app",toName:"Aiden T.",drillId:1,drillName:"FORM SHOOTING",score:9,max:10,status:"pending",ts:withTs(3,1)},
{id:7004,teamId,playerId:"tyler.r@shotlab.app",from:"tyler.r@shotlab.app",fromName:"Tyler R.",to:DEMO_PLAYER.email,toName:DEMO_PLAYER.name,drillId:2,drillName:"FREE THROWS",score:9,max:10,status:"won",respScore:10,respTs:withTs(2,2),ts:withTs(2,1)},
{id:7005,teamId,playerId:DEMO_PLAYER.email,from:DEMO_PLAYER.email,fromName:DEMO_PLAYER.name,to:"jordan.m@shotlab.app",toName:"Jordan M.",drillId:2,drillName:"FREE THROWS",score:9,max:10,status:"pending",ts:withTs(1,1)},
];
const leaderboardRows=[
{email:"jordan.m@shotlab.app",name:"Jordan M.",total:1124},
{email:"tyler.r@shotlab.app",name:"Tyler R.",total:1058},
{email:DEMO_PLAYER.email,name:DEMO_PLAYER.name,total:998},
{email:"chris.w@shotlab.app",name:"Chris W.",total:934},
{email:"aiden.t@shotlab.app",name:"Aiden T.",total:876},
];
const playerRows=leaderboardRows.flatMap((p,rankIdx)=>{
const homeTotal=Math.round(p.total*0.68);
const shotTotal=p.total-homeTotal;
const base=Math.floor(homeTotal/16);
const extra=homeTotal-base*16;
const scoreSet=Array.from({length:16},(_,i)=>base+(i<extra?1:0));
const shotSet=distributeTotal(shotTotal,6);
const scoreEntries=scoreSet.map((val,idx)=>({email:p.email,playerId:p.email,teamId,name:p.name,drillId:idx%2===0?1:2,score:val,date:isoDaysAgo(22+idx),ts:withTs(22+idx,rankIdx*100+idx),src:"home"}));
const shotEntries=shotSet.map((made,idx)=>({email:p.email,playerId:p.email,teamId,name:p.name,made,date:isoDaysAgo(22+idx),ts:withTs(22+idx,rankIdx*100+50+idx)}));
return [...scoreEntries,...shotEntries];
});
return{scoreRows,shotRows,eventRows,rsvpRows,scRows,scRsvpRows,challengeRows,leaderboardRows,playerRows};
}

export { buildDemoSeed };
