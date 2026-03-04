import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import PlayersScreen from "./screens/PlayersScreen";
import { initAnalytics, trackBackendEvent } from "./lib/analytics";
import PageHeader from "./components/PageHeader";
import CoachCommandCenter from "./components/CoachCommandCenter";
import CoachHero from "./components/CoachHero";
import CoachMiniHeader from "./components/CoachMiniHeader";
import Button from "./components/ui/Button";
import EmptyState from "./components/EmptyState";

const TOKENS={
PRIMARY:"#C8FF1A",
PRIMARY_DIM:"#9CA3AF",
PRIMARY_GLOW:"rgba(200, 255, 26, 0.18)",
SECONDARY:"#9CA3AF",
SECONDARY_DIM:"rgba(0, 229, 255, 0.12)",
DANGER:"#FF4545",
WARNING:"#FFA500",
BG_BASE:"#0B0D10",
BG_CARD:"#141821",
BG_ELEVATED:"#0F1115",
BG_SUBTLE:"rgba(255,255,255,0.08)",
TEXT_PRIMARY:"#E5E7EB",
TEXT_SECONDARY:"#9CA3AF",
TEXT_MUTED:"#6B7280",
};
const VOLT = TOKENS.PRIMARY;
const ORANGE = TOKENS.PRIMARY;
const CYAN = TOKENS.SECONDARY;
const BG = TOKENS.BG_BASE;
const SURFACE = TOKENS.BG_CARD;
const CARD_BG = TOKENS.BG_CARD;
const BORDER_CLR = TOKENS.BG_SUBTLE;
const MUTED=TOKENS.TEXT_MUTED,LIGHT=TOKENS.TEXT_PRIMARY;
const FD="'Bebas Neue','Impact','Arial Black',sans-serif",FB="'Barlow Condensed','Arial Narrow','Helvetica Neue',sans-serif";
const PAGE_ACCENTS={
feed:{accent:"var(--accent)",glow:"var(--accent-soft)",bg:"rgba(200,255,26,0.08)"},
drills:{accent:"var(--accent)",glow:"var(--accent-soft)",bg:"rgba(200,255,26,0.08)"},
events:{accent:"var(--accent)",glow:"var(--accent-soft)",bg:"rgba(200,255,26,0.08)"},
sc:{accent:"var(--accent)",glow:"var(--accent-soft)",bg:"rgba(200,255,26,0.08)"},
players:{accent:"var(--accent)",glow:"var(--accent-soft)",bg:"rgba(200,255,26,0.08)"},
};
const MODE_CARD_TOKENS={
BASE_BG:"linear-gradient(160deg, rgba(30, 30, 30, 0.96) 0%, rgba(15, 15, 15, 0.94) 100%)",
BASE_BORDER:"rgba(255, 255, 255, 0.18)",
BASE_SHADOW:"0 12px 30px rgba(0, 0, 0, 0.42)",
HOME_TINT:"rgba(200, 255, 0, 0.18)",
PROGRAM_TINT:"rgba(0, 176, 255, 0.18)",
HOME_GLOW:"rgba(200, 255, 0, 0.20)",
PROGRAM_GLOW:"rgba(0, 176, 255, 0.20)",
ICON_INNER:"rgba(255, 255, 255, 0.06)",
FOCUS_RING:"rgba(200, 255, 0, 0.45)",
CHEVRON_BG:"rgba(255, 255, 255, 0.06)",
};

const DRILLS_INIT=[
{id:1,name:"FORM SHOOTING",desc:"10 shots from 5 feet. Elbow, follow-through, arc.",max:10,icon:"ft"},
{id:2,name:"FREE THROWS",desc:"10 free throw attempts. Lock in your routine.",max:10,icon:"ft"},
{id:3,name:"CATCH & SHOOT",desc:"15 catch-and-shoot jumpers from 5 spots.",max:15,icon:"3p"},
{id:4,name:"BALL HANDLING",desc:"5-minute handle circuit. Rate yourself 1-10.",max:10,icon:"sb"},
{id:5,name:"MID-RANGE",desc:"10 pull-up jumpers from elbows and mid-post.",max:10,icon:"mr"},
{id:6,name:"FLOATERS",desc:"12 runners and floaters from inside the lane.",max:12,icon:"fl"},
];
const ICONS=["ft","3p","mr","fl","sb"];
const EVENTS_INIT=[
{id:1,title:"OPEN GYM RUN",date:"2026-02-28",time:"6:00 PM",location:"Main Gym — Court 1",desc:"Full-court 5v5 runs. First 20 players.",type:"run"},
{id:2,title:"SHOOTING CLINIC",date:"2026-03-05",time:"4:00 PM",location:"Training Facility — Bay 3",desc:"Guided shooting with film review.",type:"clinic"},
{id:3,title:"PRO-AM SCRIMMAGE",date:"2026-03-12",time:"7:00 PM",location:"Community Center",desc:"Competitive scrimmage. Jersey required.",type:"game"},
{id:4,title:"SKILLS CHALLENGE",date:"2026-03-19",time:"5:30 PM",location:"Main Gym — Court 2",desc:"Timed skills course. Prizes for top 3.",type:"challenge"},
{id:5,title:"FILM + RECOVERY",date:"2026-03-26",time:"3:00 PM",location:"Film Room + Recovery Suite",desc:"Film breakdown + cold plunge and stretch.",type:"recovery"},
];
const SC_INIT=[
{id:101,title:"UPPER BODY POWER",date:"2026-02-25",time:"6:00 AM",location:"Weight Room — Bay A",desc:"Bench press, overhead press, rows, and accessory work. Bring your lifting shoes."},
{id:102,title:"LOWER BODY STRENGTH",date:"2026-02-27",time:"6:00 AM",location:"Weight Room — Bay A",desc:"Squats, deadlifts, lunges. Focus on posterior chain."},
{id:103,title:"FULL BODY CIRCUIT",date:"2026-03-04",time:"7:00 AM",location:"Weight Room — Bay B",desc:"High-intensity circuit training. 45 min. Bring water."},
{id:104,title:"OLYMPIC LIFTS",date:"2026-03-11",time:"6:00 AM",location:"Weight Room — Platform Area",desc:"Clean & jerk, snatch progressions. Coached session."},
{id:105,title:"CORE & CONDITIONING",date:"2026-03-18",time:"6:30 AM",location:"Training Facility — Turf",desc:"Core stability, sled pushes, agility ladder. Game-day conditioning."},
];
const TIERS=[{min:0,name:"ROOKIE",color:"#555",bg:"#55555515"},{min:2,name:"IRON",color:"#A0A0A0",bg:"#A0A0A015"},{min:3,name:"BRONZE",color:"#A0A0A0",bg:"#A0A0A015"},{min:5,name:"SILVER",color:"#A0A0A0",bg:"#A0A0A015"},{min:8,name:"GOLD",color:"#C8FF00",bg:"#C8FF0015"},{min:12,name:"DIAMOND",color:CYAN,bg:CYAN+"15"}];
const getTier = c => [...TIERS].reverse().find(t => c >= t.min) || TIERS[0];
const todayStr=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`};
const ALNUM="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const DEMO_PLAYER={email:"demo@shotlab.app",password:"demo1234",name:"Demo Player",role:"player"};
const DEMO_COACH={email:"coach.demo@shotlab.app",password:"demo1234",name:"Demo Coach",role:"coach"};
const DEMO_SEED_PLAYERS=[
{email:"jordan.m@shotlab.app",name:"Jordan M."},
{email:"tyler.r@shotlab.app",name:"Tyler R."},
{email:"chris.w@shotlab.app",name:"Chris W."},
{email:"aiden.t@shotlab.app",name:"Aiden T."},
];
const isoDaysAgo=(days)=>{const d=new Date();d.setDate(d.getDate()-days);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`};
const withTs=(daysAgo,offset=0)=>Date.now()-daysAgo*86400000+offset;
const distributeTotal=(total,count)=>{const base=Math.floor(total/count);const rem=total-base*count;return Array.from({length:count},(_,i)=>base+(i<rem?1:0));};
const genId=(p="id")=>`${p}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
function generateJoinCode(existing=[],length=6){
for(let tries=0;tries<30;tries++){
let code="";
for(let i=0;i<length;i++)code+=ALNUM[Math.floor(Math.random()*ALNUM.length)];
if(!existing.includes(code))return code;
}
return Math.random().toString(36).slice(2,2+length).toUpperCase();
}
const DB={async get(k){try{const r=await window.storage.get(k,true);return r?JSON.parse(r.value):null}catch{return null}},async set(k,v){try{await window.storage.set(k,JSON.stringify(v),true)}catch{}}};
// Password hashing (simple but not plaintext)
function hashPw(s){let h=0x811c9dc5;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,0x01000193)}return(h>>>0).toString(36)}
// AudioContext must be lazy-initialized on user gesture (iOS WebKit requirement)
let _audioCtx=null;
function getAudioCtx(){if(!_audioCtx&&typeof AudioContext!=="undefined"){try{_audioCtx=new AudioContext()}catch{}}if(_audioCtx&&_audioCtx.state==="suspended"){_audioCtx.resume().catch(()=>{})}return _audioCtx}
function playTick(){const audioCtx=getAudioCtx();if(!audioCtx)return;try{const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.connect(g);g.connect(audioCtx.destination);o.frequency.value=1200;o.type="sine";g.gain.setValueAtTime(.07,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+.05);o.start();o.stop(audioCtx.currentTime+.05)}catch{}}
function playScore(){const audioCtx=getAudioCtx();if(!audioCtx)return;try{[800,1200,1600].forEach((f,i)=>{const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.connect(g);g.connect(audioCtx.destination);o.frequency.value=f;o.type="sine";g.gain.setValueAtTime(.05,audioCtx.currentTime+i*.08);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+i*.08+.12);o.start(audioCtx.currentTime+i*.08);o.stop(audioCtx.currentTime+i*.08+.12)})}catch{}}
function playUnlock(){const audioCtx=getAudioCtx();if(!audioCtx)return;try{[523,659,784,1047].forEach((f,i)=>{const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.connect(g);g.connect(audioCtx.destination);o.frequency.value=f;o.type="triangle";g.gain.setValueAtTime(.06,audioCtx.currentTime+i*.1);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+i*.1+.25);o.start(audioCtx.currentTime+i*.1);o.stop(audioCtx.currentTime+i*.1+.25)})}catch{}}
const THEMES={dark:{BG:TOKENS.BG_BASE,SURFACE:TOKENS.BG_CARD,CARD_BG:TOKENS.BG_CARD,BORDER:TOKENS.BG_SUBTLE,MUT:TOKENS.TEXT_MUTED,LT:TOKENS.TEXT_PRIMARY,SUB:TOKENS.TEXT_SECONDARY,TRACK:TOKENS.BG_SUBTLE},light:{BG:TOKENS.BG_BASE,SURFACE:TOKENS.BG_CARD,CARD_BG:TOKENS.BG_CARD,BORDER:TOKENS.BG_SUBTLE,MUT:TOKENS.TEXT_MUTED,LT:TOKENS.TEXT_PRIMARY,SUB:TOKENS.TEXT_SECONDARY,TRACK:TOKENS.BG_SUBTLE}};
const T=THEMES.dark; // module-level default for standalone components
const STREAK_BADGES=[{days:7,name:"WEEK WARRIOR",icon:"7",color:"#A0A0A0"},{days:14,name:"TWO-WEEK GRIND",icon:"14",color:"#A0A0A0"},{days:30,name:"MONTHLY BEAST",icon:"30",color:"#C8FF00"},{days:60,name:"IRON WILL",icon:"60",color:CYAN},{days:100,name:"CENTURION",icon:"💯",color:VOLT}];
const getEarnedBadges=s=>STREAK_BADGES.filter(b=>s>=b.days);

function buildDemoSeed(teamId){
const createdAt=Date.now();
const drillSeed={
1:[9,8,8,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7],
2:[10,...Array(17).fill(8)],
};
const scoreRows=[];
Object.entries(drillSeed).forEach(([drillId,vals])=>{
vals.forEach((score,idx)=>{const day=idx+1;scoreRows.push({
email:DEMO_PLAYER.email,playerId:DEMO_PLAYER.email,teamId,name:DEMO_PLAYER.name,drillId:Number(drillId),score,date:isoDaysAgo(day),ts:withTs(day,idx)
})});
});
const shotRows=distributeTotal(312,8).map((made,idx)=>({
email:DEMO_PLAYER.email,playerId:DEMO_PLAYER.email,teamId,name:DEMO_PLAYER.name,made,date:isoDaysAgo(idx+1),ts:withTs(idx+1,300+idx)
}));
const eventRows=[
{id:9001,title:"Gym Session",date:"2026-03-08",time:"6:00 PM",location:"Main Gym — Court 1",desc:"Team skill work and light scrimmage.",type:"run",teamId,createdAt},
{id:9002,title:"Shooting Clinic",date:"2026-03-12",time:"4:00 PM",location:"Training Facility — Bay 3",desc:"Guided shooting with film review.",type:"clinic",teamId,createdAt},
{id:9003,title:"Open Gym Run",date:"2026-03-16",time:"6:30 PM",location:"Main Gym — Court 2",desc:"Competitive 5v5 run.",type:"run",teamId,createdAt},
{id:9004,title:"Skills Challenge",date:"2026-03-20",time:"5:30 PM",location:"Main Gym — Court 2",desc:"Timed ball-handling and finishing challenge.",type:"challenge",teamId,createdAt},
{id:9005,title:"Film + Recovery",date:"2026-03-24",time:"3:00 PM",location:"Film Room",desc:"Film review plus recovery session.",type:"recovery",teamId,createdAt},
{id:9006,title:"Pro-Am Scrimmage",date:"2026-03-28",time:"7:00 PM",location:"Community Center",desc:"Full-court scrimmage night.",type:"game",teamId,createdAt},
{id:9007,title:"Conditioning Block",date:"2026-04-02",time:"6:00 PM",location:"Training Turf",desc:"Conditioning and agility block.",type:"run",teamId,createdAt},
{id:9008,title:"Team Shootaround",date:"2026-04-06",time:"5:00 PM",location:"Main Gym — Court 1",desc:"Shootaround before weekend games.",type:"clinic",teamId,createdAt},
];
const rsvpEmails=[DEMO_PLAYER.email,"jordan.m@shotlab.app","tyler.r@shotlab.app","chris.w@shotlab.app"];
const rsvpRows=[];
eventRows.slice(0,6).forEach((ev,idx)=>{rsvpEmails.forEach((email,order)=>{const name=email===DEMO_PLAYER.email?DEMO_PLAYER.name:DEMO_SEED_PLAYERS.find(p=>p.email===email)?.name||email;rsvpRows.push({eventId:ev.id,email,playerId:email,teamId,name,ts:withTs(20-idx,order)});});});
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
const scRsvpRows=scRows.map((s,idx)=>({sessionId:s.id,email:DEMO_PLAYER.email,playerId:DEMO_PLAYER.email,teamId,name:DEMO_PLAYER.name,ts:withTs(14-idx,500+idx)}));
const challengeRows=[
{id:7001,teamId,playerId:DEMO_PLAYER.email,from:DEMO_PLAYER.email,fromName:DEMO_PLAYER.name,to:"chris.w@shotlab.app",toName:"Chris W.",drillId:1,drillName:"FORM SHOOTING",score:8,max:10,status:"pending",ts:withTs(5,1)},
{id:7002,teamId,playerId:"jordan.m@shotlab.app",from:"jordan.m@shotlab.app",fromName:"Jordan M.",to:DEMO_PLAYER.email,toName:DEMO_PLAYER.name,drillId:2,drillName:"FREE THROWS",score:9,max:10,status:"won",respScore:10,respTs:withTs(4,2),ts:withTs(4,1)},
{id:7003,teamId,playerId:DEMO_PLAYER.email,from:DEMO_PLAYER.email,fromName:DEMO_PLAYER.name,to:"aiden.t@shotlab.app",toName:"Aiden T.",drillId:1,drillName:"FORM SHOOTING",score:9,max:10,status:"pending",ts:withTs(3,1)},
{id:7004,teamId,playerId:"tyler.r@shotlab.app",from:"tyler.r@shotlab.app",fromName:"Tyler R.",to:DEMO_PLAYER.email,toName:DEMO_PLAYER.name,drillId:2,drillName:"FREE THROWS",score:9,max:10,status:"won",respScore:10,respTs:withTs(2,2),ts:withTs(2,1)},
{id:7005,teamId,playerId:DEMO_PLAYER.email,from:DEMO_PLAYER.email,fromName:DEMO_PLAYER.name,to:"jordan.m@shotlab.app",toName:"Jordan M.",drillId:2,drillName:"FREE THROWS",score:8,max:10,status:"pending",ts:withTs(1,1)},
];
const leaderboardRows=[
{email:"jordan.m@shotlab.app",name:"Jordan M.",total:1240},
{email:"tyler.r@shotlab.app",name:"Tyler R.",total:1105},
{email:DEMO_PLAYER.email,name:DEMO_PLAYER.name,total:847},
{email:"chris.w@shotlab.app",name:"Chris W.",total:601},
{email:"aiden.t@shotlab.app",name:"Aiden T.",total:489},
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
const DRILL_ACCENTS={"FORM SHOOTING":VOLT,"FREE THROWS":VOLT,"CATCH & SHOOT":VOLT,"BALL HANDLING":VOLT,"MID-RANGE":VOLT,"FLOATERS":VOLT};
const getDrillAccentColor=name=>DRILL_ACCENTS[name]||"#C8FF00";
function Sparkline({data,color=VOLT,w=44,h=16}){if(!data||data.length<2)return null;const max=Math.max(...data,1);const pts=data.map((v,i)=>`${(i/(data.length-1))*w},${h-((v/max)*h*.8+h*.1)}`).join(" ");return <svg width={w} height={h} style={{display:"block",opacity:.6}}><polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}

const EventIcon=({type,size=24,color=VOLT})=>{const s={width:size,height:size,display:"block"};
if(type==="run")return <svg viewBox="0 0 40 40" fill="none" style={s}><circle cx="20" cy="8" r="5" stroke={color} strokeWidth="2"/><path d="M12 38l4-14 4 6 4-6 4 14" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 24h12" stroke={color} strokeWidth="1.5"/></svg>;
if(type==="clinic")return <svg viewBox="0 0 40 40" fill="none" style={s}><rect x="6" y="10" width="28" height="22" rx="3" stroke={color} strokeWidth="2"/><path d="M6 18h28" stroke={color} strokeWidth="1.5"/><circle cx="20" cy="27" r="4" stroke={color} strokeWidth="1.5"/><path d="M14 6v6M26 6v6" stroke={color} strokeWidth="2" strokeLinecap="round"/></svg>;
if(type==="game")return <svg viewBox="0 0 40 40" fill="none" style={s}><circle cx="20" cy="20" r="16" stroke={color} strokeWidth="2"/><path d="M4 20h32M20 4v32" stroke={color} strokeWidth="1.5"/><path d="M8 6c4.5 5 6.5 9 6.5 14s-2 9-6.5 14" stroke={color} strokeWidth="1.5" fill="none"/><path d="M32 6c-4.5 5-6.5 9-6.5 14s2 9 6.5 14" stroke={color} strokeWidth="1.5" fill="none"/></svg>;
if(type==="challenge")return <svg viewBox="0 0 40 40" fill="none" style={s}><path d="M20 4l4 8 8 2-6 6 2 8-8-4-8 4 2-8-6-6 8-2z" stroke={color} strokeWidth="2" fill="none" strokeLinejoin="round"/></svg>;
if(type==="recovery")return <svg viewBox="0 0 40 40" fill="none" style={s}><path d="M20 6v10l6 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="20" cy="20" r="16" stroke={color} strokeWidth="2"/></svg>;
return <svg viewBox="0 0 40 40" fill="none" style={s}><rect x="6" y="10" width="28" height="22" rx="3" stroke={color} strokeWidth="2"/><path d="M14 6v6M26 6v6M6 18h28" stroke={color} strokeWidth="2" strokeLinecap="round"/></svg>;
};
const DrillIcon=({type,size=28,color=VOLT})=>{const s={width:size,height:size,display:"block"};
if(type==="ft")return <svg viewBox="0 0 40 40" fill="none" style={s}><circle cx="20" cy="20" r="17" stroke={color} strokeWidth="2"/><path d="M3 20h34" stroke={color} strokeWidth="1.5"/><path d="M20 3v34" stroke={color} strokeWidth="1.5"/><path d="M8 5c4.5 5 6.5 9 6.5 15s-2 10-6.5 15" stroke={color} strokeWidth="1.5" fill="none"/><path d="M32 5c-4.5 5-6.5 9-6.5 15s2 10 6.5 15" stroke={color} strokeWidth="1.5" fill="none"/></svg>;
if(type==="3p")return <svg viewBox="0 0 40 40" fill="none" style={s}><path d="M6 36Q20 4 34 36" stroke={color} strokeWidth="2" fill="none"/><circle cx="20" cy="18" r="4" fill={color} opacity=".8"/><line x1="20" y1="22" x2="20" y2="36" stroke={color} strokeWidth="1.5"/></svg>;
if(type==="mr")return <svg viewBox="0 0 40 40" fill="none" style={s}><rect x="6" y="6" width="28" height="28" rx="3" stroke={color} strokeWidth="1.5"/><circle cx="20" cy="20" r="8" stroke={color} strokeWidth="1.5" fill="none"/><circle cx="20" cy="20" r="2.5" fill={color}/></svg>;
if(type==="fl")return <svg viewBox="0 0 40 40" fill="none" style={s}><path d="M10 34Q12 14 20 10Q28 14 30 34" stroke={color} strokeWidth="2" fill="none"/><circle cx="20" cy="10" r="4" stroke={color} strokeWidth="1.5" fill="none"/><path d="M16 20h8" stroke={color} strokeWidth="1.5" strokeDasharray="2 2"/></svg>;
if(type==="sb")return <svg viewBox="0 0 40 40" fill="none" style={s}><path d="M28 32L12 24L22 12" stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/><circle cx="22" cy="12" r="5" stroke={color} strokeWidth="1.5" fill="none"/><path d="M32 8l-4 2" stroke={color} strokeWidth="1.5" strokeLinecap="round"/></svg>;
return <svg viewBox="0 0 40 40" style={s}><circle cx="20" cy="20" r="16" stroke={color} strokeWidth="2" fill="none"/></svg>;
};
const WhistleIcon=({size=12,color=VOLT,style={}})=><svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><path d="M5 14a4 4 0 118 0v2a2 2 0 11-4 0v-2"/><path d="M13 14h3a3 3 0 010 6h-3"/><circle cx="19" cy="9" r="1.5"/></svg>
const ShieldIcon=({size=12,color=VOLT,style={}})=><svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><path d="M12 3l7 3v6c0 5-3.4 8.8-7 10-3.6-1.2-7-5-7-10V6l7-3z"/></svg>
const UsersIcon=({size=14,color="#A0A0A0"})=><svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6"/><path d="M23 11h-6"/></svg>
const CourtBG=({opacity=.02})=><svg style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none",opacity}} viewBox="0 0 400 900" fill="none" preserveAspectRatio="xMidYMid slice"><rect x="20" y="40" width="360" height="700" stroke={VOLT} strokeWidth="1"/><line x1="20" y1="390" x2="380" y2="390" stroke={VOLT} strokeWidth=".8"/><circle cx="200" cy="390" r="60" stroke={VOLT} strokeWidth=".8" fill="none"/><rect x="110" y="40" width="180" height="190" stroke={VOLT} strokeWidth=".8"/><path d="M140 40Q200 140 260 40" stroke={VOLT} strokeWidth=".8" fill="none"/><rect x="110" y="550" width="180" height="190" stroke={VOLT} strokeWidth=".8"/><path d="M140 740Q200 640 260 740" stroke={VOLT} strokeWidth=".8" fill="none"/></svg>;
const GlowOrb=({color=VOLT,top="20%",left="50%",size=300,animate})=><div style={{position:"absolute",top,left,width:size,height:size,borderRadius:"50%",background:`radial-gradient(circle,${color}0a 0%,transparent 70%)`,transform:"translate(-50%,-50%)",pointerEvents:"none",animation:animate?"orbDrift 12s ease-in-out infinite alternate":"none"}}/>;
const _STYLES_CSS=`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@400;500;600;700;800&display=swap'); :root{--bg-0:#0B0D10;--surface-1:#0F1115;--surface-2:#141821;--surface-3:#171D28;--text-1:#E5E7EB;--text-2:#9CA3AF;--text-3:#6B7280;--stroke-1:rgba(255,255,255,0.08);--stroke-2:rgba(255,255,255,0.12);--shadow-0:none;--shadow-1:0 2px 10px rgba(0,0,0,0.35);--shadow-2:0 8px 24px rgba(0,0,0,0.45);--radius-card:20px;--space-2:8px;--space-3:12px;--space-4:16px;--space-5:20px;--space-6:24px;--space-8:32px;--page-gutter:16px;--stack-gap:var(--space-6);--card-pad:var(--space-5);--mini-card-pad:var(--space-4);--accent:#C8FF1A;--accent-soft:rgba(200,255,26,0.18);--color-primary:var(--accent);--color-primary-dim:#A3CC00;--color-primary-glow:var(--accent-soft);--color-secondary:var(--text-2);--color-secondary-dim:rgba(156,163,175,0.16);--color-danger:#FF4545;--color-warning:#FFA500;--color-bg-base:var(--bg-0);--color-bg-card:var(--surface-2);--color-bg-elevated:var(--surface-1);--color-bg-subtle:var(--stroke-1);--color-text-primary:var(--text-1);--color-text-secondary:var(--text-2);--color-text-muted:var(--text-3);--tracking-tight:0.04em;--tracking-default:0.06em;--tracking-wide:0.10em;--text-primary:var(--text-1);--text-secondary:var(--text-2);--text-tertiary:var(--text-3);--accent-default:var(--accent);--accent-feed:var(--accent);--accent-drills:var(--accent);--accent-events:var(--accent);--accent-lifting:var(--accent);--accent-sc:var(--accent);--accent-players:var(--accent);--nav-inactive:var(--text-3);--nav-inactive-icon:var(--text-3);--nav-active-text:var(--accent);--nav-indicator-height:3px;--nav-focus:var(--accent-soft);}@media(min-width:768px){:root{--page-gutter:20px;}} *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}body{background:${BG};overflow-x:hidden}.coach-mode{background:#0B0A09!important}input,textarea{font-family:${FB}}.u-allcaps-long{text-transform:uppercase;letter-spacing:var(--tracking-default);font-weight:600}.u-meta-label{text-transform:uppercase;letter-spacing:var(--tracking-tight);color:var(--text-tertiary);font-weight:600}.u-secondary-text{color:var(--text-secondary)}button:focus-visible,a:focus-visible{outline:2px solid var(--page-accent,var(--color-primary,#C8FF00));outline-offset:2px}.uiDecor{pointer-events:none!important;user-select:none!important;opacity:.18;filter:saturate(.9);position:relative;z-index:0}.uiDecor,.uiDecor *{box-shadow:none!important;text-shadow:none!important;outline:none!important}.uiTap{cursor:pointer;-webkit-tap-highlight-color:transparent}.uiTap:focus-visible{outline:2px solid var(--lime,#C6FF00);outline-offset:3px;border-radius:12px}.uiTap:active{transform:scale(.985)}@media (hover:hover) and (pointer:fine){.uiTap:hover{filter:brightness(1.06)}}.sectionContent{position:relative;z-index:1}input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none}input[type=number]{-moz-appearance:textfield}::-webkit-scrollbar{width:0}@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}@keyframes scaleIn{from{opacity:0;transform:scale(.8)}to{opacity:1;transform:scale(1)}}@keyframes glow{0%,100%{box-shadow:0 0 0 transparent}50%{box-shadow:0 0 0 transparent}}@keyframes heroGlow{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}@keyframes rippleOut{0%{transform:scale(0);opacity:.5}100%{transform:scale(4);opacity:0}}@keyframes countUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}@keyframes orbDrift{0%{transform:translate(-50%,-50%) scale(1)}25%{transform:translate(-40%,-60%) scale(1.1)}50%{transform:translate(-60%,-45%) scale(.95)}75%{transform:translate(-45%,-55%) scale(1.05)}100%{transform:translate(-55%,-50%) scale(1)}}@keyframes confettiBurst{0%{transform:translate(0,0) scale(1);opacity:1}100%{opacity:0}}@keyframes particleFly{0%{transform:translate(0,0) scale(1);opacity:1}60%{opacity:.8}100%{transform:var(--fly-to);opacity:0}}@keyframes screenFadeIn{from{opacity:0}to{opacity:1}}@keyframes detailEnter{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}@keyframes ballEntrance{0%{opacity:0;transform:scale(.85)}100%{opacity:1;transform:scale(1)}}@keyframes shadowEntrance{0%{opacity:0;transform:scale(.5)}100%{opacity:1;transform:scale(1)}}@keyframes cardEntrance{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}@keyframes demoEntrance{from{opacity:0}to{opacity:1}}@keyframes metricPop{from{transform:scale(.8);opacity:.6}to{transform:scale(1);opacity:1}}@keyframes flashPress{0%{opacity:1}40%{opacity:1}100%{opacity:0}}@keyframes rankBounce{0%{transform:scale(1)}50%{transform:scale(1.15)}100%{transform:scale(1)}}@keyframes badgeFlash{0%,100%{stroke:#555555}25%,75%{stroke:#C8FF00}50%{stroke:#555555}}.fade-up{animation:fadeUp .4s ease-out both}.screen-fade-in{animation:screenFadeIn .2s ease-out both}.detail-enter{animation:detailEnter .25s ease-out both}.scale-in{animation:scaleIn .35s ease-out both}.btn-v{transition:transform .1s ease,box-shadow .2s ease;position:relative;overflow:hidden}.btn-v:active{transform:scale(.97)}.btn-v::after{content:'';position:absolute;inset:0;background:rgba(255,255,255,.15);opacity:0;pointer-events:none}.btn-v:active::after{animation:flashPress .2s ease-out forwards}.cta-primary,.cta-primary-accent,.cta-brand,.cta-danger{position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;gap:8px;min-height:52px;width:calc(100% - 32px)!important;margin-left:16px!important;margin-right:16px!important;height:52px!important;padding:0 16px!important;border:none;border-radius:14px!important;cursor:pointer;font-family:${FB}!important;font-size:13px!important;font-weight:700!important;letter-spacing:var(--tracking-default)!important;text-transform:uppercase;transition:transform .1s ease,box-shadow .1s ease,opacity .2s ease,filter .15s ease}.cta-primary,.cta-primary-accent{color:#000000;background:linear-gradient(180deg,rgba(255,255,255,.08) 0%,rgba(255,255,255,0) 100%),var(--page-accent,var(--color-primary,#C8FF00));box-shadow:0 4px 24px color-mix(in srgb,var(--page-accent,var(--color-primary,#C8FF00)) 26%, transparent)}.cta-brand{color:#000000;background:linear-gradient(180deg,rgba(255,255,255,.08) 0%,rgba(255,255,255,0) 100%),var(--color-primary,#C8FF00);box-shadow:0 4px 24px rgba(200,255,0,.25)}.cta-primary:active,.cta-primary-accent:active,.cta-brand:active,.cta-danger:active{transform:scale(.97)}.cta-primary:active,.cta-primary-accent:active{box-shadow:0 4px 24px color-mix(in srgb,var(--page-accent,var(--color-primary,#C8FF00)) 14%, transparent)}.cta-brand:active{box-shadow:0 4px 24px rgba(200,255,0,.12)}.cta-primary:hover,.cta-primary-accent:hover,.cta-brand:hover,.cta-danger:hover{filter:brightness(1.05)}.cta-primary:focus-visible,.cta-primary-accent:focus-visible{outline:2px solid var(--page-accent,var(--color-primary,#C8FF00));outline-offset:2px}.cta-brand:focus-visible{outline:2px solid var(--color-primary,#C8FF00);outline-offset:2px}.cta-danger:focus-visible{outline:2px solid var(--color-danger,#FF4545);outline-offset:2px}.cta-danger{color:#FFFFFF;background:linear-gradient(180deg,rgba(255,255,255,.08) 0%,rgba(255,255,255,0) 100%),var(--color-danger,#FF4545);box-shadow:0 4px 24px rgba(255,69,69,.25)}.cta-danger:active{box-shadow:0 4px 24px rgba(255,69,69,.12)}.cta-primary[disabled],.cta-primary-accent[disabled],.cta-brand[disabled],.cta-primary[data-loading='true'],.cta-primary-accent[data-loading='true'],.cta-brand[data-loading='true'],.cta-danger[disabled],.cta-danger[data-loading='true']{opacity:.4;box-shadow:none;cursor:not-allowed}.cta-primary[disabled] .cta-icon,.cta-primary-accent[disabled] .cta-icon,.cta-brand[disabled] .cta-icon,.cta-primary[data-loading='true'] .cta-icon,.cta-primary-accent[data-loading='true'] .cta-icon,.cta-brand[data-loading='true'] .cta-icon,.cta-danger[disabled] .cta-icon,.cta-danger[data-loading='true'] .cta-icon{display:none}.cta-primary[disabled]::before,.cta-primary-accent[disabled]::before,.cta-brand[disabled]::before,.cta-primary[data-loading='true']::before,.cta-primary-accent[data-loading='true']::before,.cta-brand[data-loading='true']::before,.cta-danger[disabled]::before,.cta-danger[data-loading='true']::before{content:'';width:12px;height:12px;border-radius:50%;border:2px solid currentColor;border-right-color:transparent;display:inline-block;animation:spin .7s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}.cta-secondary{position:relative;overflow:hidden;display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:44px;width:auto;max-width:100%;padding:0 18px;border-radius:999px;border:1px solid rgba(229,231,235,.72);background:rgba(255,255,255,.92);color:#111827;cursor:pointer;font-family:${FB}!important;font-size:11px!important;font-weight:700!important;letter-spacing:var(--tracking-tight)!important;text-transform:uppercase;line-height:1;transition:transform .1s ease,box-shadow .15s ease,opacity .2s ease,filter .15s ease}.cta-secondary:hover{filter:brightness(.98)}.cta-secondary:active{box-shadow:0 2px 10px rgba(0,0,0,.22)}.cta-secondary-link{margin-top:16px;font-family:${FB};font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--color-primary,#C8FF00);background:none;border:none;padding:0;cursor:pointer}.cta-secondary-link:hover,.cta-secondary-link:focus-visible{text-decoration:underline}.ch{transition:transform .1s ease,background-color .15s ease,border-color .15s ease}.ch:hover{background:#1A1A1A!important;border-color:rgba(200,255,0,.15)!important}.ch:active{transform:scale(.985)}.tb{background-size:200% 100%;animation:shimmer 3s linear infinite}.cnt-up{animation:countUp .5s ease-out both}.grd-bdr{background:linear-gradient(135deg,${VOLT}15,${ORANGE}10,${CYAN}10);padding:1px;border-radius:17px}.grd-bdr>div{border-radius:16px}.glass-hdr{background:${BG}cc;backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:1px solid ${BORDER_CLR}80;box-shadow:0 4px 30px ${BG}80}.card-glow-v,.card-glow-o,.card-glow-c{box-shadow:var(--shadow-1)}.particle{position:absolute;border-radius:50%;pointer-events:none;animation:particleFly .7s ease-out forwards}@keyframes bbBounce{0%{transform:translateY(0) scaleY(1) scaleX(1)}40%{transform:translateY(8px) scaleY(.7) scaleX(1.3)}70%{transform:translateY(-6px) scaleY(1.1) scaleX(.95)}100%{transform:translateY(0) scaleY(1) scaleX(1)}}@keyframes badgeReveal{0%{transform:scale(0) rotate(-10deg);opacity:0}60%{transform:scale(1.15) rotate(3deg);opacity:1}100%{transform:scale(1) rotate(0);opacity:1}}@keyframes shineSwipe{0%{left:-60%}100%{left:160%}}.badge-pop{animation:badgeReveal .6s cubic-bezier(.34,1.56,.64,1) both}.badge-shine{position:relative;overflow:hidden}.badge-shine::after{content:'';position:absolute;top:0;width:40%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.18),transparent);animation:shineSwipe 1.2s ease .3s}@keyframes slideInRight{from{opacity:0;transform:translateX(30px)}to{opacity:1;transform:translateX(0)}}@keyframes slideInLeft{from{opacity:0;transform:translateX(-30px)}to{opacity:1;transform:translateX(0)}}@keyframes ballSpin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}@keyframes ballBounceIn{0%{transform:scale(0) translateY(40px);opacity:0}50%{transform:scale(1.15) translateY(-10px);opacity:1}70%{transform:scale(.95) translateY(4px)}100%{transform:scale(1) translateY(0)}}@keyframes podiumPulse{0%,100%{box-shadow:0 0 12px var(--pod-c,${VOLT})22}50%{box-shadow:0 0 28px var(--pod-c,${VOLT})33}}.slide-r{animation:slideInRight .3s ease-out both}.slide-l{animation:slideInLeft .3s ease-out both}.ball-spin{animation:ballSpin 8s linear infinite}.auth-ball-enter{animation:ballEntrance .6s cubic-bezier(.34,1.56,.64,1) both}.auth-shadow-enter{animation:shadowEntrance .6s cubic-bezier(.34,1.56,.64,1) both}.auth-card-enter{animation:cardEntrance .4s ease-out .2s both}.auth-demo-enter{animation:demoEntrance .25s ease-out .7s both}.metric-pop{display:inline-block;animation:metricPop .3s ease-out both}.rank-bounce{animation:rankBounce .4s cubic-bezier(.34,1.56,.64,1)}.rank-badge-flash{animation:badgeFlash .6s ease-in-out 2}.ball-bounce{animation:ballBounceIn .7s cubic-bezier(.34,1.56,.64,1) both}.podium-glow{animation:podiumPulse 2s ease-in-out infinite}.grad-text{background-clip:text;-webkit-background-clip:text;-webkit-text-fill-color:transparent}.page{--page-accent:var(--accent-default);--nav-accent:var(--accent-default);}.page[data-accent="feed"]{--page-accent:var(--accent-feed);--nav-accent:var(--accent-feed);}.page[data-accent="drills"]{--page-accent:var(--accent-drills);--nav-accent:var(--accent-drills);}.page[data-accent="events"]{--page-accent:var(--accent-events);--nav-accent:var(--accent-events);}.page[data-accent="sc"]{--page-accent:var(--accent-sc);--nav-accent:var(--accent-sc);}.page[data-accent="players"]{--page-accent:var(--accent-players);--nav-accent:var(--accent-players);}.page-header{margin-top:8px;margin-bottom:16px;}.page-title{text-transform:uppercase;letter-spacing:var(--tracking-default);max-width:100%;word-break:break-word;}.page-identity-bar{height:3px;width:56px;margin-top:10px;border-radius:999px;background:var(--page-accent);opacity:0.95;}.accent-card{position:relative;overflow:hidden;}.accent-card::before{content:"";position:absolute;left:0;top:12px;bottom:12px;width:3px;border-radius:999px;background:var(--page-accent);opacity:0.85;}.bottom-nav .tab{color:var(--nav-inactive);}.bottom-nav .tab .tab-icon{color:var(--nav-inactive-icon);transition:color 150ms ease-out,filter 150ms ease-out;line-height:1;}.bottom-nav .tab .tab-label{color:var(--nav-inactive);font-weight:500;transition:color 150ms ease-out,font-weight 150ms ease-out;}.bottom-nav .tab::after{content:"";position:absolute;top:2px;left:50%;transform:translateX(-50%);width:22px;height:var(--nav-indicator-height);border-radius:999px;background:var(--tab-accent,var(--nav-accent));opacity:0;transition:opacity 150ms ease-out;}.bottom-nav .tab.is-active,.bottom-nav .tab.active{color:var(--nav-active-text);}.bottom-nav .tab.is-active .tab-icon,.bottom-nav .tab.active .tab-icon{color:var(--tab-accent,var(--nav-accent));filter:drop-shadow(0 0 6px color-mix(in srgb,var(--tab-accent,var(--nav-accent)) 55%, transparent));}.bottom-nav .tab.is-active .tab-label,.bottom-nav .tab.active .tab-label{color:var(--tab-accent,var(--nav-accent));font-weight:600;}.bottom-nav .tab.is-active::after,.bottom-nav .tab.active::after{opacity:0.95;}.bottom-nav .tab:focus-visible{outline:2px solid var(--nav-focus);outline-offset:3px;border-radius:10px;}@media(prefers-reduced-motion:reduce){*,.fade-up,.scale-in,.slide-r,.slide-l,.ball-spin,.ball-bounce,.badge-pop,.cnt-up,.podium-glow,.tb,.btn-v,.ch{animation:none!important;transition:none!important}}
.coach-mode .page-title,.coach-mode .pageHeaderText h1,.coach-mode .heroStatLbl,.coach-mode .sidebar-nav .nav-title,.coach-mode .insights-panel .panel-title{letter-spacing:0.08em;line-height:1.15;}
.coach-mode .pageHeaderText p,.coach-mode .coach-tools-trigger,.coach-mode .coach-tools-trigger__chevron,.coach-mode .placeholder,.coach-mode .sidebar-nav .nav-item{color:rgba(255,255,255,0.78);}
.eventsList{display:flex;flex-direction:column;gap:16px;}.eventCard{display:grid;grid-template-columns:52px 1fr auto;align-items:center;gap:14px;padding:16px;border-radius:16px;}.eventIcon{width:44px;height:44px;display:grid;place-items:center;border-radius:14px;}.eventMain{min-width:0;}.eventTitle{font-size:16px;font-weight:700;letter-spacing:.04em;line-height:1.15;margin:0;text-transform:none;}.eventMeta{margin-top:var(--space-2);font-size:12px;line-height:1.25;opacity:.75;display:flex;flex-wrap:wrap;gap:var(--space-2);}.eventSide{display:flex;flex-direction:column;align-items:flex-end;gap:var(--space-2);min-width:64px;}.eventCta{height:36px;padding:0 var(--space-3);border-radius:12px;font-size:12px;letter-spacing:.10em;align-self:end;width:auto!important;max-width:160px;grid-column:2 / 4;justify-self:end;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.16);box-shadow:none;}.eventCard button.eventCta,.eventCard .eventCta button{width:auto!important;}
.coach-mode .pageHeaderText p,.coach-mode .placeholder{line-height:1.4;}
`;
const _PAGE_SIGNATURE_CSS=`
.pageShell{--pageAccent:#B8FF00;--pageAccentGlow:rgba(184,255,0,.35);--pageAccentBg:rgba(184,255,0,.08);--page-accent:#B8FF00;--page-accent-soft:rgba(184,255,0,.08);--page-accent-border:rgba(184,255,0,.35);display:flex;flex-direction:column;gap:var(--space-5);}
.pageHeader{margin:0 0 var(--space-6);padding:var(--space-4) var(--space-4) var(--space-3);border-radius:16px;border:1px solid color-mix(in srgb,var(--pageAccent) 28%, transparent);background:linear-gradient(135deg,var(--pageAccentBg),rgba(10,10,10,.96) 55%);box-shadow:0 8px 24px rgba(0,0,0,.3);}
.pageHeaderTop{display:flex;align-items:center;gap:var(--space-3);flex-wrap:wrap;}
.pageHeaderBadge{width:48px;height:48px;border-radius:14px;border:1px solid color-mix(in srgb,var(--headerAccent) 55%, transparent);background:color-mix(in srgb,var(--headerAccent) 14%, #111);display:flex;align-items:center;justify-content:center;color:var(--headerAccent);box-shadow:0 0 18px color-mix(in srgb,var(--headerAccent) 35%, transparent);flex-shrink:0;}
.pageHeaderText{min-width:0;flex:1 1 220px;}.pageHeaderText h1{font-family:${FD};font-size:26px;letter-spacing:var(--tracking-default);color:#fff;line-height:1;word-break:break-word;}
.pageHeaderText p{font-family:${FB};font-size:11px;color:var(--text-secondary);margin-top:4px;text-transform:uppercase;letter-spacing:var(--tracking-tight);}
.pageHeaderRight{margin-left:auto;flex-shrink:0;}
.pageHeaderPill{padding:6px 10px;border-radius:999px;border:1px solid rgba(255,255,255,0.10);background:rgba(255,255,255,0.06);font-family:${FB};font-size:10px;color:#EAEAEA;font-weight:700;letter-spacing:var(--tracking-tight);text-transform:uppercase;transition:background .15s ease,border-color .15s ease,transform .1s ease,filter .15s ease;}
.pageHeaderPill:hover{background:rgba(255,255,255,0.09);border-color:rgba(255,255,255,0.18);filter:brightness(1.04);}
.pageHeaderPill:active{transform:translateY(1px);}
.pageHeaderPill:focus-visible{outline:2px solid var(--page-accent);outline-offset:2px;}
.pageHeaderPillBrand{border:none;background:transparent;color:var(--lime);}
.pageHeaderPillBrand:hover{text-decoration:underline;background:transparent;}
.pageHeaderPillBrand:focus-visible{outline-color:#C8FF00;}
.pageAccentBar{height:4px;width:48%;border-radius:999px;background:var(--headerAccent);box-shadow:0 0 16px var(--headerAccent);margin-top:var(--space-3);}
.heroModule{position:relative;overflow:hidden;border:1px solid var(--stroke-2);border-radius:var(--radius-card);padding:var(--card-pad);margin-bottom:var(--stack-gap);background:var(--surface-3);box-shadow:var(--shadow-2);}
.heroModule::before{content:'';position:absolute;left:0;top:0;width:54px;height:4px;background:var(--pageAccent);}
.heroStats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:var(--space-2);margin-top:var(--space-3);}
.heroStat{background:#0f0f0f;border:1px solid #2a2a2a;border-radius:10px;padding:var(--space-2);text-align:center;}
.heroStatVal{font-family:${FD};color:var(--pageAccent);font-size:20px;line-height:1;}
.heroStatLbl{font-family:${FB};font-size:9px;color:var(--text-tertiary);letter-spacing:var(--tracking-tight);margin-top:2px;}
.feedListItem{position:relative;padding-left:14px;}
.feedListItem::before{content:'';position:absolute;left:0;top:17px;width:6px;height:6px;border-radius:50%;background:var(--pageAccent);box-shadow:0 0 8px var(--pageAccentGlow);}
.drillsMetrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--stack-gap);margin-bottom:var(--stack-gap);}
.drillsMetricTile{border-left:2px solid rgba(56,232,255,.65);}
.eventsDatePill{display:inline-flex;align-items:center;justify-content:center;min-width:56px;padding:6px 8px;border-radius:999px;background:rgba(255,196,0,.16);border:1px solid rgba(255,196,0,.45);color:#FFC400;font-size:10px;font-family:${FB};font-weight:700;letter-spacing:.08em;}
.scSection{border-top:1px solid rgba(91,124,255,.35);padding-top:var(--space-3);margin-top:var(--space-3);}
.playersAvatarRing{outline:2px solid rgba(184,108,255,.65);outline-offset:1px;border-radius:50%;}
.lbList{display:flex;flex-direction:column;gap:var(--space-4);}
.lbRow{display:grid;grid-template-columns:40px 52px minmax(0,1fr) 88px;align-items:center;gap:var(--space-3);padding:15px var(--space-4);border-radius:16px;}
.lbRank{width:32px;height:32px;display:grid;place-items:center;border-radius:10px;font-weight:800;opacity:.9;}
.lbAvatar{width:44px;height:44px;border-radius:999px;display:grid;place-items:center;}
.lbMain{min-width:0;}
.lbName{font-size:14px;font-weight:800;letter-spacing:.03em;line-height:1.15;margin:0;font-family:${FB};color:${LIGHT};}
.lbMeta{margin-top:6px;font-size:12px;line-height:1.2;opacity:.7;font-family:${FB};color:${T.SUB};}
.lbMetric{justify-self:end;text-align:right;font-size:20px;font-weight:900;font-variant-numeric:tabular-nums;letter-spacing:.02em;font-family:${FD};}
.lbRow .decorativeLine,.lbRow .decorativeDot{opacity:.15;z-index:0;}
.lbRow>*{position:relative;z-index:1;}
.bottom-nav .tab.is-active::before,.bottom-nav .tab.active::before{display:none;}
@media(min-width:768px){.pageHeaderBadge{width:56px;height:56px;}.drillsMetrics{grid-template-columns:repeat(2,minmax(0,1fr));}}


@media (hover: hover) and (pointer: fine){.heroModule{transition:transform 150ms ease,box-shadow 150ms ease;}.heroModule:hover{transform:translateY(-2px);box-shadow:0 12px 28px rgba(0,0,0,0.50);}}
/* === Coach Typography Readability Patch (Rec #4) === */
.coach-mode h1,
.coach-mode h2,
.coach-mode h3,
.coach-mode .page-title,
.coach-mode .title,
.coach-mode .heading,
.coach-mode .sectionTitle,
.coach-mode .cardTitle,
.coach-mode .pageTitle{
  letter-spacing:0.04em;
}

.coach-mode .kicker,
.coach-mode .label,
.coach-mode .metaLabel,
.coach-mode .subtitle,
.coach-mode .pageHeaderText p{
  letter-spacing:0.06em;
}

.coach-mode .helper,
.coach-mode .muted,
.coach-mode .description,
.coach-mode .subtext,
.coach-mode .hint,
.coach-mode .meta,
.coach-mode small,
.coach-mode p:not(.page-title){
  color:#B0B6BD;
  opacity:.78;
}

/* ================================
   ShotLab Depth System (Rec #2)
   Add-only patch: tokens + safe selectors
   ================================ */

:root{
  --bg-0:#0B0D10;

  --fs-page:clamp(28px,3.2vw,34px);
  --fs-section:18px;
  --fs-cardTitle:16px;
  --fs-body:14px;
  --fs-meta:12px;
  --lh-tight:1.1;
  --lh-normal:1.35;
  --track-wide:0.08em;
  --track-med:0.04em;

  --surface-1:#0F1115;
  --surface-2:#141821;
  --surface-3:#171D28;

  --stroke-1:rgba(255,255,255,0.08);
  --stroke-2:rgba(255,255,255,0.12);

  --shadow-0:none;
  --shadow-1:0 2px 10px rgba(0,0,0,0.35);
  --shadow-2:0 8px 24px rgba(0,0,0,0.45);

  --radius-card:20px;

  --stack-gap:24px;
}

.pageHeaderText h1,
.page-title,
.pageTitle,
.pageSignatureTitle,
.coach-mode h1{
  font-size:var(--fs-page)!important;
  line-height:var(--lh-tight)!important;
  letter-spacing:var(--track-med)!important;
}

.coach-mode h2,
.sectionTitle,
.section-title,
.panel-title,
.nav-title,
.emptyState__title,
.coach-mode h3{
  font-size:var(--fs-section)!important;
  line-height:var(--lh-normal)!important;
  letter-spacing:0.03em!important;
  color:rgba(229,231,235,.94)!important;
}

.cardTitle,
.card-title,
.lbName,
.eventTitle,
.coach-mode .title,
.coach-mode .heading{
  font-size:var(--fs-cardTitle)!important;
  line-height:var(--lh-normal)!important;
  letter-spacing:0.02em!important;
  text-transform:none;
}

body,
.coach-mode p,
.emptyState__subtitle,
.coach-mode .helper,
.coach-mode .description,
.coach-mode .subtext,
.coach-mode .hint,
.coach-mode .placeholder,
.coach-mode .u-secondary-text{
  font-size:var(--fs-body);
  line-height:var(--lh-normal);
}

.u-meta-label,
.eventMeta,
.lbMeta,
.pageHeaderText p,
.heroStatLbl,
.eventsDatePill,
.coach-mode .kicker,
.coach-mode .label,
.coach-mode .meta,
.coach-mode small{
  font-size:var(--fs-meta)!important;
  letter-spacing:var(--track-wide)!important;
  opacity:.75!important;
  text-transform:uppercase;
}

.heroStatVal,
.lbMetric,
.metric-pop,
[class*="score"],
[class*="Score"],
[class*="streak"],
[class*="Streak"],
[class*="makes"],
[class*="Makes"]{
  font-variant-numeric:tabular-nums;
}

/* Tier 2 default "card-like" surfaces (safe, common class/id patterns) */
.card,
.Card,
.panel,
.Panel,
.tile,
.Tile,
.widget,
.Widget,
.surface,
.Surface,
[class*="card"],
[class*="Card"],
[class*="panel"],
[class*="Panel"],
[class*="tile"],
[class*="Tile"]{
  background: var(--surface-2) !important;
  border: 1px solid var(--stroke-1) !important;
  border-radius: var(--radius-card) !important;
  box-shadow: var(--shadow-1) !important;
}

/* Tier 3: hero / primary blocks (targets common "hero/summary/report/log" patterns) */
.hero,
.Hero,
.summary,
.Summary,
.report,
.Report,
.sessionLog,
.SessionLog,
[class*="Hero"],
[class*="hero"],
[class*="Report"],
[class*="report"],
[class*="Summary"],
[class*="summary"],
[class*="Session"],
[class*="session"],
[class*="Log"],
[class*="log"]{
  background: var(--surface-3) !important;
  border: 1px solid var(--stroke-2) !important;
  box-shadow: var(--shadow-2) !important;
}

/* Tier 1: large background panels if present */
.section,
.Section,
.containerPanel,
.ContainerPanel,
[class*="Section"],
[class*="section"]{
  background: var(--surface-1);
}

/* Remove neon glow from containers (only affects elements that already have glowy shadows) */
.card,
.Card,
.panel,
.Panel,
.tile,
.Tile,
.widget,
.Widget,
[class*="card"],
[class*="Card"],
[class*="panel"],
[class*="Panel"],
[class*="tile"],
[class*="Tile"]{
  filter: none !important;
  text-shadow: none !important;
}

/* Vertical rhythm: increase spacing in common stacks/lists without changing layout */
.stack,
.Stack,
.list,
.List,
.feed,
.Feed,
.grid,
.Grid,
[class*="stack"],
[class*="Stack"],
[class*="list"],
[class*="List"],
[class*="feed"],
[class*="Feed"]{
  gap: var(--stack-gap);
}

/* If stacks are not using gap, add margin between siblings safely */
.stack > * + *,
.Stack > * + *,
.list > * + *,
.List > * + *,
[class*="stack"] > * + *,
[class*="Stack"] > * + *,
[class*="list"] > * + *,
[class*="List"] > * + *{
  margin-top: var(--stack-gap);
}

/* Desktop-only subtle hover lift for Tier 3 (safe, no mobile impact) */
@media (hover:hover) and (pointer:fine){
  .hero:hover,
  .Hero:hover,
  .summary:hover,
  .Summary:hover,
  .report:hover,
  .Report:hover,
  .sessionLog:hover,
  .SessionLog:hover,
  [class*="Hero"]:hover,
  [class*="hero"]:hover,
  [class*="Report"]:hover,
  [class*="report"]:hover,
  [class*="Summary"]:hover,
  [class*="summary"]:hover,
  [class*="Session"]:hover,
  [class*="session"]:hover,
  [class*="Log"]:hover,
  [class*="log"]:hover{
    box-shadow: 0 12px 28px rgba(0,0,0,0.50) !important;
    transform: translateY(-2px);
    transition: transform 150ms ease, box-shadow 150ms ease;
  }
}
`;
const _DESKTOP_SHELL_CSS=`:root{--shell-bg:#070707;--panel-bg:rgba(255,255,255,0.04);--panel-border:rgba(255,255,255,0.08);--text-dim:rgba(255,255,255,0.62);}.app-shell{min-height:100vh;background:var(--shell-bg);}@media (min-width:1024px){.app-shell.is-desktop{display:grid;grid-template-columns:240px minmax(640px,1fr) 320px;gap:var(--stack-gap);padding:var(--stack-gap);align-items:start;}.sidebar-nav{position:sticky;top:18px;height:calc(100vh - 36px);background:var(--surface-1);border:1px solid var(--stroke-1);border-radius:var(--radius-card);box-shadow:var(--shadow-0);padding:var(--mini-card-pad);overflow:auto;}.sidebar-nav .nav-title{font-size:12px;letter-spacing:0.26em;text-transform:uppercase;color:var(--text-dim);margin:6px 10px 14px;}.sidebar-nav .nav-item{display:flex;align-items:center;gap:10px;padding:12px 12px;border-radius:14px;color:rgba(255,255,255,0.70);cursor:pointer;user-select:none;border:1px solid transparent;transition:background 140ms ease,border-color 140ms ease,transform 120ms ease;width:100%;background:transparent;text-align:left;}.sidebar-nav .nav-item:hover{background:rgba(255,255,255,0.05);transform:translateY(-1px);}.sidebar-nav .nav-item.is-active{background:rgba(198,255,0,0.10);border-color:rgba(198,255,0,0.22);color:#C6FF00;}.shell-main{min-width:0;}.content-wrap{background:var(--surface-1);border:1px solid var(--stroke-1);border-radius:var(--radius-card);box-shadow:var(--shadow-0);padding:var(--card-pad);}.insights-panel{position:sticky;top:18px;height:calc(100vh - 36px);background:var(--surface-1);border:1px solid var(--stroke-1);border-radius:var(--radius-card);box-shadow:var(--shadow-0);padding:var(--mini-card-pad);overflow:auto;}.insights-panel .panel-title{font-size:12px;letter-spacing:0.26em;text-transform:uppercase;color:var(--text-dim);margin:6px 10px 14px;}.insights-panel .placeholder{background:rgba(0,0,0,0.35);border:1px dashed rgba(255,255,255,0.14);border-radius:14px;padding:14px;color:rgba(255,255,255,0.55);font-size:13px;line-height:1.35;}}`;
const _EMPTY_STATE_CSS=`.emptyState{display:flex;flex-direction:column;align-items:center}.emptyState__art{width:80px;height:80px;display:flex;align-items:center;justify-content:center}.emptyState__art svg{width:80px;height:80px;display:block}.emptyState__title{margin-top:24px}.emptyState__subtitle{margin-top:8px}.emptyState__accentDash{stroke-dasharray:72;stroke-dashoffset:72;animation:emptyArcDraw 1.2s ease-in-out infinite}.emptyState__ball{transform-box:fill-box;transform-origin:center;animation:emptyBallFloat 1.2s ease-in-out infinite}.emptyState__accentOrbit{transform-box:fill-box;transform-origin:center;animation:emptyOrbitPulse 1.2s ease-in-out infinite}.emptyState__accentPulse{animation:emptyAccentPulse 1.2s ease-in-out infinite}@keyframes emptyBallFloat{0%,100%{transform:translateY(1px)}50%{transform:translateY(-2px)}}@keyframes emptyArcDraw{0%{stroke-dashoffset:72}50%{stroke-dashoffset:0}100%{stroke-dashoffset:-72}}@keyframes emptyOrbitPulse{0%,100%{opacity:.7;transform:scale(1)}50%{opacity:1;transform:scale(1.1)}}@keyframes emptyAccentPulse{0%,100%{opacity:.8}50%{opacity:1}}@media (prefers-reduced-motion: reduce){.emptyState__art *{animation:none!important;transition:none!important}}`;
const _LIST_ROW_SYSTEM_CSS=`/* ---------- List Row System ---------- */
:root{--row-py:14px;--row-px:16px;--row-gap:12px;--row-radius:18px;--row-border:rgba(255,255,255,0.08);--row-bg:rgba(255,255,255,0.03);--row-bg-hover:rgba(255,255,255,0.05);--text-title:rgba(255,255,255,0.92);--text-meta:rgba(255,255,255,0.70);--text-muted:rgba(255,255,255,0.55);--stat-strong:rgba(190,255,0,0.95);--status-won:rgba(190,255,0,0.90);--status-wait:rgba(255,255,255,0.55);}
.listRow{display:flex;align-items:center;justify-content:space-between;padding:var(--row-py) var(--row-px);border:1px solid var(--row-border);background:var(--row-bg);border-radius:var(--row-radius);gap:var(--row-gap);}
.listRow+.listRow{margin-top:12px;}
.listRowLeft{display:flex;align-items:center;gap:12px;min-width:0;flex:1 1 auto;}
.listRowText{min-width:0;display:flex;flex-direction:column;gap:4px;}
.listRowTitle{color:var(--text-title);font-size:16px;font-weight:700;line-height:1.15;letter-spacing:0.02em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.listRowMeta{color:var(--text-meta);font-size:12px;line-height:1.2;letter-spacing:0.06em;text-transform:none;}
.listRowRight{display:flex;align-items:center;justify-content:flex-end;gap:10px;flex:0 0 auto;text-align:right;}
.listRowStat{color:var(--stat-strong);font-size:22px;font-weight:800;line-height:1;font-variant-numeric:tabular-nums;}
.listRowStatSub{color:var(--text-muted);font-size:11px;line-height:1.1;letter-spacing:0.10em;text-transform:uppercase;}
.listRowStatus{font-size:12px;line-height:1.2;letter-spacing:0.06em;font-weight:700;}
.listRowStatus--won{color:var(--status-won);}
.listRowStatus--wait{color:var(--status-wait);}
@media (hover:hover){.listRow:hover{background:var(--row-bg-hover);}}
.listRow .btn-primary,.listRow .primaryButton,.listRow button.primary{height:44px;min-height:44px;box-shadow:none;}
.listRow a,.listRow button{min-height:44px;}
/* ---------- End List Row System ---------- */`;

const _BUTTON_SYSTEM_CSS=`:root{--btn-h-lg:48px;--btn-h-md:44px;--btn-h-sm:40px;--btn-radius:999px;--focus-ring:0 0 0 3px color-mix(in oklab, var(--accent) 35%, transparent);}
.btn{height:var(--btn-h-lg);min-height:44px;border-radius:var(--btn-radius);padding:0 18px;font-family:${FB};font-size:13px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;display:inline-flex;align-items:center;justify-content:center;gap:10px;border:1px solid transparent;cursor:pointer;transition:filter 150ms ease,transform 120ms ease,background-color 150ms ease,border-color 150ms ease,color 150ms ease;}
.btn:focus-visible{outline:none;box-shadow:var(--focus-ring);}
.btn--lg{height:var(--btn-h-lg);}
.btn--md{height:var(--btn-h-md);}
.btn--sm{height:var(--btn-h-sm);}
.btn--primary,.btn-primary,.cta-primary,.cta-primary-accent,.cta-brand,.cta-danger{background:var(--accent)!important;color:#081006!important;border-color:transparent!important;box-shadow:none!important;}
.btn--primary:hover,.btn-primary:hover,.cta-primary:hover,.cta-primary-accent:hover,.cta-brand:hover,.cta-danger:hover{filter:brightness(1.03);}
.btn--primary:active,.btn-primary:active,.cta-primary:active,.cta-primary-accent:active,.cta-brand:active,.cta-danger:active{transform:translateY(1px);}
.btn--secondary,.btn-secondary,.cta-secondary{background:var(--surface-2)!important;color:var(--text-1)!important;border-color:var(--stroke-1)!important;box-shadow:none!important;}
.btn--secondary:hover,.btn-secondary:hover,.cta-secondary:hover{border-color:var(--stroke-2)!important;}
.btn--secondary:active,.btn-secondary:active,.cta-secondary:active{transform:translateY(1px);}
.btn--tertiary,.btn-link,.cta-secondary-link{background:transparent!important;color:var(--accent)!important;border-color:transparent!important;padding:0!important;height:auto!important;min-height:44px;text-decoration:none;}
.btn--tertiary:hover,.btn-link:hover,.cta-secondary-link:hover{text-decoration:underline;}
.btn--tertiary:focus-visible,.btn-link:focus-visible,.cta-secondary-link:focus-visible{text-decoration:underline;}
.btn-v{position:relative;overflow:hidden;}
.btn-v::after{content:'';position:absolute;inset:0;background:rgba(255,255,255,.12);opacity:0;pointer-events:none}
.btn-v:active::after{animation:flashPress .2s ease-out forwards}
.iconBtn,.icon-btn-square,.drill-row-arrow{width:44px;height:44px;border-radius:14px;background:var(--surface-2);border:1px solid var(--stroke-1);display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:border-color 150ms ease,transform 120ms ease,background-color 150ms ease;}
.iconBtn:hover,.icon-btn-square:hover,.drill-row-arrow:hover{border-color:var(--stroke-2);}
.iconBtn:focus-visible,.icon-btn-square:focus-visible,.drill-row-arrow:focus-visible{outline:none;box-shadow:var(--focus-ring);}
.iconBtn:active,.icon-btn-square:active,.drill-row-arrow:active{transform:translateY(1px);}
.chipBtn,.eventCta{height:var(--btn-h-sm)!important;min-height:40px!important;border-radius:999px!important;padding:0 14px!important;background:var(--surface-2)!important;border:1px solid var(--stroke-1)!important;color:var(--text-1)!important;font-weight:700;letter-spacing:.04em;box-shadow:none!important;width:auto!important;}
.chipBtn:hover,.eventCta:hover{border-color:var(--stroke-2)!important;}
.chipBtn:focus-visible,.eventCta:focus-visible{outline:none;box-shadow:var(--focus-ring);}
@media (prefers-reduced-motion:reduce){.btn,.iconBtn,.icon-btn-square,.drill-row-arrow{transition:none!important;}}`;

const Styles=()=><><style>{_STYLES_CSS}</style><style>{_BUTTON_SYSTEM_CSS}</style><style>{_PAGE_SIGNATURE_CSS}</style><style>{_DESKTOP_SHELL_CSS}</style><style>{_EMPTY_STATE_CSS}</style><style>{_LIST_ROW_SYSTEM_CSS}</style></>;

// ═══════════════════════════════════════
// APP ROOT
// ═══════════════════════════════════════
// Error Boundary using try-catch pattern (functional)
function ErrorFallback(){return <div style={{minHeight:"100dvh",background:BG,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16,padding:40}}>
<SLLogo size={64} glow/>

  <div style={{fontFamily:FD,color:LIGHT,fontSize:24,letterSpacing:3}}>SOMETHING WENT WRONG</div>
  <p style={{fontFamily:FB,color:MUTED,fontSize:13,textAlign:"center",lineHeight:1.6,maxWidth:300}}>The app hit an unexpected error. Try refreshing the page.</p>
  <button onClick={()=>window.location.reload()} style={{padding:"12px 32px",background:VOLT,color:"#000000",fontFamily:FD,fontSize:16,letterSpacing:3,border:"none",borderRadius:10,cursor:"pointer"}}>RELOAD</button>
</div>}

export default function App(){
const[appErr,setAppErr]=useState(false);
if(appErr)return <><Styles/><ErrorFallback/></>;
try{return <AppInner/>}catch(e){return <><Styles/><ErrorFallback/></>}
}

function AppInner(){
const[view,setView]=useState("auth"),[user,setUser]=useState(null),[drills,setDrills]=useState(DRILLS_INIT),[programDrills,setProgramDrills]=useState([]),[scores,setScores]=useState([]),[players,setPlayers]=useState([]),[playerProfiles,setPlayerProfiles]=useState([]),[events,setEvents]=useState(EVENTS_INIT),[rsvps,setRsvps]=useState([]),[shotLogs,setShotLogs]=useState([]),[challenges,setChallenges]=useState([]),[theme,setTheme]=useState("dark"),[scSessions,setScSessions]=useState(SC_INIT),[scRsvps,setScRsvps]=useState([]),[scLogs,setScLogs]=useState([]),[teams,setTeams]=useState([]),[ready,setReady]=useState(false);
const T=THEMES[theme];
const normalizeJoin=v=>String(v||"").trim().toUpperCase();
const requireCoach=(actor,teamId)=>actor?.role==="coach"&&actor.teamId&&actor.teamId===teamId;
const requirePlayer=(actor,teamId,email)=>actor?.role==="player"&&actor.teamId&&actor.teamId===teamId&&actor.email===email;
const trackEvent=useCallback((type,meta={},actor=user)=>{
trackBackendEvent(type,{
teamId:meta.teamId??actor?.teamId??null,
userEmail:actor?.email||meta.userEmail||null,
userRole:actor?.role||meta.userRole||null,
view,
meta,
});
},[user,view]);

const migrateData=useCallback(({players:rawPlayers,playerProfiles:rawPlayerProfiles,scores:rawScores,events:rawEvents,rsvps:rawRsvps,shotLogs:rawShotLogs,challenges:rawChallenges,scSessions:rawScSessions,scRsvps:rawScRsvps,scLogs:rawScLogs,teams:rawTeams})=>{
const ps=(rawPlayers||[]).map(p=>({...p,role:p.role||"player"}));
const existingTeams=rawTeams||[];
const coaches=ps.filter(p=>p.role==="coach");
const hasTeams=existingTeams.length>0;
const map={};
let ts=[...existingTeams];
const used=ts.map(t=>t.joinCode);
if(!hasTeams){
if(coaches.length===0){
const tid=genId("team");
ts=[{id:tid,name:"ShotLab Team",ownerCoachId:null,joinCode:generateJoinCode(used),joinCodeUpdatedAt:Date.now(),createdAt:Date.now()}];
ps.forEach(p=>{map[p.email]=tid});
}else{
coaches.forEach((c,i)=>{const tid=genId("team");const code=generateJoinCode([...used,...ts.map(t=>t.joinCode)]);ts.push({id:tid,name:c.name?`${c.name.split(" ")[0]}'s Team`:`Team ${i+1}`,ownerCoachId:c.email,joinCode:code,joinCodeUpdatedAt:Date.now(),createdAt:Date.now()});map[c.email]=tid;});
ps.forEach(p=>{if(p.role!=="coach"){const firstCoach=coaches[0];if(firstCoach)map[p.email]=map[firstCoach.email];}});
}
}else{
ts.forEach(t=>{if(t.ownerCoachId)map[t.ownerCoachId]=t.id;});
}
const playersMigrated=ps.map(p=>({...p,teamId:p.teamId||map[p.email]||ts[0]?.id||null}));
const profilesExisting=rawPlayerProfiles||[];
const profilesMigrated=(profilesExisting.length?profilesExisting:playersMigrated.filter(p=>p.role!=="coach").map(p=>({id:genId("pp"),userId:p.email,teamId:p.teamId,firstName:(p.name||"").split(" ")[0]||"Player",lastName:(p.name||"").split(" ").slice(1).join(" "),createdAt:Date.now()}))).map(pp=>({...pp,teamId:pp.teamId||playersMigrated.find(p=>p.email===pp.userId)?.teamId||ts[0]?.id||null}));
const teamForEmail=e=>playersMigrated.find(p=>p.email===e)?.teamId||ts[0]?.id||null;
const scoresM=(rawScores||[]).map(s=>({...s,playerId:s.playerId||s.email,teamId:s.teamId||teamForEmail(s.email)}));
const eventsM=(rawEvents||[]).map(e=>({...e,teamId:e.teamId||teamForEmail(e.ownerCoachId)}));
const rsvpsM=(rawRsvps||[]).map(r=>({...r,playerId:r.playerId||r.email,teamId:r.teamId||teamForEmail(r.email)}));
const shotM=(rawShotLogs||[]).map(l=>({...l,playerId:l.playerId||l.email,teamId:l.teamId||teamForEmail(l.email)}));
const chM=(rawChallenges||[]).map(c=>({...c,teamId:c.teamId||teamForEmail(c.from),playerId:c.playerId||c.from}));
const scSM=(rawScSessions||[]).map(s=>({...s,teamId:s.teamId||teamForEmail(s.ownerCoachId)}));
const scRM=(rawScRsvps||[]).map(r=>({...r,playerId:r.playerId||r.email,teamId:r.teamId||teamForEmail(r.email)}));
const scLM=(rawScLogs||[]).map(l=>({...l,playerId:l.playerId||l.email,teamId:l.teamId||teamForEmail(l.email)}));
return {playersMigrated,profilesMigrated,teamsMigrated:ts,scoresM,eventsM,rsvpsM,shotM,chM,scSM,scRM,scLM};
},[]);

// Load persisted data + restore session
useEffect(()=>{(async()=>{const[d,pd,s,p,pp,ev,rv,sl,ch,scs,scr,scl,tm,sess]=await Promise.all([DB.get("sl:drills"),DB.get("sl:program-drills"),DB.get("sl:scores"),DB.get("sl:players"),DB.get("sl:player-profiles"),DB.get("sl:events"),DB.get("sl:rsvps"),DB.get("sl:shotlogs"),DB.get("sl:challenges"),DB.get("sl:sc-sessions"),DB.get("sl:sc-rsvps"),DB.get("sl:sc-logs"),DB.get("sl:teams"),DB.get("sl:session")]);if(d)setDrills(d);if(pd)setProgramDrills(pd);
const m=migrateData({players:p,playerProfiles:pp,scores:s,events:ev,rsvps:rv,shotLogs:sl,challenges:ch,scSessions:scs,scRsvps:scr,scLogs:scl,teams:tm});
setPlayers(m.playersMigrated);setPlayerProfiles(m.profilesMigrated);setTeams(m.teamsMigrated);setScores(m.scoresM);setEvents(m.eventsM);setRsvps(m.rsvpsM);setShotLogs(m.shotM);setChallenges(m.chM);setScSessions(m.scSM);setScRsvps(m.scRM);setScLogs(m.scLM);
await Promise.all([DB.set("sl:players",m.playersMigrated),DB.set("sl:player-profiles",m.profilesMigrated),DB.set("sl:teams",m.teamsMigrated),DB.set("sl:scores",m.scoresM),DB.set("sl:events",m.eventsM),DB.set("sl:rsvps",m.rsvpsM),DB.set("sl:shotlogs",m.shotM),DB.set("sl:challenges",m.chM),DB.set("sl:sc-sessions",m.scSM),DB.set("sl:sc-rsvps",m.scRM),DB.set("sl:sc-logs",m.scLM)]);
if(sess&&sess.email){const found=m.playersMigrated.find(pl=>pl.email===sess.email);if(found){setUser({email:found.email,role:found.role||"player",isCoach:(found.role||"player")==="coach",name:found.name,teamId:found.teamId});if(found.role==="coach"&&!found.teamId)setView("create-team");else if(found.role==="player"&&!found.teamId)setView("join-team");else setView(found.role||"player")}}
setReady(true)})()},[migrateData]);

const P=useCallback(async(k,v,set)=>{set(v);await DB.set(k,v)},[]);
// Auth with hashed passwords
const register=async(email,password,name,role)=>{
const existing=players.find(p=>p.email===email);
if(existing)return{ok:false,err:"Account already exists. Please sign in."};
const hashed=hashPw(password);
const np=[...players,{email,name,password:hashed,role,teamId:null}];
await P("sl:players",np,setPlayers);
setUser({email,role,isCoach:role==="coach",name,teamId:null});setView(role==="coach"?"create-team":"join-team");
DB.set("sl:session",{email});
trackEvent("auth_register",{targetRole:role,userEmail:email,userRole:role},{email,role,teamId:null});
return{ok:true};
};
const login=(email,password)=>{
const p=players.find(p=>p.email===email);
if(!p)return{ok:false,err:"No account found. Please register first."};
const hashed=hashPw(password);
if(p.password&&p.password!==hashed){
if(p.password!==password)return{ok:false,err:"Incorrect password."};
P("sl:players",players.map(pl=>pl.email===email?{...pl,password:hashed}:pl),setPlayers);
}
if(!p.password){P("sl:players",players.map(pl=>pl.email===email?{...pl,password:hashed}:pl),setPlayers)}
setUser({email,role:p.role||"player",isCoach:(p.role||"player")==="coach",name:p.name,teamId:p.teamId||null});
if((p.role||"player")==="coach"&&!p.teamId)setView("create-team");
else if((p.role||"player")==="player"&&!p.teamId)setView("join-team");
else setView(p.role||"player");
DB.set("sl:session",{email});
trackEvent("auth_login",{method:"password"},{email,role:p.role||"player",teamId:p.teamId||null});
return{ok:true};
};
const demoSignIn=async(kind="player")=>{
const acct=kind==="coach"?DEMO_COACH:DEMO_PLAYER;
let np=[...players];
let nts=[...teams];
const savePlayers=async()=>{await P("sl:players",np,setPlayers)};
const saveTeams=async()=>{await P("sl:teams",nts,setTeams)};

if(!np.find(p=>p.email===DEMO_COACH.email)){
np=[...np,{email:DEMO_COACH.email,name:DEMO_COACH.name,password:hashPw(DEMO_COACH.password),role:"coach",teamId:null}];
}
if(!np.find(p=>p.email===DEMO_PLAYER.email)){
np=[...np,{email:DEMO_PLAYER.email,name:DEMO_PLAYER.name,password:hashPw(DEMO_PLAYER.password),role:"player",teamId:null}];
}
await savePlayers();

let demoTeam=nts.find(t=>t.ownerCoachId===DEMO_COACH.email);
if(!demoTeam){
demoTeam={id:genId("team"),name:"Demo Team",ownerCoachId:DEMO_COACH.email,joinCode:generateJoinCode(nts.map(t=>t.joinCode)),joinCodeUpdatedAt:Date.now(),createdAt:Date.now()};
nts=[...nts,demoTeam];
await saveTeams();
}

let changedPlayers=false;
np=np.map(p=>{
if(p.email===DEMO_COACH.email&&p.teamId!==demoTeam.id){changedPlayers=true;return {...p,teamId:demoTeam.id};}
if(p.email===DEMO_PLAYER.email&&p.teamId!==demoTeam.id){changedPlayers=true;return {...p,teamId:demoTeam.id};}
return p;
});
if(changedPlayers)await savePlayers();

const demoProfiles=[{userId:DEMO_PLAYER.email,firstName:"Demo",lastName:"Player"},...DEMO_SEED_PLAYERS.map(sp=>({userId:sp.email,firstName:sp.name.split(" ")[0],lastName:sp.name.split(" ")[1]||""}))];
const missingProfiles=demoProfiles.filter(dp=>!playerProfiles.some(pp=>pp.userId===dp.userId&&pp.teamId===demoTeam.id)).map(dp=>({id:genId("pp"),userId:dp.userId,teamId:demoTeam.id,firstName:dp.firstName,lastName:dp.lastName,createdAt:Date.now()}));
if(missingProfiles.length){
await P("sl:player-profiles",[...playerProfiles,...missingProfiles],setPlayerProfiles);
}

const demoSeed=buildDemoSeed(demoTeam.id);
const seededPlayers=[DEMO_PLAYER,...DEMO_SEED_PLAYERS].map(p=>({email:p.email,name:p.name,password:hashPw("demo1234"),role:"player",teamId:demoTeam.id}));
np=[...np.filter(p=>!seededPlayers.some(sp=>sp.email===p.email)),...seededPlayers,{email:DEMO_COACH.email,name:DEMO_COACH.name,password:hashPw(DEMO_COACH.password),role:"coach",teamId:demoTeam.id}];
await P("sl:players",np,setPlayers);

const existingDemoScores=scores.filter(s=>s.teamId===demoTeam.id&&[DEMO_PLAYER.email,...DEMO_SEED_PLAYERS.map(p=>p.email)].includes(s.email));
const preservedScores=scores.filter(s=>!existingDemoScores.includes(s));
const seededScores=[...preservedScores,...demoSeed.playerRows.filter(r=>r.score!==undefined),...demoSeed.scoreRows.map(r=>({...r,src:"home"}))];
await P("sl:scores",seededScores,setScores);

const existingDemoShotLogs=shotLogs.filter(s=>s.teamId===demoTeam.id&&[DEMO_PLAYER.email,...DEMO_SEED_PLAYERS.map(p=>p.email)].includes(s.email));
const preservedShotLogs=shotLogs.filter(s=>!existingDemoShotLogs.includes(s));
const seededShotLogs=[...preservedShotLogs,...demoSeed.playerRows.filter(r=>r.made!==undefined),...demoSeed.shotRows];
await P("sl:shotlogs",seededShotLogs,setShotLogs);

const preservedEvents=events.filter(e=>e.teamId!==demoTeam.id||!String(e.id).startsWith("900"));
await P("sl:events",[...preservedEvents,...demoSeed.eventRows],setEvents);

const preservedRsvps=rsvps.filter(r=>!demoSeed.eventRows.some(e=>e.id===r.eventId));
await P("sl:rsvps",[...preservedRsvps,...demoSeed.rsvpRows],setRsvps);

const preservedScSessions=scSessions.filter(s=>s.teamId!==demoTeam.id||!String(s.id).startsWith("810"));
await P("sl:sc-sessions",[...preservedScSessions,...demoSeed.scRows],setScSessions);

const preservedScRsvps=scRsvps.filter(r=>!demoSeed.scRows.some(s=>s.id===r.sessionId));
await P("sl:sc-rsvps",[...preservedScRsvps,...demoSeed.scRsvpRows],setScRsvps);

const preservedChallenges=challenges.filter(c=>!String(c.id).startsWith("700")&&c.teamId!==demoTeam.id);
await P("sl:challenges",[...preservedChallenges,...demoSeed.challengeRows],setChallenges);

const signedIn=np.find(p=>p.email===acct.email);
if(!signedIn)return{ok:false,err:"Unable to prepare demo account."};
setUser({email:signedIn.email,role:signedIn.role||"player",isCoach:(signedIn.role||"player")==="coach",name:signedIn.name,teamId:demoTeam.id});
setView(kind==="coach"?"coach":"player");
await DB.set("sl:session",{email:signedIn.email});
await trackEvent("auth_demo_login",{kind},{email:signedIn.email,role:signedIn.role||"player",teamId:demoTeam.id});
return{ok:true};
};
const logout=()=>{trackEvent("auth_logout");setUser(null);setView("auth");DB.set("sl:session",null)};
const deleteAccount=async()=>{
if(!user)return;
const e=user.email;
await P("sl:players",players.filter(p=>p.email!==e),setPlayers);
await P("sl:scores",scores.filter(s=>s.playerId!==e),setScores);
await P("sl:rsvps",rsvps.filter(r=>r.playerId!==e),setRsvps);
await P("sl:shotlogs",shotLogs.filter(s=>s.playerId!==e),setShotLogs);
await P("sl:challenges",challenges.filter(c=>c.from!==e&&c.to!==e),setChallenges);
await P("sl:sc-rsvps",scRsvps.filter(r=>r.playerId!==e),setScRsvps);
await P("sl:sc-logs",scLogs.filter(l=>l.playerId!==e),setScLogs);
DB.set("sl:session",null);setUser(null);setView("auth");
};
const createTeam=async(name,meta={})=>{
if(!user||user.role!=="coach")return{ok:false,err:"Not authorized"};
if(teams.some(t=>t.ownerCoachId===user.email))return{ok:false,err:"Team already exists"};
const code=generateJoinCode(teams.map(t=>t.joinCode));
const nt={id:genId("team"),name:san(name)||"Team",school:san(meta.school||""),level:san(meta.level||""),ownerCoachId:user.email,joinCode:code,joinCodeUpdatedAt:Date.now(),createdAt:Date.now()};
await P("sl:teams",[...teams,nt],setTeams);
const np=players.map(p=>p.email===user.email?{...p,teamId:nt.id}:p);
await P("sl:players",np,setPlayers);
setUser({...user,teamId:nt.id});setView("coach");
return{ok:true,team:nt};
};
const joinTeam=async(code)=>{
if(!user||user.role!=="player")return{ok:false,err:"Not authorized"};
const c=normalizeJoin(code);const t=teams.find(tm=>tm.joinCode===c);
if(!t)return{ok:false,err:"Invalid team code."};
if(user.teamId===t.id){setView("player");return{ok:true,alreadyJoined:true};}
const np=players.map(p=>p.email===user.email?{...p,teamId:t.id}:p);
await P("sl:players",np,setPlayers);
const hasProfile=playerProfiles.some(pp=>pp.userId===user.email&&pp.teamId===t.id);
if(!hasProfile){
const parts=(user.name||"Player").trim().split(/\s+/);
await P("sl:player-profiles",[...playerProfiles,{id:genId("pp"),userId:user.email,teamId:t.id,firstName:parts[0]||"Player",lastName:parts.slice(1).join(" "),createdAt:Date.now()}],setPlayerProfiles);
}
setUser({...user,teamId:t.id});setView("player");
return{ok:true};
};
const addRosterPlayer=async(data)=>{
if(!user||user.role!=="coach"||!user.teamId)return{ok:false,err:"Not authorized"};
if(!requireCoach(user,user.teamId))return{ok:false,err:"Not authorized"};
const firstName=san(data.firstName||"");
const lastName=san(data.lastName||"");
if(!firstName)return{ok:false,err:"First name is required"};
const profile={id:genId("pp"),userId:null,teamId:user.teamId,firstName,lastName,jerseyNumber:san(data.jerseyNumber||""),createdAt:Date.now()};
await P("sl:player-profiles",[...playerProfiles,profile],setPlayerProfiles);
return{ok:true};
};
const regenerateJoinCode=async(teamId)=>{
if(!requireCoach(user,teamId))return{ok:false,err:"Not authorized"};
const t=teams.find(tm=>tm.id===teamId&&tm.ownerCoachId===user.email);
if(!t)return{ok:false,err:"Team not found"};
const code=generateJoinCode(teams.filter(x=>x.id!==teamId).map(x=>x.joinCode));
await P("sl:teams",teams.map(tm=>tm.id===teamId?{...tm,joinCode:code,joinCodeUpdatedAt:Date.now()}:tm),setTeams);
return{ok:true,joinCode:code};
};
const addScore=async(drillId,score,src="home")=>{if(!requirePlayer(user,user?.teamId,user?.email))return;await P("sl:scores",[...scores,{email:user.email,playerId:user.email,teamId:user.teamId,name:user.name,drillId,score,date:todayStr(),ts:Date.now(),src}],setScores);trackEvent("score_logged",{drillId,score,src})};
const updateDrill=async(id,up)=>{if(user?.role!=="coach")return;await P("sl:drills",drills.map(d=>d.id===id?{...d,...up}:d),setDrills)};
const addDrill=async(drill)=>{if(user?.role!=="coach")return;await P("sl:drills",[...drills,{...drill,id:Date.now()}],setDrills)};
const removeDrill=async(id)=>{if(user?.role!=="coach")return;await P("sl:drills",drills.filter(d=>d.id!==id),setDrills)};
const addProgramDrill=async(drill)=>{if(user?.role!=="coach")return{ok:false,err:"Not authorized"};if(programDrills.length>=7)return{ok:false,err:"Program drill limit reached (7)."};await P("sl:program-drills",[...programDrills,{...drill,id:Date.now()}],setProgramDrills);return{ok:true}};
const removeProgramDrill=async(id)=>{if(user?.role!=="coach")return;await P("sl:program-drills",programDrills.filter(d=>d.id!==id),setProgramDrills)};
const toggleRsvp=async(eid)=>{if(!requirePlayer(user,user?.teamId,user?.email))return;const ex=rsvps.find(r=>r.eventId===eid&&r.playerId===user.email&&r.teamId===user.teamId);if(ex){await P("sl:rsvps",rsvps.filter(r=>!(r.eventId===eid&&r.playerId===user.email&&r.teamId===user.teamId)),setRsvps);trackEvent("event_rsvp_removed",{eventId:eid});}else{await P("sl:rsvps",[...rsvps,{eventId:eid,email:user.email,playerId:user.email,teamId:user.teamId,name:user.name,ts:Date.now()}],setRsvps);trackEvent("event_rsvp_added",{eventId:eid});}};
const addEvent=async ev=>{if(user?.role!=="coach"||!user.teamId)return;await P("sl:events",[...events,{...ev,id:Date.now(),teamId:user.teamId,ownerCoachId:user.email}],setEvents);trackEvent("event_created",{eventType:ev.type||"run"})};
const removeEvent=async id=>{if(user?.role!=="coach"||!user.teamId)return;await P("sl:events",events.filter(e=>!(e.id===id&&e.teamId===user.teamId)),setEvents);await P("sl:rsvps",rsvps.filter(r=>!(r.eventId===id&&r.teamId===user.teamId)),setRsvps)};
const removeRsvp=async(eid,email)=>{if(user?.role!=="coach"||!user.teamId)return;await P("sl:rsvps",rsvps.filter(r=>!(r.eventId===eid&&r.playerId===email&&r.teamId===user.teamId)),setRsvps)};
const addRsvp=async(eid,email,name)=>{if(user?.role!=="coach"||!user.teamId)return;if(rsvps.find(r=>r.eventId===eid&&r.playerId===email&&r.teamId===user.teamId))return;await P("sl:rsvps",[...rsvps,{eventId:eid,email,playerId:email,teamId:user.teamId,name,ts:Date.now()}],setRsvps)};
const addShotLog=async(made,date)=>{if(!requirePlayer(user,user?.teamId,user?.email))return;await P("sl:shotlogs",[...shotLogs,{email:user.email,playerId:user.email,teamId:user.teamId,name:user.name,made,date,ts:Date.now()}],setShotLogs);trackEvent("shot_log_added",{made,date})};
const addChallenge=async(ch)=>{if(!requirePlayer(user,user?.teamId,user?.email))return;await P("sl:challenges",[...challenges,{...ch,id:Date.now(),teamId:user.teamId,playerId:user.email,from:user.email,fromName:user.name,status:"pending",ts:Date.now()}],setChallenges);trackEvent("challenge_created",{to:ch.to||null})};
const respondChallenge=async(id,score)=>{if(!requirePlayer(user,user?.teamId,user?.email))return;await P("sl:challenges",challenges.map(c=>c.id===id&&c.teamId===user.teamId&&c.to===user.email?{...c,respScore:score,respTs:Date.now(),status:score>c.score?"won":score===c.score?"tied":"lost"}:c),setChallenges)};
const addScSession=async(s)=>{if(user?.role!=="coach"||!user.teamId)return;await P("sl:sc-sessions",[...scSessions,{...s,id:Date.now(),teamId:user.teamId,ownerCoachId:user.email}],setScSessions);trackEvent("sc_session_created",{sport:s.sport||""})};
const removeScSession=async(id)=>{if(user?.role!=="coach"||!user.teamId)return;await P("sl:sc-sessions",scSessions.filter(s=>!(s.id===id&&s.teamId===user.teamId)),setScSessions);await P("sl:sc-rsvps",scRsvps.filter(r=>!(r.sessionId===id&&r.teamId===user.teamId)),setScRsvps)};
const toggleScRsvp=async(sid)=>{if(!requirePlayer(user,user?.teamId,user?.email))return;const ex=scRsvps.find(r=>r.sessionId===sid&&r.playerId===user.email&&r.teamId===user.teamId);if(ex){await P("sl:sc-rsvps",scRsvps.filter(r=>!(r.sessionId===sid&&r.playerId===user.email&&r.teamId===user.teamId)),setScRsvps);trackEvent("sc_rsvp_removed",{sessionId:sid});}else{await P("sl:sc-rsvps",[...scRsvps,{sessionId:sid,email:user.email,playerId:user.email,teamId:user.teamId,name:user.name,ts:Date.now()}],setScRsvps);trackEvent("sc_rsvp_added",{sessionId:sid});}};
const addScLog=async(log)=>{if(!requirePlayer(user,user?.teamId,user?.email))return;await P("sl:sc-logs",[{...log,id:Date.now(),email:user.email,playerId:user.email,teamId:user.teamId,name:user.name},...scLogs],setScLogs)};


const scopedPlayers=players.filter(p=>p.teamId===user?.teamId);
const scopedScores=scores.filter(s=>s.teamId===user?.teamId);
const scopedEvents=events.filter(e=>e.teamId===user?.teamId);
const scopedRsvps=rsvps.filter(r=>r.teamId===user?.teamId);
const scopedShotLogs=shotLogs.filter(l=>l.teamId===user?.teamId);
const scopedChallenges=challenges.filter(c=>c.teamId===user?.teamId);
const scopedScSessions=scSessions.filter(s=>s.teamId===user?.teamId);
const scopedScRsvps=scRsvps.filter(r=>r.teamId===user?.teamId);
const scopedScLogs=scLogs.filter(l=>l.teamId===user?.teamId);
const myTeam=teams.find(t=>t.id===user?.teamId)||null;

useEffect(()=>{initAnalytics();trackBackendEvent("app_loaded",{path:window.location.pathname});},[]);
useEffect(()=>{if(ready&&user&&["coach","player"].includes(view))trackEvent("screen_view",{screen:view,role:user.role||"player"});},[ready,user,view,trackEvent]);
useEffect(()=>{const onErr=(e)=>trackEvent("app_error",{kind:"error",message:e?.message||"unknown"});const onRej=(e)=>trackEvent("app_error",{kind:"unhandledrejection",message:e?.reason?.message||String(e?.reason||"unknown")});window.addEventListener("error",onErr);window.addEventListener("unhandledrejection",onRej);return()=>{window.removeEventListener("error",onErr);window.removeEventListener("unhandledrejection",onRej);};},[trackEvent]);

if(!ready)return <><Styles/><div style={{minHeight:"100dvh",background:BG,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:24,position:"relative",overflow:"hidden"}}><CourtBG opacity={.015}/><div style={{position:"relative",zIndex:1,textAlign:"center"}}><SLLogo size={72} glow/><div style={{fontFamily:FD,fontSize:14,color:VOLT,letterSpacing:6,marginTop:16,animation:"pulse 1.5s infinite"}}>LOADING</div></div></div></>;

return <><Styles/>
{view==="auth"&&<div className="screen-fade-in"><Auth onLogin={login} onRegister={register} onDemo={demoSignIn}/></div>}{view==="create-team"&&<div className="screen-fade-in"><CreateTeam onCreate={createTeam} u={user}/></div>} 
{view==="join-team"&&<div className="screen-fade-in"><JoinTeam onJoin={joinTeam} u={user}/></div>}
{view==="player"&&<div className="screen-fade-in"><Player u={user} drills={drills} programDrills={programDrills} scores={scopedScores} addScore={addScore} events={scopedEvents} rsvps={scopedRsvps} toggleRsvp={toggleRsvp} shotLogs={scopedShotLogs} addShotLog={addShotLog} challenges={scopedChallenges} addChallenge={addChallenge} respondChallenge={respondChallenge} players={scopedPlayers} T={T} theme={theme} setTheme={setTheme} scSessions={scopedScSessions} scRsvps={scopedScRsvps} toggleScRsvp={toggleScRsvp} scLogs={scopedScLogs} addScLog={addScLog} logout={logout} deleteAccount={deleteAccount}/></div>}
{view==="coach"&&<div className="screen-fade-in"><Coach u={user} team={myTeam} regenerateJoinCode={regenerateJoinCode} addRosterPlayer={addRosterPlayer} playerProfiles={playerProfiles.filter(pp=>pp.teamId===user?.teamId)} drills={drills} programDrills={programDrills} scores={scopedScores} players={scopedPlayers} updateDrill={updateDrill} addDrill={addDrill} removeDrill={removeDrill} addProgramDrill={addProgramDrill} removeProgramDrill={removeProgramDrill} events={scopedEvents} rsvps={scopedRsvps} addEvent={addEvent} removeEvent={removeEvent} removeRsvp={removeRsvp} addRsvp={addRsvp} scSessions={scopedScSessions} scRsvps={scopedScRsvps} scLogs={scopedScLogs} addScSession={addScSession} removeScSession={removeScSession} shotLogs={scopedShotLogs} logout={logout} deleteAccount={deleteAccount}/></div>}
</>;
}

// ═══════════════════════════════════════
// AUTH
// ═══════════════════════════════════════
function Auth({onLogin,onRegister,onDemo}){
const[mode,setMode]=useState("login"),[role,setRole]=useState("player"),[email,setEmail]=useState(""),[password,setPassword]=useState(""),[name,setName]=useState(""),[err,setErr]=useState("");
const doLogin=()=>{
const e=email.trim().toLowerCase();if(!e){setErr("Enter your email");return}
if(!password){setErr("Enter your password");return}
const id=e.includes("@")?e:e+"@shotlab.app";
const r=onLogin(id,password);
if(!r.ok)setErr(r.err);
};
const doRegister=async()=>{
const e=email.trim().toLowerCase();if(!e){setErr("Enter your email");return}
if(!name.trim()){setErr("Enter your name");return}
if(!password||password.length<4){setErr("Password must be at least 4 characters");return}
const id=e.includes("@")?e:e+"@shotlab.app";
const r=await onRegister(id,password,name.trim(),role);
if(!r.ok)setErr(r.err);
};
const doDemo=async(kind="player")=>{
const acct=kind==="coach"?DEMO_COACH:DEMO_PLAYER;
setErr("");
setEmail(acct.email);
setPassword(acct.password);
const demo=await onDemo(kind);
if(!demo.ok)setErr(demo.err||"Unable to start demo.");
};
const inp={width:"100%",height:52,padding:"0 16px",background:"#141414",border:"1px solid #333333",borderRadius:12,color:LIGHT,fontSize:14,fontFamily:FB,fontWeight:500,outline:"none",transition:"border-color .15s ease, box-shadow .15s ease"};
return <div style={{minHeight:"100dvh",background:BG,display:"flex",alignItems:"center",justifyContent:"center",position:"relative",overflow:"hidden"}}>
<CourtBG opacity={.024}/><GlowOrb color={VOLT} top="15%" left="50%" size={400}/><GlowOrb color={ORANGE} top="85%" left="30%" size={250}/>
<div className="fade-up" style={{position:"relative",zIndex:1,width:"100%",maxWidth:400,padding:"0 24px"}}>
<div style={{textAlign:"center",marginBottom:28,position:"relative"}}>
<div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",opacity:.08,pointerEvents:"none"}}><SLLogo size={140}/></div>
<div className="auth-ball-enter" style={{display:"inline-flex",flexDirection:"column",alignItems:"center",position:"relative",zIndex:1}}><div className="ball-spin"><DrillIcon type="ft" size={60}/></div><div className="auth-shadow-enter" style={{width:40,height:6,marginTop:8,background:"rgba(0,0,0,0.4)",borderRadius:"50%"}}/></div>
</div>
<h1 style={{fontFamily:FD,fontSize:72,color:LIGHT,textAlign:"center",margin:0,lineHeight:.85,letterSpacing:4}}>SHOT<span style={{color:VOLT}}>LAB</span></h1>
<p style={{fontFamily:FB,color:MUTED,textAlign:"center",fontSize:13,letterSpacing:5,margin:"8px 0 0",fontWeight:500}}>OFFSEASON DEVELOPMENT PROGRAM</p>
<div style={{display:"flex",alignItems:"center",gap:12,margin:"32px auto",maxWidth:200}}><div style={{flex:1,height:1,background:`linear-gradient(to right,transparent,${VOLT}44)`}}/><div style={{width:6,height:6,borderRadius:"50%",background:VOLT,opacity:.6}}/><div style={{flex:1,height:1,background:`linear-gradient(to left,transparent,${VOLT}44)`}}/></div>
<div className="auth-card-enter" style={{background:`linear-gradient(180deg,${CARD_BG},#141414)`,borderRadius:24,padding:"36px 28px",border:`1px solid ${BORDER_CLR}`}}>
{/* Login / Register toggle */}
<div style={{display:"flex",background:"#1E1E1E",borderRadius:12,padding:2,marginBottom:24,border:"1px solid #242424"}}>
{["login","register"].map(m=><button key={m} onClick={()=>{setMode(m);setErr("")}} style={{flex:1,height:44,borderRadius:10,border:"none",cursor:"pointer",fontFamily:FD,fontSize:16,letterSpacing:3,textTransform:"uppercase",transition:"all .15s ease",background:mode===m?VOLT:"transparent",color:mode===m?"#000000":"#555555",fontWeight:mode===m?700:600}}>{m==="login"?"SIGN IN":"REGISTER"}</button>)}
</div>

    {mode==="register"&&<>
      <h2 style={{fontFamily:FD,color:LIGHT,fontSize:24,textAlign:"center",margin:"0 0 4px",letterSpacing:2}}>CREATE ACCOUNT</h2>
      <p style={{fontFamily:FB,color:MUTED,textAlign:"center",fontSize:13,margin:"0 0 22px"}}>Join your team's offseason program</p>
      {/* Role selector */}
      <div style={{display:"flex",background:BG,borderRadius:10,padding:3,marginBottom:20,border:`1px solid ${BORDER_CLR}`}}>
        {["player","coach"].map(r=><button key={r} onClick={()=>setRole(r)} style={{flex:1,padding:"10px 0",borderRadius:8,border:"none",cursor:"pointer",fontFamily:FB,fontSize:12,fontWeight:700,letterSpacing:2,textTransform:"uppercase",transition:"all .25s",background:role===r?VOLT+"15":"transparent",color:role===r?VOLT:"#555555"}}>{r}</button>)}
      </div>
      <label style={{fontFamily:FB,color:"#A0A0A0",fontSize:10,fontWeight:700,letterSpacing:3,display:"block",marginBottom:6}}>YOUR NAME</label>
      <input type="text" value={name} onChange={e=>{setName(e.target.value);setErr("")}} placeholder="First Last" style={{...inp,marginBottom:14}} onFocus={e=>{e.target.style.borderColor=VOLT;e.target.style.boxShadow="0 0 0 3px rgba(200,255,0,0.08)"}} onBlur={e=>{e.target.style.borderColor="#333333";e.target.style.boxShadow="none"}}/>
    </>}

    {mode==="login"&&<>
      <h2 style={{fontFamily:FB,color:LIGHT,fontSize:28,fontWeight:900,textAlign:"center",margin:"0 0 4px",letterSpacing:1.5,textTransform:"uppercase"}}>WELCOME BACK</h2>
      <p style={{fontFamily:FB,color:"#A0A0A0",textAlign:"center",fontSize:13,fontWeight:400,margin:"0 0 22px"}}>Sign in to access your dashboard</p>
    </>}

    <label style={{fontFamily:FB,color:"#A0A0A0",fontSize:10,fontWeight:700,letterSpacing:3,display:"block",marginBottom:6}}>EMAIL</label>
    <input type="email" autoComplete="email" value={email} onChange={e=>{setEmail(e.target.value);setErr("")}} onKeyDown={e=>e.key==="Enter"&&(mode==="login"?doLogin():doRegister())} placeholder="you@example.com" style={{...inp,marginBottom:14}} onFocus={e=>{e.target.style.borderColor=VOLT;e.target.style.boxShadow="0 0 0 3px rgba(200,255,0,0.08)"}} onBlur={e=>{e.target.style.borderColor="#333333";e.target.style.boxShadow="none"}}/>

    <label style={{fontFamily:FB,color:"#A0A0A0",fontSize:10,fontWeight:700,letterSpacing:3,display:"block",marginBottom:6}}>PASSWORD</label>
    <input type="password" autoComplete={mode==="login"?"current-password":"new-password"} value={password} onChange={e=>{setPassword(e.target.value);setErr("")}} onKeyDown={e=>e.key==="Enter"&&(mode==="login"?doLogin():doRegister())} placeholder={mode==="register"?"Min 4 characters":"••••••••"} style={{...inp,marginBottom:err?8:20}} onFocus={e=>{e.target.style.borderColor=VOLT;e.target.style.boxShadow="0 0 0 3px rgba(200,255,0,0.08)"}} onBlur={e=>{e.target.style.borderColor="#333333";e.target.style.boxShadow="none"}}/>

    {err&&<p style={{fontFamily:FB,color:"#FF4545",fontSize:12,margin:"0 0 14px"}}>{err}</p>}

    <button className="btn-v cta-primary" onClick={mode==="login"?doLogin:doRegister} style={{}}>
      {mode==="login"?"SIGN IN":"CREATE ACCOUNT"} &#8594;
    </button>
    {mode==="login"&&<><div style={{display:"flex",alignItems:"center",gap:10,width:"100%",margin:"8px 0 12px"}}><div style={{height:1,background:"#242424",flex:1}}/><div style={{width:4,height:4,borderRadius:"50%",background:"#555555"}}/><div style={{height:1,background:"#242424",flex:1}}/></div><div className="auth-demo-enter" style={{display:"flex",gap:12,justifyContent:"center",marginTop:0,opacity:0}}>
      <button onClick={()=>doDemo("player")} className="btn-v" style={{height:44,padding:"0 20px",background:"#1E1E1E",color:"#A0A0A0",fontFamily:FB,fontSize:12,fontWeight:600,letterSpacing:"0.08em",border:"1px solid #333333",borderRadius:10,cursor:"pointer",textTransform:"uppercase"}}>Demo Player</button>
      <button onClick={()=>doDemo("coach")} className="btn-v" style={{height:44,padding:"0 20px",background:"#1E1E1E",color:"#A0A0A0",fontFamily:FB,fontSize:12,fontWeight:600,letterSpacing:"0.08em",border:"1px solid #333333",borderRadius:10,cursor:"pointer",textTransform:"uppercase"}}>Demo Coach</button>
    </div></>}

    <p style={{fontFamily:FB,color:MUTED,textAlign:"center",fontSize:12,marginTop:16,cursor:"pointer"}} onClick={()=>{setMode(mode==="login"?"register":"login");setErr("")}}>
      {mode==="login"?"Don't have an account? ":"Already have an account? "}
      <span style={{color:VOLT,fontWeight:700}}>{mode==="login"?"Register":"Sign In"}</span>
    </p>
    {mode==="register"&&<p style={{fontFamily:FB,color:MUTED+"88",textAlign:"center",fontSize:10,marginTop:12,lineHeight:1.5}}>By creating an account, you agree to our data practices. All data is stored locally on your device. You can delete your account and all data at any time from your Profile settings.</p>}
  </div>
</div>

  </div>;
}

function CreateTeam({u,onCreate}){
const[name,setName]=useState("");const[school,setSchool]=useState("");const[level,setLevel]=useState("");const[err,setErr]=useState("");
const submit=async()=>{if(!name.trim())return setErr("Enter a team name");const r=await onCreate(name.trim(),{school,level});if(!r.ok)setErr(r.err||"Could not create team")}
return <div style={{minHeight:"100dvh",background:BG,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}><div style={{width:"100%",maxWidth:420,background:CARD_BG,border:`1px solid ${BORDER_CLR}`,borderRadius:16,padding:24}}><h2 style={{fontFamily:FD,color:LIGHT,letterSpacing:2,margin:"0 0 8px"}}>CREATE TEAM</h2><p style={{fontFamily:FB,color:MUTED,fontSize:12,margin:"0 0 16px"}}>Welcome {u?.name}. Create your team to continue.</p><input value={name} onChange={e=>{setName(e.target.value);setErr("")}} placeholder="Team Name" style={{width:"100%",padding:12,marginBottom:10,background:BG,color:LIGHT,border:`1px solid ${BORDER_CLR}`,borderRadius:10}}/><input value={school} onChange={e=>setSchool(e.target.value)} placeholder="School (optional)" style={{width:"100%",padding:12,marginBottom:10,background:BG,color:LIGHT,border:`1px solid ${BORDER_CLR}`,borderRadius:10}}/><input value={level} onChange={e=>setLevel(e.target.value)} placeholder="Level (optional)" style={{width:"100%",padding:12,marginBottom:10,background:BG,color:LIGHT,border:`1px solid ${BORDER_CLR}`,borderRadius:10}}/>{err&&<div style={{color:"#FF4545",fontFamily:FB,fontSize:12,marginBottom:10}}>{err}</div>}<button onClick={submit} className="btn-v cta-primary" style={{}}>CREATE TEAM</button></div></div>;
}

function JoinTeam({u,onJoin}){
const[code,setCode]=useState("");const[err,setErr]=useState("");
const submit=async()=>{const r=await onJoin(code);if(!r.ok)setErr(r.err||"Could not join team")};
return <div style={{minHeight:"100dvh",background:BG,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}><div style={{width:"100%",maxWidth:420,background:CARD_BG,border:`1px solid ${BORDER_CLR}`,borderRadius:16,padding:24}}><h2 style={{fontFamily:FD,color:LIGHT,letterSpacing:2,margin:"0 0 8px"}}>JOIN TEAM</h2><p style={{fontFamily:FB,color:MUTED,fontSize:12,margin:"0 0 16px"}}>Hey {u?.name}, enter your coach's team code.</p><input value={code} onChange={e=>{setCode(e.target.value.toUpperCase());setErr("")}} placeholder="TEAM CODE" style={{width:"100%",padding:12,marginBottom:10,background:BG,color:LIGHT,border:`1px solid ${BORDER_CLR}`,borderRadius:10,textTransform:"uppercase",letterSpacing:2}}/>{err&&<div style={{color:"#FF4545",fontFamily:FB,fontSize:12,marginBottom:10}}>{err}</div>}<button onClick={submit} className="btn-v cta-primary" style={{}}>JOIN TEAM</button></div></div>;
}

// ═══════════════════════════════════════
// PLAYER SCREEN — Dual Dashboard
// ═══════════════════════════════════════
function Player({u,drills,programDrills,scores,addScore,events,rsvps,toggleRsvp,shotLogs,addShotLog,challenges,addChallenge,respondChallenge,players,T,theme,setTheme,scSessions,scRsvps,toggleScRsvp,scLogs,addScLog,logout,deleteAccount}){
const initialTab = u.isCoach && window.location.pathname === "/players" ? "players" : "home";
const[tab,setTab]=useState(initialTab),[active,setActive]=useState(null),[input,setInput]=useState(""),[saved,setSaved]=useState(false),[shareData,setShareData]=useState(null),[confetti,setConfetti]=useState(false);
const[shotMade,setShotMade]=useState(""),[shotDate,setShotDate]=useState(todayStr()),[shotSaved,setShotSaved]=useState(false);
const[challTarget,setChallTarget]=useState(""),[showChallForm,setShowChallForm]=useState(false);
const[badgeReveal,setBadgeReveal]=useState(null),[pullY,setPullY]=useState(0);
const[showShotStats,setShowShotStats]=useState(false);
const[isNarrow,setIsNarrow]=useState(typeof window!=="undefined"?window.innerWidth<768:false);
const slideClass="screen-fade-in";
const switchTab=(k)=>{setTab(k);setActive(null);setShowShotStats(false);
if(u.isCoach&&k==="players")window.history.pushState({},"","/players");
else if(u.isCoach&&window.location.pathname==="/players")window.history.pushState({},"","/");}
useEffect(()=>{const onResize=()=>setIsNarrow(window.innerWidth<768);window.addEventListener("resize",onResize);return()=>window.removeEventListener("resize",onResize);},[]);
useEffect(()=>{
  const onPop=()=>{
    if(u.isCoach&&window.location.pathname==="/players")setTab("players");
    else if(tab==="players")setTab("home");
  };
  window.addEventListener("popstate",onPop);
  return ()=>window.removeEventListener("popstate",onPop);
},[u.isCoach,tab]);;
const my=useMemo(()=>scores.filter(s=>s.email===u.email),[scores,u]);
const homeScores=useMemo(()=>my.filter(s=>s.src==="home"||!s.src),[my]);
const total=useMemo(()=>homeScores.reduce((a,s)=>a+s.score,0),[homeScores]);
const totalMakes=total;
const today=todayStr();
const todayS=useMemo(()=>homeScores.filter(s=>s.date===today),[homeScores,today]);
const streak=useMemo(()=>calcStreak(homeScores),[homeScores]);
const earnedBadges=useMemo(()=>getEarnedBadges(streak),[streak]);
const myRsvps=useMemo(()=>rsvps.filter(r=>r.email===u.email).length,[rsvps,u]);
const tier=useMemo(()=>getTier(myRsvps),[myRsvps]);

// Notification dots for nav
const pendingDuels=useMemo(()=>challenges.filter(c=>c.to===u.email&&c.status==="pending").length,[challenges,u]);
const unrsvpEvents=useMemo(()=>{const up=events.filter(e=>e.date>=today);return up.filter(e=>!rsvps.some(r=>r.eventId===e.id&&r.email===u.email)).length},[events,rsvps,u,today]);
const soonSC=useMemo(()=>{const d2=new Date();d2.setDate(d2.getDate()+2);const cut=`${d2.getFullYear()}-${String(d2.getMonth()+1).padStart(2,"0")}-${String(d2.getDate()).padStart(2,"0")}`;return scSessions.filter(s=>s.date>=today&&s.date<=cut&&!scRsvps.some(r=>r.sessionId===s.id&&r.email===u.email)).length},[scSessions,scRsvps,u,today]);

const[pbReveal,setPbReveal]=useState(null);
const[submitting,setSubmitting]=useState(false);
const[drillBarW,setDrillBarW]=useState(0);
useEffect(()=>{const target=drills.length>0?Math.round(todayS.length/drills.length*100):0;const timer=setTimeout(()=>{if(target===0){setDrillBarW(8);setTimeout(()=>setDrillBarW(0),200);}else{setDrillBarW(target);}},300);return()=>clearTimeout(timer);},[]);
const handleLog=()=>{if(submitting)return;const v=parseInt(input);if(isNaN(v)||v<0||v>active.max)return;setSubmitting(true);const oldStreak=streak;
// Check personal best
const prevBest=homeScores.filter(s=>s.drillId===active.id).reduce((m,s)=>Math.max(m,s.score),0);
const isPB=v>prevBest&&prevBest>0;
addScore(active.id,v);playScore();const pct=Math.round(v/active.max*100);setShareData({drill:active.name,score:v,max:active.max,pct,name:u.name,streak,date:todayStr(),drillId:active.id,icon:active.icon,badges:earnedBadges,isPB,prevBest});setSaved(true);setConfetti(true);setInput("");setTimeout(()=>setConfetti(false),1200);
if(isPB){setTimeout(()=>{setPbReveal({drill:active.name,score:v,prev:prevBest});setTimeout(()=>setPbReveal(null),3000)},400)}
setTimeout(()=>{const ns=calcStreak([...homeScores,{date:todayStr()}]);const nb=STREAK_BADGES.find(b=>oldStreak<b.days&&ns>=b.days);if(nb){playUnlock();setBadgeReveal(nb);setTimeout(()=>setBadgeReveal(null),3500)}},700)};
const closeShare=()=>{setSaved(false);setActive(null);setShareData(null);setShowChallForm(false);setChallTarget("");setSubmitting(false);setTab("home")};
const sendChallenge=()=>{if(!challTarget)return;addChallenge({to:challTarget,toName:players.find(p=>p.email===challTarget)?.name||challTarget.split("@")[0],drillId:shareData.drillId,drillName:shareData.drill,score:shareData.score,max:shareData.max});setShowChallForm(false);setChallTarget("");closeShare()};

// Pull-to-refresh
const[tStart,setTStart]=useState(0);
const onTS=e=>{setTStart(e.touches[0].clientY)};
const onTM=e=>{if(!tStart)return;const el=e.currentTarget;if(el.scrollTop>0)return;const dy=Math.max(0,Math.min(70,(e.touches[0].clientY-tStart)*.35));setPullY(dy)};
const onTE=()=>{if(pullY>40){setPullY(50);setTimeout(()=>setPullY(0),700)}else setPullY(0);setTStart(0)};

return <div className={u.isCoach?"coach-mode":""} style={{minHeight:"100dvh",background:u.isCoach?"#0B0A09":T.BG,display:"flex",flexDirection:"column",fontFamily:FB,position:"relative",transition:"background .3s"}}>
<BrandBackdrop/>
<div style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:0}}><CourtBG opacity={theme==="light"?.028:.012}/><GlowOrb color={tab==="program"?CYAN:tab==="duels"?ORANGE:tab==="players"?VOLT:VOLT} top="0" left="70%" size={300} animate/><GlowOrb color={tab==="program"?VOLT:tab==="duels"?CYAN:tab==="players"?CYAN:ORANGE} top="60%" left="20%" size={250} animate/></div>

{/* Badge Reveal Overlay */}
{badgeReveal&&<div style={{position:"fixed",inset:0,zIndex:30,background:"#000c",display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(8px)"}} onClick={()=>setBadgeReveal(null)}>
  <div className="badge-pop badge-shine" style={{textAlign:"center",padding:40}}>
    <div style={{width:120,height:120,borderRadius:"50%",background:`linear-gradient(145deg,${badgeReveal.color}22,${badgeReveal.color}08)`,border:`3px solid ${badgeReveal.color}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 24px",boxShadow:`0 0 60px ${badgeReveal.color}33`}}>
      <span style={{fontFamily:FD,fontSize:36,color:badgeReveal.color}}>{badgeReveal.icon}</span>
    </div>
    <div style={{fontFamily:FD,color:badgeReveal.color,fontSize:32,letterSpacing:6}}>UNLOCKED</div>
    <div style={{fontFamily:FD,color:"#FFFFFF",fontSize:22,letterSpacing:3,marginTop:8}}>{badgeReveal.name}</div>
    <div style={{fontFamily:FB,color:"#A0A0A0",fontSize:13,marginTop:8}}>{badgeReveal.days}-day streak achieved</div>
    <div style={{fontFamily:FB,color:T.MUT,fontSize:10,marginTop:24}}>Tap to dismiss</div>
  </div>
</div>}

{/* Personal Best Reveal */}
{pbReveal&&<div style={{position:"fixed",inset:0,zIndex:30,background:"#000a",display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(6px)"}} onClick={()=>setPbReveal(null)}>
  <div className="badge-pop" style={{textAlign:"center",padding:32}}>
    <div style={{fontFamily:FD,color:ORANGE,fontSize:48,letterSpacing:4,lineHeight:1}}>NEW PB!</div>
    <div style={{fontFamily:FD,color:LIGHT,fontSize:64,lineHeight:1,margin:"16px 0 8px"}}>{pbReveal.score}</div>
    <div style={{fontFamily:FB,color:MUTED,fontSize:14}}>Previous best: {pbReveal.prev}</div>
    <div style={{fontFamily:FB,color:ORANGE,fontSize:13,fontWeight:700,marginTop:8,letterSpacing:2}}>{pbReveal.drill}</div>
    <div style={{fontFamily:FB,color:T.SUB,fontSize:10,marginTop:20}}>Tap to dismiss</div>
  </div>
</div>}

{/* Header — Sticky profile hierarchy */}
<div style={{position:"sticky",top:0,zIndex:10,paddingTop:"max(0px,env(safe-area-inset-top))",height:"calc(72px + max(0px,env(safe-area-inset-top)))",background:TOKENS.BG_BASE,borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
  <div style={{height:72,padding:"0 16px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
    <div style={{display:"flex",alignItems:"center",minWidth:0,flex:1}}>
      <button aria-label="Open profile" onClick={()=>switchTab("profile")} style={{width:44,height:44,borderRadius:"50%",background:"#1E1E1E",border:"1.5px solid #C8FF00",boxShadow:u.isCoach?"0 0 0 4px rgba(200, 255, 0, 0.15)":"none",color:"#FFFFFF",fontSize:16,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",padding:0,cursor:"pointer",fontFamily:FB,flexShrink:0,marginRight:12}}>{(u.name||"?")[0].toUpperCase()}</button>
      <div style={{display:"flex",flexDirection:"column",justifyContent:"center",minWidth:0,maxWidth:"100%"}}>
        <div style={{fontFamily:FB,color:"#FFFFFF",fontSize:18,fontWeight:700,lineHeight:1.1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{u.name}</div>
        <div style={{fontFamily:FB,color:"rgba(255,255,255,0.5)",fontSize:11,fontWeight:400,lineHeight:1.2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",marginTop:2}}>{u.isCoach?"Your program awaits":"Today's mission awaits"}</div>
      </div>
    </div>
    <button aria-label="Settings" title="Settings" onClick={()=>switchTab("profile")} style={{background:T.SURFACE,border:`1px solid ${T.BORDER}`,borderRadius:12,color:TOKENS.TEXT_PRIMARY,width:44,height:44,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
    </button>
  </div>

</div>
{u.isCoach&&<div style={{height:28,background:"linear-gradient(90deg, rgba(200, 255, 0, 0.08) 0%, transparent 100%)",borderBottom:"1px solid rgba(200, 255, 0, 0.12)",display:"flex",alignItems:"center",padding:`0 var(--page-gutter)`,gap:"var(--space-2)"}}><WhistleIcon size={12} color="#C8FF00"/><span style={{fontFamily:FB,fontSize:9,textTransform:"uppercase",letterSpacing:"var(--tracking-tight)",color:"rgba(200, 255, 0, 0.84)"}}>COACH VIEW — FULL ACCESS</span></div>}

<div style={{flex:1,padding:"14px 16px 124px",overflowY:"auto",position:"relative",zIndex:1,transform:`translateY(${pullY}px)`,transition:pullY?"none":"transform .3s"}} onTouchStart={onTS} onTouchMove={onTM} onTouchEnd={onTE}>
  {/* Pull-to-refresh basketball */}
  {pullY>5&&<div style={{position:"absolute",top:-44,left:"50%",transform:"translateX(-50%)",textAlign:"center",opacity:Math.min(pullY/30,1)}}>
    <svg width="24" height="24" viewBox="0 0 40 40" fill="none" style={{animation:pullY>40?"bbBounce .5s ease infinite":"none"}}><circle cx="20" cy="20" r="17" stroke={ORANGE} strokeWidth="2.5"/><path d="M3 20h34" stroke={ORANGE} strokeWidth="1.5"/><path d="M20 3v34" stroke={ORANGE} strokeWidth="1.5"/><path d="M8 5c4.5 5 6.5 9 6.5 15s-2 10-6.5 15" stroke={ORANGE} strokeWidth="1.5" fill="none"/><path d="M32 5c-4.5 5-6.5 9-6.5 15s2 10 6.5 15" stroke={ORANGE} strokeWidth="1.5" fill="none"/></svg>
    <div style={{fontFamily:FB,color:ORANGE,fontSize:8,letterSpacing:2,marginTop:2}}>{pullY>40?"REFRESHING":"PULL"}</div>
  </div>}

  {tab!=="home"&&<button onClick={()=>switchTab("home")} style={{background:"none",border:"none",color:VOLT,fontFamily:FB,fontSize:13,cursor:"pointer",fontWeight:700,letterSpacing:2,marginBottom:16,padding:0}}>&#8592; DASHBOARD</button>}

  {/* ═════════════ HOME — DASHBOARD ═════════════ */}
  {tab==="home"&&!active&&<div className={slideClass} key="home">

    {(()=>{
      const sorted=[...events].sort((a,b)=>a.date.localeCompare(b.date));
      const upcomingEvents=sorted.filter(e=>e.date>=today);
      const nextEvent=upcomingEvents[0]||null;
      const upcomingEventsCount=upcomingEvents.length||0;
      const attendanceRows=rsvps.filter(r=>r.email===u.email);
      const attendancePct=upcomingEventsCount>0&&attendanceRows.length>0?`${Math.min(100,Math.round((attendanceRows.length/upcomingEventsCount)*100))}%`:"—";
      const nextEventLabel=nextEvent?`${nextEvent.date.slice(5)} · ${nextEvent.time}`:"None";
      const homeStats=[{label:"Total Makes",value:<AnimNum v={totalMakes} c={VOLT} size={26}/>,color:VOLT},{label:"Streak",value:`${streak}D`,color:CYAN},{label:"Drills",value:`${todayS.length}/${drills.length}`,color:LIGHT}];
      const programStats=[{label:"Upcoming Events",value:upcomingEventsCount,color:VOLT},{label:"Attendance",value:attendancePct,color:CYAN},{label:"Next Event",value:nextEventLabel,color:LIGHT}];
      return <div style={{marginBottom:28}}>
        <section style={{marginBottom:18,padding:"16px 4px 0"}} aria-label="Training mode selector">
          <div style={{fontFamily:FD,color:LIGHT,fontSize:26,letterSpacing:2.8,textTransform:"uppercase",lineHeight:1}}>TRAINING MODE</div>
          <div style={{fontFamily:FB,color:T.SUB,fontSize:12,fontWeight:600,letterSpacing:"0.03em",marginTop:6}}>Choose how you’re training today</div>
        </section>
        <div style={{display:"grid",gridTemplateColumns:isNarrow?"1fr":"repeat(2,minmax(0,1fr))",gap:isNarrow?18:16,alignItems:"stretch"}}>
          <ModeCard title="AT HOME" subtitle="Solo drills & shot tracking" icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={VOLT} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5L12 3l9 6.5"/><path d="M19 13v6a1 1 0 01-1 1H6a1 1 0 01-1-1v-6"/></svg>} stats={homeStats} accent="home" isActive={tab==="log-drill"} onClick={()=>setTab("log-drill")}/>
          <ModeCard title="PROGRAM" subtitle="Team events & verified attendance" icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={VOLT} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4M16 2v4"/><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18"/></svg>} stats={programStats} accent="program" isActive={tab==="program"} onClick={()=>setTab("program")}/>
        </div>
      </div>
    })()}

    {/* ══════ LEADERBOARD ══════ */}
    <DashboardLeaderboard scores={scores} drills={drills} programDrills={programDrills} user={u} scRsvps={scRsvps} rsvps={rsvps} shotLogs={shotLogs}/>
  </div>}

  {/* ═════════════ AT HOME (sub-screen) ═════════════ */}
  {(tab==="log-drill")&&!active&&!showShotStats&&<div className="fade-up">
    
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={VOLT} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5L12 3l9 6.5"/><path d="M19 13v6a1 1 0 01-1 1H6a1 1 0 01-1-1v-6"/></svg>
      <div style={{fontFamily:FD,color:VOLT,fontSize:22,letterSpacing:3}}>AT HOME</div>
    </div>
    <div style={{fontFamily:FB,color:MUTED,fontSize:12,marginBottom:24,fontWeight:500}}>Track your shots here on the honor system.</div>

    {/* ── SHOT TRACKER ── */}
    <div style={{fontFamily:FB,color:VOLT,fontSize:10,letterSpacing:3,fontWeight:700,marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={VOLT} strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
      SHOT TRACKER
    </div>
    <div style={{background:CARD_BG,borderRadius:16,padding:"16px 16px",border:`1px solid ${BORDER_CLR}`,marginBottom:24}}>
      <div style={{display:"flex",gap:10,marginBottom:12}}>
        <div style={{flex:1}}>
          <label style={{fontFamily:FB,color:"#A0A0A0",fontSize:10,fontWeight:700,letterSpacing:2,display:"block",marginBottom:6}}>MAKES</label>
          <input type="number" min="0" value={shotMade} onChange={e=>setShotMade(e.target.value)} placeholder="0" style={{width:"100%",padding:"12px",background:BG,border:`1px solid ${BORDER_CLR}`,borderRadius:12,color:VOLT,fontFamily:FD,fontSize:24,textAlign:"center",outline:"none"}} onFocus={e=>{e.target.style.borderColor=VOLT;e.target.style.boxShadow="0 0 0 3px rgba(200,255,0,0.08)"}} onBlur={e=>{e.target.style.borderColor="#333333";e.target.style.boxShadow="none"}}/>
        </div>
        <div style={{flex:1}}>
          <label style={{fontFamily:FB,color:"#A0A0A0",fontSize:10,fontWeight:700,letterSpacing:2,display:"block",marginBottom:6}}>DATE</label>
          <input type="date" value={shotDate} onChange={e=>setShotDate(e.target.value)} style={{width:"100%",padding:"12px 8px",background:BG,border:`1px solid ${BORDER_CLR}`,borderRadius:12,color:LIGHT,fontFamily:FB,fontSize:16,outline:"none"}} onFocus={e=>{e.target.style.borderColor=VOLT;e.target.style.boxShadow="0 0 0 3px rgba(200,255,0,0.08)"}} onBlur={e=>{e.target.style.borderColor="#333333";e.target.style.boxShadow="none"}}/>
        </div>
      </div>
      <button className="btn btn--primary btn-v" onClick={()=>{const v=parseInt(shotMade);if(isNaN(v)||v<=0)return;addShotLog(v,shotDate);setShotSaved(true);setShotMade("");setTimeout(()=>setShotSaved(false),1800)}} style={{opacity:shotSaved?.7:1,width:"100%"}}>
        {shotSaved?"✓ SAVED":"LOG SHOTS"}
      </button>
      {(()=>{const t=shotLogs.filter(s=>s.email===u.email&&s.date===today).reduce((a,s)=>a+s.made,0);return t>0?<div style={{fontFamily:FB,color:MUTED,fontSize:11,textAlign:"center",marginTop:8}}>{t} makes logged today</div>:null})()}
      <button onClick={()=>setShowShotStats(true)} className="btn btn--tertiary" style={{width:"100%",textAlign:"center",opacity:.85}}>VIEW SHOT STATS →</button>
    </div>

    <div style={{background:CARD_BG,borderRadius:14,padding:"12px 14px",border:`1px solid ${BORDER_CLR}`}}>
      <div style={{fontFamily:FB,color:T.SUB,fontSize:10,letterSpacing:1.8,textTransform:"uppercase",fontWeight:700}}>No drills assigned today</div>
      <div style={{fontFamily:FB,color:MUTED,fontSize:11,marginTop:6,lineHeight:1.5}}>Your coach is updating your drill plan. You can still log shots now and check back for assigned drills later.</div>
    </div>
  </div>}

  {/* ═════ SHOT STATS sub-screen ═════ */}
  {tab==="log-drill"&&showShotStats&&!active&&<div className="fade-up">
    <button onClick={()=>setShowShotStats(false)} style={{background:"none",border:"none",color:VOLT,fontFamily:FB,fontSize:13,cursor:"pointer",fontWeight:700,letterSpacing:2,marginBottom:20,padding:0}}>&#8592; BACK TO DRILLS</button>
    <ShotTracker u={u} shotLogs={shotLogs} addShotLog={addShotLog} shotMade={shotMade} setShotMade={setShotMade} shotDate={shotDate} setShotDate={setShotDate} shotSaved={shotSaved} setShotSaved={setShotSaved}/>
  </div>}


  {/* ═════════════ ACTIVE DRILL INPUT ═════════════ */}
  {(tab==="home"||tab==="log-drill")&&active&&<div className="detail-enter" style={{textAlign:"center",paddingTop:12,position:"relative"}}>
    {confetti&&<ConfettiBurst/>}
    {saved&&shareData?<div className="fade-up" style={{padding:"16px 0"}}>
      {/* ── SHAREABLE WORKOUT CARD ── */}
      <ShareCard data={shareData}/>
      {/* Challenge button */}
      {!showChallForm?<div style={{display:"flex",gap:8,marginTop:16}}>
        <button className="btn-v cta-primary" onClick={closeShare} style={{width:"100%"}}>DONE</button>
        <button className="btn-v cta-primary" onClick={()=>setShowChallForm(true)} style={{width:"100%"}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={BG} strokeWidth="2.5" strokeLinecap="round"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>CHALLENGE
        </button>
      </div>
      :<div className="fade-up" style={{marginTop:16,background:CARD_BG,borderRadius:16,padding:"20px 18px",border:`1px solid ${ORANGE}33`,textAlign:"left"}}>
        <div style={{fontFamily:FD,color:ORANGE,fontSize:16,letterSpacing:3,marginBottom:4}}>SEND A CHALLENGE</div>
        <div style={{fontFamily:FB,color:MUTED,fontSize:11,marginBottom:14}}>Dare a teammate to beat your {shareData.score}/{shareData.max} on {shareData.drill}</div>
        {players.filter(p=>p.email!==u.email).length===0?<div style={{fontFamily:FB,color:MUTED,fontSize:12,textAlign:"center",padding:16}}>No other players yet. They need to log in first.</div>
        :<><div style={{fontFamily:FB,color:"#A0A0A0",fontSize:10,letterSpacing:2,fontWeight:700,marginBottom:8}}>PICK YOUR OPPONENT</div>
          <div style={{display:"flex",flexDirection:"column",gap:4,marginBottom:14}}>{players.filter(p=>p.email!==u.email).map(p=>
            <button key={p.email} onClick={()=>setChallTarget(p.email)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:challTarget===p.email?ORANGE+"15":BG,border:`1px solid ${challTarget===p.email?ORANGE:BORDER_CLR}`,borderRadius:10,cursor:"pointer",textAlign:"left"}}>
              <Av n={p.name} sz={28} email={p.email}/><span style={{fontFamily:FB,color:challTarget===p.email?ORANGE:LIGHT,fontSize:13,fontWeight:600,flex:1}}>{p.name}</span>
              {challTarget===p.email&&<svg width="16" height="16" viewBox="0 0 20 20"><path d="M5 10l4 4 6-7" stroke={ORANGE} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </button>)}
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>{setShowChallForm(false);setChallTarget("")}} style={{flex:1,padding:"12px",background:"transparent",color:MUTED,fontFamily:FD,fontSize:14,letterSpacing:2,border:`1px solid ${BORDER_CLR}`,borderRadius:10,cursor:"pointer"}}>CANCEL</button>
            <button className="btn-v cta-primary" onClick={sendChallenge} disabled={!challTarget} style={{width:"100%",opacity:challTarget?1:.5}}>SEND IT</button>
          </div>
        </>}
      </div>}
      <div style={{fontFamily:FB,color:T.SUB,fontSize:10,marginTop:12}}>Screenshot your card and share on social media</div>
    </div>
    :<><button onClick={()=>{setActive(null);if(tab==="home")setTab("log-drill")}} style={{background:"none",border:"none",color:VOLT,fontFamily:FB,fontSize:13,cursor:"pointer",fontWeight:700,letterSpacing:2,marginBottom:32,padding:"8px 16px"}}>&#8592; BACK</button>
      <div style={{width:100,height:100,borderRadius:22,background:`linear-gradient(135deg,${SURFACE},${CARD_BG})`,border:`1px solid ${BORDER_CLR}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 24px"}}><DrillIcon type={active.icon} size={48}/></div>
      <h2 style={{fontFamily:FD,color:LIGHT,fontSize:36,letterSpacing:4,margin:"0 0 8px"}}>{active.name}</h2>
      <p style={{fontFamily:FB,color:MUTED,fontSize:14,margin:"0 auto 6px",maxWidth:280,lineHeight:1.6}}>{active.desc}</p>
      {/* Personal Best + Average */}
      {(()=>{const ds=homeScores.filter(s=>s.drillId===active.id);const pb=ds.reduce((m,s)=>Math.max(m,s.score),0);const avg=ds.length?Math.round(ds.reduce((a,s)=>a+s.score,0)/ds.length*10)/10:0;
        return ds.length>0?<div style={{display:"flex",gap:8,justifyContent:"center",margin:"12px 0 6px"}}>
          <div style={{background:CARD_BG,borderRadius:10,padding:"8px 16px",border:`1px solid ${ORANGE}33`,textAlign:"center"}}>
            <div style={{fontFamily:FD,color:ORANGE,fontSize:18}}>{pb}</div>
            <div style={{fontFamily:FB,color:MUTED,fontSize:8,letterSpacing:2,fontWeight:600}}>YOUR PB</div>
          </div>
          <div style={{background:CARD_BG,borderRadius:10,padding:"8px 16px",border:`1px solid ${BORDER_CLR}`,textAlign:"center"}}>
            <div style={{fontFamily:FD,color:VOLT,fontSize:18}}>{avg}</div>
            <div style={{fontFamily:FB,color:MUTED,fontSize:8,letterSpacing:2,fontWeight:600}}>AVG</div>
          </div>
          <div style={{background:CARD_BG,borderRadius:10,padding:"8px 16px",border:`1px solid ${BORDER_CLR}`,textAlign:"center"}}>
            <div style={{fontFamily:FD,color:LIGHT,fontSize:18}}>{ds.length}</div>
            <div style={{fontFamily:FB,color:MUTED,fontSize:8,letterSpacing:2,fontWeight:600}}>LOGGED</div>
          </div>
        </div>:null})()}
      {active.instructions&&<div style={{margin:"12px auto 0",maxWidth:300,background:CARD_BG,borderRadius:12,padding:"14px 16px",border:`1px solid ${BORDER_CLR}`,textAlign:"left"}}>
        <div style={{fontFamily:FD,color:CYAN,fontSize:10,letterSpacing:3,marginBottom:6,display:"flex",alignItems:"center",gap:6}}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
          COACH NOTES
        </div>
        <p style={{fontFamily:FB,color:"#A0A0A0",fontSize:12,lineHeight:1.6,margin:0,whiteSpace:"pre-wrap"}}>{active.instructions}</p>
      </div>}
      {/* Motivational line */}
      <div style={{fontFamily:FB,color:"#555555",fontSize:12,fontStyle:"italic",letterSpacing:1,margin:"20px 0 8px",fontWeight:500}}>{["Lock in.","No shortcuts.","This rep counts.","Earn it.","Be honest with yourself.","Own the work.","Details matter.","Trust the process.","Stay disciplined.","Championship habits."][Math.floor((active.id*7+new Date().getDate())%10)]}</div>
      <div style={{fontFamily:FD,color:T.SUB,fontSize:13,letterSpacing:3,marginBottom:28}}>MAX: {active.max}</div>
      {/* Score input with reactive color */}
      {(()=>{const v=parseInt(input)||0;const pct=active.max>0?v/active.max:0;const glowColor=pct>=.9?VOLT:pct>=.6?ORANGE:pct>.01?"#FF4545":VOLT;const borderColor=v>0?glowColor:VOLT;
        return <div style={{display:"flex",alignItems:"baseline",justifyContent:"center",gap:8,marginBottom:40}}>
        <input autoFocus type="number" min="0" max={active.max} value={input} onChange={e=>{setInput(e.target.value);playTick()}} onKeyDown={e=>e.key==="Enter"&&handleLog()} placeholder="0" style={{width:120,padding:"24px 8px",background:BG,border:`2px solid ${borderColor}`,borderRadius:20,color:borderColor,fontFamily:FD,fontSize:64,textAlign:"center",outline:"none",letterSpacing:2,boxShadow:v>0?`0 0 30px ${glowColor}20,0 0 60px ${glowColor}08`:`0 0 20px ${VOLT}15`,transition:"border-color .3s,color .3s,box-shadow .3s"}}/>
        <div style={{fontFamily:FD,color:T.SUB,fontSize:32}}>/{active.max}</div>
      </div>})()}
      {/* Score quality indicator */}
      {(()=>{const v=parseInt(input)||0;if(v<=0)return null;const pct=Math.round(v/active.max*100);const label=pct>=90?"ELITE":pct>=75?"STRONG":pct>=50?"SOLID":"KEEP PUSHING";const c=pct>=90?VOLT:pct>=75?VOLT:pct>=50?ORANGE:"#FF4545";
        return <div className="fade-up" style={{fontFamily:FB,color:c,fontSize:10,fontWeight:700,letterSpacing:3,marginBottom:16,marginTop:-20,transition:"color .3s"}}>{pct}% — {label}</div>})()}
      <button className="btn-v cta-primary" onClick={handleLog} style={{maxWidth:300,margin:"0 auto"}}>LOG SCORE &#8594;</button>
    </>}
  </div>}

  {/* ═════════════ PROGRAM (Coach-Verified) ═════════════ */}
  {tab==="program"&&<div className={slideClass} key="program"><SectionHero icon={<EventIcon type="star" size={28} color={VOLT}/>} title="PROGRAM EVENTS" subtitle="Official workouts and attendance" accent={VOLT} deco={<EventIcon type="run" size={16} color={VOLT}/>} isCoach={u.isCoach}/><ProgramDrillsPanel user={u} drills={programDrills} scores={scores} addScore={addScore}/><DividerDot/><EventsPanel events={events} rsvps={rsvps} user={u} toggleRsvp={toggleRsvp} scores={scores} drills={drills}/></div>}

  {/* ═════════════ CHALLENGES ═════════════ */}
  {!u.isCoach&&tab==="duels"&&<div className={slideClass} key="duels"><DuelsPanel u={u} challenges={challenges} drills={drills} respondChallenge={respondChallenge} players={players}/></div>}
  {u.isCoach&&tab==="players"&&<div className={slideClass} key="players"><PlayersScreen/></div>}

  {/* ═════════════ STRENGTH & CONDITIONING ═════════════ */}
  {tab==="sc"&&<div className={slideClass} key="sc"><SectionHero icon={<LiftIcon size={28} color="#A0A0A0"/>} title="STRENGTH & CONDITIONING" subtitle="Log sessions and build consistency" accent="#A0A0A0" deco={<LiftIcon size={16} color="#A0A0A0"/>} isCoach={u.isCoach}/><SCPanel sessions={scSessions} scRsvps={scRsvps} user={u} toggleScRsvp={toggleScRsvp} scLogs={scLogs} addScLog={addScLog}/></div>}

  {/* ═════════════ PROFILE — Offseason Resume ═════════════ */}
  {tab==="profile"&&<div className={slideClass} key="profile"><ProfilePage u={u} scores={scores} shotLogs={shotLogs} drills={drills} rsvps={rsvps} scRsvps={scRsvps} challenges={challenges} streak={streak} earnedBadges={earnedBadges} T={T} deleteAccount={deleteAccount}/></div>}
</div>

<NavBar items={[
  {k:"home",l:"Home",accentVar:"--accent-feed",svg:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>},
  ...(u.isCoach
    ? [{k:"players",l:"Players",accentVar:"--accent-players",svg:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6"/><path d="M23 11h-6"/></svg>}] 
    : [{k:"duels",l:"Duels",accentVar:"--accent-drills",svg:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>,dot:pendingDuels>0?ORANGE:null}]),
  {k:"log-drill",l:"Quick Menu",accentVar:"--accent-drills",svg:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h10"/></svg>},
  {k:"sc",l:"Lifting",accentVar:"--accent-lifting",svg:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6.5 6.5h-2a1 1 0 00-1 1v9a1 1 0 001 1h2M17.5 6.5h2a1 1 0 011 1v9a1 1 0 01-1 1h-2M6.5 12h11M1.5 9.5v5M22.5 9.5v5"/></svg>,dot:soonSC>0?VOLT:null},
  {k:"program",l:"Events",accentVar:"--accent-events",svg:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4M16 2v4"/><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18"/></svg>,dot:unrsvpEvents>0?VOLT:null},
  {k:"profile",l:"Profile",accentVar:"--accent-players",svg:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>},
]} active={tab} onChange={switchTab}/>

  </div>;
}

// ═══════════════════════════════════════
// SHAREABLE WORKOUT CARD
// ═══════════════════════════════════════
function ShareCard({data}){
const pct=data.pct||0;const pcol=pct>=80?VOLT:pct>=50?ORANGE:"#FF4545";
return <div style={{background:`linear-gradient(145deg,#0A0A0A,#141414)`,borderRadius:24,padding:"28px 24px 24px",border:`1px solid ${VOLT}22`,position:"relative",overflow:"hidden",textAlign:"center",maxWidth:340,margin:"0 auto"}}>
{/* Corner accents */}
<div style={{position:"absolute",top:0,left:0,width:60,height:60,borderTop:`3px solid ${VOLT}`,borderLeft:`3px solid ${VOLT}`,borderRadius:"24px 0 0 0",opacity:.4}}/>
<div style={{position:"absolute",bottom:0,right:0,width:60,height:60,borderBottom:`3px solid ${VOLT}`,borderRight:`3px solid ${VOLT}`,borderRadius:"0 0 24px 0",opacity:.4}}/>
{/* Glow */}
<div style={{position:"absolute",top:"-30%",left:"50%",width:200,height:200,borderRadius:"50%",background:`radial-gradient(circle,${VOLT}0c,transparent)`,transform:"translateX(-50%)",pointerEvents:"none"}}/>
{/* Brand */}
<div style={{position:"relative",zIndex:1}}>
<div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:4,marginBottom:4}}>
<SLLogo size={22}/>
<span style={{fontFamily:FD,color:VOLT,fontSize:12,letterSpacing:4}}>SHOT LAB</span>
</div>
<div style={{fontFamily:FB,color:T.MUT,fontSize:9,letterSpacing:2,marginBottom:20}}>WORKOUT COMPLETE</div>
{/* Player name */}
<div style={{fontFamily:FD,color:LIGHT,fontSize:28,letterSpacing:3,lineHeight:1}}>{data.name.toUpperCase()}</div>
<div style={{fontFamily:FB,color:T.SUB,fontSize:10,letterSpacing:2,marginTop:4,marginBottom:20}}>{data.date}</div>
{/* Drill + Score */}
<div style={{display:"inline-flex",alignItems:"center",gap:8,background:BG,borderRadius:12,padding:"8px 16px",border:`1px solid ${BORDER_CLR}`,marginBottom:16}}>
<DrillIcon type={data.icon} size={20}/>
<span style={{fontFamily:FD,color:LIGHT,fontSize:14,letterSpacing:2}}>{data.drill}</span>
</div>
{/* Big score */}
<div style={{fontFamily:FD,fontSize:72,color:VOLT,lineHeight:.9,letterSpacing:2}}>{data.score}<span style={{color:MUTED,fontSize:32}}>/{data.max}</span></div>
{/* Personal Best badge */}
{data.isPB&&<div style={{display:"inline-flex",alignItems:"center",gap:6,background:ORANGE+"15",borderRadius:10,padding:"6px 16px",border:`1px solid ${ORANGE}33`,marginTop:12}}>
<span style={{fontFamily:FD,color:ORANGE,fontSize:16,letterSpacing:3}}>★ NEW PERSONAL BEST</span>
</div>}
{/* Accuracy ring */}
<div style={{margin:"16px auto 12px",width:80,position:"relative"}}>
<svg width="80" height="40" viewBox="0 0 80 40">
<path d="M5 35 A 35 35 0 0 1 75 35" fill="none" stroke="#242424" strokeWidth="6" strokeLinecap="round"/>
<path d="M5 35 A 35 35 0 0 1 75 35" fill="none" stroke={pcol} strokeWidth="6" strokeLinecap="round" strokeDasharray={`${pct*1.1} 110`}/>
</svg>
<div style={{position:"absolute",bottom:0,left:"50%",transform:"translateX(-50%)",fontFamily:FD,color:pcol,fontSize:18}}>{pct}%</div>
</div>
{/* Streak */}
{data.streak>0&&<div style={{display:"inline-flex",alignItems:"center",gap:4,background:ORANGE+"12",borderRadius:8,padding:"4px 12px",border:`1px solid ${ORANGE}22`}}>
<span style={{fontSize:14}}>🔥</span>
<span style={{fontFamily:FD,color:ORANGE,fontSize:14,letterSpacing:2}}>{data.streak} DAY STREAK</span>
</div>}
{data.badges&&data.badges.length>0&&<div style={{display:"flex",gap:3,justifyContent:"center",flexWrap:"wrap",marginTop:6}}>{data.badges.map(b=><span key={b.days} style={{fontFamily:FD,fontSize:8,color:b.color,background:`${b.color}12`,border:`1px solid ${b.color}33`,borderRadius:5,padding:"1px 6px",letterSpacing:1}}>{b.icon}D</span>)}</div>}
</div>

  </div>;
}

// ═══════════════════════════════════════
// HEAD-TO-HEAD DUELS
// ═══════════════════════════════════════
function DuelsPanel({u,challenges,drills,respondChallenge,players}){
const[respId,setRespId]=useState(null),[respInput,setRespInput]=useState(""),[respSaved,setRespSaved]=useState(null);
const incoming=useMemo(()=>challenges.filter(c=>c.to===u.email).sort((a,b)=>b.ts-a.ts),[challenges,u]);
const outgoing=useMemo(()=>challenges.filter(c=>c.from===u.email).sort((a,b)=>b.ts-a.ts),[challenges,u]);
const pending=incoming.filter(c=>c.status==="pending");
const resolved=[...incoming.filter(c=>c.status!=="pending"),...outgoing].sort((a,b)=>(b.respTs||b.ts)-(a.respTs||a.ts));

const handleRespond=(ch)=>{
const v=parseInt(respInput);if(isNaN(v)||v<0||v>ch.max)return;
respondChallenge(ch.id,v);setRespSaved(ch.id);setRespId(null);setRespInput("");
setTimeout(()=>setRespSaved(null),2000);
};

return <div className="fade-up">
{/* Duels banner — aggressive, asymmetric */}
<div style={{background:`linear-gradient(135deg,${ORANGE}10,${CARD_BG},${ORANGE}05)`,borderRadius:18,padding:"20px 22px",marginBottom:16,border:`1px solid ${ORANGE}22`,position:"relative",overflow:"hidden"}}>
<div style={{position:"absolute",top:-12,right:-8,opacity:.08}}><svg width="100" height="100" viewBox="0 0 24 24" fill={ORANGE} stroke="none"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg></div>

<div style={{position:"absolute",bottom:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${ORANGE},${ORANGE}44,transparent)`}}/>
<div style={{display:"flex",alignItems:"center",gap:14,position:"relative"}}>
<div style={{width:48,height:48,borderRadius:14,background:`${ORANGE}15`,border:`1.5px solid ${ORANGE}33`,display:"flex",alignItems:"center",justifyContent:"center",transform:"rotate(-6deg)"}}>
<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={ORANGE} strokeWidth="2.5" strokeLinecap="round"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
</div>
<div>
<div style={{fontFamily:FD,color:ORANGE,fontSize:18,letterSpacing:3}}>HEAD-TO-HEAD</div>
<div style={{fontFamily:FB,color:MUTED,fontSize:11,marginTop:2}}>Challenge teammates. Beat their score.</div>
</div>
</div>
</div>

{/* Pending challenges */}
{pending.length>0&&<><SH isCoach={typeof u!=="undefined"&&u?.isCoach} t="INCOMING" s={`${pending.length} WAITING`}/>
  {pending.map(ch=>{const dr=drills.find(d=>d.id===ch.drillId);const isResp=respId===ch.id;
    return <div key={ch.id} className="fade-up card-glow-o" style={{background:`linear-gradient(135deg,${CARD_BG},#141414)`,borderRadius:16,padding:"18px 20px",marginBottom:10,border:`1px solid ${ORANGE}33`,position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:0,left:0,width:4,height:"100%",background:ORANGE,borderRadius:"4px 0 0 4px"}}/>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
        <Av n={ch.fromName} sz={38} email={ch.from}/>
        <div style={{flex:1}}>
          <div style={{fontFamily:FD,color:LIGHT,fontSize:15,letterSpacing:1}}>{ch.fromName.toUpperCase()}</div>
          <div style={{fontFamily:FB,color:T.SUB,fontSize:10,marginTop:1}}>challenged you on <span style={{color:ORANGE,fontWeight:700}}>{ch.drillName}</span></div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontFamily:FD,color:ORANGE,fontSize:24}}>{ch.score}<span style={{color:MUTED,fontSize:14}}>/{ch.max}</span></div>
          <div style={{fontFamily:FB,color:MUTED,fontSize:8,letterSpacing:1}}>TO BEAT</div>
        </div>
      </div>
      {respSaved===ch.id?<div style={{textAlign:"center",padding:8}}><div style={{fontFamily:FD,color:VOLT,fontSize:18,letterSpacing:3}}>RESPONSE LOGGED!</div></div>
      :isResp?<div className="fade-up">
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
          <div style={{flex:1}}><div style={{fontFamily:FB,color:"#A0A0A0",fontSize:10,letterSpacing:2,fontWeight:700,marginBottom:6}}>YOUR SCORE</div>
            <input autoFocus type="number" min="0" max={ch.max} value={respInput} onChange={e=>setRespInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleRespond(ch)} placeholder="0" style={{width:"100%",padding:"14px 8px",background:BG,border:`2px solid ${ORANGE}`,borderRadius:14,color:ORANGE,fontFamily:FD,fontSize:36,textAlign:"center",outline:"none"}}/>
          </div>
          <div style={{fontFamily:FD,color:T.SUB,fontSize:24,paddingTop:20}}>/{ch.max}</div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>{setRespId(null);setRespInput("")}} style={{flex:1,padding:"11px",background:"transparent",color:MUTED,fontFamily:FD,fontSize:13,letterSpacing:2,border:`1px solid ${BORDER_CLR}`,borderRadius:10,cursor:"pointer"}}>CANCEL</button>
          <button className="btn-v cta-primary" onClick={()=>handleRespond(ch)} style={{width:"100%"}}>SUBMIT</button>
        </div>
      </div>
      :<button className="btn-v cta-primary" onClick={()=>setRespId(ch.id)} style={{}}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={BG} strokeWidth="2.5" strokeLinecap="round"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>ACCEPT CHALLENGE
      </button>}
    </div>;
  })}</>}

{/* Resolved / History */}
{pending.length>0&&<CourtDivider color={ORANGE} my={12}/>}
<SH t={pending.length>0?"COMPLETED":"ALL DUELS"} s={`${resolved.length} TOTAL`}/>
{resolved.length===0&&pending.length===0&&<Empty t="No duels yet" action="Log a drill score, then tap CHALLENGE to dare a teammate to beat it!"/>}
{resolved.map(ch=>{
  const isMine=ch.from===u.email;const dr=drills.find(d=>d.id===ch.drillId);
  const won=isMine?(ch.status==="lost"):(ch.status==="won");const tied=ch.status==="tied";const isPending=ch.status==="pending";
  const oppName=isMine?ch.toName:ch.fromName;
  const myScore=isMine?ch.score:ch.respScore;const oppScore=isMine?ch.respScore:ch.score;
  const resultColor=isPending?MUTED:won?VOLT:tied?"#C8FF00":"#FF4545";
  const resultText=isPending?"PENDING":won?"YOU WON":tied?"TIE":"YOU LOST";

  return <div key={ch.id+"-"+ch.ts} className="listRow" style={{background:CARD_BG,border:isPending?`1px solid ${ORANGE}22`:undefined}}>
    <div className="listRowLeft">
    <div style={{width:40,height:40,borderRadius:12,background:resultColor+"12",border:`1px solid ${resultColor}33`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
      {isPending?<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
      :won?<svg width="16" height="16" viewBox="0 0 20 20"><path d="M5 10l4 4 6-7" stroke={VOLT} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
      :tied?<span style={{fontFamily:FD,color:"#C8FF00",fontSize:14}}>=</span>
      :<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF4545" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>}
    </div>
    <div className="listRowText" style={{flex:1}}>
      <div className="listRowTitle" style={{fontFamily:FD,fontSize:13}}>{isMine?"YOU":"YOU"} VS {oppName.toUpperCase()}</div>
      <div className="listRowMeta" style={{fontFamily:FB,fontSize:10}}>{ch.drillName} &#183; {isPending?<span className="listRowStatus listRowStatus--wait">Waiting for response</span>:<span className={`listRowStatus ${won?"listRowStatus--won":"listRowStatus--wait"}`}>{resultText}</span>}</div>
    </div>
    </div>
    <div className="listRowRight">
      {isPending?<div className="listRowStat" style={{fontFamily:FD,color:ORANGE}}>{ch.score}</div>
      :<div className="listRowStat" style={{fontFamily:FD,color:won?VOLT:"#FF4545",fontSize:18}}>{myScore||"-"}<span style={{color:MUTED,fontSize:10}}> v </span><span style={{color:won?"#FF4545":VOLT}}>{oppScore}</span></div>}
      <div className="listRowStatSub" style={{fontFamily:FB}}>/{ch.max}</div>
    </div>
  </div>;
})}

  </div>;
}

// ═══════════════════════════════════════
// STRENGTH & CONDITIONING PANEL
// ═══════════════════════════════════════
function SCPanel({sessions,scRsvps,user,toggleScRsvp,scLogs,addScLog}){
const[showBoard,setShowBoard]=useState(false),[expanded,setExpanded]=useState(null);
const[newLog,setNewLog]=useState({date:todayStr(),time:"",place:"",sport:""}),[logErr,setLogErr]=useState(""),[logSaved,setLogSaved]=useState(false);
const sorted=useMemo(()=>[...sessions].sort((a,b)=>a.date.localeCompare(b.date)),[sessions]);
const upcoming=sorted.filter(s=>s.date>=todayStr()),past=sorted.filter(s=>s.date<todayStr());
const myCount=scRsvps.filter(r=>r.email===user.email).length;
const currentYear=String(new Date().getFullYear());
const myAttendanceByDate=useMemo(()=>{
  const dateCounts={};
  const sessionsById={};
  sessions.forEach(s=>{sessionsById[s.id]=s});
  scRsvps.forEach(r=>{
    if(r.email!==user.email)return;
    const session=sessionsById[r.sessionId];
    if(!session?.date||!session.date.startsWith(currentYear))return;
    dateCounts[session.date]=(dateCounts[session.date]||0)+1;
  });
  return Object.entries(dateCounts)
    .sort((a,b)=>a[0].localeCompare(b[0]))
    .map(([date,count])=>({date,count}));
},[sessions,scRsvps,user,currentYear]);
const medals=[VOLT,"#A0A0A0","#A0A0A0"];

const board=useMemo(()=>{const m={};scRsvps.forEach(r=>{if(!m[r.email])m[r.email]={email:r.email,name:r.name,count:0};m[r.email].count++});return Object.values(m).sort((a,b)=>b.count-a.count)},[scRsvps]);

const LiftIcon=({size=24,color="#A0A0A0"})=><svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6.5 6.5h-2a1 1 0 00-1 1v9a1 1 0 001 1h2M17.5 6.5h2a1 1 0 011 1v9a1 1 0 01-1 1h-2M6.5 12h11M1.5 9.5v5M22.5 9.5v5"/></svg>;
const SC_COLOR="#A0A0A0";
const myScLogs=useMemo(()=>scLogs.filter(l=>l.email===user.email),[scLogs,user]);
const handleAddScLog=()=>{
  const date=newLog.date?.trim();
  const time=newLog.time?.trim();
  const place=newLog.place?.trim();
  const sport=newLog.sport?.trim();
  if(!date||!time||!place||!sport){setLogErr("Please complete date, time, place, and sport.");return}
  addScLog({date,time,place,sport,ts:Date.now()});
  setNewLog({date:todayStr(),time:"",place:"",sport:""});
  setLogErr("");
  setLogSaved(true);
  setTimeout(()=>setLogSaved(false),1800);
};

return <div className="fade-up">
{/* S&C banner — heavy, grounded */}
<div style={{background:`linear-gradient(180deg,${SC_COLOR}0c,${CARD_BG})`,borderRadius:18,padding:0,marginBottom:16,border:`1px solid ${SC_COLOR}18`,overflow:"hidden",position:"relative"}}>
<div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at top left, rgba(200, 255, 0, 0.06) 0%, transparent 70%)",pointerEvents:"none"}}/>
<div style={{padding:"18px 22px",display:"flex",alignItems:"center",gap:12,position:"relative"}}>
<div style={{width:42,height:42,borderRadius:12,background:`${SC_COLOR}12`,border:`1px solid ${SC_COLOR}22`,display:"flex",alignItems:"center",justifyContent:"center"}}><LiftIcon size={22} color={SC_COLOR}/></div>
<div>
<div style={{fontFamily:FD,color:SC_COLOR,fontSize:16,letterSpacing:3}}>STRENGTH & CONDITIONING</div>
<div style={{fontFamily:FB,color:MUTED,fontSize:11,marginTop:2}}>Show up. Get stronger. Track sessions.</div>
</div>
</div>
</div>

{/* Personal stats */}
<div style={{display:"flex",gap:8,marginBottom:16}}>
  <div className="grd-bdr" style={{flex:1.5}}><div style={{background:`linear-gradient(145deg,${SURFACE},${CARD_BG})`,borderRadius:16,padding:"18px 16px"}}>
    <AnimNum v={myCount} c={SC_COLOR} big/>
    <div style={{fontFamily:FB,color:T.SUB,fontSize:9,letterSpacing:3,marginTop:6,fontWeight:600}}>SESSIONS ATTENDED</div>
  </div></div>
  <div style={{flex:1,display:"flex",flexDirection:"column",gap:8}}>
    <div style={{flex:1,background:`linear-gradient(145deg,${SURFACE},${CARD_BG})`,borderRadius:14,padding:"12px 12px",border:`1px solid ${BORDER_CLR}`}}>
      <div style={{fontFamily:FD,color:LIGHT,fontSize:22,letterSpacing:1,lineHeight:1}}>{upcoming.length}</div>
      <div style={{fontFamily:FB,color:T.SUB,fontSize:8,letterSpacing:2,marginTop:4,fontWeight:600}}>UPCOMING</div>
    </div>
    <div style={{flex:1,background:`linear-gradient(145deg,${SURFACE},${CARD_BG})`,borderRadius:14,padding:"12px 12px",border:`1px solid ${BORDER_CLR}`}}>
      <div style={{fontFamily:FD,color:SC_COLOR,fontSize:22,letterSpacing:1,lineHeight:1}}>#{board.findIndex(b=>b.email===user.email)+1||"-"}</div>
      <div style={{fontFamily:FB,color:T.SUB,fontSize:8,letterSpacing:2,marginTop:4,fontWeight:600}}>YOUR RANK</div>
    </div>
  </div>
</div>

<div className="grd-bdr" style={{marginBottom:16}}><div style={{background:`linear-gradient(145deg,${SURFACE},${CARD_BG})`,borderRadius:16,padding:"18px 16px"}}>
  <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",gap:10,marginBottom:10}}>
    <div style={{fontFamily:FD,color:SC_COLOR,fontSize:22,letterSpacing:2}}>ATTENDANCE BY DATE ({currentYear})</div>
    <div style={{fontFamily:FD,color:LIGHT,fontSize:30,lineHeight:1}}>{myAttendanceByDate.reduce((a,d)=>a+d.count,0)}</div>
  </div>
  {myAttendanceByDate.length===0
    ?<div style={{fontFamily:FB,color:MUTED,fontSize:12}}>No S&C sessions attended yet this year.</div>
    :<div style={{display:"grid",gap:6}}>
      {myAttendanceByDate.map(entry=><div key={entry.date} style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:BG,border:`1px solid ${BORDER_CLR}`,borderRadius:10,padding:"8px 10px"}}>
        <span style={{fontFamily:FB,color:LIGHT,fontSize:12,fontWeight:700}}>{entry.date}</span>
        <span style={{fontFamily:FD,color:SC_COLOR,fontSize:18,lineHeight:1}}>{entry.count}</span>
      </div>)}
    </div>}
</div></div>

{/* Leaderboard toggle */}
<button onClick={()=>setShowBoard(!showBoard)} className="ch" style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",background:`linear-gradient(135deg,${CARD_BG},#141414)`,border:`1px solid ${BORDER_CLR}`,borderRadius:14,padding:"14px 18px",marginBottom:16,cursor:"pointer",textAlign:"left"}}>
  <div style={{display:"flex",alignItems:"center",gap:10}}><div style={{width:36,height:36,borderRadius:10,background:SC_COLOR+"15",display:"flex",alignItems:"center",justifyContent:"center"}}><LiftIcon size={18} color={SC_COLOR}/></div><div><div style={{fontFamily:FD,color:LIGHT,fontSize:14,letterSpacing:2}}>LIFTING LEADERBOARD</div><div style={{fontFamily:FB,color:T.SUB,fontSize:10,marginTop:1}}>Ranked by sessions attended</div></div></div>
  <svg width="14" height="14" viewBox="0 0 16 16" style={{transform:showBoard?"rotate(90deg)":"none",transition:"transform .2s"}}><path d="M6 3l5 5-5 5" stroke={SC_COLOR} strokeWidth="2" fill="none" strokeLinecap="round"/></svg>
</button>
{showBoard&&<div className="fade-up" style={{marginBottom:20}}>
  {board.length===0&&<Empty t="No attendance yet"/>}
  {board.map((p,i)=>{const isMe=p.email===user.email;return <div key={p.email} style={{display:"flex",alignItems:"center",gap:12,background:CARD_BG,borderRadius:12,padding:"12px 14px",marginBottom:6,border:`1px solid ${isMe?SC_COLOR+"33":BORDER_CLR}`}}>
    <RB r={i+1} m={medals}/>
    <Av n={p.name} sz={30} email={p.email}/>
    <div style={{flex:1,fontFamily:FD,color:LIGHT,fontSize:13,letterSpacing:1}}>{p.name.toUpperCase()}{isMe?" (YOU)":""}</div>
    <div style={{fontFamily:FD,color:SC_COLOR,fontSize:18}}>{p.count}</div>
  </div>})}
</div>}

<SH isCoach={typeof u!=="undefined"&&u?.isCoach} t="SESSION LOG"/>
<div className="grd-bdr" style={{marginBottom:16}}><div style={{background:`linear-gradient(145deg,${SURFACE},${CARD_BG})`,borderRadius:16,padding:"16px"}}>
  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
    <FF l="DATE" v={newLog.date} set={v=>setNewLog({...newLog,date:v})} tp="date"/>
    <FF l="TIME" v={newLog.time} set={v=>setNewLog({...newLog,time:v})} tp="time" ph="6:00 AM"/>
    <div style={{gridColumn:"1 / -1"}}><FF l="PLACE" v={newLog.place} set={v=>setNewLog({...newLog,place:v})} ph="Weight Room — Bay A"/></div>
    <div style={{gridColumn:"1 / -1"}}><FF l="SPORT" v={newLog.sport} set={v=>setNewLog({...newLog,sport:v})} ph="Basketball"/></div>
  </div>
  {logErr&&<div style={{fontFamily:FB,color:"#FF4545",fontSize:11,marginTop:8}}>{logErr}</div>}
  {logSaved&&<div style={{fontFamily:FB,color:SC_COLOR,fontSize:11,marginTop:8}}>Session logged.</div>}
  <button className="btn btn--primary btn-v" onClick={handleAddScLog} style={{marginTop:10,width:"100%"}}>ADD SESSION</button>
</div></div>

<div style={{marginBottom:16,background:"#141414",border:"1px solid #242424",borderRadius:16,minHeight:100,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",padding:"16px"}}>
  <div style={{fontFamily:FD,color:"#C8FF00",fontSize:48,fontWeight:900,lineHeight:1}}>{myScLogs.length}</div>
  <div style={{fontFamily:FB,color:"#A0A0A0",fontSize:11,letterSpacing:"0.08em",fontWeight:700,marginTop:8,textTransform:"uppercase"}}>TOTAL S&C SESSIONS LOGGED</div>
</div>

{/* Upcoming sessions */}
<SH isCoach={typeof u!=="undefined"&&u?.isCoach} t="UPCOMING SESSIONS" s={`${upcoming.length} SCHEDULED`}/>
{upcoming.length===0&&<Empty variant="lifting" t="No upcoming sessions" action="Your coach will add S&C sessions here. Check back soon!"/>}
{upcoming.map(s=>{const sr=scRsvps.filter(r=>r.sessionId===s.id);const going=sr.some(r=>r.email===user.email);const exp=expanded===s.id;
  return <div key={s.id} style={{marginBottom:12}}>
    <button onClick={()=>setExpanded(exp?null:s.id)} className="ch" style={{width:"100%",background:`linear-gradient(135deg,${CARD_BG},#141414)`,border:`1px solid ${going?SC_COLOR+"33":BORDER_CLR}`,borderRadius:exp?"16px 16px 0 0":16,padding:"18px 20px",textAlign:"left",cursor:"pointer",position:"relative",overflow:"hidden"}}>
      {going&&<div style={{position:"absolute",top:0,left:0,width:4,height:"100%",background:SC_COLOR,borderRadius:"4px 0 0 4px"}}/>}
      <div style={{display:"flex",alignItems:"flex-start",gap:14}}>
        <div style={{width:50,height:50,borderRadius:14,background:BG,border:`1px solid ${BORDER_CLR}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><LiftIcon size={24} color={going?SC_COLOR:MUTED}/></div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontFamily:FD,color:LIGHT,fontSize:17,letterSpacing:2}}>{s.sport||s.title}</div>
          <div style={{fontFamily:FB,color:MUTED,fontSize:11,marginTop:3}}><span style={{color:SC_COLOR,fontWeight:700}}>{s.date}</span> &#183; {s.time}</div>
          <div style={{fontFamily:FB,color:T.SUB,fontSize:10,marginTop:1}}>{s.location}</div>
        </div>
        <div style={{textAlign:"right",flexShrink:0}}><div style={{fontFamily:FD,color:sr.length>0?SC_COLOR:MUTED,fontSize:20}}>{sr.length}</div><div style={{fontFamily:FB,color:MUTED,fontSize:9,letterSpacing:1}}>GOING</div></div>
      </div>
    </button>
    {exp&&<div className="fade-up" style={{background:`linear-gradient(180deg,${CARD_BG},#141414)`,borderRadius:"0 0 16px 16px",padding:"16px 20px",border:`1px solid ${BORDER_CLR}`,borderTop:"none"}}>
      {s.desc&&<p style={{fontFamily:FB,color:MUTED,fontSize:12,lineHeight:1.6,marginBottom:14}}>{s.desc}</p>}
      <button className="btn btn--secondary btn--sm btn-v chipBtn" onClick={()=>toggleScRsvp(s.id)} style={{width:"100%"}}>
        {going?<>&#10003; YOU'RE IN — TAP TO CANCEL</>:<><LiftIcon size={16} color={BG}/> RSVP NOW</>}
      </button>
      {sr.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:12}}>{sr.map((r,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:4,background:CARD_BG,borderRadius:8,padding:"4px 8px",border:`1px solid ${BORDER_CLR}`}}><Av n={r.name} sz={20} email={r.email}/><span style={{fontFamily:FB,color:LIGHT,fontSize:10,fontWeight:600}}>{r.name}</span></div>)}</div>}
    </div>}
  </div>;
})}

{/* Past sessions */}
{past.length>0&&<><CourtDivider color={SC_COLOR} my={12}/><SH isCoach={typeof u!=="undefined"&&u?.isCoach} t="PAST SESSIONS" s={`${past.length} COMPLETED`}/>
  {past.map(s=>{const sr=scRsvps.filter(r=>r.sessionId===s.id);const went=sr.some(r=>r.email===user.email);
    return <div key={s.id} style={{display:"flex",alignItems:"center",gap:12,background:CARD_BG,borderRadius:12,padding:"12px 16px",marginBottom:6,border:`1px solid ${BORDER_CLR}`,opacity:.7}}>
      <div style={{width:36,height:36,borderRadius:10,background:went?SC_COLOR+"12":BG,border:`1px solid ${went?SC_COLOR+"33":BORDER_CLR}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><LiftIcon size={16} color={went?SC_COLOR:MUTED}/></div>
      <div style={{flex:1,minWidth:0}}><div style={{fontFamily:FD,color:LIGHT,fontSize:13,letterSpacing:1}}>{s.sport||s.title}</div><div style={{fontFamily:FB,color:T.SUB,fontSize:10,marginTop:1}}>{s.date} &#183; {sr.length} attended</div></div>
      {went&&<span style={{fontFamily:FB,fontSize:8,fontWeight:700,color:SC_COLOR,background:SC_COLOR+"12",padding:"2px 8px",borderRadius:4,letterSpacing:1}}>ATTENDED</span>}
    </div>;
  })}</>}

  </div>;
}


function StatTile({value,label,color}){
return <div style={{background:CARD_BG,border:`1px solid ${BORDER_CLR}`,borderRadius:14,padding:"12px 10px",minHeight:98,display:"flex",flexDirection:"column",justifyContent:"space-between",boxShadow:"inset 0 1px 0 rgba(255,255,255,0.02)"}}><div style={{fontFamily:FD,color:color||LIGHT,fontSize:24,lineHeight:1.05,wordBreak:"break-word"}}>{value}</div><div style={{fontFamily:FB,color:TOKENS.TEXT_SECONDARY,fontSize:10,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase"}}>{label}</div></div>
}

function ModeCard({title,subtitle,icon,stats,accent="home",isActive,onClick}){
const accentMap={
home:{tint:MODE_CARD_TOKENS.HOME_TINT,glow:MODE_CARD_TOKENS.HOME_GLOW,iconStroke:VOLT},
program:{tint:MODE_CARD_TOKENS.PROGRAM_TINT,glow:MODE_CARD_TOKENS.PROGRAM_GLOW,iconStroke:CYAN}
};
const a=accentMap[accent]||accentMap.home;
const baseBorder=isActive?`1.5px solid ${a.glow}`:`1.5px solid ${MODE_CARD_TOKENS.BASE_BORDER}`;
const baseShadow=isActive?`0 14px 32px rgba(0,0,0,.45), 0 0 0 1px ${a.glow} inset`:MODE_CARD_TOKENS.BASE_SHADOW;
return <button type="button" onClick={onClick} className="mode-card" style={{width:"100%",background:`radial-gradient(circle at 12% 10%, ${a.tint} 0%, transparent 55%), ${MODE_CARD_TOKENS.BASE_BG}`,border:baseBorder,borderRadius:24,padding:22,cursor:"pointer",textAlign:"left",position:"relative",minHeight:272,display:"flex",flexDirection:"column",justifyContent:"space-between",boxShadow:baseShadow,transition:"transform .12s ease, border-color .2s ease, box-shadow .2s ease"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=a.glow;e.currentTarget.style.boxShadow=`0 16px 34px rgba(0,0,0,.48), 0 0 0 1px ${a.glow} inset, 0 0 24px ${a.glow}`}} onMouseLeave={e=>{e.currentTarget.style.border=baseBorder;e.currentTarget.style.boxShadow=baseShadow;e.currentTarget.style.transform="scale(1)"}} onMouseDown={e=>{e.currentTarget.style.transform="scale(0.99)";e.currentTarget.style.boxShadow=`0 0 0 2px ${a.glow}, 0 14px 28px rgba(0,0,0,.45)`}} onMouseUp={e=>{e.currentTarget.style.transform="scale(1)"}} onFocus={e=>{e.currentTarget.style.outline="none";e.currentTarget.style.boxShadow=`0 0 0 3px ${MODE_CARD_TOKENS.FOCUS_RING}, 0 14px 28px rgba(0,0,0,.45), 0 0 0 1px ${a.glow} inset`}} onBlur={e=>{e.currentTarget.style.boxShadow=baseShadow;e.currentTarget.style.transform="scale(1)"}}>
  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,marginBottom:16}}>
    <div style={{display:"flex",alignItems:"center",gap:12,minWidth:0}}>
      <div style={{width:50,height:50,borderRadius:14,background:MODE_CARD_TOKENS.ICON_INNER,border:`1.5px solid ${a.glow}`,boxShadow:`inset 0 0 10px ${a.glow}`,display:"flex",alignItems:"center",justifyContent:"center",color:a.iconStroke,flexShrink:0}}>{icon}</div>
      <div style={{minWidth:0}}>
        <div style={{fontFamily:FD,color:LIGHT,fontSize:22,letterSpacing:2.5,lineHeight:1,textTransform:"uppercase"}}>{title}</div>
        <div style={{fontFamily:FB,color:TOKENS.TEXT_SECONDARY,fontSize:11,fontWeight:600,marginTop:5,letterSpacing:"0.04em"}}>{subtitle}</div>
      </div>
    </div>
    <div className="iconBtn"><svg width="16" height="16" viewBox="0 0 16 16"><path d="M6 3l5 5-5 5" stroke={a.iconStroke} strokeWidth="2.2" fill="none" strokeLinecap="round"/></svg></div>
  </div>
  <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:10}}>{stats.map(s=><StatTile key={s.label} value={s.value} label={s.label} color={s.color}/>)}</div>
</button>
}

// ═══════════════════════════════════════
// DASHBOARD LEADERBOARD — The hero section
// ═══════════════════════════════════════
function DashboardLeaderboard({scores,drills,programDrills,user,scRsvps,rsvps,shotLogs}){
const[mode,setMode]=useState("home");
const[sub,setSub]=useState("shots");
const medals=[VOLT,"#A0A0A0","#A0A0A0"];
const homeScores=useMemo(()=>scores.filter(s=>s.src==="home"||!s.src),[scores]);
const progScores=useMemo(()=>scores.filter(s=>s.src==="program"),[scores]);

const board=useMemo(()=>{
if(mode==="home"){
const m={};
shotLogs.forEach(s=>{
if(!m[s.email])m[s.email]={email:s.email,name:s.name||s.email,total:0,lastDate:s.date||""};
m[s.email].total+=s.made;
if((s.date||"")>(m[s.email].lastDate||""))m[s.email].lastDate=s.date;
});
return Object.values(m).sort((a,b)=>b.total-a.total);
}
// Program
if(sub==="events"){
const m={};rsvps.forEach(r=>{if(!m[r.email])m[r.email]={email:r.email,name:r.name,total:0};m[r.email].total++});return Object.values(m).sort((a,b)=>b.total-a.total);
}
if(sub==="sc"){
const m={};scRsvps.forEach(r=>{if(!m[r.email])m[r.email]={email:r.email,name:r.name,total:0};m[r.email].total++});return Object.values(m).sort((a,b)=>b.total-a.total);
}
if(sub.startsWith("prog-")){const did=parseInt(sub.slice(5));const m={};progScores.filter(s=>s.drillId===did).forEach(s=>{if(!m[s.email])m[s.email]={email:s.email,name:s.name||s.email,total:0};m[s.email].total+=s.score});return Object.values(m).sort((a,b)=>b.total-a.total);}
const m={};progScores.forEach(s=>{if(!m[s.email])m[s.email]={email:s.email,name:s.name||s.email,total:0};m[s.email].total+=s.score});
return Object.values(m).sort((a,b)=>b.total-a.total);
},[homeScores,progScores,mode,sub,scores,scRsvps,rsvps,shotLogs,programDrills]);

const isHome=mode==="home";
const accentColor=isHome?VOLT:CYAN;
const unit=sub==="shots"?"makes":sub==="events"?"events":sub==="sc"?"sessions":"makes";
const title=isHome?"AT HOME":"PROGRAM";
const modeStyles={
home:{accent:VOLT,bg:"rgba(200, 255, 0, 0.14)",glow:"0 0 18px rgba(200, 255, 0, 0.28)",label:"🏠"},
prog:{accent:CYAN,bg:"rgba(0, 229, 255, 0.14)",glow:"0 0 18px rgba(0, 229, 255, 0.28)",label:"📅"}
};

// Swap sub when switching modes
const switchMode=(m)=>{setMode(m);setSub(m==="home"?"shots":"events")};

return <div>
{/* Mode toggle */}
<div style={{display:"flex",gap:8,background:"#121212",borderRadius:14,padding:6,marginBottom:16,border:"1px solid rgba(200, 255, 0, 0.24)"}}>
{[{k:"home",l:"AT HOME"},{k:"prog",l:"PROGRAM"}].map(m=>{
const active=mode===m.k;
const thisMode=modeStyles[m.k];
return <button key={m.k} onClick={()=>switchMode(m.k)} style={{flex:1,padding:"10px 0",borderRadius:10,border:`1px solid ${active?thisMode.accent+"AA":"#353535"}`,cursor:"pointer",fontFamily:FB,fontSize:13,fontWeight:700,letterSpacing:2,transition:"all 180ms ease",background:active?`linear-gradient(180deg, ${thisMode.bg}, #131313 85%)`:"#171717",color:active?thisMode.accent:"#7A7A7A",boxShadow:active?thisMode.glow:"none",display:"flex",alignItems:"center",justifyContent:"center",gap:8,textShadow:active?`0 0 8px ${thisMode.accent}55`:"none"}}><span aria-hidden="true" style={{fontSize:12,lineHeight:1,opacity:active?1:.65}}>{thisMode.label}</span>{m.l}</button>
})}
</div>

{/* Sub-tabs */}
<div style={{overflowX:"auto",marginBottom:16,paddingBottom:4,paddingLeft:16,WebkitOverflowScrolling:"touch",scrollbarWidth:"none",msOverflowStyle:"none"}}>
  <div style={{display:"flex",gap:8,minWidth:"max-content"}}>
    {isHome?
      [{k:"shots",l:"SHOT MAKES"}].map(t=>
        <button key={t.k} onClick={()=>setSub(t.k)} style={{height:32,padding:"0 14px",borderRadius:20,border:sub===t.k?"none":"1px solid #333333",cursor:"pointer",fontFamily:FB,fontSize:11,fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",whiteSpace:"nowrap",background:sub===t.k?"#C8FF00":"#1E1E1E",color:sub===t.k?"#000000":"#555555",transition:"all .2s"}}>{t.l}</button>)
    :[{k:"events",l:"ATTENDANCE"},{k:"sc",l:"S&C"},{k:"prog-total",l:"DRILL SCORES"},...programDrills.map(d=>({k:`prog-${d.id}`,l:d.name}))].map(t=>
        <button key={t.k} onClick={()=>setSub(t.k)} style={{height:32,padding:"0 14px",borderRadius:20,border:sub===t.k?"none":"1px solid #333333",cursor:"pointer",fontFamily:FB,fontSize:11,fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",whiteSpace:"nowrap",background:sub===t.k?CYAN:"#1E1E1E",color:sub===t.k?"#041014":"#555555",transition:"all .2s",boxShadow:sub===t.k?"0 0 14px rgba(0, 229, 255, 0.35)":"none"}}>{t.l}</button>)}
  </div>
</div>

{/* Title */}
<div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
  <div style={{width:4,height:22,borderRadius:2,background:accentColor}}/>
  <div style={{fontFamily:FD,color:accentColor,fontSize:18,letterSpacing:3,flex:1}}>{title} LEADERBOARD</div>
  <div style={{fontFamily:FB,color:T.SUB,fontSize:10,letterSpacing:2,fontWeight:600}}>{board.length}</div>
</div>

{/* Board */}
<div key={mode+sub} className="slide-r">
{board.length===0&&<Empty variant="leaderboard" t={`No ${unit} logged yet`} action="Log a drill score to get on the board!" onTap={null}/>}

{/* YOUR POSITION — sticky anchor */}
{(()=>{const myIdx=board.findIndex(p=>p.email===user.email);const myEntry=board[myIdx];
  if(myIdx<0)return null;
  return <div style={{background:"rgba(10, 12, 14, 0.94)",backgroundClip:"padding-box",borderRadius:14,padding:"12px 16px",marginBottom:14,border:`2px solid ${accentColor}44`,display:"flex",alignItems:"center",gap:12,position:"sticky",top:0,zIndex:5,backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)"}}>
    <div style={{width:4,height:28,borderRadius:2,background:accentColor,flexShrink:0}}/>
    <div style={{fontFamily:FD,color:accentColor,fontSize:24}}>#{myIdx+1}</div>
    <div style={{flex:1,minWidth:0}}>
      <div style={{fontFamily:FB,color:LIGHT,fontSize:12,fontWeight:700,letterSpacing:1}}>YOUR POSITION</div>
	      <div style={{fontFamily:FB,color:T.SUB,fontSize:10,marginTop:1}}>{myEntry.total} {unit}{isHome&&myEntry.lastDate?` · ${myEntry.lastDate}`:""}</div>
    </div>
    {myIdx>0&&<div style={{fontFamily:FB,color:T.SUB,fontSize:9,fontWeight:600,letterSpacing:1}}>{board[myIdx-1].total-myEntry.total} to #{myIdx}</div>}
  </div>})()}

<div className="lbList">
{board.map((p,i)=>{
  const isMe=p.email===user.email;
  const isLeader=i===0&&board.length>1;
  const isTop3=i<3;
  const leaderTotal=board[0]?.total||1;
  const pct=Math.round((p.total/leaderTotal)*100);
  const rowBg=i%2===0?CARD_BG:T.SURFACE;

  if(isLeader) return <div key={p.email} className="podium-glow lbRow listRow" style={{"--pod-c":accentColor,background:"rgba(10, 12, 14, 0.94)",backgroundClip:"padding-box",border:`2px solid ${accentColor}33`,position:"relative",overflow:"hidden"}}>
    <div className="decorativeLine" style={{position:"absolute",top:0,left:0,width:4,height:"100%",background:accentColor,borderRadius:"4px 0 0 4px"}}/>
    <div className="listRowLeft">
    <div className="lbRank" style={{background:`${accentColor}18`,border:`2px solid ${accentColor}`,fontFamily:FD,fontSize:14,color:accentColor}}>👑</div>
    <div className="lbAvatar playersAvatarRing"><Av n={p.name} sz={40} email={p.email}/></div>
    <div className="lbMain listRowText">
      <div className="lbName listRowTitle">{p.name.toUpperCase()}{isMe&&<span style={{fontFamily:FB,fontSize:9,fontWeight:700,padding:"2px 6px",borderRadius:4,background:accentColor,color:BG,marginLeft:6,letterSpacing:1}}>YOU</span>}</div>
      <div className="lbMeta listRowMeta" style={{color:accentColor,opacity:1,fontSize:9,letterSpacing:2,fontWeight:700,marginTop:2}}>#1{isHome&&p.lastDate?` · ${p.lastDate}`:""}</div>
    </div>
    </div>
    <div className="listRowRight" style={{minWidth:0}}>
      <div className="lbMetric listRowStat" style={{color:accentColor,fontSize:28}}>{p.total}</div>
      <div className="listRowStatSub" style={{fontFamily:FB,fontSize:8,fontWeight:600}}>{unit.toUpperCase()}</div>
    </div>
  </div>;

  return <div key={p.email} className="lbRow listRow" style={{background:isMe?"rgba(10, 12, 14, 0.94)":rowBg,backgroundClip:"padding-box",border:isMe?`2px solid ${accentColor}44`:`1px solid ${BORDER_CLR}`,position:"relative",overflow:"hidden"}}>
    {isTop3&&<div className="decorativeLine" style={{position:"absolute",top:0,left:0,width:3,height:"100%",background:accentColor+"66",borderRadius:"3px 0 0 3px"}}/>}
    {isMe&&<div className="decorativeLine" style={{position:"absolute",top:0,left:0,width:3,height:"100%",background:accentColor,borderRadius:"3px 0 0 3px"}}/>}
    <div className="listRowLeft">
    <div className="lbRank"><RB r={i+1} m={medals}/></div>
    <div className="lbAvatar"><Av n={p.name} sz={32} email={p.email}/></div>
    <div className="lbMain listRowText">
      <div className="lbName listRowTitle" style={{fontSize:13,fontWeight:isMe?700:600}}>{p.name.toUpperCase()}{isMe&&<span style={{fontFamily:FB,fontSize:8,fontWeight:700,padding:"1px 5px",borderRadius:4,background:accentColor,color:BG,marginLeft:6,letterSpacing:1,verticalAlign:"middle"}}>YOU</span>}</div>
      {isHome&&p.lastDate&&<div className="lbMeta listRowMeta" style={{fontSize:9,marginTop:2}}>{p.lastDate}</div>}
      <div className="decorativeLine" style={{marginTop:5,height:3,borderRadius:2,background:T.TRACK,overflow:"hidden"}}>
        <div style={{width:`${pct}%`,height:"100%",background:isMe?accentColor:isTop3?accentColor:accentColor+"66",borderRadius:2,transition:"width .4s ease"}}/>
      </div>
    </div>
    </div>

    <div className="listRowRight" style={{minWidth:0}}>
      <div className="lbMetric listRowStat" style={{color:isMe?accentColor:isTop3?accentColor:LIGHT}}>{p.total}</div>
      <div className="listRowStatSub" style={{fontFamily:FB,fontSize:8,fontWeight:500}}>{unit.toUpperCase()}</div>
    </div>
  </div>;
})}
</div>
</div>

  </div>;
}

// ═══════════════════════════════════════
// SHOT TRACKER — Log makes by date with running totals
// ═══════════════════════════════════════
function ShotTracker({u,shotLogs,addShotLog,shotMade,setShotMade,shotDate,setShotDate,shotSaved,setShotSaved}){
const my=useMemo(()=>shotLogs.filter(s=>s.email===u.email),[shotLogs,u]);
const today=todayStr();

const handleLog=()=>{
const v=parseInt(shotMade);if(isNaN(v)||v<=0)return;
addShotLog(v,shotDate);setShotSaved(true);setShotMade("");
setTimeout(()=>setShotSaved(false),1800);
};

// Running totals
const todayTotal=useMemo(()=>my.filter(s=>s.date===today).reduce((a,s)=>a+s.made,0),[my,today]);
const weekTotal=useMemo(()=>{
const d=new Date();const day=d.getDay();const start=new Date(d.getFullYear(),d.getMonth(),d.getDate()-day);const startStr=`${start.getFullYear()}-${String(start.getMonth()+1).padStart(2,"0")}-${String(start.getDate()).padStart(2,"0")}`;
return my.filter(s=>s.date>=startStr&&s.date<=today).reduce((a,s)=>a+s.made,0);
},[my,today]);
const monthTotal=useMemo(()=>{const mo=today.slice(0,7);return my.filter(s=>s.date.startsWith(mo)).reduce((a,s)=>a+s.made,0)},[my,today]);
const yearTotal=useMemo(()=>{const yr=today.slice(0,4);return my.filter(s=>s.date.startsWith(yr)).reduce((a,s)=>a+s.made,0)},[my,today]);
const allTime=useMemo(()=>my.reduce((a,s)=>a+s.made,0),[my]);

return <div className="fade-up">
{/* Header */}
{/* Shot Tracker banner — arc-inspired */}
<div style={{background:`linear-gradient(180deg,${ORANGE}08,${CARD_BG})`,borderRadius:18,padding:"18px 22px",marginBottom:16,border:`1px solid ${ORANGE}12`,position:"relative",overflow:"hidden"}}>
<div style={{position:"absolute",top:-20,right:20,opacity:.06}}><svg width="80" height="80" viewBox="0 0 40 40" fill="none"><circle cx="20" cy="20" r="17" stroke={ORANGE} strokeWidth="3"/><path d="M3 20h34" stroke={ORANGE} strokeWidth="2"/></svg></div>

<div style={{display:"flex",alignItems:"center",gap:12,position:"relative"}}>
<div style={{width:42,height:42,borderRadius:12,background:`${ORANGE}12`,border:`1px solid ${ORANGE}22`,display:"flex",alignItems:"center",justifyContent:"center"}}>
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={ORANGE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
</div>
<div>
<div style={{fontFamily:FD,color:ORANGE,fontSize:16,letterSpacing:3}}>SHOT TRACKER</div>
<div style={{fontFamily:FB,color:MUTED,fontSize:11,marginTop:2}}>Log makes · Running totals · Heat map</div>
</div>
</div>
</div>

{/* Running totals */}
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
  <div className="grd-bdr" style={{gridColumn:"1/3"}}><div style={{background:`linear-gradient(145deg,${SURFACE},${CARD_BG})`,borderRadius:16,padding:"18px 16px"}}>
    <AnimNum v={allTime} c={VOLT} big/><div style={{fontFamily:FB,color:T.SUB,fontSize:10,letterSpacing:3,marginTop:6,fontWeight:600}}>ALL-TIME MAKES</div>
  </div></div>
  {[{l:"TODAY",v:todayTotal,c:LIGHT},{l:"THIS WEEK",v:weekTotal,c:VOLT},{l:"THIS MONTH",v:monthTotal,c:CYAN},{l:"THIS YEAR",v:yearTotal,c:ORANGE}].map((s,i)=>
    <div key={i} style={{background:`linear-gradient(145deg,${SURFACE},${CARD_BG})`,borderRadius:14,padding:"14px 14px",border:`1px solid ${BORDER_CLR}`}}>
      <AnimNum v={s.v} c={s.c}/>
      <div style={{fontFamily:FB,color:T.SUB,fontSize:9,letterSpacing:2,marginTop:4,fontWeight:600}}>{s.l}</div>
    </div>
  )}
</div>

{/* Input card */}
<div style={{background:`linear-gradient(135deg,${CARD_BG},#141414)`,borderRadius:18,padding:"24px 22px",border:`1px solid ${BORDER_CLR}`,marginBottom:20}}>
  <div style={{fontFamily:FD,color:LIGHT,fontSize:16,letterSpacing:3,marginBottom:18}}>LOG MADE SHOTS</div>

  {shotSaved?<div style={{textAlign:"center",padding:"24px 0"}}>
    <div style={{width:60,height:60,borderRadius:"50%",background:VOLT+"15",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}><svg width="28" height="28" viewBox="0 0 40 40"><path d="M10 20l8 8 12-14" stroke={VOLT} strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
    <div style={{fontFamily:FD,color:VOLT,fontSize:22,letterSpacing:4}}>SHOTS LOGGED</div>
  </div>
  :<>
    <div style={{display:"flex",gap:10,marginBottom:16}}>
      <div style={{flex:1}}>
        <label style={{fontFamily:FB,color:"#A0A0A0",fontSize:10,fontWeight:700,letterSpacing:3,display:"block",marginBottom:6}}>SHOTS MADE</label>
        <input type="number" min="1" value={shotMade} onChange={e=>setShotMade(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLog()} placeholder="0" style={{width:"100%",padding:"16px 14px",background:BG,border:`2px solid ${ORANGE}66`,borderRadius:14,color:ORANGE,fontFamily:FD,fontSize:36,textAlign:"center",outline:"none",letterSpacing:2}} onFocus={e=>e.target.style.borderColor=ORANGE} onBlur={e=>e.target.style.borderColor=ORANGE+"66"}/>
      </div>
      <div style={{flex:1}}>
        <label style={{fontFamily:FB,color:"#A0A0A0",fontSize:10,fontWeight:700,letterSpacing:3,display:"block",marginBottom:6}}>DATE</label>
        <input type="date" value={shotDate} onChange={e=>setShotDate(e.target.value)} max={today} style={{width:"100%",padding:"16px 10px",background:BG,border:`1px solid ${BORDER_CLR}`,borderRadius:14,color:LIGHT,fontFamily:FB,fontSize:16,fontWeight:600,outline:"none",textAlign:"center"}} onFocus={e=>e.target.style.borderColor=ORANGE+"66"} onBlur={e=>e.target.style.borderColor=BORDER_CLR}/>
      </div>
    </div>
    <button className="btn btn--primary btn-v" onClick={handleLog} style={{width:"100%"}}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={BG} strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
      LOG SHOTS
    </button>
  </>}
</div>

{/* Heat Map Calendar */}
{my.length>0||true?<>
  <CourtDivider color={ORANGE} my={12}/>
  <SH isCoach={typeof u!=="undefined"&&u?.isCoach} t="SHOT HEAT MAP" s="LAST 12 WEEKS"/>
  {(()=>{
    const dayMap={};my.forEach(s=>{if(!dayMap[s.date])dayMap[s.date]=0;dayMap[s.date]+=s.made});
    const maxCount=Math.max(1,...Object.values(dayMap));
    const cells=[];
    const end=new Date(today);
    const mondayOffset=(end.getDay()+6)%7;
    end.setDate(end.getDate()-mondayOffset);

    for(let w=0;w<12;w++){
      for(let day=0;day<7;day++){
        const dd=new Date(end);
        dd.setDate(dd.getDate()-(11-w)*7+day);
        const ds=`${dd.getFullYear()}-${String(dd.getMonth()+1).padStart(2,"0")}-${String(dd.getDate()).padStart(2,"0")}`;
        const count=dayMap[ds]||0;
        const isFuture=ds>today;
        cells.push({date:ds,count,isFuture,isToday:ds===today,dayIndex:day,weekIndex:w,monthKey:`${dd.getFullYear()}-${String(dd.getMonth()+1).padStart(2,"0")}`,monthLabel:dd.toLocaleString("en-US",{month:"short"})});
      }
    }

    const monthLabels=[];
    cells.filter(c=>c.dayIndex===0).forEach(c=>{if(monthLabels.at(-1)?.key!==c.monthKey)monthLabels.push({key:c.monthKey,label:c.monthLabel,weekIndex:c.weekIndex});});
    const dayLabels=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
    const getColor=(c)=>{if(c===0)return BORDER_CLR;const intensity=Math.min(c/Math.max(maxCount*.6,20),1);const r=parseInt(VOLT.slice(1,3),16);const g=parseInt(VOLT.slice(3,5),16);const b=parseInt(VOLT.slice(5,7),16);return `rgba(${r},${g},${b},${.14+intensity*.86})`};

    return <div style={{overflowX:"auto",paddingBottom:8}}>
      <div style={{minWidth:250,width:"fit-content"}}>
        <div style={{display:"grid",gridTemplateColumns:"42px repeat(12, 1fr)",columnGap:4,marginBottom:6}}>
          <div/>
          {monthLabels.map(m=><div key={m.key} style={{gridColumn:`${m.weekIndex+2} / span 1`,fontFamily:FB,fontSize:8,color:MUTED,fontWeight:700,letterSpacing:.6}}>{m.label}</div>)}
        </div>

        <div style={{display:"grid",gridTemplateColumns:"42px repeat(12, 1fr)",gap:4,alignItems:"center"}}>
          {dayLabels.map((label,dayIndex)=><div key={label} style={{display:"contents"}}>
            <div style={{fontFamily:FB,fontSize:8,color:MUTED,fontWeight:700}}>{label}</div>
            {Array.from({length:12}).map((_,weekIndex)=>{
              const day=cells[weekIndex*7+dayIndex];
              return <div key={`${label}-${weekIndex}`} title={`${day.date}: ${day.count} makes`} style={{width:12,height:12,borderRadius:3,background:day.isFuture?"transparent":getColor(day.count),border:day.isToday?`1.5px solid ${ORANGE}`:day.isFuture?`1px dashed ${BORDER_CLR}`:`1px solid ${day.count?getColor(day.count):BORDER_CLR}66`,opacity:day.isFuture?.35:1,justifySelf:"center"}}/>;
            })}
          </div>)}
        </div>
      </div>

      <div style={{display:"flex",alignItems:"center",gap:4,marginTop:10,justifyContent:"flex-end"}}>
        <span style={{fontFamily:FB,fontSize:8,color:MUTED}}>Less</span>
        {[0,.2,.4,.7,1].map((v,i)=><div key={i} style={{width:10,height:10,borderRadius:2,background:`rgba(200,255,0,${.1+v*.9})`,border:`1px solid ${VOLT}22`}}/>)}
        <span style={{fontFamily:FB,fontSize:8,color:MUTED}}>More</span>
      </div>
    </div>;
  })()}
</>:null}
{my.length===0&&<Empty t="No shots logged yet" action="Track your makes from any session — gym, driveway, anywhere. Every shot counts!"/>}

  </div>;
}

// ═══════════════════════════════════════
function ProgramDrillsPanel({user,drills,scores,addScore}){
const[active,setActive]=useState(null),[val,setVal]=useState(""),[saved,setSaved]=useState(false);
const byDrill=useMemo(()=>{const m={};drills.forEach(d=>{m[d.id]=scores.filter(s=>s.src==="program"&&s.drillId===d.id)});return m;},[drills,scores]);
const submit=()=>{if(!active)return;const n=parseInt(val);if(isNaN(n)||n<0||n>active.max)return;addScore(active.id,n,"program");setSaved(true);setVal("");setTimeout(()=>setSaved(false),1200)};
if(drills.length===0)return <div style={{marginBottom:14}}><SH isCoach={typeof u!=="undefined"&&u?.isCoach} t="PROGRAM DRILLS" s="COACH ADDED"/><Empty variant="drills" t="No drills assigned yet" subtitle="Your coach hasn't added drills for you yet. You can still log shots to build your streak today." cta="LOG SHOTS" ctaVariant="primary" secondaryCta="CONTACT COACH" secondaryCtaVariant="tertiary" onTap={()=>setTab("log-drill")}/></div>;
return <div style={{marginBottom:16}}><SH isCoach={typeof u!=="undefined"&&u?.isCoach} t="PROGRAM DRILLS" s={`${drills.length} ACTIVE`}/>{drills.map(d=>{const rows=byDrill[d.id]||[];const board=Object.values(rows.reduce((m,s)=>{if(!m[s.email])m[s.email]={email:s.email,name:s.name||s.email,total:0};m[s.email].total+=s.score;return m;},{})).sort((a,b)=>b.total-a.total).slice(0,3);return <div key={d.id} style={{background:CARD_BG,border:`1px solid ${active?.id===d.id?CYAN+"55":BORDER_CLR}`,borderRadius:12,padding:"12px 14px",marginBottom:8}}><button onClick={()=>setActive(active?.id===d.id?null:d)} style={{width:"100%",background:"none",border:"none",padding:0,cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:10}}><DrillIcon type={d.icon} size={18}/><div style={{flex:1}}><div style={{fontFamily:FD,color:LIGHT,fontSize:13,letterSpacing:1}}>{d.name}</div><div style={{fontFamily:FB,color:T.SUB,fontSize:10}}>{d.desc}</div></div><div style={{fontFamily:FB,color:CYAN,fontSize:9,fontWeight:700}}>{rows.length} LOGS</div></button>{active?.id===d.id&&<div style={{marginTop:10}}><div style={{fontFamily:FB,color:MUTED,fontSize:9,marginBottom:6}}>TEAM LEADERBOARD {board.length>0&&"(TOTAL SCORES)"}</div>{board.length===0?<div style={{fontFamily:FB,color:T.SUB,fontSize:10,marginBottom:8}}>No scores yet.</div>:board.map((p,i)=><div key={p.email} style={{display:"flex",justifyContent:"space-between",fontFamily:FB,fontSize:11,color:LIGHT,marginBottom:4}}><span>#{i+1} {p.name}</span><span style={{color:CYAN,fontWeight:700}}>{p.total}</span></div>)}<div style={{display:"flex",gap:6,marginTop:8}}><input value={val} onChange={e=>setVal(e.target.value)} type="number" placeholder={`0-${d.max}`} style={{flex:1,padding:9,background:BG,border:`1px solid ${BORDER_CLR}`,borderRadius:8,color:LIGHT}}/><button onClick={submit} style={{padding:"9px 12px",background:CYAN,color:BG,border:"none",borderRadius:8,fontFamily:FD,fontSize:11,letterSpacing:1,cursor:"pointer"}}>LOG</button></div>{saved&&<div style={{fontFamily:FB,color:CYAN,fontSize:10,marginTop:6}}>Score saved for {user.name}.</div>}</div>}</div>})}</div>;
}

// EVENTS PANEL (Player Program View)
// ═══════════════════════════════════════
function EventsPanel({events,rsvps,user,toggleRsvp,scores,drills}){
const[expanded,setExpanded]=useState(null),[showBoard,setShowBoard]=useState(false),[lbMode,setLbMode]=useState("attend"),[rankFx,setRankFx]=useState(false),[lastRank,setLastRank]=useState(null),[rankBarPct,setRankBarPct]=useState(0),[rankBarPulse,setRankBarPulse]=useState(false);
const sorted=useMemo(()=>[...events].sort((a,b)=>a.date.localeCompare(b.date)),[events]);
const upcoming=sorted.filter(e=>e.date>=todayStr()),past=sorted.filter(e=>e.date<todayStr());
const myRsvps=rsvps.filter(r=>r.email===user.email).length,myTier=getTier(myRsvps);
const prefersReducedMotion=useMemo(()=>typeof window!=="undefined"&&window.matchMedia("(prefers-reduced-motion: reduce)").matches,[]);
const nextTier=useMemo(()=>[...TIERS].find(t=>t.min>myRsvps),[myRsvps]);
const rankProgressPct=useMemo(()=>nextTier?Math.round(myRsvps/nextTier.min*100):null,[myRsvps,nextTier]);
useEffect(()=>{if(lastRank===null){setLastRank(myTier.name);return;}if(lastRank!==myTier.name){setRankFx(true);setLastRank(myTier.name);const t=setTimeout(()=>setRankFx(false),650);return ()=>clearTimeout(t);}},[myTier.name,lastRank]);
useEffect(()=>{
  if(rankProgressPct===null)return;
  if(prefersReducedMotion){setRankBarPct(rankProgressPct);setRankBarPulse(false);return;}
  setRankBarPulse(false);
  setRankBarPct(0);
  const raf=requestAnimationFrame(()=>setRankBarPct(rankProgressPct));
  const pulseStart=setTimeout(()=>setRankBarPulse(true),600);
  const pulseEnd=setTimeout(()=>setRankBarPulse(false),800);
  return ()=>{cancelAnimationFrame(raf);clearTimeout(pulseStart);clearTimeout(pulseEnd);};
},[rankProgressPct,prefersReducedMotion]);

const attendBoard=useMemo(()=>{const m={};rsvps.forEach(r=>{if(!m[r.email])m[r.email]={email:r.email,name:r.name,count:0};m[r.email].count++});return Object.values(m).sort((a,b)=>b.count-a.count)},[rsvps]);
const medals=[VOLT,"#A0A0A0","#A0A0A0"];

return <div className="fade-up">
{/* Events banner — structured, timeline-oriented */}
<div style={{background:`linear-gradient(135deg,${VOLT}04,${CARD_BG})`,borderRadius:18,padding:"20px 22px",marginBottom:16,border:`1px solid ${BORDER_CLR}`,position:"relative",overflow:"hidden"}}>

<div className="sectionContent" style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
<div className="uiDecor" aria-hidden="true" style={{width:42,height:42,borderRadius:12,background:`${VOLT}08`,border:`1px solid ${VOLT}10`,display:"flex",alignItems:"center",justifyContent:"center"}}>
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={VOLT} strokeWidth="2"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
</div>
<div>
<div style={{fontFamily:FD,color:LIGHT,fontSize:16,letterSpacing:3}}>PROGRAM EVENTS</div>
<div style={{fontFamily:FB,color:MUTED,fontSize:11,marginTop:2}}>Official workouts & verified attendance</div>
</div>
</div>
{/* Timeline strip — next 3 events as dots */}
{upcoming.length>0&&<div className="sectionContent" style={{display:"flex",alignItems:"center",gap:0,paddingLeft:4}}>
<div style={{flex:1,display:"flex",alignItems:"center"}}>
{upcoming.slice(0,3).map((ev,i)=>{
const going=rsvps.some(r=>r.eventId===ev.id&&r.email===user.email);
return <div key={ev.id} style={{display:"flex",alignItems:"center",flex:1}}>
<div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
<div className="uiDecor" aria-hidden="true" style={{width:10,height:10,borderRadius:"50%",background:going?VOLT:BORDER_CLR,border:going?`2px solid ${VOLT}`:`2px solid ${MUTED}44`,boxShadow:"none"}}/>
<div style={{fontFamily:FB,fontSize:8,fontWeight:700,letterSpacing:1,color:going?VOLT:MUTED,whiteSpace:"nowrap"}}>{ev.date.slice(5)}</div>
</div>
{i<Math.min(upcoming.length,3)-1&&<div className="uiDecor" aria-hidden="true" style={{flex:1,height:1,background:`linear-gradient(90deg,${going?VOLT+"44":BORDER_CLR},${BORDER_CLR})`,margin:"0 6px",marginBottom:14}}/>}
</div>})}
</div>
{upcoming.length>3&&<div className="uiDecor" aria-hidden="true" style={{fontFamily:FB,fontSize:9,color:MUTED,marginLeft:8,marginBottom:14}}>+{upcoming.length-3}</div>}
</div>}
</div>

{/* Tier card */}
<div style={{background:CARD_BG,borderRadius:18,padding:"20px 22px",border:`1px solid ${BORDER_CLR}`,marginBottom:16,position:"relative",overflow:"hidden"}}>
  <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",position:"relative",gap:14}}>
    <div>
      <div style={{fontFamily:FB,color:VOLT,fontSize:13,letterSpacing:"0.10em",fontWeight:700,textTransform:"uppercase"}}>ATTENDANCE RANK</div>
      <div style={{display:"flex",alignItems:"center",gap:10,marginTop:6}}>
        <svg className={rankFx?"rank-badge-flash":""} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C8FF00" strokeWidth="2"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
        <div className={rankFx?"rank-bounce":""} style={{fontFamily:FD,color:LIGHT,fontSize:28,fontWeight:900,letterSpacing:2}}>{myTier.name}</div>
        <div style={{fontFamily:FD,color:VOLT,fontSize:28,fontWeight:700,lineHeight:1}}>{myRsvps}</div>
      </div>
      <div style={{fontFamily:FB,color:"#A0A0A0",fontSize:12,marginTop:4}}>{myRsvps} event{myRsvps!==1?"s":""} attended</div>
    </div>
  </div>
  {!nextTier
    ?<div style={{fontFamily:FB,color:"#A0A0A0",fontSize:12,marginTop:8}}>MAX RANK ACHIEVED</div>
    :<div style={{marginTop:8}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:24}}>
        <span style={{fontFamily:FB,color:"#A0A0A0",fontSize:12}}>{nextTier.min-myRsvps} more to <span style={{color:LIGHT,fontWeight:700}}>{nextTier.name}</span></span>
      </div>
      <div style={{position:"relative",paddingTop:8}}>
        <div style={{position:"relative"}}>
          <div
            style={{
              position:"absolute",
              left:`${Math.min(Math.max(rankBarPct,5),95)}%`,
              top:-16,
              transform:"translateX(-50%)",
              color:"#CCFF00",
              fontFamily:FB,
              fontSize:11,
              fontWeight:700,
              lineHeight:1,
              whiteSpace:"nowrap",
              pointerEvents:"none"
            }}
          >
            {rankProgressPct}%
          </div>
          <div
            style={{
              position:"absolute",
              right:0,
              top:-16,
              fontFamily:FB,
              fontSize:11,
              fontWeight:700,
              color:"#CCFF00",
              opacity:.9,
              lineHeight:1,
              letterSpacing:"0.03em",
              pointerEvents:"none"
            }}
          >
            {nextTier.name}
          </div>
          <div style={{height:6,background:"rgba(255,255,255,0.12)",borderRadius:3,position:"relative",overflow:"hidden"}}>
            <div
              style={{
                width:`${rankBarPct}%`,
                height:"100%",
                background:"#CCFF00",
                borderRadius:3,
                boxShadow:rankBarPulse?"2px 0 12px rgba(204,255,0,0.9)":"2px 0 8px rgba(204,255,0,0.6)",
                transition:prefersReducedMotion?"none":"width 600ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 200ms ease-out"
              }}
            />
          </div>
        </div>
      </div>
    </div>}

</div>

{/* Leaderboard toggle */}
<button onClick={()=>setShowBoard(!showBoard)} className="ch uiTap" style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",background:`linear-gradient(135deg,${CARD_BG},#141414)`,border:`1px solid ${BORDER_CLR}`,borderRadius:14,padding:"14px 18px",marginBottom:16,cursor:"pointer",textAlign:"left"}}>
  <div style={{display:"flex",alignItems:"center",gap:10}}><div style={{width:36,height:36,borderRadius:10,background:ORANGE+"15",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>&#128293;</div><div><div style={{fontFamily:FD,color:LIGHT,fontSize:14,letterSpacing:2}}>LEADERBOARD</div><div style={{fontFamily:FB,color:T.SUB,fontSize:10,marginTop:1}}>Attendance, scores & streaks</div></div></div>
  <svg width="14" height="14" viewBox="0 0 16 16" style={{transform:showBoard?"rotate(90deg)":"none",transition:"transform .2s"}}><path d="M6 3l5 5-5 5" stroke={VOLT} strokeWidth="2" fill="none" strokeLinecap="round"/></svg>
</button>

{showBoard&&<div className="fade-up" style={{marginBottom:20}}>
  <div style={{display:"flex",gap:4,marginBottom:14}}>{[{k:"attend",l:"ATTENDANCE"},{k:"overall",l:"DRILL SCORES"},{k:"streaks",l:"STREAKS"}].map(t=><button className="uiTap" key={t.k} onClick={()=>setLbMode(t.k)} style={{flex:1,padding:"9px 4px",borderRadius:10,border:lbMode===t.k?"none":`1px solid ${BORDER_CLR}`,cursor:"pointer",fontFamily:FD,fontSize:12,letterSpacing:1,background:lbMode===t.k?CYAN:CARD_BG,color:lbMode===t.k?BG:MUTED}}>{t.l}</button>)}</div>
  {lbMode==="attend"&&<>{attendBoard.length===0&&<Empty variant="leaderboard" t="No RSVPs yet"/>}{attendBoard.map((p,i)=>{const t=getTier(p.count);return <div key={p.email} style={{display:"flex",alignItems:"center",gap:12,background:CARD_BG,borderRadius:12,padding:"12px 14px",marginBottom:6,border:`1px solid ${p.email===user.email?VOLT+"33":BORDER_CLR}`}}><RB r={i+1} m={medals}/><Av n={p.name} sz={30} email={p.email}/><div style={{flex:1,display:"flex",alignItems:"center",gap:6}}><span style={{fontFamily:FD,color:LIGHT,fontSize:13,letterSpacing:1}}>{p.name.toUpperCase()}</span><span className="tb" style={{fontFamily:FB,fontSize:8,fontWeight:700,letterSpacing:1,padding:"1px 6px",borderRadius:3,color:t.color,background:`linear-gradient(90deg,${t.bg},${t.color}18,${t.bg})`}}>{t.name}</span></div><div style={{fontFamily:FD,color:t.color,fontSize:18}}>{p.count}</div></div>})}</>}
  {lbMode==="overall"&&<>{(()=>{const m={};scores.forEach(s=>{if(!m[s.email])m[s.email]={email:s.email,name:s.name||s.email,total:0};m[s.email].total+=s.score});const a=Object.values(m).sort((a,b)=>b.total-a.total);return a.length===0?<Empty variant="leaderboard" t="No scores yet"/>:a.map((p,i)=><div key={p.email} style={{display:"flex",alignItems:"center",gap:12,background:CARD_BG,borderRadius:12,padding:"12px 14px",marginBottom:6,border:`1px solid ${p.email===user.email?VOLT+"33":BORDER_CLR}`}}><RB r={i+1} m={medals}/><Av n={p.name} sz={30} email={p.email}/><div style={{flex:1,fontFamily:FD,color:LIGHT,fontSize:13,letterSpacing:1}}>{p.name.toUpperCase()}{p.email===user.email?" (YOU)":""}</div><div style={{fontFamily:FD,color:VOLT,fontSize:18}}>{p.total}</div></div>)})()}</>}
  {lbMode==="streaks"&&<>{(()=>{const es=[...new Set(scores.map(s=>s.email))];const st=es.map(e=>({email:e,name:scores.find(s=>s.email===e)?.name||e,streak:calcStreak(scores.filter(s=>s.email===e))})).sort((a,b)=>b.streak-a.streak);return st.length===0?<Empty variant="leaderboard" t="No streaks yet"/>:st.map((p,i)=><div key={p.email} style={{display:"flex",alignItems:"center",gap:12,background:CARD_BG,borderRadius:12,padding:"12px 14px",marginBottom:6,border:`1px solid ${p.email===user.email?VOLT+"33":BORDER_CLR}`}}><RB r={i+1} m={medals}/><Av n={p.name} sz={30} email={p.email}/><div style={{flex:1,fontFamily:FD,color:LIGHT,fontSize:13,letterSpacing:1}}>{p.name.toUpperCase()}</div><div style={{fontFamily:FD,color:ORANGE,fontSize:18}}>{p.streak} &#128293;</div></div>)})()}</>}
</div>}

{/* Upcoming */}
<SH isCoach={typeof u!=="undefined"&&u?.isCoach} t="UPCOMING EVENTS" s={`${upcoming.length} SCHEDULED`}/>
{upcoming.length===0&&<Empty variant="events" t="No events scheduled yet" subtitle="Your coach hasn't posted any team sessions yet. Keep momentum by logging today's work at home." cta="LOG SHOTS" ctaVariant="primary" secondaryCta="NOTIFY MY COACH" secondaryCtaVariant="tertiary" onTap={()=>setTab("log-drill")}/>}
<div className="eventsList">
{upcoming.map(ev=>{const evR=rsvps.filter(r=>r.eventId===ev.id);const going=evR.some(r=>r.email===user.email);const exp=expanded===ev.id;
  return <div key={ev.id}>
    <div className="ch eventCard listRow" style={{width:"100%",background:`linear-gradient(135deg,${CARD_BG},#141414)`,border:`1px solid ${going?VOLT+"33":BORDER_CLR}`,borderRadius:exp?"16px 16px 0 0":16,textAlign:"left",position:"relative",overflow:"hidden",cursor:"pointer"}} onClick={()=>setExpanded(exp?null:ev.id)}>
      {going&&<div style={{position:"absolute",top:0,left:0,width:4,height:"100%",background:VOLT,borderRadius:"4px 0 0 4px"}}/>}
      <div className="listRowLeft">
      <div className="eventIcon" style={{background:BG,border:`1px solid ${BORDER_CLR}`,flexShrink:0}}><EventIcon type={ev.type} size={24} color={going?CYAN:MUTED}/></div>
      <div className="eventMain listRowText" style={{flex:1}}><div className="eventTitle listRowTitle" style={{fontFamily:FD,color:LIGHT}}>{ev.title}</div><div className="eventMeta listRowMeta" style={{fontFamily:FB,color:MUTED}}><span style={{color:VOLT,fontWeight:700}}>{ev.date}</span><span>{ev.time}</span><span style={{color:T.SUB}}>{ev.location}</span></div></div>
      </div>
      <div className="eventSide listRowRight" style={{flexShrink:0}}>
        <div style={{textAlign:"right"}}><div className="listRowStat" style={{fontFamily:FD,color:evR.length>0?VOLT:MUTED,fontSize:20}}>{evR.length}</div><div className="listRowStatSub" style={{fontFamily:FB,fontSize:9,letterSpacing:1}}>GOING</div></div>
      </div>
      {/* Inline quick-RSVP pill */}
      <button onClick={(e)=>{e.stopPropagation();toggleRsvp(ev.id)}} className="btn btn--secondary btn--sm chipBtn eventCta" style={{fontFamily:FD}}>
        {going?<><svg width="14" height="14" viewBox="0 0 20 20"><path d="M5 10l4 4 6-7" stroke={BG} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>I'M GOING</>:"RSVP →"}
      </button>
    </div>
    {exp&&<div className="fade-up" style={{background:SURFACE,borderRadius:"0 0 16px 16px",padding:"16px 20px",border:`1px solid ${BORDER_CLR}`,borderTop:"none"}}>
      <p style={{fontFamily:FB,color:MUTED,fontSize:13,lineHeight:1.6,marginBottom:14}}>{ev.desc}</p>
      <button className="btn btn--secondary btn--sm btn-v chipBtn eventCta" onClick={()=>toggleRsvp(ev.id)} style={{marginBottom:14}}>
        {going?"&#10003; I'M GOING":"RSVP NOW &#8594;"}
      </button>
      {evR.length>0&&<div><div style={{fontFamily:FB,color:T.SUB,fontSize:10,letterSpacing:2,marginBottom:8,fontWeight:600}}>WHO'S GOING</div><div style={{display:"flex",flexWrap:"wrap",gap:6}}>
        {evR.map((r,i)=>{const tr=getTier(rsvps.filter(rr=>rr.email===r.email).length);return <div key={i} style={{display:"flex",alignItems:"center",gap:6,background:CARD_BG,borderRadius:8,padding:"6px 10px",border:`1px solid ${BORDER_CLR}`}}><Av n={r.name} sz={22} email={r.email}/><span style={{fontFamily:FB,color:LIGHT,fontSize:11,fontWeight:600}}>{r.name}</span>{tr.min>=2&&<span style={{fontFamily:FB,fontSize:7,fontWeight:700,letterSpacing:1,padding:"1px 4px",borderRadius:3,color:tr.color,background:tr.bg}}>{tr.name}</span>}</div>})}
      </div></div>}
    </div>}
  </div>})}
</div>

{past.length>0&&<><div style={{marginTop:8}}><SH isCoach={typeof u!=="undefined"&&u?.isCoach} t="PAST EVENTS" s={`${past.length} COMPLETED`}/></div>
  {past.map(ev=>{const evR=rsvps.filter(r=>r.eventId===ev.id);const was=evR.some(r=>r.email===user.email);return <div key={ev.id} style={{display:"flex",alignItems:"center",gap:12,background:CARD_BG,borderRadius:14,padding:"12px 16px",marginBottom:6,border:`1px solid ${BORDER_CLR}`,opacity:.5}}><EventIcon type={ev.type} size={20} color={MUTED}/><div style={{flex:1,minWidth:0}}><div style={{fontFamily:FD,color:MUTED,fontSize:13,letterSpacing:2}}>{ev.title}</div><div style={{fontFamily:FB,color:T.SUB,fontSize:10,marginTop:1}}>{ev.date}</div></div>{was&&<span style={{fontFamily:FB,fontSize:9,fontWeight:700,padding:"3px 7px",borderRadius:5,color:VOLT,background:VOLT+"15",letterSpacing:1}}>ATTENDED</span>}<span style={{fontFamily:FD,color:MUTED,fontSize:13}}>{evR.length}</span></div>})}</>}

  </div>;
}


// ═══════════════════════════════════════
// COACH SCREEN
// ═══════════════════════════════════════
function Coach({u,team,regenerateJoinCode,addRosterPlayer,playerProfiles,drills,programDrills,scores,players,updateDrill,addDrill,removeDrill,addProgramDrill,removeProgramDrill,events,rsvps,addEvent,removeEvent,removeRsvp,addRsvp,scSessions,scRsvps,scLogs=[],addScSession,removeScSession,shotLogs,logout,deleteAccount}){
const[tab,setTab]=useState("feed"),[editD,setEditD]=useState(null),[eName,setEName]=useState(""),[eDesc,setEDesc]=useState(""),[eInstr,setEInstr]=useState(""),[eMax,setEMax]=useState(""),[eIcon,setEIcon]=useState("ft"),[selP,setSelP]=useState(null),[showAdd,setShowAdd]=useState(false),[expEv,setExpEv]=useState(null),[ne,setNe]=useState({title:"",date:"",time:"",location:"",desc:"",type:"run"}),[addEmail,setAddEmail]=useState(""),[showAddSC,setShowAddSC]=useState(false),[nsc,setNsc]=useState({sport:"",date:"",time:""});
const[showNewDrill,setShowNewDrill]=useState(false),[nd,setNd]=useState({name:"",desc:"",max:"10",icon:"ft",instructions:""}),[programErr,setProgramErr]=useState(""),[newProgramDrill,setNewProgramDrill]=useState({name:"",desc:"",max:"10",icon:"ft"});
const[nudged,setNudged]=useState([]);
const[confirmDelete,setConfirmDelete]=useState(null);const[codeErr,setCodeErr]=useState("");const[newProfile,setNewProfile]=useState({firstName:"",lastName:"",jerseyNumber:""});const[profileErr,setProfileErr]=useState("");
const ups=useMemo(()=>{const es=[...new Set(scores.map(s=>s.email))];return es.map(e=>{const p=players.find(p=>p.email===e);return{email:e,name:p?.name||e.split("@")[0].replace(/[._-]/g," ").replace(/\b\w/g,c=>c.toUpperCase())}})},[scores,players]);
const allKnown=useMemo(()=>{const m={};players.forEach(p=>m[p.email]=p.name);scores.forEach(s=>{if(!m[s.email])m[s.email]=s.name||s.email});return Object.entries(m).map(([email,name])=>({email,name}))},[players,scores]);
const today=todayStr(),todayS=scores.filter(s=>s.date===today);
const saveDrill=()=>{const m=parseInt(eMax);updateDrill(editD.id,{name:san(eName),desc:san(eDesc),instructions:san(eInstr),max:m>0?m:editD.max,icon:eIcon});setEditD(null)};
const handleAddDrill=()=>{if(!nd.name)return;const m=parseInt(nd.max);addDrill({name:san(nd.name).toUpperCase(),desc:san(nd.desc),max:m>0?m:10,icon:nd.icon,instructions:san(nd.instructions)});setNd({name:"",desc:"",max:"10",icon:"ft",instructions:""});setShowNewDrill(false)};
const handleAddProgramDrill=async()=>{if(!newProgramDrill.name)return;const m=parseInt(newProgramDrill.max);const r=await addProgramDrill({name:san(newProgramDrill.name).toUpperCase(),desc:san(newProgramDrill.desc),max:m>0?m:10,icon:newProgramDrill.icon,instructions:""});if(!r.ok){setProgramErr(r.err||"Could not add drill");return;}setProgramErr("");setNewProgramDrill({name:"",desc:"",max:"10",icon:"ft"});};
const handleRemoveDrill=(id)=>{setConfirmDelete(id)};
const confirmDrillDelete=()=>{if(confirmDelete)removeDrill(confirmDelete);setConfirmDelete(null)};
const handleAddEvent=()=>{if(!ne.title||!ne.date)return;addEvent({...ne,title:san(ne.title),desc:san(ne.desc),location:san(ne.location)});setNe({title:"",date:"",time:"",location:"",desc:"",type:"run"});setShowAdd(false)};

const handleAddWalkin=(evId)=>{
const e=addEmail.trim().toLowerCase();if(!e)return;
const known=allKnown.find(p=>p.email===e);
const name=known?.name||e.split("@")[0].replace(/[._-]/g," ").replace(/\b\w/g,c=>c.toUpperCase());
addRsvp(evId,e,name);setAddEmail("")};
const handleAddSC=()=>{if(!nsc.sport||!nsc.date)return;addScSession({...nsc,sport:san(nsc.sport)});setNsc({sport:"",date:"",time:""});setShowAddSC(false)};
const totalPlayers=ups.length;
const activeTodayCount=new Set(todayS.map(s=>s.email)).size;
const sortedEvents=[...events].sort((a,b)=>a.date.localeCompare(b.date));
const nextEvent=sortedEvents.find(e=>e.date>=today);
const nextEventDateFormatted=nextEvent?new Date(`${nextEvent.date}T00:00:00`).toLocaleDateString(undefined,{month:"short",day:"numeric"}):"None";
const highlightAddPlayer=totalPlayers===0;
const highlightAddDrill=drills.length===0;
const highlightScheduleEvent=events.length===0||!nextEvent;
const weekStart=new Date();weekStart.setDate(weekStart.getDate()-weekStart.getDay());
const weekStr=`${weekStart.getFullYear()}-${String(weekStart.getMonth()+1).padStart(2,"0")}-${String(weekStart.getDate()).padStart(2,"0")}`;
const activeThisWeek=new Set(scores.filter(s=>s.date>=weekStr).map(s=>s.email));
const inactivePlayersCount=ups.filter(p=>!activeThisWeek.has(p.email)).length;
const highlightPlayersAttention=inactivePlayersCount>0;
const primaryQuickAction=highlightAddPlayer?"addPlayer":highlightAddDrill?"addDrill":highlightScheduleEvent?"scheduleEvent":null;
const jumpToSection=(targetTab,sectionId)=>{setTab(targetTab);setSelP(null);setTimeout(()=>document.getElementById(sectionId)?.scrollIntoView({behavior:"smooth",block:"start"}),120)};
const handleLogScoreAction=()=>{
  // TODO: Route to dedicated coach score logging flow when implemented.
  setTab("feed");
};
const shellVars=(k)=>({"--pageAccent":PAGE_ACCENTS[k].accent,"--pageAccentGlow":PAGE_ACCENTS[k].glow,"--pageAccentBg":PAGE_ACCENTS[k].bg,"--page-accent":PAGE_ACCENTS[k].accent,"--page-accent-soft":PAGE_ACCENTS[k].bg,"--page-accent-border":PAGE_ACCENTS[k].glow});
const navItems=[
  {k:"feed",l:"Feed",accentVar:"--accent-feed",svg:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></svg>},
  {k:"drills",l:"Drills",accentVar:"--accent-drills",svg:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2v20"/><path d="M5 4.5c3.5 4 5 7 5 7.5s-1.5 3.5-5 7.5"/><path d="M19 4.5c-3.5 4-5 7-5 7.5s1.5 3.5 5 7.5"/></svg>},
  {k:"events",l:"Events",accentVar:"--accent-events",svg:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4M16 2v4"/><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18"/></svg>},
  {k:"sc",l:"S&C",accentVar:"--accent-lifting",svg:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6.5 6.5h-2a1 1 0 00-1 1v9a1 1 0 001 1h2M17.5 6.5h2a1 1 0 011 1v9a1 1 0 01-1 1h-2M6.5 12h11M1.5 9.5v5M22.5 9.5v5"/></svg>},
  {k:"players",l:"Players",accentVar:"--accent-players",svg:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="7" r="3"/><path d="M2 21v-2a4 4 0 014-4h6a4 4 0 014 4v2"/><path d="M16 3.13a4 4 0 010 7.75M21 21v-2a4 4 0 00-3-3.87"/></svg>},
];
const handleNavChange=(k)=>{setTab(k);setEditD(null);setSelP(null);setShowAdd(false);setExpEv(null);setShowAddSC(false)};
const [isDesktop,setIsDesktop]=useState(()=>typeof window!=="undefined"?window.innerWidth>=1024:false);
const [showMiniHeader,setShowMiniHeader]=useState(false);
const heroRef=useRef(null);
const isOverviewTab=tab==="feed";
const coachTabs=["feed","drills","events","sc","players"];
const isCoachTab=u.isCoach&&coachTabs.includes(tab);
const showFullCommandCenter=isCoachTab&&tab==="feed";

useEffect(()=>{
  const onResize=()=>setIsDesktop(window.innerWidth>=1024);
  onResize();
  window.addEventListener("resize",onResize);
  return()=>window.removeEventListener("resize",onResize);
},[]);

useEffect(()=>{
  const heroNode=heroRef.current;
  if(!heroNode){
    setShowMiniHeader(false);
    return;
  }
  const updateFromRect=()=>{
    const rect=heroNode.getBoundingClientRect();
    const viewport=Math.max(window.innerHeight||0,1);
    const visibleTop=Math.max(rect.top,0);
    const visibleBottom=Math.min(rect.bottom,viewport);
    const visibleHeight=Math.max(0,visibleBottom-visibleTop);
    const ratio=Math.min(1,visibleHeight/Math.max(rect.height,1));
    setShowMiniHeader(ratio<0.25);
  };
  if(typeof window!=="undefined" && "IntersectionObserver" in window){
    const observer=new IntersectionObserver((entries)=>{
      const ratio=entries[0]?.intersectionRatio ?? 1;
      setShowMiniHeader(ratio<0.25);
    },{threshold:[0,0.25,0.5,0.75,1]});
    observer.observe(heroNode);
    return()=>observer.disconnect();
  }
  let ticking=false;
  const onScroll=()=>{
    if(ticking)return;
    ticking=true;
    window.requestAnimationFrame(()=>{updateFromRect();ticking=false;});
  };
  updateFromRect();
  window.addEventListener("scroll",onScroll,{passive:true});
  window.addEventListener("resize",onScroll);
  return()=>{window.removeEventListener("scroll",onScroll);window.removeEventListener("resize",onScroll);};
},[tab]);

return <div className={`app-shell ${isDesktop?"is-desktop":"is-mobile"}`}>
{isDesktop&&<aside className="sidebar-nav" aria-label="Coach navigation"><div className="nav-title">COACH DASHBOARD</div>{navItems.map(item=>{const active=tab===item.k;return <button key={item.k} className={`nav-item ${active?"is-active":""}`} onClick={()=>handleNavChange(item.k)}>{item.svg}<span>{item.l}</span></button>;})}</aside>}
<main className="shell-main"><div className="content-wrap"><div className={`${u.isCoach?"coach-mode ":""}page`} data-accent={u.isCoach&&["feed","drills","events","sc","players"].includes(tab)?tab:"feed"} style={{minHeight:"100dvh",background:u.isCoach?"#0B0A09":BG,display:"flex",flexDirection:"column",fontFamily:FB,position:"relative"}}><BrandBackdrop/>
{/* Delete confirmation dialog */}
{confirmDelete&&<div style={{position:"fixed",inset:0,zIndex:30,background:"#000c",display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(6px)"}} onClick={()=>setConfirmDelete(null)}>
<div onClick={e=>e.stopPropagation()} style={{background:CARD_BG,borderRadius:20,padding:"28px 24px",border:`1px solid ${BORDER_CLR}`,maxWidth:300,width:"90%",textAlign:"center"}}>
<div style={{fontFamily:FD,color:LIGHT,fontSize:20,letterSpacing:3,marginBottom:8}}>DELETE DRILL?</div>
<p style={{fontFamily:FB,color:MUTED,fontSize:12,lineHeight:1.5,marginBottom:20}}>Player scores will be kept but this drill will no longer appear.</p>
<div style={{display:"flex",gap:8}}>
<button onClick={()=>setConfirmDelete(null)} style={{flex:1,padding:"12px",background:"transparent",color:MUTED,fontFamily:FD,fontSize:14,letterSpacing:2,border:`1px solid ${BORDER_CLR}`,borderRadius:10,cursor:"pointer"}}>CANCEL</button>
<button onClick={confirmDrillDelete} className="btn-v cta-danger" style={{}}>DELETE</button>
</div>
</div>
</div>}
<div style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:0}}><CourtBG opacity={.01}/><GlowOrb color={ORANGE} top="0" left="80%" size={250}/></div>
<CoachMiniHeader
  visible={showMiniHeader}
  avatar={<Av n={u.name} sz={24} email={u.email} isCoach={u.isCoach}/>}
  wordmark={<BrandWordmark size={14} small/>}
  borderColor={BORDER_CLR}
  mutedColor={MUTED}
  onLogout={logout}
/>
<div style={{position:"relative",zIndex:1,padding:`max(var(--space-5),env(safe-area-inset-top)) var(--page-gutter) 0`}}>
<CoachHero
  heroRef={heroRef}
  isOverview={isOverviewTab}
  userName={u.name}
  isCoach={u.isCoach}
  accentColor={ORANGE}
  borderColor={BORDER_CLR}
  mutedColor={MUTED}
  avatar={<Av n={u.name} sz={isOverviewTab?32:30} email={u.email} isCoach={u.isCoach}/>}
  wordmark={<BrandWordmark size={isOverviewTab?17:16} small/>}
  onLogout={logout}
/>
{isCoachTab&&<CoachCommandCenter
  variant={showFullCommandCenter?"full":"compact"}
  totalPlayers={totalPlayers}
  activeTodayCount={activeTodayCount}
  nextEventDateFormatted={nextEventDateFormatted}
  highlightPlayersAttention={highlightPlayersAttention}
  primaryQuickAction={primaryQuickAction}
  onPlayersClick={()=>setTab("players")}
  onActiveTodayClick={()=>setTab("players")}
  onNextEventClick={()=>setTab("events")}
  onAddPlayer={()=>jumpToSection("players","coach-add-player-form")}
  onAddDrill={()=>jumpToSection("drills","coach-drills-management")}
  onScheduleEvent={()=>jumpToSection("events","coach-events-management")}
  onLogScore={handleLogScoreAction}
  joinCode={team?.joinCode}
  onCopyJoinCode={()=>navigator.clipboard?.writeText(team?.joinCode||"")}
  onRegenerateJoinCode={async()=>{const r=await regenerateJoinCode(team?.id);if(!r.ok)setCodeErr(r.err||"Failed")}}
  codeErr={codeErr}
/>}
</div>
{u.isCoach&&<div style={{height:28,background:"linear-gradient(90deg, rgba(200, 255, 0, 0.08) 0%, transparent 100%)",borderBottom:"1px solid rgba(200, 255, 0, 0.12)",display:"flex",alignItems:"center",padding:`0 var(--page-gutter)`,gap:"var(--space-2)"}}><WhistleIcon size={12} color="#C8FF00"/><span style={{fontFamily:FB,fontSize:9,textTransform:"uppercase",letterSpacing:"var(--tracking-tight)",color:"rgba(200, 255, 0, 0.84)"}}>COACH VIEW — FULL ACCESS</span></div>}

<div style={{flex:1,padding:`${showMiniHeader?"88px":"var(--space-4)"} var(--page-gutter) 110px`,overflowY:"auto",position:"relative",zIndex:1}}>
  {/* FEED */}
  {tab==="feed"&&<div className="page pageShell page-feed fade-up" data-accent="feed" style={shellVars("feed")}><PageHeader title="FEED" subtitle="Daily team activity and momentum" accent="lime" icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></svg>} actionLabel="Coach Mode" /><div className="heroModule"><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}><div><div style={{fontFamily:FD,color:PAGE_ACCENTS.feed.accent,fontSize:12,letterSpacing:"var(--tracking-default)"}}>TODAY'S PULSE</div><div style={{fontFamily:FB,color:T.SUB,fontSize:10}}>Who's active, streaking, and needs attention</div></div><button className="pageHeaderPill" onClick={()=>setTab("players")}>View Team</button></div>
    {/* Coach dashboard pulse */}
    <div className="accent-card" style={{background:`linear-gradient(135deg,${ORANGE}08,${CARD_BG})`,borderRadius:18,padding:"20px 20px",border:`1px solid ${ORANGE}22`,marginBottom:20,position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:0,left:0,width:4,height:"100%",background:ORANGE,borderRadius:"4px 0 0 4px"}}/>
      
      <div style={{fontFamily:FD,color:ORANGE,fontSize:12,letterSpacing:"var(--tracking-default)",marginBottom:12}}>TODAY'S PULSE</div>
      <div style={{display:"flex",gap:8,marginBottom:12}}>
        {(()=>{
          const activeToday=new Set(scores.filter(s=>s.date===today).map(s=>s.email)).size;
          const totalPlayers=ups.length;
          const sorted=[...events].sort((a,b)=>a.date.localeCompare(b.date));
          const nextEv=sorted.find(e=>e.date>=today);
          const nextEvRsvps=nextEv?rsvps.filter(r=>r.eventId===nextEv.id).length:0;
          // Top scorer this week
          const weekStart=new Date();weekStart.setDate(weekStart.getDate()-weekStart.getDay());
          const weekStr=`${weekStart.getFullYear()}-${String(weekStart.getMonth()+1).padStart(2,"0")}-${String(weekStart.getDate()).padStart(2,"0")}`;
          const weekScores={};scores.filter(s=>s.date>=weekStr).forEach(s=>{if(!weekScores[s.email])weekScores[s.email]={email:s.email,name:s.name||s.email,total:0};weekScores[s.email].total+=s.score});
          const topWeek=Object.values(weekScores).sort((a,b)=>b.total-a.total)[0];
          return <>
            <div style={{flex:1,background:BG,borderRadius:12,padding:"12px",border:`1px solid ${BORDER_CLR}`,textAlign:"center"}}>
              <div style={{fontFamily:FD,color:activeToday>0?VOLT:MUTED,fontSize:24,lineHeight:1}}>{activeToday}<span style={{color:MUTED,fontSize:14}}>/{totalPlayers}</span></div>
              <div style={{fontFamily:FB,color:MUTED,fontSize:8,letterSpacing:2,marginTop:3,fontWeight:600}}>ACTIVE TODAY</div>
            </div>
            <div style={{flex:1,background:BG,borderRadius:12,padding:"12px",border:`1px solid ${BORDER_CLR}`,textAlign:"center"}}>
              {nextEv?<>
                <div style={{fontFamily:FD,color:CYAN,fontSize:14,lineHeight:1.1,letterSpacing:1}}>{nextEv.title.length>12?nextEv.title.slice(0,12)+"...":nextEv.title}</div>
                <div style={{fontFamily:FB,color:MUTED,fontSize:8,letterSpacing:2,marginTop:3,fontWeight:600}}>{nextEvRsvps} RSVP · {nextEv.date.slice(5)}</div>
              </>:<div style={{fontFamily:FB,color:T.SUB,fontSize:10}}>No events</div>}
            </div>
          </>
        })()}
      </div>
      {(()=>{
        // Players who haven't logged this week
        const weekStart=new Date();weekStart.setDate(weekStart.getDate()-weekStart.getDay());
        const weekStr=`${weekStart.getFullYear()}-${String(weekStart.getMonth()+1).padStart(2,"0")}-${String(weekStart.getDate()).padStart(2,"0")}`;
        const activeThisWeek=new Set(scores.filter(s=>s.date>=weekStr).map(s=>s.email));
        const inactive=ups.filter(p=>!activeThisWeek.has(p.email));
        return inactive.length>0?<div style={{fontFamily:FB,color:ORANGE,fontSize:10,fontWeight:600,letterSpacing:1}}>
          ⚠ {inactive.length} player{inactive.length>1?"s":""} haven't logged this week: {inactive.slice(0,3).map(p=>p.name.split(" ")[0]).join(", ")}{inactive.length>3?` +${inactive.length-3} more`:""}
        </div>:<div style={{fontFamily:FB,color:VOLT,fontSize:10,fontWeight:600,letterSpacing:1}}>✓ All players active this week</div>
      })()}
    </div>

    </div>
    <SH isCoach={typeof u!=="undefined"&&u?.isCoach} t="ACTIVITY FEED" s="ALL SOURCES" identity/>{scores.length===0&&<Empty t="No scores yet" action="Once your players start logging drills, their activity will appear here. Share the app link to get started!"/>}{scores.slice(-20).reverse().map((s,i)=>{const dr=drills.find(d=>d.id===s.drillId);const pct=dr?Math.round(s.score/dr.max*100):0;const isHome=s.src==="home"||!s.src;return <div key={i} className="feedListItem" style={{display:"flex",alignItems:"center",gap:12,padding:"14px 0",borderBottom:`1px solid ${BORDER_CLR}44`}}><Av n={s.name||s.email} sz={36} email={s.email}/><div style={{flex:1,minWidth:0}}><div style={{color:LIGHT,fontSize:13,fontWeight:700,display:"flex",alignItems:"center",gap:6}}>{s.name||s.email}<span style={{fontFamily:FB,fontSize:8,fontWeight:700,letterSpacing:1,padding:"1px 5px",borderRadius:3,color:isHome?VOLT:LIGHT,background:isHome?VOLT+"15":LIGHT+"10"}}>{isHome?"HOME":"PROGRAM"}</span></div><div style={{color:T.MUT,fontSize:11,marginTop:2,fontWeight:500}}>{dr?.name} &#183; {s.date}</div></div><div style={{textAlign:"right",flexShrink:0}}><div style={{fontFamily:FD,color:VOLT,fontSize:18}}>{s.score}<span style={{color:MUTED,fontSize:12}}>/{dr?.max}</span></div><div style={{fontSize:10,fontWeight:700,color:pct>=80?"#C8FF00":pct>=50?"#FFA500":"#FF4545"}}>{pct}%</div></div></div>})}</div>}

  {/** DRILLS */}
  {tab==="drills"&&!editD&&<div className="page pageShell fade-up" data-accent="drills" id="coach-drills-management" style={shellVars("drills")}><PageHeader title="DRILLS" subtitle="Skill plans, assignments, and drill library" accent="cyan" icon={<DrillIcon type="ft" size={22} color={PAGE_ACCENTS.drills.accent}/>} actionLabel="Add" onAction={()=>setShowNewDrill(true)} /><div className="heroModule"><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}><div><div style={{fontFamily:FD,color:PAGE_ACCENTS.drills.accent,fontSize:12,letterSpacing:"var(--tracking-default)"}}>QUICK START DRILL</div><div style={{fontFamily:FB,color:T.SUB,fontSize:10}}>{drills.length} total drills ready to start</div></div><button className="pageHeaderPill pageHeaderPillBrand" onClick={()=>setShowNewDrill(true)}>Start</button></div><div className="drillsMetrics"><div className="heroStat drillsMetricTile"><div className="heroStatVal">{drills.length}</div><div className="heroStatLbl">ACTIVE</div></div><div className="heroStat drillsMetricTile"><div className="heroStatVal">{programDrills.length}</div><div className="heroStatLbl">PROGRAM</div></div></div><button className="pageHeaderPill" onClick={()=>document.getElementById("coach-drills-management")?.scrollIntoView({behavior:"smooth"})}>Manage Drills</button></div>
    <SH isCoach={typeof u!=="undefined"&&u?.isCoach} t="Drill Management" s={`${drills.length} active`} identity/>
    <div style={{fontFamily:FB,color:MUTED,fontSize:11,marginBottom:16,lineHeight:1.5}}>Customize the drills your players see in their "At Home" section. Each drill gets its own leaderboard.</div>
    <div className="accent-card" style={{background:SURFACE,border:`1px solid ${BORDER_CLR}`,borderRadius:12,padding:12,marginBottom:14}}>
      <div style={{fontFamily:FD,color:CYAN,fontSize:12,letterSpacing:"var(--tracking-default)",marginBottom:6}}>PROGRAM SHOOTING DRILLS ({programDrills.length}/7)</div>
      <div style={{fontFamily:FB,color:T.SUB,fontSize:10,marginBottom:10}}>Add up to 7 coach-defined program drills for player score tracking and per-drill team leaderboards.</div>
      <div style={{display:"grid",gridTemplateColumns:"1.2fr 1fr .7fr",gap:6,marginBottom:8}}>
        <input value={newProgramDrill.name} onChange={e=>{setNewProgramDrill({...newProgramDrill,name:e.target.value});setProgramErr("")}} placeholder="Drill name" style={{padding:9,background:BG,border:`1px solid ${BORDER_CLR}`,borderRadius:8,color:LIGHT}}/>
        <input value={newProgramDrill.desc} onChange={e=>setNewProgramDrill({...newProgramDrill,desc:e.target.value})} placeholder="Description" style={{padding:9,background:BG,border:`1px solid ${BORDER_CLR}`,borderRadius:8,color:LIGHT}}/>
        <input value={newProgramDrill.max} onChange={e=>setNewProgramDrill({...newProgramDrill,max:e.target.value})} type="number" placeholder="Max" style={{padding:9,background:BG,border:`1px solid ${BORDER_CLR}`,borderRadius:8,color:LIGHT}}/>
      </div>
      <div style={{display:"flex",gap:5,marginBottom:8}}>{ICONS.map(ic=><button key={`prog-${ic}`} onClick={()=>setNewProgramDrill({...newProgramDrill,icon:ic})} style={{width:34,height:34,borderRadius:8,border:`1px solid ${newProgramDrill.icon===ic?CYAN:BORDER_CLR}`,background:newProgramDrill.icon===ic?CYAN+"22":BG,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><DrillIcon type={ic} size={14} color={newProgramDrill.icon===ic?CYAN:MUTED}/></button>)}</div>
      <button onClick={handleAddProgramDrill} disabled={programDrills.length>=7} className="btn-v cta-primary" style={{opacity:programDrills.length>=7?.6:1}}>+ ADD PROGRAM DRILL</button>
      {programErr&&<div style={{fontFamily:FB,color:"#FF4545",fontSize:10,marginTop:6}}>{programErr}</div>}
      <div style={{marginTop:10}}>{programDrills.length===0?<div style={{fontFamily:FB,color:T.SUB,fontSize:10}}>No program drills yet.</div>:programDrills.map(pd=>{const b=scores.filter(s=>s.src==="program"&&s.drillId===pd.id).reduce((m,s)=>{m[s.email]=(m[s.email]||0)+s.score;return m;},{});const lead=Object.entries(b).sort((a,b)=>b[1]-a[1]).slice(0,3);return <div key={pd.id} style={{display:"flex",alignItems:"center",gap:8,background:BG,border:`1px solid ${BORDER_CLR}`,borderRadius:10,padding:"8px 10px",marginBottom:6}}><DrillIcon type={pd.icon} size={14}/><div style={{flex:1,minWidth:0}}><div style={{fontFamily:FB,color:LIGHT,fontSize:11,fontWeight:700}}>{pd.name}</div><div style={{fontFamily:FB,color:MUTED,fontSize:9}}>Leaderboard: {lead.length===0?"No scores":lead.map(([email,total],i)=>`#${i+1} ${(players.find(p=>p.email===email)?.name||email.split("@")[0])} ${total}`).join(" · ")}</div></div><button onClick={()=>removeProgramDrill(pd.id)} style={{background:"#FF454512",border:"1px solid #FF454533",borderRadius:7,color:"#FF4545",padding:"4px 7px",fontSize:9,cursor:"pointer"}}>DEL</button></div>})}</div>
    </div>

    {drills.map(d=>{const dS=scores.filter(s=>s.drillId===d.id);const avg=dS.length?Math.round(dS.reduce((a,s)=>a+s.score,0)/dS.length*10)/10:0;return <div key={d.id} style={{display:"flex",gap:8,marginBottom:10,alignItems:"stretch"}}>
      <button className="ch" onClick={()=>{setEditD(d);setEName(d.name);setEDesc(d.desc);setEInstr(d.instructions||"");setEMax(String(d.max));setEIcon(d.icon||"ft")}} style={{flex:1,display:"flex",alignItems:"center",gap:14,background:`linear-gradient(135deg,${CARD_BG},#141414)`,border:`1px solid ${BORDER_CLR}`,borderRadius:16,padding:"16px 18px",cursor:"pointer",textAlign:"left"}}>
        <div style={{width:44,height:44,display:"flex",alignItems:"center",justifyContent:"center",background:BG,borderRadius:12,border:`1px solid ${BORDER_CLR}`,flexShrink:0}}><DrillIcon type={d.icon} size={22}/></div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontFamily:FB,color:LIGHT,fontSize:14,fontWeight:700,letterSpacing:1}}>{d.name}</div>
          <div style={{color:"#484848",fontSize:10,marginTop:2,fontWeight:500}}>{d.desc}</div>
          <div style={{color:T.SUB,fontSize:9,marginTop:3,fontWeight:600}}>MAX: {d.max} · {dS.length} logged · Avg: {avg}</div>
        </div>
        <svg width="14" height="14" fill="none" stroke={VOLT} strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      </button>
      <button onClick={()=>handleRemoveDrill(d.id)} style={{width:44,background:`#FF454512`,border:`1px solid #FF454533`,borderRadius:12,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF4545" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
      </button>
    </div>})}

    {/* Add new drill */}
    {!showNewDrill?<button onClick={()=>setShowNewDrill(true)} className="btn-v cta-primary" style={{marginTop:8}}>+ ADD DRILL</button>
    :<div className="fade-up" style={{background:SURFACE,borderRadius:16,padding:"22px 18px",border:`1px solid ${BORDER_CLR}`,marginTop:8}}>
      <div style={{fontFamily:FD,color:VOLT,fontSize:16,letterSpacing:3,marginBottom:16}}>NEW DRILL</div>
      <FF l="DRILL NAME" v={nd.name} set={v=>setNd({...nd,name:v})} ph="e.g. STEP-BACK JUMPER"/>
      <FF l="SHORT DESCRIPTION" v={nd.desc} set={v=>setNd({...nd,desc:v})} ph="Brief description for players"/>
      <div style={{display:"flex",gap:8}}>
        <div style={{flex:1}}><FF l="MAX SCORE" v={nd.max} set={v=>setNd({...nd,max:v})} tp="number" ph="10"/></div>
        <div style={{flex:1}}>
          <label style={{fontFamily:FB,color:"#A0A0A0",fontSize:11,fontWeight:700,letterSpacing:3,display:"block",marginBottom:8}}>ICON</label>
          <div style={{display:"flex",gap:4,marginBottom:14}}>{ICONS.map(ic=><button key={ic} onClick={()=>setNd({...nd,icon:ic})} style={{width:44,height:44,borderRadius:10,background:nd.icon===ic?VOLT+"22":BG,border:`1px solid ${nd.icon===ic?VOLT:BORDER_CLR}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><DrillIcon type={ic} size={16} color={nd.icon===ic?VOLT:MUTED}/></button>)}</div>
        </div>
      </div>
      <FF l="DETAILED INSTRUCTIONS (OPTIONAL)" v={nd.instructions} set={v=>setNd({...nd,instructions:v})} ta ph="Coaching cues, setup details..."/>
      <div style={{display:"flex",gap:8}}>
        <button onClick={()=>{setShowNewDrill(false);setNd({name:"",desc:"",max:"10",icon:"ft",instructions:""})}} style={{flex:1,padding:"13px",background:"transparent",color:MUTED,fontFamily:FD,fontSize:14,letterSpacing:2,border:`1px solid ${BORDER_CLR}`,borderRadius:10,cursor:"pointer"}}>CANCEL</button>
        <button className="btn-v cta-primary" onClick={handleAddDrill} style={{width:"100%"}}>ADD DRILL</button>
      </div>
    </div>}
  </div>}
  {tab==="drills"&&editD&&<div className="scale-in" style={{paddingTop:8}}>
    <button onClick={()=>setEditD(null)} style={{background:"none",border:"none",color:VOLT,fontFamily:FB,fontSize:13,cursor:"pointer",fontWeight:700,letterSpacing:2,marginBottom:28}}>&#8592; BACK</button>
    <div style={{width:80,height:80,borderRadius:18,background:`linear-gradient(135deg,${SURFACE},${CARD_BG})`,border:`1px solid ${BORDER_CLR}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px"}}><DrillIcon type={eIcon} size={40}/></div>
    <h2 style={{fontFamily:FD,color:LIGHT,fontSize:26,letterSpacing:4,textAlign:"center",margin:"0 0 28px"}}>EDIT DRILL</h2>
    <FF l="DRILL NAME" v={eName} set={setEName}/><FF l="SHORT DESCRIPTION" v={eDesc} set={setEDesc} ph="Brief summary shown on cards"/>
    <div style={{display:"flex",gap:8}}>
      <div style={{flex:1}}><FF l="MAX SCORE" v={eMax} set={setEMax} tp="number"/></div>
      <div style={{flex:1}}>
        <label style={{fontFamily:FB,color:"#A0A0A0",fontSize:11,fontWeight:700,letterSpacing:3,display:"block",marginBottom:8}}>ICON</label>
        <div style={{display:"flex",gap:4,marginBottom:14}}>{ICONS.map(ic=><button key={ic} onClick={()=>setEIcon(ic)} style={{width:44,height:44,borderRadius:10,background:eIcon===ic?VOLT+"22":BG,border:`1px solid ${eIcon===ic?VOLT:BORDER_CLR}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><DrillIcon type={ic} size={16} color={eIcon===ic?VOLT:MUTED}/></button>)}</div>
      </div>
    </div>
    <FF l="DETAILED INSTRUCTIONS" v={eInstr} set={setEInstr} ta ph="Step-by-step breakdown, coaching cues, key focus areas..."/>
    <button className="btn-v cta-primary" onClick={saveDrill} style={{}}>SAVE &#8594;</button>
  </div>}

  {/* EVENTS */}
  {tab==="events"&&<div className="page pageShell fade-up accent-card" data-accent="events" id="coach-events-management" style={shellVars("events")}><PageHeader title="EVENTS" subtitle="Schedule team moments and track attendance" accent="amber" icon={<EventIcon type="event" size={22} color={PAGE_ACCENTS.events.accent}/>} actionLabel={showAdd?"Close":"Create"} onAction={()=>setShowAdd(!showAdd)} /><div className="heroModule"><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}><div><div style={{fontFamily:FD,color:PAGE_ACCENTS.events.accent,fontSize:12,letterSpacing:"var(--tracking-default)"}}>NEXT EVENT</div><div style={{fontFamily:FB,color:T.SUB,fontSize:10}}>{nextEvent?`${nextEvent.title} · ${nextEvent.date} ${nextEvent.time}`:"No event scheduled"}</div></div><button className="pageHeaderPill" onClick={()=>setShowAdd(true)}>Create Event</button></div><div style={{marginTop:8}}><button className="pageHeaderPill" onClick={()=>document.getElementById("coach-events-management")?.scrollIntoView({behavior:"smooth"})}>Manage Events</button></div></div>
    <SH isCoach={typeof u!=="undefined"&&u?.isCoach} t="Event Management" s={`${events.length} total`} identity/>
    <button onClick={()=>setShowAdd(!showAdd)} className="btn-v cta-primary" style={{marginBottom:20}}>{showAdd?"CANCEL":"+ ADD EVENT"}</button>

    {showAdd&&<div className="fade-up accent-card" style={{background:SURFACE,borderRadius:16,padding:"22px 18px",border:`1px solid ${BORDER_CLR}`,marginBottom:20}}>
      <FF l="TITLE" v={ne.title} set={v=>setNe({...ne,title:v})} ph="e.g. OPEN GYM RUN"/>
      <div style={{display:"flex",gap:8}}><div style={{flex:1}}><FF l="DATE" v={ne.date} set={v=>setNe({...ne,date:v})} ph="2026-03-15" tp="date"/></div><div style={{flex:1}}><FF l="TIME" v={ne.time} set={v=>setNe({...ne,time:v})} ph="6:00 PM"/></div></div>
      <FF l="LOCATION" v={ne.location} set={v=>setNe({...ne,location:v})} ph="Main Gym"/><FF l="DESCRIPTION" v={ne.desc} set={v=>setNe({...ne,desc:v})} ph="Details..." ta/>
      <label style={{fontFamily:FB,color:"#A0A0A0",fontSize:11,fontWeight:700,letterSpacing:3,display:"block",marginBottom:8}}>TYPE</label>
      <div style={{display:"flex",gap:4,marginBottom:18,flexWrap:"wrap"}}>{["run","clinic","game","challenge","recovery"].map(t=><button key={t} onClick={()=>setNe({...ne,type:t})} style={{padding:"7px 12px",borderRadius:8,border:ne.type===t?`1px solid ${VOLT}`:`1px solid ${BORDER_CLR}`,background:ne.type===t?VOLT+"15":"transparent",color:ne.type===t?VOLT:MUTED,fontFamily:FD,fontSize:11,letterSpacing:2,cursor:"pointer",textTransform:"uppercase"}}>{t}</button>)}</div>
      <button className="btn-v cta-primary" onClick={handleAddEvent} style={{}}>CREATE EVENT</button>
    </div>}

    {[...events].sort((a,b)=>a.date.localeCompare(b.date)).map(ev=>{const evR=rsvps.filter(r=>r.eventId===ev.id);const isExp=expEv===ev.id;
      return <div key={ev.id} style={{marginBottom:10}}>
        <button onClick={()=>setExpEv(isExp?null:ev.id)} className="ch" style={{width:"100%",display:"flex",alignItems:"center",gap:12,background:CARD_BG,borderRadius:isExp?"14px 14px 0 0":14,padding:"14px 16px",border:`1px solid ${BORDER_CLR}`,cursor:"pointer",textAlign:"left"}}>
          <span className="eventsDatePill">{new Date(`${ev.date}T00:00:00`).toLocaleDateString(undefined,{month:"short",day:"numeric"})}</span><EventIcon type={ev.type} size={22} color={ev.date>=today?CYAN:MUTED}/><div style={{flex:1,minWidth:0}}><div style={{fontFamily:FD,color:LIGHT,fontSize:14,letterSpacing:2}}>{ev.title}</div><div style={{fontFamily:FB,color:T.SUB,fontSize:10,marginTop:2}}>{ev.date} &#183; {ev.time} &#183; <span style={{color:VOLT}}>{evR.length} RSVP</span></div></div>
          <svg width="12" height="12" viewBox="0 0 16 16" style={{transform:isExp?"rotate(90deg)":"none",transition:"transform .2s",flexShrink:0}}><path d="M6 3l5 5-5 5" stroke={VOLT} strokeWidth="2" fill="none" strokeLinecap="round"/></svg>
        </button>
        {isExp&&<div className="fade-up" style={{background:SURFACE,borderRadius:"0 0 14px 14px",padding:"16px 16px",border:`1px solid ${BORDER_CLR}`,borderTop:"none"}}>
          <p style={{fontFamily:FB,color:MUTED,fontSize:12,lineHeight:1.5,marginBottom:12}}>{ev.desc}</p>
          <div style={{fontFamily:FB,color:"#A0A0A0",fontSize:10,letterSpacing:2,fontWeight:700,marginBottom:8}}>ATTENDEES ({evR.length})</div>
          {evR.length===0&&<p style={{fontFamily:FB,color:T.SUB,fontSize:11,marginBottom:10}}>No attendees yet</p>}
          {evR.map((r,i)=>{const t=getTier(rsvps.filter(rr=>rr.email===r.email).length);return <div key={i} style={{display:"flex",alignItems:"center",gap:8,background:CARD_BG,borderRadius:10,padding:"9px 12px",marginBottom:5,border:`1px solid ${BORDER_CLR}`}}>
            <Av n={r.name} sz={26} email={r.email}/><div style={{flex:1,minWidth:0}}><div style={{display:"flex",alignItems:"center",gap:5}}><span style={{fontFamily:FB,color:LIGHT,fontSize:12,fontWeight:600}}>{r.name}</span>{t.min>=2&&<span style={{fontFamily:FB,fontSize:7,fontWeight:700,padding:"1px 4px",borderRadius:3,color:t.color,background:t.bg}}>{t.name}</span>}</div><div style={{fontFamily:FB,color:T.SUB,fontSize:9,marginTop:1}}>{r.email}</div></div>
            <button onClick={()=>removeRsvp(ev.id,r.email)} style={{background:"#FF454512",border:"1px solid #FF454533",borderRadius:7,color:"#FF4545",fontFamily:FD,fontSize:9,letterSpacing:1,padding:"4px 8px",cursor:"pointer",display:"flex",alignItems:"center",gap:3,whiteSpace:"nowrap"}}><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#FF4545" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>NO-SHOW</button>
          </div>})}

          {/* ADD WALK-IN */}
          <div style={{marginTop:12,padding:"14px 14px",background:CARD_BG,borderRadius:12,border:`1px solid ${BORDER_CLR}`}}>
            <div style={{fontFamily:FB,color:VOLT,fontSize:10,letterSpacing:2,fontWeight:700,marginBottom:8}}>+ ADD WALK-IN ATTENDEE</div>
            <div style={{fontFamily:FB,color:T.MUT,fontSize:10,marginBottom:8}}>Give credit to players who showed up without an RSVP</div>
            {/* Quick-add from known players */}
            {allKnown.filter(p=>!evR.some(r=>r.email===p.email)).length>0&&<div style={{marginBottom:10}}>
              <div style={{fontFamily:FB,color:T.MUT,fontSize:9,letterSpacing:1,marginBottom:6,fontWeight:600}}>KNOWN PLAYERS</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                {allKnown.filter(p=>!evR.some(r=>r.email===p.email)).map(p=><button key={p.email} onClick={()=>addRsvp(ev.id,p.email,p.name)} style={{display:"flex",alignItems:"center",gap:5,background:BG,border:`1px solid ${BORDER_CLR}`,borderRadius:8,padding:"5px 10px",cursor:"pointer",transition:"border-color .2s"}} onMouseEnter={e=>e.currentTarget.style.borderColor=CYAN+"66"} onMouseLeave={e=>e.currentTarget.style.borderColor=BORDER_CLR}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={VOLT} strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
                  <span style={{fontFamily:FB,color:LIGHT,fontSize:11,fontWeight:600}}>{p.name}</span>
                </button>)}
              </div>
            </div>}
            {/* Manual email entry */}
            <div style={{display:"flex",gap:6}}>
              <input value={addEmail} onChange={e=>setAddEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleAddWalkin(ev.id)} placeholder="email@example.com" style={{flex:1,padding:"10px 12px",background:BG,border:`1px solid ${BORDER_CLR}`,borderRadius:10,color:LIGHT,fontSize:16,fontFamily:FB,outline:"none"}} onFocus={e=>e.target.style.borderColor=CYAN+"66"} onBlur={e=>e.target.style.borderColor=BORDER_CLR}/>
              <button onClick={()=>handleAddWalkin(ev.id)} style={{padding:"10px 16px",background:"var(--page-accent)",color:"#000000",fontFamily:FD,fontSize:13,letterSpacing:2,border:"none",borderRadius:10,cursor:"pointer",whiteSpace:"nowrap"}}>ADD</button>
            </div>
          </div>

          <button onClick={()=>removeEvent(ev.id)} className="btn-v cta-danger" style={{marginTop:14}}>
            <span className="cta-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF4545" strokeWidth="2"><path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg></span>DELETE EVENT
          </button>
        </div>}
      </div>})}
  </div>}

  {tab==="players"&&!selP&&<div className="page pageShell" data-accent="players" style={shellVars("players")}><PageHeader title="PLAYERS" subtitle="Roster insights, development, and availability" accent="purple" icon={<UsersIcon size={20} color={PAGE_ACCENTS.players.accent}/>} actionLabel="Add" onAction={()=>document.getElementById("coach-add-player-form")?.scrollIntoView({behavior:"smooth"})} /><div className="heroModule"><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}><div><div style={{fontFamily:FD,color:PAGE_ACCENTS.players.accent,fontSize:12,letterSpacing:"var(--tracking-default)"}}>ROSTER SNAPSHOT</div><div style={{fontFamily:FB,color:T.SUB,fontSize:10}}>{ups.length} players on roster</div></div><button className="pageHeaderPill" onClick={()=>document.getElementById("coach-add-player-form")?.scrollIntoView({behavior:"smooth"})}>Add Player</button></div></div>
    <div id="coach-add-player-form" className="accent-card" style={{background:CARD_BG,border:`1px solid ${BORDER_CLR}`,borderRadius:14,padding:14,marginBottom:12}}>
      <div style={{fontFamily:FD,color:LIGHT,fontSize:14,letterSpacing:2,marginBottom:8}}>ADD PLAYER TO ROSTER</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
        <input value={newProfile.firstName} onChange={e=>{setNewProfile({...newProfile,firstName:e.target.value});setProfileErr("")}} placeholder="First" style={{padding:10,background:BG,color:LIGHT,border:`1px solid ${BORDER_CLR}`,borderRadius:8}}/>
        <input value={newProfile.lastName} onChange={e=>{setNewProfile({...newProfile,lastName:e.target.value});setProfileErr("")}} placeholder="Last" style={{padding:10,background:BG,color:LIGHT,border:`1px solid ${BORDER_CLR}`,borderRadius:8}}/>
        <input value={newProfile.jerseyNumber} onChange={e=>setNewProfile({...newProfile,jerseyNumber:e.target.value})} placeholder="Jersey" style={{padding:10,background:BG,color:LIGHT,border:`1px solid ${BORDER_CLR}`,borderRadius:8}}/>
      </div>
      {profileErr&&<div style={{color:"#FF4545",fontSize:11,marginTop:8}}>{profileErr}</div>}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:10}}>
        <div style={{fontSize:10,color:MUTED,fontFamily:FB}}>{playerProfiles.length} player profiles on team</div>
        <button onClick={async()=>{const r=await addRosterPlayer(newProfile);if(!r.ok)setProfileErr(r.err||"Could not add player");else setNewProfile({firstName:"",lastName:"",jerseyNumber:""});}} style={{padding:"8px 12px",background:"var(--page-accent)",color:"#000000",border:"none",borderRadius:8,fontFamily:FD,letterSpacing:1,cursor:"pointer"}}>ADD</button>
      </div>
    </div>
    <CoachRoster players={players} scores={scores} shotLogs={shotLogs} drills={drills} nudged={nudged} setNudged={setNudged}/>
    {/* Tap any player in roster for detail */}
    <div style={{marginTop:16}}>
      <SH isCoach={typeof u!=="undefined"&&u?.isCoach} t="PLAYER DETAILS" s="TAP TO VIEW"/>
      {ups.map((p,i)=>{const ps=scores.filter(s=>s.email===p.email);const tot=ps.reduce((a,s)=>a+s.score,0);
        return <button key={i} className="ch" onClick={()=>setSelP(p)} style={{width:"100%",display:"flex",alignItems:"center",gap:12,background:CARD_BG,border:`1px solid ${BORDER_CLR}`,borderRadius:14,padding:"14px 16px",marginBottom:8,cursor:"pointer",textAlign:"left"}}>
          <Av n={p.name} sz={36} email={p.email}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontFamily:FB,color:LIGHT,fontSize:13,fontWeight:700}}>{p.name.toUpperCase()}</div>
            <div style={{fontFamily:FB,color:T.SUB,fontSize:10,marginTop:2}}>{tot} makes · {rsvps.filter(r=>r.email===p.email).length} events</div>
          </div>
          <svg width="12" height="12" viewBox="0 0 16 16"><path d="M6 3l5 5-5 5" stroke={VOLT} strokeWidth="2" fill="none" strokeLinecap="round"/></svg>
        </button>})}
    </div>
    {/* Account management — required by App Store §5.1.1(v) */}
    <div style={{marginTop:32,paddingTop:20,borderTop:`1px solid ${BORDER_CLR}44`}}>
      <button onClick={deleteAccount} style={{width:"100%",padding:"12px",background:"transparent",border:`1px solid #FF454533`,borderRadius:10,cursor:"pointer",fontFamily:FB,fontSize:12,color:"#FF4545",fontWeight:600,letterSpacing:1}}>Delete My Coach Account & Data</button>
      <p style={{fontFamily:FB,color:MUTED,fontSize:9,textAlign:"center",marginTop:8}}>Removes your account. Player data and drills are preserved.</p>
    </div>
  </div>}
  {tab==="players"&&selP&&<div className="fade-up"><button onClick={()=>setSelP(null)} style={{background:"none",border:"none",color:VOLT,fontFamily:FB,fontSize:13,cursor:"pointer",fontWeight:700,letterSpacing:2,marginBottom:20}}>&#8592; BACK</button><div style={{textAlign:"center",marginBottom:24}}><Av n={selP.name} sz={64} email={selP.email} style={{margin:"0 auto 14px"}}/><div style={{fontFamily:FD,color:LIGHT,fontSize:24,letterSpacing:2}}>{selP.name.toUpperCase()}</div><div style={{color:MUTED,fontSize:12,marginTop:4}}>{selP.email}</div><div style={{display:"flex",gap:8,justifyContent:"center",marginTop:12,flexWrap:"wrap"}}><span style={{fontFamily:FB,fontSize:10,fontWeight:700,padding:"3px 8px",borderRadius:5,color:VOLT,background:VOLT+"15"}}>HOME: {scores.filter(s=>s.email===selP.email&&(s.src==="home"||!s.src)).length}</span><span style={{fontFamily:FB,fontSize:10,fontWeight:700,padding:"3px 8px",borderRadius:5,color:LIGHT,background:LIGHT+"10"}}>PROGRAM: {scores.filter(s=>s.email===selP.email&&s.src==="program").length}</span><span style={{fontFamily:FB,fontSize:10,fontWeight:700,padding:"3px 8px",borderRadius:5,color:ORANGE,background:ORANGE+"15"}}>{rsvps.filter(r=>r.email===selP.email).length} EVENTS</span></div></div><HistPanel sc={scores.filter(s=>s.email===selP.email)} dr={drills}/></div>}

  {/* ═════════════ S&C MANAGEMENT ═════════════ */}
  {tab==="sc"&&<div className="page pageShell fade-up" data-accent="sc" style={shellVars("sc")}><PageHeader title="S&C" subtitle="Strength blocks, readiness, and recovery" accent="blue" icon={<LiftIcon size={22} color={PAGE_ACCENTS.sc.accent}/>} actionLabel={showAddSC?"Close":"Add"} onAction={()=>setShowAddSC(!showAddSC)} /><div className="heroModule"><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}><div><div style={{fontFamily:FD,color:PAGE_ACCENTS.sc.accent,fontSize:12,letterSpacing:"var(--tracking-default)"}}>TODAY'S LIFT</div><div style={{fontFamily:FB,color:T.SUB,fontSize:10}}>{scSessions[0]?`${scSessions[0].sport||scSessions[0].title} · ${scSessions[0].date}`:"No lift scheduled"}</div></div><button className="pageHeaderPill" onClick={()=>setShowAddSC(true)}>Add Session</button></div><div className="heroStats"><div className="heroStat"><div className="heroStatVal">{scSessions.length}</div><div className="heroStatLbl">SESSIONS</div></div><div className="heroStat"><div className="heroStatVal">{scRsvps.length}</div><div className="heroStatLbl">RSVPS</div></div><div className="heroStat"><div className="heroStatVal">{scLogs.length}</div><div className="heroStatLbl">LOGS</div></div></div></div>
    <SH isCoach={typeof u!=="undefined"&&u?.isCoach} t="S&C SESSIONS" s={`${scSessions.length} TOTAL`} identity/>
    <div className="accent-card" style={{marginBottom:16,paddingLeft:10}}><button className="btn btn--primary btn-v" onClick={()=>setShowAddSC(!showAddSC)} style={{marginBottom:0,width:"calc(100% - 32px)",marginLeft:16,marginRight:16}}>
      {showAddSC?"CANCEL":"+ ADD SESSION"}
    </button>
    {showAddSC&&<div className="fade-up" style={{background:CARD_BG,borderRadius:16,padding:"20px 18px",marginTop:12,border:`1px solid ${BORDER_CLR}`}}>
      <FF l="SPORT" v={nsc.sport} set={v=>setNsc({...nsc,sport:v})} ph="e.g. Basketball"/>
      <div style={{display:"flex",gap:8}}><div style={{flex:1}}><FF l="DATE" v={nsc.date} set={v=>setNsc({...nsc,date:v})} tp="date"/></div><div style={{flex:1}}><FF l="TIME" v={nsc.time} set={v=>setNsc({...nsc,time:v})} ph="6:00 AM"/></div></div>
      <button className="btn btn--primary btn-v" onClick={handleAddSC} style={{width:"calc(100% - 32px)",marginLeft:16,marginRight:16}}>CREATE SESSION</button>
    </div>}
    </div>
    {scSessions.sort((a,b)=>a.date.localeCompare(b.date)).map(s=>{const sr=scRsvps.filter(r=>r.sessionId===s.id);
      return <div key={s.id} className="scSection" style={{display:"flex",alignItems:"center",gap:12,background:CARD_BG,borderRadius:12,padding:"14px 16px",marginBottom:8,border:`1px solid ${BORDER_CLR}`}}>
        <div style={{width:40,height:40,borderRadius:10,background:"#A0A0A012",border:"1px solid #A0A0A033",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A0A0A0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6.5 6.5h-2a1 1 0 00-1 1v9a1 1 0 001 1h2M17.5 6.5h2a1 1 0 011 1v9a1 1 0 01-1 1h-2M6.5 12h11M1.5 9.5v5M22.5 9.5v5"/></svg>
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontFamily:FD,color:LIGHT,fontSize:14,letterSpacing:1}}>{s.sport||s.title}</div>
          <div style={{fontFamily:FB,color:T.SUB,fontSize:10,marginTop:2}}>{s.date} &#183; {s.time} &#183; <span style={{color:"#A0A0A0"}}>{sr.length} RSVPs</span></div>
        </div>
        <button onClick={()=>removeScSession(s.id)} style={{background:"none",border:"none",color:"#FF4545",cursor:"pointer",fontSize:16,padding:4}}>&#10005;</button>
      </div>;
    })}
  </div>}
</div>

{!isDesktop&&<NavBar items={navItems} active={tab} onChange={handleNavChange}/>}

  </div></div></main>
{isDesktop&&<aside className="insights-panel"><div className="panel-title">COACH INSIGHTS</div><div className="placeholder">Add widgets here later (activity, upcoming events, roster changes, lifting compliance).</div></aside>}
  </div>;
}

// ═══════════════════════════════════════
// HISTORY
// ═══════════════════════════════════════
function HistPanel({sc,dr}){
const sorted=useMemo(()=>[...sc].sort((a,b)=>(b.ts||0)-(a.ts||0)),[sc]);
const grouped=useMemo(()=>{const m={};sorted.forEach(s=>{if(!m[s.date])m[s.date]=[];m[s.date].push(s)});return Object.entries(m)},[sorted]);
return <div><SH isCoach={typeof u!=="undefined"&&u?.isCoach} t="SCORE HISTORY" s="ALL SOURCES"/>{grouped.length===0&&<Empty t="No scores yet"/>}{grouped.map(([date,entries])=><div key={date} style={{marginBottom:24}}><div style={{fontFamily:FD,color:T.SUB,fontSize:12,letterSpacing:4,marginBottom:8}}>{date}</div>{entries.map((s,i)=>{const d=dr.find(d=>d.id===s.drillId);const pct=d?Math.round(s.score/d.max*100):0;const isH=s.src==="home"||!s.src;return <div key={i} style={{display:"flex",alignItems:"center",gap:12,background:CARD_BG,borderRadius:12,padding:"12px 16px",marginBottom:5,border:`1px solid ${BORDER_CLR}`}}><div style={{width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",background:BG,borderRadius:8,flexShrink:0}}><DrillIcon type={d?.icon} size={18}/></div><div style={{flex:1}}><div style={{fontFamily:FD,color:LIGHT,fontSize:13,letterSpacing:2,display:"flex",alignItems:"center",gap:6}}>{d?.name}<span style={{fontFamily:FB,fontSize:7,fontWeight:700,padding:"1px 4px",borderRadius:3,color:isH?VOLT:LIGHT,background:isH?VOLT+"15":LIGHT+"10"}}>{isH?"HOME":"PROG"}</span></div></div><div style={{textAlign:"right"}}><div style={{fontFamily:FD,color:VOLT,fontSize:16}}>{s.score}<span style={{color:MUTED,fontSize:11}}>/{d?.max}</span></div><div style={{fontFamily:FB,fontSize:9,fontWeight:700,color:pct>=80?"#C8FF00":pct>=50?"#FFA500":"#FF4545"}}>{pct}%</div></div></div>})}</div>)}</div>;
}

// ═══════════════════════════════════════
// PLAYER PROFILE — Offseason Resume
// ═══════════════════════════════════════
function ProfilePage({u,scores,shotLogs,drills,rsvps,scRsvps,challenges,streak,earnedBadges,T,deleteAccount}){
const[confirmDel,setConfirmDel]=useState(false);
const my=useMemo(()=>scores.filter(s=>s.email===u.email),[scores,u]);
const homeScores=useMemo(()=>my.filter(s=>s.src==="home"||!s.src),[my]);
const totalMakes=homeScores.reduce((a,s)=>a+s.score,0);
const totalShots=shotLogs.filter(s=>s.email===u.email).reduce((a,s)=>a+s.made,0);
const sessionsLogged=[...new Set(homeScores.map(s=>s.date))].length;
const eventsAttended=rsvps.filter(r=>r.email===u.email).length;
const scCount=scRsvps.filter(r=>r.email===u.email).length;
const challWon=challenges.filter(c=>(c.from===u.email&&c.status==="lost")||(c.to===u.email&&c.status==="won")).length;
const challTotal=challenges.filter(c=>c.from===u.email||c.to===u.email).length;
const bestStreak=useMemo(()=>{const ds=[...new Set(homeScores.map(s=>s.date))].sort();let max=0,cur=0,prev=null;
ds.forEach(d=>{const dt=new Date(d);if(prev){const diff=(dt-prev)/(1000*60*60*24);cur=diff<=1?cur+1:1}else cur=1;max=Math.max(max,cur);prev=dt});return max},[homeScores]);

// Per-drill stats with personal bests, averages, trends
const drillStats=useMemo(()=>drills.map(d=>{
const ds=homeScores.filter(s=>s.drillId===d.id).sort((a,b)=>(a.ts||0)-(b.ts||0));
const pb=ds.reduce((m,s)=>Math.max(m,s.score),0);
const avg=ds.length?Math.round(ds.reduce((a,s)=>a+s.score,0)/ds.length*10)/10:0;
const last10=ds.slice(-10).map(s=>s.score);
// Trend: compare first half avg vs second half avg of last 10
let trend="flat";
if(last10.length>=4){const mid=Math.floor(last10.length/2);const first=last10.slice(0,mid).reduce((a,v)=>a+v,0)/mid;const second=last10.slice(mid).reduce((a,v)=>a+v,0)/(last10.length-mid);if(second>first*1.05)trend="up";else if(second<first*0.95)trend="down"}
return{...d,pb,avg,count:ds.length,last10,trend};
}),[drills,homeScores]);

const StatRow=({label,value,color=VOLT,sub})=><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 0",borderBottom:`1px solid ${BORDER_CLR}44`}}>
<div><div style={{fontFamily:FB,color:LIGHT,fontSize:13,fontWeight:600}}>{label}</div>{sub&&<div style={{fontFamily:FB,color:T.SUB,fontSize:10,marginTop:2}}>{sub}</div>}</div>
<div style={{fontFamily:FD,color,fontSize:22}}>{value}</div>

  </div>;

return <div className="fade-up">
{u.isCoach&&<div style={{background:CARD_BG,border:`1px solid ${BORDER_CLR}`,borderRadius:14,padding:"14px 16px",marginBottom:16}}><div style={{fontSize:13,color:"#C8FF00",textTransform:"uppercase",letterSpacing:"0.10em",fontFamily:FB,fontWeight:700,marginBottom:10}}>COACH ACCOUNT</div><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${BORDER_CLR}66`}}><div style={{display:"flex",alignItems:"center",gap:8}}><UsersIcon size={14} color="#A0A0A0"/><span style={{fontSize:11,color:"#555555",textTransform:"uppercase",fontFamily:FB,letterSpacing:"0.08em"}}>ROLE</span></div><span style={{fontSize:13,color:"#FFFFFF",fontFamily:FB}}>Coach</span></div><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 0"}}><div style={{display:"flex",alignItems:"center",gap:8}}><ShieldIcon size={14} color="#A0A0A0"/><span style={{fontSize:11,color:"#555555",textTransform:"uppercase",fontFamily:FB,letterSpacing:"0.08em"}}>ACCESS</span></div><span style={{fontSize:13,color:"#C8FF00",fontFamily:FB}}>Full Program Access</span></div></div>}
{/* ══════ SHAREABLE SEASON CARD ══════ */}
<div style={{background:`linear-gradient(145deg,#0A0A0A,#141414)`,borderRadius:24,padding:"28px 24px 24px",border:`1px solid ${VOLT}22`,position:"relative",overflow:"hidden",textAlign:"center",marginBottom:28}}>
{/* Corner accents */}
<div style={{position:"absolute",top:0,left:0,width:60,height:60,borderTop:`3px solid ${VOLT}`,borderLeft:`3px solid ${VOLT}`,borderRadius:"24px 0 0 0",opacity:.4}}/>
<div style={{position:"absolute",bottom:0,right:0,width:60,height:60,borderBottom:`3px solid ${VOLT}`,borderRight:`3px solid ${VOLT}`,borderRadius:"0 0 24px 0",opacity:.4}}/>
<div style={{position:"absolute",top:-40,right:-40,width:150,height:150,borderRadius:"50%",background:`radial-gradient(circle,${VOLT}08,transparent)`}}/>
{/* SL logo watermark */}
<div style={{position:"absolute",top:12,right:16,opacity:.06,pointerEvents:"none"}}><SLLogo size={90} opacity={.06}/></div>

  <div style={{fontFamily:FB,color:VOLT,fontSize:9,letterSpacing:5,fontWeight:700,marginBottom:12}}>OFFSEASON REPORT CARD</div>
  <Av n={u.name} sz={64} email={u.email} style={{margin:"0 auto 14px"}}/>
  <div style={{fontFamily:FD,color:LIGHT,fontSize:32,letterSpacing:4,lineHeight:1}}>{u.name.toUpperCase()}</div>
  <div style={{fontFamily:FB,color:MUTED,fontSize:11,marginTop:6,letterSpacing:2}}>OFFSEASON 2026</div>

  {/* Big stats row */}
  <div style={{display:"flex",gap:6,marginTop:20,justifyContent:"center"}}>
    {[{v:totalMakes+totalShots,l:"TOTAL MAKES",c:VOLT},{v:bestStreak+"D",l:"BEST STREAK",c:ORANGE},{v:eventsAttended,l:"EVENTS",c:CYAN}].map(s=>
      <div key={s.l} style={{flex:1,background:"#0a0a0a",borderRadius:14,padding:"14px 8px",border:`1px solid ${BORDER_CLR}`}}>
        <div style={{fontFamily:FD,color:s.c,fontSize:26,lineHeight:1}}>{s.v}</div>
        <div style={{fontFamily:FB,color:T.SUB,fontSize:7,letterSpacing:2,marginTop:4,fontWeight:600}}>{s.l}</div>
      </div>)}
  </div>

  {/* Highlight stat — best improving drill */}
  {(()=>{const improving=drillStats.filter(d=>d.trend==="up"&&d.count>=4);const topBadge=earnedBadges.length>0?earnedBadges[earnedBadges.length-1]:null;
    const highlight=improving.length>0
      ?`${improving[0].name} avg improved to ${improving[0].avg}`
      :topBadge?`Earned ${topBadge.name} badge (${topBadge.days}D streak)`
       :sessionsLogged>0?`${sessionsLogged} training sessions logged`:"0 sessions logged — log shots to start your progress";
    return highlight?<div style={{marginTop:16,padding:"8px 16px",background:VOLT+"08",borderRadius:10,border:`1px solid ${VOLT}22`,display:"inline-block"}}>
      <div style={{fontFamily:FB,color:VOLT,fontSize:11,fontWeight:600,letterSpacing:1}}>★ {highlight.toUpperCase()}</div>
    </div>:null})()}

  {/* Watermark */}
  <div style={{marginTop:16,display:"flex",alignItems:"center",justifyContent:"center",gap:4,opacity:.25}}>
    <SLLogo size={24}/>
    <span style={{fontFamily:FD,fontSize:10,color:VOLT,letterSpacing:3}}>SHOTLAB</span>
  </div>
</div>

{/* Hero card */}
<div style={{background:`linear-gradient(135deg,${VOLT}08,${CARD_BG})`,borderRadius:20,padding:"28px 22px",border:`1px solid ${VOLT}22`,marginBottom:24,textAlign:"center",position:"relative",overflow:"hidden"}}>
  <div style={{position:"absolute",top:0,right:0,width:120,height:120,borderRadius:"50%",background:`radial-gradient(circle,${VOLT}08,transparent)`,transform:"translate(30%,-30%)"}}/>
  <Av n={u.name} sz={72} email={u.email} style={{margin:"0 auto 16px"}}/>
  <div style={{fontFamily:FD,color:LIGHT,fontSize:28,letterSpacing:3}}>{u.name.toUpperCase()}</div>
  <div style={{fontFamily:FB,color:MUTED,fontSize:12,marginTop:4,letterSpacing:2}}>OFFSEASON PLAYER</div>
  {/* Quick stats row */}
  <div style={{display:"flex",gap:6,marginTop:20,justifyContent:"center"}}>
    {[{v:totalMakes+totalShots,l:"MAKES",c:VOLT},{v:sessionsLogged,l:"SESSIONS",c:LIGHT},{v:streak,l:"STREAK",c:ORANGE}].map(s=>
      <div key={s.l} style={{background:BG,borderRadius:12,padding:"10px 14px",border:`1px solid ${BORDER_CLR}`,minWidth:70}}>
        <div style={{fontFamily:FD,color:s.c,fontSize:22,lineHeight:1}}>{s.v}</div>
        <div style={{fontFamily:FB,color:T.SUB,fontSize:7,letterSpacing:2,marginTop:3,fontWeight:600}}>{s.l}</div>
      </div>)}
  </div>
</div>

{/* Badges */}
{earnedBadges.length>0&&<div style={{marginBottom:24}}>
  <div style={{fontFamily:FB,color:T.SUB,fontSize:10,letterSpacing:3,fontWeight:700,marginBottom:10}}>BADGES EARNED</div>
  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{earnedBadges.map(b=>
    <div key={b.days} style={{display:"flex",alignItems:"center",gap:5,background:`${b.color}10`,border:`1px solid ${b.color}33`,borderRadius:10,padding:"6px 12px"}}>
      <span style={{fontFamily:FD,fontSize:14,color:b.color}}>{b.icon}</span>
      <span style={{fontFamily:FB,fontSize:10,color:b.color,fontWeight:700,letterSpacing:1}}>{b.name}</span>
    </div>)}
  </div>
</div>}

{/* Overall stats */}
<div style={{background:CARD_BG,borderRadius:16,padding:"4px 20px",border:`1px solid ${BORDER_CLR}`,marginBottom:24}}>
  <StatRow label="Total Drill Makes" value={totalMakes}/>
  <StatRow label="Shot Tracker Makes" value={totalShots} color={ORANGE}/>
  <StatRow label="Events Attended" value={eventsAttended} color={CYAN}/>
  <StatRow label="S&C Sessions" value={scCount} color="#A0A0A0"/>
  <StatRow label="Challenges" value={`${challWon}/${challTotal}`} color={ORANGE} sub={challTotal>0?`${Math.round(challWon/challTotal*100)}% win rate`:"No challenges yet"}/>
  <StatRow label="Best Streak" value={`${bestStreak}D`} color={ORANGE}/>
  <div style={{height:4}}/>
</div>

{/* Per-drill breakdown with PBs and trends */}
<div style={{fontFamily:FB,color:T.SUB,fontSize:10,letterSpacing:3,fontWeight:700,marginBottom:12}}>DRILL BREAKDOWN</div>
{drillStats.map(d=>{const accentColor=getDrillAccentColor(d.name);return <div key={d.id} style={{background:CARD_BG,borderRadius:14,padding:"16px 18px",border:`1px solid ${BORDER_CLR}`,borderLeft:`5px solid ${accentColor}`,marginBottom:10}}>
  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
    <DrillIcon type={d.icon} size={20} color={accentColor}/>
    <div style={{flex:1,fontFamily:FB,color:LIGHT,fontSize:13,fontWeight:700,letterSpacing:1}}>{d.name}</div>
    <div style={{fontFamily:FB,fontSize:9,fontWeight:700,letterSpacing:1,padding:"2px 8px",borderRadius:5,
      color:d.trend==="up"?"#C8FF00":d.trend==="down"?"#FF4545":MUTED,
      background:d.trend==="up"?"#C8FF0015":d.trend==="down"?"#FF454515":BORDER_CLR}}>
      {d.trend==="up"?"▲ IMPROVING":d.trend==="down"?"▼ DECLINING":"— STEADY"}
    </div>
  </div>
  <div style={{display:"flex",gap:8,marginBottom:d.last10.length>=2?12:0}}>
    <div style={{flex:1,background:BG,borderRadius:10,padding:"10px",border:`1px solid ${BORDER_CLR}`,textAlign:"center"}}>
      <div style={{fontFamily:FD,color:ORANGE,fontSize:20}}>{d.pb}</div>
      <div style={{fontFamily:FB,color:T.SUB,fontSize:7,letterSpacing:2,marginTop:2,fontWeight:600}}>PB</div>
    </div>
    <div style={{flex:1,background:BG,borderRadius:10,padding:"10px",border:`1px solid ${BORDER_CLR}`,textAlign:"center"}}>
      <div style={{fontFamily:FD,color:VOLT,fontSize:20}}>{d.avg}</div>
      <div style={{fontFamily:FB,color:T.SUB,fontSize:7,letterSpacing:2,marginTop:2,fontWeight:600}}>AVG</div>
    </div>
    <div style={{flex:1,background:BG,borderRadius:10,padding:"10px",border:`1px solid ${BORDER_CLR}`,textAlign:"center"}}>
      <div style={{fontFamily:FD,color:LIGHT,fontSize:20}}>{d.count}</div>
      <div style={{fontFamily:FB,color:T.SUB,fontSize:7,letterSpacing:2,marginTop:2,fontWeight:600}}>LOGGED</div>
    </div>
  </div>
  {/* Mini sparkline chart of last 10 scores */}
  {d.last10.length>=2&&<div style={{display:"flex",alignItems:"center",gap:8}}>
    <div style={{fontFamily:FB,color:T.SUB,fontSize:8,letterSpacing:1,fontWeight:600,flexShrink:0}}>LAST {d.last10.length}</div>
    <Sparkline data={d.last10} color={VOLT} w={200} h={20}/>
  </div>}
</div>})}

{/* ══════ ACCOUNT MANAGEMENT ══════ */}
<div style={{marginTop:32,paddingTop:24,borderTop:`1px solid ${BORDER_CLR}44`}}>
  <div style={{fontFamily:FB,color:T.SUB,fontSize:10,letterSpacing:3,fontWeight:700,marginBottom:12}}>ACCOUNT</div>
  {!confirmDel?<button onClick={()=>setConfirmDel(true)} style={{width:"100%",padding:"14px",background:"transparent",border:`1px solid #FF454544`,borderRadius:12,cursor:"pointer",fontFamily:FB,fontSize:13,color:"#FF4545",fontWeight:600,letterSpacing:1}}>
    Delete Account & All Data
  </button>
  :<div className="fade-up" style={{background:"#FF454508",borderRadius:16,padding:"20px",border:`1px solid #FF454533`}}>
    <div style={{fontFamily:FD,color:"#FF4545",fontSize:18,letterSpacing:3,marginBottom:8}}>DELETE ACCOUNT?</div>
    <p style={{fontFamily:FB,color:MUTED,fontSize:12,lineHeight:1.5,marginBottom:16}}>This will permanently delete your account, scores, shot logs, RSVPs, and all associated data. This cannot be undone.</p>
    <div style={{display:"flex",gap:8}}>
      <button onClick={()=>setConfirmDel(false)} style={{flex:1,padding:"12px",background:"transparent",color:MUTED,fontFamily:FD,fontSize:14,letterSpacing:2,border:`1px solid ${BORDER_CLR}`,borderRadius:10,cursor:"pointer"}}>CANCEL</button>
      <button onClick={deleteAccount} className="btn-v cta-danger" style={{}}>DELETE</button>
    </div>
  </div>}
  <p style={{fontFamily:FB,color:T.SUB,fontSize:10,textAlign:"center",marginTop:12,lineHeight:1.5}}>Your data is stored locally on this device. Deleting your account removes all your personal information and scores.</p>
</div>

  </div>;
}
function CoachRoster({players,scores,shotLogs,drills,nudged,setNudged}){
  const [sortBy,setSortBy]=useState("status");
  const now=Date.now();
  const dayMs=1000*60*60*24;
  const weekStartTs=now-(7*dayMs);
  const parseAnyDate=(v)=>{
    if(!v)return null;
    if(v instanceof Date)return Number.isNaN(v.getTime())?null:v;
    const d=new Date(v);
    return Number.isNaN(d.getTime())?null:d;
  };
  const toEventDate=(entry)=>{
    if(entry?.ts)return new Date(entry.ts);
    return parseAnyDate(entry?.date||entry?.updatedAt||entry?.createdAt);
  };
  const daysSince=(date)=>{
    if(!date)return null;
    return Math.max(0,Math.floor((now-date.getTime())/dayMs));
  };
  const getStatusMeta=(days)=>{
    if(days===null||days>=5)return {pill:"INACTIVE",color:TOKENS.DANGER,rank:0};
    if(days<=2)return {pill:"ACTIVE",color:VOLT,rank:2};
    return {pill:"AT RISK",color:TOKENS.WARNING,rank:1};
  };
  const formatLastActive=(days)=>{
    if(days===null)return "Never";
    if(days===0)return "Today";
    if(days===1)return "1 day ago";
    return `${days} days ago`;
  };

  const roster=useMemo(()=>{
    const enriched=players.filter(p=>p.role!=="coach").map(p=>{
      const playerScores=scores.filter(s=>s.email===p.email);
      const playerShotLogs=shotLogs.filter(s=>s.email===p.email);
      const scoreDates=playerScores.map(toEventDate).filter(Boolean);
      const shotDates=playerShotLogs.map(toEventDate).filter(Boolean);
      const profileDates=[p.lastActiveAt,p.lastLogin,p.updatedAt,p.createdAt].map(parseAnyDate).filter(Boolean);
      const allDates=[...scoreDates,...shotDates,...profileDates];
      const lastActiveAt=allDates.length?new Date(Math.max(...allDates.map(d=>d.getTime()))):null;
      const daysAgo=daysSince(lastActiveAt);
      const statusMeta=getStatusMeta(daysAgo);
      const weeklyScoreCount=playerScores.filter(s=>{
        const d=toEventDate(s);
        return d&&d.getTime()>=weekStartTs;
      }).length;
      const weeklyShotCount=playerShotLogs.filter(s=>{
        const d=toEventDate(s);
        return d&&d.getTime()>=weekStartTs;
      }).length;
      const weeklyActivityCount=weeklyScoreCount+weeklyShotCount;
      const weekDrillSet=new Set(playerScores.filter(s=>{
        const d=toEventDate(s);
        return d&&d.getTime()>=weekStartTs&&(s.src==="home"||!s.src);
      }).map(s=>s.drillId).filter(Boolean));
      const weeklyCompletionPct=drills.length?Math.min(100,Math.round((weekDrillSet.size/drills.length)*100)):null;
      return {...p,lastActiveAt,daysAgo,weeklyActivityCount,weeklyCompletionPct,statusMeta};
    });
    return [...enriched].sort((a,b)=>{
      if(sortBy==="name")return (a.name||"").localeCompare(b.name||"");
      const ageA=a.daysAgo===null?Number.POSITIVE_INFINITY:a.daysAgo;
      const ageB=b.daysAgo===null?Number.POSITIVE_INFINITY:b.daysAgo;
      return a.statusMeta.rank-b.statusMeta.rank||ageB-ageA||(a.name||"").localeCompare(b.name||"");
    });
  },[players,scores,shotLogs,drills,sortBy,weekStartTs]);

return <div className="fade-up">
<SH isCoach={typeof u!=="undefined"&&u?.isCoach} t="PLAYER ROSTER" s={`${roster.length} PLAYERS`} identity/>
<div style={{fontFamily:FB,color:MUTED,fontSize:11,marginBottom:18,lineHeight:1.5}}>Track who's putting in work today. Tap "NUDGE" to flag inactive players for follow-up.</div>

<div style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}>
  <label style={{display:"flex",alignItems:"center",gap:8,fontFamily:FB,fontSize:10,color:TOKENS.TEXT_SECONDARY,letterSpacing:"0.08em",textTransform:"uppercase"}}>
    Sort
    <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{height:34,padding:"0 10px",background:BG,border:`1px solid ${BORDER_CLR}`,borderRadius:9,color:LIGHT,fontFamily:FB,fontSize:11,fontWeight:600}}>
      <option value="status">Status (Inactive First)</option>
      <option value="name">Name (A-Z)</option>
    </select>
  </label>
</div>

{roster.length===0&&<Empty t="No players registered yet" action="Players need to create an account and log their first score to appear here."/>}
{roster.map(p=>{const c=p.statusMeta.color;const isNudged=nudged.includes(p.email);
  const circumference=2*Math.PI*12;
  const ringOffset=p.weeklyCompletionPct===null?circumference:circumference-((p.weeklyCompletionPct/100)*circumference);
  return <div key={p.email} style={{display:"flex",background:CARD_BG,borderRadius:14,marginBottom:10,border:`1px solid ${p.statusMeta.pill==="INACTIVE"?"#FF454533":BORDER_CLR}`,overflow:"hidden"}}>
    <div style={{width:5,background:c,flexShrink:0}}/>
    <div style={{display:"flex",alignItems:"stretch",gap:12,padding:"14px 12px",flex:1}}>
      <div style={{position:"relative",alignSelf:"center"}}>
        <Av n={p.name} sz={40} email={p.email}/>
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,marginBottom:4}}>
          <div style={{display:"flex",alignItems:"center",gap:8,minWidth:0}}>
            <span style={{fontFamily:FB,color:LIGHT,fontSize:14,fontWeight:800,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.name}</span>
            {p.weeklyCompletionPct!==null&&<svg width="28" height="28" viewBox="0 0 28 28" aria-label={`Weekly completion ${p.weeklyCompletionPct}%`}>
              <circle cx="14" cy="14" r="12" stroke="#333333" strokeWidth="3" fill="none"/>
              <circle cx="14" cy="14" r="12" stroke={VOLT} strokeWidth="3" fill="none" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={ringOffset} transform="rotate(-90 14 14)"/>
            </svg>}
          </div>
          <span style={{fontFamily:FB,fontSize:9,fontWeight:700,letterSpacing:1,padding:"3px 7px",borderRadius:999,color:c,background:c+"15",whiteSpace:"nowrap"}}>{p.statusMeta.pill}</span>
        </div>
        <div style={{fontFamily:FB,color:"#FFFFFFB3",fontSize:11,lineHeight:1.55}}>
          <div>Last Active: <span style={{color:VOLT,fontWeight:700}}>{formatLastActive(p.daysAgo)}</span></div>
          <div>This Week: <span style={{color:VOLT,fontWeight:700}}>{p.weeklyActivityCount}</span> logs</div>
          {p.weeklyCompletionPct!==null&&<div>Weekly Completion: <span style={{color:VOLT,fontWeight:700}}>{p.weeklyCompletionPct}%</span></div>}
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"flex-end",gap:8,minWidth:94}}>
    {p.statusMeta.pill==="INACTIVE"&&<button onClick={()=>{if(!isNudged)setNudged(n=>[...n,p.email])}} style={{minHeight:40,padding:"0 12px",borderRadius:8,border:`1px solid ${isNudged?VOLT+"44":"#FF454544"}`,background:isNudged?VOLT+"12":"#FF454512",cursor:"pointer",fontFamily:FB,fontSize:10,fontWeight:700,letterSpacing:1,color:isNudged?VOLT:"#FF4545",whiteSpace:"nowrap",width:"100%"}}>
      {isNudged?"✓ NUDGED":"NUDGE"}
    </button>}
      </div>
    </div>
  </div>})}

  </div>;
}

// Text sanitizer — strip HTML tags from user input
function san(s){return typeof s==="string"?s.replace(/<[^>]*>/g,""):s}

// ═══════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════
function SLLogo({size=60,glow=false,opacity:op=1,style:sx}){return <img src="data:image/png;base64,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" alt="SL" width={size} height={size} style={{display:"block",objectFit:"contain",opacity:op,borderRadius:size*.18,...(glow?{filter:`drop-shadow(0 0 ${size*.15}px ${VOLT}66)`}:{}),...sx}}/>}

function calcStreak(sc){const ds=[...new Set(sc.map(s=>s.date))].sort().reverse();let c=0,d=new Date();for(let i=0;i<400;i++){const s=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;if(ds.includes(s)){c++;d.setDate(d.getDate()-1)}else if(i===0){d.setDate(d.getDate()-1)}else break}return c}
function hashCode(s){let h=0;for(let i=0;i<s.length;i++){h=((h<<5)-h)+s.charCodeAt(i);h|=0}return Math.abs(h)}
const AVG=[["#C8FF00","#00E5FF"],["#C8FF00","#C8FF00"],["#00E5FF","#C8FF00"],["#C8FF00","#C8FF00"],["#A0A0A0","#00E5FF"],["#C8FF00","#C8FF00"],["#C8FF00","#00E5FF"],["#C8FF00","#C8FF00"]];
function AnimNum({v,c=VOLT,big,size}){const[display,setDisplay]=useState(0);const[isVisible,setIsVisible]=useState(false);useEffect(()=>{setIsVisible(false);const fadeIn=requestAnimationFrame(()=>setIsVisible(true));if(typeof v!=="number"){setDisplay(v);return()=>cancelAnimationFrame(fadeIn)}let cancelled=false;const end=v;const dur=600;const t0=Date.now();const step=()=>{if(cancelled)return;const elapsed=Date.now()-t0;const prog=Math.min(elapsed/dur,1);const eased=1-Math.pow(1-prog,3);setDisplay(Math.round(eased*end));if(prog<1)requestAnimationFrame(step)};step();return()=>{cancelAnimationFrame(fadeIn);cancelled=true}},[v]);return <span className="cnt-up" style={{fontFamily:FD,color:c,fontSize:size||(big?42:26),letterSpacing:1,lineHeight:1,fontWeight:700,opacity:isVisible?1:0,transition:"opacity 150ms ease"}}>{display}</span>}
function BrandWordmark({size=30,small}){return <div style={{fontFamily:FD,fontSize:size,lineHeight:.85,letterSpacing:small?1.5:3,fontWeight:900,whiteSpace:"nowrap"}}><span style={{color:LIGHT}}>SHOT</span><span style={{color:VOLT}}>LAB</span></div>}
function BrandBackdrop(){return <><div style={{position:"fixed",inset:0,background:"radial-gradient(ellipse 80% 40% at 50% 0%, rgba(200, 255, 0, 0.04) 0%, transparent 100%)",pointerEvents:"none",zIndex:0}}/><div style={{position:"fixed",left:"50%",top:"50%",transform:"translate(-50%,-35%)",opacity:.03,pointerEvents:"none",zIndex:0,width:180}}><SLLogo size={180}/></div></>}
function SectionHero({icon,title,subtitle,accent=VOLT,deco,isCoach=false}){return <div style={{marginBottom:12}}><div style={{height:80,display:"flex",alignItems:"center",gap:14}}><div style={{width:42,height:42,borderRadius:12,background:accent+"12",border:`1px solid ${accent}33`,display:"flex",alignItems:"center",justifyContent:"center",position:"relative",flexShrink:0}}>{icon}{deco&&<div style={{position:"absolute",bottom:-6,right:-6,opacity:.6}}>{deco}</div>}</div><div><div className="u-allcaps-long" style={{fontFamily:FD,fontSize:24,color:"var(--text-1)",lineHeight:1,display:"flex",alignItems:"center",gap:6}}>{title}{isCoach&&<ShieldIcon size={12} color="var(--text-3)" style={{opacity:.5,pointerEvents:"none"}}/>}</div><div className="u-secondary-text" style={{fontFamily:FB,fontSize:12,marginTop:4}}>{subtitle}</div></div></div><div style={{height:1,background:BORDER_CLR}}/></div>}
function SC({l,v,c=VOLT,big,small,fire,accent}){const inner=<div style={{flex:big?1.6:1,background:`linear-gradient(145deg,${SURFACE},${CARD_BG})`,borderRadius:16,padding:big?"22px 18px":"14px 12px",position:"relative",overflow:"hidden"}}>{fire&&<div style={{position:"absolute",top:6,right:8,fontSize:14}}>🔥</div>}{typeof v==="number"?<AnimNum v={v} c={c} big={big}/>:<div style={{fontFamily:FD,color:c,fontSize:big?42:26,letterSpacing:1,lineHeight:1}}>{v}</div>}<div style={{fontFamily:FB,color:T.SUB,fontSize:9,letterSpacing:3,marginTop:big?6:4,fontWeight:600}}>{l}</div></div>;if(accent)return <div className="grd-bdr" style={{flex:big?1.6:1}}>{inner}</div>;return <div style={{flex:big?1.6:1}}><div style={{border:`1px solid ${BORDER_CLR}`,borderRadius:16}}>{inner}</div></div>}
function SH({t,s,isCoach=false,identity=false}){return <div style={{marginBottom:16,display:"flex",alignItems:"baseline",justifyContent:"space-between"}}><div>{identity?<div className="page-header"><h1 className="page-title u-allcaps-long" style={{fontFamily:FD,color:LIGHT,fontSize:18,display:"inline-flex",alignItems:"center",gap:6,margin:0}}>{t}{isCoach&&<ShieldIcon size={12} color="var(--text-3)" style={{opacity:.5,pointerEvents:"none"}}/>}</h1><div className="page-identity-bar" aria-hidden="true"></div></div>:<div className="u-allcaps-long" style={{fontFamily:FD,color:LIGHT,fontSize:18,display:"inline-flex",alignItems:"center",gap:6}}>{t}{isCoach&&<ShieldIcon size={12} color="var(--text-3)" style={{opacity:.5,pointerEvents:"none"}}/>}</div>}</div>{s&&<div className="u-meta-label" style={{fontFamily:FB,fontSize:11}}>{s}</div>}</div>}
function Av({n,sz=36,style:x,email,isCoach=false}){const idx=email?hashCode(email)%AVG.length:hashCode(n||"?")%AVG.length;const[c1,c2]=AVG[idx];return <div style={{width:sz,height:sz,borderRadius:"50%",background:`linear-gradient(135deg,${c1}44,${c2}44)`,border:`2px solid ${c1}33`,color:c1,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:FD,fontSize:sz*.42,flexShrink:0,letterSpacing:1,boxShadow:`0 0 12px ${c1}11${isCoach?", 0 0 0 4px rgba(200, 255, 0, 0.15)":""}`,...x}}>{(n||"?")[0].toUpperCase()}</div>}
function ConfettiBurst(){const particles=useMemo(()=>Array.from({length:24},(_,i)=>{const angle=(i/24)*360*(Math.PI/180);const dist=60+Math.random()*80;const x=Math.cos(angle)*dist;const y=Math.sin(angle)*dist-20;const colors=[VOLT,ORANGE,CYAN,"#C8FF00","#C8FF00","#FFFFFF"];return {x,y,color:colors[i%colors.length],size:3+Math.random()*4,delay:Math.random()*0.15}}),[]);return <div style={{position:"absolute",top:"30%",left:"50%",zIndex:20,pointerEvents:"none"}}>{particles.map((p,i)=><div key={i} className="particle" style={{width:p.size,height:p.size,background:p.color,left:0,top:0,"–fly-to":`translate(${p.x}px,${p.y}px) scale(0)`,animationDelay:`${p.delay}s`,animationDuration:".7s"}}/>)}</div>}
function CourtDivider({color=VOLT,my=20}){return <div className="uiDecor" aria-hidden="true" style={{margin:`${my}px 0`,position:"relative",height:24,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}><svg width="100%" height="24" viewBox="0 0 400 24" preserveAspectRatio="none" fill="none" style={{position:"absolute",inset:0,opacity:.12}}><line x1="0" y1="12" x2="160" y2="12" stroke={color} strokeWidth="1"/><path d="M160 12Q200 -4 240 12" stroke={color} strokeWidth="1" fill="none"/><line x1="240" y1="12" x2="400" y2="12" stroke={color} strokeWidth="1"/></svg><div style={{width:6,height:6,borderRadius:"50%",background:color,opacity:.15,position:"relative",zIndex:1}}/></div>}
function DividerDot(){return <div className="uiDecor" aria-hidden="true" style={{display:"flex",alignItems:"center",gap:10,width:"100%",margin:"14px 0"}}><div style={{height:1,background:BORDER_CLR,flex:1}}/><div style={{width:4,height:4,borderRadius:"50%",background:VOLT}}/><div style={{height:1,background:BORDER_CLR,flex:1}}/></div>}
function RB({r,m,small}){const t=r<=3;return <div style={{width:small?22:28,height:small?22:28,borderRadius:small?5:7,background:t?m[r-1]+"18":"transparent",border:t?`1.5px solid ${m[r-1]}44`:`1px solid ${BORDER_CLR}`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:FD,fontSize:small?11:14,color:t?m[r-1]:"#555555",flexShrink:0}}>{r}</div>}
function Empty({t,action,onTap,cta="GET STARTED",ctaVariant="primary",secondaryCta,onSecondaryTap,secondaryCtaVariant="tertiary",icon=<DrillIcon type="sb" size={48} color="#555555"/>,variant,subtitle}){return <EmptyState variant={variant} title={t} subtitle={subtitle||action} onTap={onTap} cta={cta} ctaVariant={ctaVariant} secondaryCta={secondaryCta} onSecondaryTap={onSecondaryTap} secondaryCtaVariant={secondaryCtaVariant} icon={icon}/>}
function LiftIcon({size=24,color="#A0A0A0"}){return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6.5 6.5h-2a1 1 0 00-1 1v9a1 1 0 001 1h2M17.5 6.5h2a1 1 0 011 1v9a1 1 0 01-1 1h-2M6.5 12h11M1.5 9.5v5M22.5 9.5v5"/></svg>}
function FF({l,v,set,ph,tp,ta}){return <><label style={{fontFamily:FB,color:"#A0A0A0",fontSize:11,fontWeight:700,letterSpacing:3,display:"block",marginBottom:8}}>{l}</label>{ta?<textarea value={v} onChange={e=>set(e.target.value)} placeholder={ph} style={{width:"100%",padding:"13px 16px",background:"#141414",border:"1px solid #333333",borderRadius:12,color:LIGHT,fontSize:14,fontFamily:FB,outline:"none",minHeight:70,resize:"vertical",lineHeight:1.6,marginBottom:14,transition:"border-color .15s ease, box-shadow .15s ease"}} onFocus={e=>{e.target.style.borderColor=VOLT;e.target.style.boxShadow="0 0 0 3px rgba(200,255,0,0.08)"}} onBlur={e=>{e.target.style.borderColor="#333333";e.target.style.boxShadow="none"}}/>:<input type={tp||"text"} value={v} onChange={e=>set(e.target.value)} placeholder={ph} style={{width:"100%",height:52,padding:"0 16px",background:"#141414",border:"1px solid #333333",borderRadius:12,color:LIGHT,fontSize:14,fontFamily:FB,fontWeight:500,outline:"none",marginBottom:14,transition:"border-color .15s ease, box-shadow .15s ease"}} onFocus={e=>{e.target.style.borderColor=VOLT;e.target.style.boxShadow="0 0 0 3px rgba(200,255,0,0.08)"}} onBlur={e=>{e.target.style.borderColor="#333333";e.target.style.boxShadow="none"}}/>}</>}
function NavBar({items,active,onChange}){
const navAccent=PAGE_ACCENTS[active]?.accent||PAGE_ACCENTS.feed.accent;
return <nav className="bottom-nav" role="navigation" aria-label="Main navigation" style={{"--nav-accent":navAccent,position:"fixed",left:0,right:0,bottom:0,display:"flex",justifyContent:"space-evenly",alignItems:"center",height:64,paddingBottom:"env(safe-area-inset-bottom)",background:"var(--surface-1)",borderTop:"1px solid var(--stroke-1)",zIndex:20}}>{items.map(t=>{const a=active===t.k;
const tabAccent="var(--accent)";
return <button key={t.k} aria-label={t.l} aria-current={a?"page":undefined} className={`tab ${a?"is-active active":""}`} onClick={()=>onChange(t.k)} style={{"--tab-accent":tabAccent,flex:1,minWidth:48,minHeight:48,height:"100%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4,padding:"8px 4px 6px",position:"relative",background:"none",border:"none",cursor:"pointer",transition:"color 150ms ease-out",outlineOffset:2}}>
<div className="tab-icon" style={{position:"relative"}}>{t.svg}</div>
<div className="tab-label" style={{fontFamily:FB,fontSize:10,letterSpacing:"0.05em",textTransform:"uppercase",lineHeight:1.1,whiteSpace:"nowrap"}}>{t.l}</div>
</button>})}</nav>}
