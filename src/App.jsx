// src/App.jsx

import {
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import PlayersScreen from "./screens/PlayersScreen";
import CoachTeamBrandingScreen from "./screens/CoachTeamBrandingScreen";

import PageHeader from "./components/PageHeader";
import AppHeader from "./components/AppHeader";
import CoachCommandCenter from "./components/CoachCommandCenter";
import CoachHero from "./components/CoachHero";
import CoachMiniHeader from "./components/CoachMiniHeader";
import ShotLabCharts from "./components/ShotLabCharts";
import HomeShotsLeaderboardCard from "./components/HomeShotsLeaderboardCard";

import { TeamBrandingProvider, useTeamBranding } from "./context/TeamBrandingContext";

import DEFAULT_BRANDING from "./theme/brandingDefaults";
import resolveTeamBranding from "./theme/resolveTeamBranding";
import TOKENS from "./theme/appTokens";

import { initAnalytics, trackBackendEvent } from "./lib/analytics";
import { buildDemoDataBundle, applyDemoData, clearDemoData } from "./lib/demoData";
import { isDemoMode } from "./lib/demoMode.js";

import { supabase } from "./lib/supabase.js";
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
feed:{accent:"var(--accent)",glow:"var(--accent-soft)",bg:"var(--team-brand-accent-bg, rgba(200,255,26,0.08))"},
drills:{accent:"var(--accent)",glow:"var(--accent-soft)",bg:"var(--team-brand-accent-bg, rgba(200,255,26,0.08))"},
events:{accent:"var(--accent)",glow:"var(--accent-soft)",bg:"var(--team-brand-accent-bg, rgba(200,255,26,0.08))"},
sc:{accent:"var(--accent)",glow:"var(--accent-soft)",bg:"var(--team-brand-accent-bg, rgba(200,255,26,0.08))"},
players:{accent:"var(--accent)",glow:"var(--accent-soft)",bg:"var(--team-brand-accent-bg, rgba(200,255,26,0.08))"},
};
const MODE_CARD_TOKENS={
BASE_BG:"linear-gradient(160deg, rgba(30, 30, 30, 0.96) 0%, rgba(15, 15, 15, 0.94) 100%)",
BASE_BORDER:"rgba(255, 255, 255, 0.18)",
BASE_SHADOW:"0 12px 30px rgba(0, 0, 0, 0.42)",
HOME_TINT:"rgba(200, 255, 0, 0.18)",
PROGRAM_TINT:"rgba(0, 176, 255, 0.14)",
HOME_GLOW:"rgba(200, 255, 0, 0.20)",
PROGRAM_GLOW:"rgba(0, 176, 255, 0.22)",
HOME_FOCUS_RING:"rgba(200, 255, 0, 0.45)",
PROGRAM_FOCUS_RING:"rgba(0, 176, 255, 0.38)",
PROGRAM_ACCENT_LINE:"rgba(124, 223, 255, 0.9)",
PROGRAM_CTA_BG:"rgba(0, 176, 255, 0.05)",
PROGRAM_CTA_SHADOW:"0 0 16px rgba(0, 176, 255, 0.12)",
PROGRAM_CHIP_BG:"rgba(0, 176, 255, 0.08)",
PROGRAM_CHIP_BORDER:"rgba(0, 176, 255, 0.26)",
ICON_INNER:"rgba(255, 255, 255, 0.06)",
CHEVRON_BG:"rgba(255, 255, 255, 0.06)",
};
const MODE_CARD_ACCENTS={
home:{
  tint:MODE_CARD_TOKENS.HOME_TINT,
  glow:MODE_CARD_TOKENS.HOME_GLOW,
  iconStroke:VOLT,
  focusRing:MODE_CARD_TOKENS.HOME_FOCUS_RING,
  topAccentStart:VOLT,
  topAccentEnd:MODE_CARD_TOKENS.HOME_GLOW,
  ctaBackground:MODE_CARD_TOKENS.CHEVRON_BG,
  ctaShadow:"0 0 10px var(--glow)",
  chipBackground:"var(--chip-bg)",
  chipBorder:"1.5px solid var(--chip-border)",
  chipColor:"var(--chip-color)",
},
program:{
  tint:MODE_CARD_TOKENS.PROGRAM_TINT,
  glow:MODE_CARD_TOKENS.PROGRAM_GLOW,
  iconStroke:CYAN,
  focusRing:MODE_CARD_TOKENS.PROGRAM_FOCUS_RING,
  topAccentStart:MODE_CARD_TOKENS.PROGRAM_ACCENT_LINE,
  topAccentEnd:MODE_CARD_TOKENS.PROGRAM_GLOW,
  ctaBackground:MODE_CARD_TOKENS.PROGRAM_CTA_BG,
  ctaShadow:MODE_CARD_TOKENS.PROGRAM_CTA_SHADOW,
  chipBackground:MODE_CARD_TOKENS.PROGRAM_CHIP_BG,
  chipBorder:`1px solid ${MODE_CARD_TOKENS.PROGRAM_CHIP_BORDER}`,
  chipColor:CYAN,
},
};
const MODE_CARD_VARIANTS={
active:{
showTopAccent:true,
chipBackground:"accent",
chipBorder:"accent",
chipColor:"accent",
iconBorderWidth:"1.5px",
iconGlow:"inset 0 0 10px var(--glow)",
ctaShadow:"accent",
ctaBackground:"accent",
},
structured:{
showTopAccent:false,
chipBackground:"accent",
chipBorder:"accent",
chipColor:"accent",
iconBorderWidth:"1px",
iconGlow:"none",
ctaShadow:"accent",
ctaBackground:"accent",
	},
};
const MODE_CARD_INFO_LAYOUTS={
equal:{
container:{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:10},
getTileStyle:()=>({}),
},
schedule:{
container:{display:"grid",gridTemplateColumns:"1.45fr 1fr",gridTemplateRows:"repeat(2,minmax(0,1fr))",gap:10},
getTileStyle:(index,total)=>total>=3&&index===0?{gridRow:"1 / span 2"}: {},
},
};
const COACH_TEXT_SIZES=["standard","large","xl"];

const DEFAULT_DEMO_DRILL_CATALOG=[
{key:"warm-up-shooting-4-minute",name:"4 MINUTE WARM UP SHOOTING",desc:"4-minute weighted shooting circuit.",icon:"mr",instructions:`Setup: 1 shooter, 1 ball, 1 rebounder.

1st minute: FT line jumpers = 1 point
2nd minute: wing 15 foot jumpers = 2 points
3rd minute: baseline 15 foot jumpers = 2 points
4th minute: top of key 3 pointers = 3 points`,homeId:"demo-home-warm-up-shooting-4-minute",programId:"demo-program-warm-up-shooting-4-minute"},
{key:"calipari-shooting",name:"CALIPARI SHOOTING",desc:"Complete as many 3-point spots as possible in 1:30.",icon:"3p",instructions:`Setup: 1 shooter, 1 ball, 1 rebounder.

1:30 on clock
5 spots: 2 corners, 2 wings, top of key
All 3 pointers
Make 2 in a row from each spot, then move on
Score is how many spots were completed in 1:30`,homeId:"demo-home-calipari-shooting",programId:"demo-program-calipari-shooting"},
{key:"3-minute-shooting",name:"3 MINUTE SHOOTING",desc:"Make as many 3s as possible in 3 minutes.",icon:"3p",instructions:`Setup: 1 shooter, 1 ball, 1 rebounder.

Make as many 3s as possible in 3 minutes at any spot or spots

Reference:
Standard score = 32
Good shooters = 40+`,homeId:"demo-home-3-minute-shooting",programId:"demo-program-3-minute-shooting"},
{key:"47-shooting",name:"47 SHOOTING",desc:"Finish the sequence, then score top-of-key 3s with time left.",icon:"3p",instructions:`Setup: 1 shooter, 1 ball, 1 rebounder.

4:00 on clock
5 spots: 2 corners, 2 wings, top of key
First make 3/5 at each of the 5 spots
If player goes 2/5 at a spot, stay there and restart from 0/0
Next make 5 in a row, 1 from each of the 5 spots
If any of the 5 is missed, restart from either corner at 0
Then make 5 in a row again with the same rules
Once completed, go to top of key and make as many 3s as possible in the remaining time
Only those final top of key makes count as the posted score`,homeId:"demo-home-47-shooting",programId:"demo-program-47-shooting"},
{key:"buddy-hield-shooting",name:"BUDDY HIELD SHOOTING",desc:"Keep shooting until you miss twice in a row.",icon:"3p",instructions:`Setup: 1 shooter, 1 ball, 1 rebounder.

No time
Start with a make
Continue shooting until 2 misses in a row
Score is total makes before the drill ends`,homeId:"demo-home-buddy-hield-shooting",programId:"demo-program-buddy-hield-shooting"},
{key:"make-20",name:"MAKE 20",desc:"Track how many shots it takes to make 20 threes.",icon:"3p",instructions:`Setup: 1 shooter, 1 ball, 1 rebounder.

No time
Take 3s from any spot
Continue until 20 made 3 pointers
Score is total shots taken`,homeId:"demo-home-make-20",programId:"demo-program-make-20"},
{key:"230s",name:"230'S",desc:"2:30 weighted shooting circuit from elbows, corners, and top.",icon:"3p",instructions:`Setup: 1 shooter, 1 ball, 1 rebounder.

2 minutes 30 seconds on clock
30 seconds from one elbow
30 seconds from the other elbow
30 seconds from one corner
30 seconds from the other corner
30 seconds from top of key 3s

Scoring:
Elbows and corners = 1 point per make
Top of key 3s = 2 points per make`,homeId:"demo-home-230s",programId:"demo-program-230s"},
];
const DEFAULT_HOME_DRILLS=DEFAULT_DEMO_DRILL_CATALOG.map(({homeId,key,...drill})=>({...drill,id:homeId,slug:`home-${key}`,isDefaultDemo:true,mode:"home"}));
const DEFAULT_PROGRAM_DRILLS=DEFAULT_DEMO_DRILL_CATALOG.map(({programId,key,...drill})=>({...drill,id:programId,slug:`program-${key}`,isDefaultDemo:true,mode:"program"}));
const DEFAULT_HOME_DRILL_SLUGS=new Set(DEFAULT_HOME_DRILLS.map(d=>d.slug));
const DEFAULT_PROGRAM_DRILL_SLUGS=new Set(DEFAULT_PROGRAM_DRILLS.map(d=>d.slug));
const normalizeDrillText=value=>String(value||"").trim().toLowerCase().replace(/\s+/g," ");
const buildDefaultDrillIndex=defaults=>{const byId=new Map(),bySlug=new Map(),byName=new Map();defaults.forEach(def=>{byId.set(String(def.id),def);bySlug.set(def.slug,def);byName.set(normalizeDrillText(def.name),def);});return{byId,bySlug,byName};};
const DEFAULT_HOME_DRILL_INDEX=buildDefaultDrillIndex(DEFAULT_HOME_DRILLS);
const DEFAULT_PROGRAM_DRILL_INDEX=buildDefaultDrillIndex(DEFAULT_PROGRAM_DRILLS);
const findMatchingDefaultDrill=(drill,index)=>{if(!drill)return null;return index.byId.get(String(drill.id))||index.bySlug.get(drill.slug)||index.byName.get(normalizeDrillText(drill.name))||null;};
const mergeDefaultDrills=(existing=[],defaults=[])=>{const list=Array.isArray(existing)?existing:[];const index=defaults===DEFAULT_PROGRAM_DRILLS?DEFAULT_PROGRAM_DRILL_INDEX:DEFAULT_HOME_DRILL_INDEX;const custom=[];const seenDefaults=new Set();list.forEach(item=>{const match=findMatchingDefaultDrill(item,index);if(match){if(seenDefaults.has(match.slug))return;seenDefaults.add(match.slug);custom.push({...item,...match,id:match.id,slug:match.slug,isDefaultDemo:true,mode:match.mode});return;}custom.push(item);});defaults.forEach(def=>{if(!seenDefaults.has(def.slug))custom.push(def);});return custom;};
const buildDefaultDrillIdAliases=(existing=[],defaults=[])=>{const aliases=new Map();const index=defaults===DEFAULT_PROGRAM_DRILLS?DEFAULT_PROGRAM_DRILL_INDEX:DEFAULT_HOME_DRILL_INDEX;(Array.isArray(existing)?existing:[]).forEach(item=>{const match=findMatchingDefaultDrill(item,index);if(!match)return;aliases.set(String(match.id),match.id);if(item?.id!=null)aliases.set(String(item.id),match.id);if(item?.slug)aliases.set(item.slug,match.id);});defaults.forEach(def=>{aliases.set(String(def.id),def.id);aliases.set(def.slug,def.id);});return aliases;};
const normalizeScoresForDefaultDrills=(scores=[],homeAliases=new Map(),programAliases=new Map())=>(Array.isArray(scores)?scores:[]).map(score=>{const src=score?.src||"home";const aliases=src==="program"?programAliases:homeAliases;const nextDrillId=aliases.get(String(score?.drillId))||score?.drillId;return nextDrillId===score?.drillId&&src===score?.src?score:{...score,src,drillId:nextDrillId};});
const countCustomProgramDrills=list=>(Array.isArray(list)?list:[]).filter(d=>!findMatchingDefaultDrill(d,DEFAULT_PROGRAM_DRILL_INDEX)).length;
const DRILLS_INIT=DEFAULT_HOME_DRILLS;
const PROGRAM_DRILLS_INIT=DEFAULT_PROGRAM_DRILLS;
const ICONS=["ft","3p","mr","fl","sb"];
const hasDrillMax=drill=>Number.isFinite(Number(drill?.max))&&Number(drill.max)>0;
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
const PLAYER_TAB_PATHS={home:"/",duels:"/program-log","log-drill":"/quick-menu",sc:"/lifting",program:"/events",profile:"/profile",players:"/players"};
const PLAYER_PATH_TABS={"/":"home","/duels":"duels","/program-log":"duels","/quick-menu":"log-drill","/lifting":"sc","/events":"program","/profile":"profile","/players":"players"};
const TIERS=[
{min:0,name:"ROOKIE",color:"#555",bg:"#55555515"},
{min:3,name:"STARTER",color:"#7D7D7D",bg:"#7D7D7D15"},
{min:6,name:"VARSITY",color:"#A0A0A0",bg:"#A0A0A015"},
{min:10,name:"ALL-STAR",color:"#D7E7FF",bg:"#D7E7FF15"},
{min:15,name:"ELITE",color:"#C8FF00",bg:"#C8FF0015"},
{min:22,name:"MVP",color:"#FFE082",bg:"#FFE08215"},
{min:30,name:"LEGEND",color:CYAN,bg:CYAN+"15"},
];
const getTier = c => [...TIERS].reverse().find(t => c >= t.min) || TIERS[0];
const todayStr=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`};
const ALNUM="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const DEMO_PLAYER={email:"demo@shotlab.app",password:"demo1234",name:"Demo Player",role:"player"};
const DEMO_COACH={email:"coach.demo@shotlab.app",password:"demo1234",name:"Demo Coach",role:"coach"};
const genId=(p="id")=>`${p}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
function generateJoinCode(existing=[],length=6){
for(let tries=0;tries<30;tries++){
let code="";
for(let i=0;i<length;i++)code+=ALNUM[Math.floor(Math.random()*ALNUM.length)];
if(!existing.includes(code))return code;
}
return Math.random().toString(36).slice(2,2+length).toUpperCase();
}
const TABLE_MAP = {
  "sl:scores": "scores",
  "sl:players": "players",
  "sl:player-profiles": "player_profiles",
  "sl:events": "events",
  "sl:rsvps": "rsvps",
  "sl:shotlogs": "shot_logs",
  "sl:teams": "teams",
  "sl:session": "sessions",
};
const PENDING_JOIN_CONTEXT_KEY = "sl:pending-join-context";
const HOME_SHOTS_LEADERBOARD_LIMIT = 10;
const INVITE_CONTEXT_STORAGE_KEY = "sl:invite-context";
const HOME_SHOTS_LEADERBOARD_SCOPES = [
  { key: "players", label: "PLAYERS" },
  { key: "coaches", label: "COACHES" },
];

const HOME_SHOTS_SCOPE_BUTTON_BASE_STYLE = {
  borderRadius: 999,
  padding: "7px 12px",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.08em",
  cursor: "pointer",
};

const DB = {
  async get(k) {
    const hasData = (value) => {
      if (Array.isArray(value)) return value.length > 0;
      if (value && typeof value === "object") return Object.keys(value).length > 0;
      return Boolean(value);
    };

    let local = null;
    try {
      const r = await window.storage.get(k, true);
      local = r?.value ? JSON.parse(r.value) : null;
    } catch (e) {}

    const table = TABLE_MAP[k];
    if (table) {
      try {
        const { data } = await supabase.from(table).select("*");
        if (hasData(data)) {
          return data;
        }
      } catch (e) {}
    }

    return hasData(local) ? local : null;
  },
  async set(k, v, options = {}) {
    const strictRemote = options?.strictRemote === true;
    try {
      await window.storage.set(k, JSON.stringify(v), true);
    } catch (e) {}
    const table = TABLE_MAP[k];
    if (table && Array.isArray(v) && v.length > 0) {
      try {
        const { error } = await supabase.from(table).upsert(v, { onConflict: "id" });
        if (error && strictRemote) {
          throw new Error(error?.message || "remote_persist_failed");
        }
      } catch (e) {
        if (strictRemote) throw e;
      }
    }
  }
};

const parseLeaderboardErrorMessage = (errorCode = "", status = 0, parseMode = "json") => {
  if (parseMode === "non_json") return "Leaderboard endpoint unavailable (invalid response format).";
  if (status === 404) return "Leaderboard endpoint missing.";
  if (status >= 500) return "Leaderboard service error.";
  switch (String(errorCode || "").toLowerCase()) {
    case "unauthorized":
      return "Sign in required.";
    case "forbidden":
      return "Not allowed for this team.";
    case "team_id_required":
      return "Team id is required.";
    case "invalid_scope":
      return "Leaderboard scope is invalid.";
    case "internal_error":
      return "Leaderboard service error.";
    case "rate_limited":
      return "Too many requests. Try again shortly.";
    default:
      return "Leaderboard unavailable.";
  }
};
const parseCreateTeamErrorMessage=(status=0,errorCode="",parseMode="json")=>{
if(parseMode==="non_json"||parseMode==="invalid_json")return"Team setup returned an invalid response.";
if(status===404)return"Team setup endpoint is missing.";
if(status===401||status===403)return"Coach authorization failed. Please sign in again.";
if(status>=500&&String(errorCode||"").toLowerCase()==="env_config_mismatch")return"Team setup is not configured on the server.";
if(status>=500)return"Team setup service error. Please try again.";
const normalizedErrorCode=String(errorCode||"").toLowerCase();
if(normalizedErrorCode.startsWith("table_missing_"))return`Team setup is missing backend table: ${normalizedErrorCode.replace("table_missing_","")}.`;
if(normalizedErrorCode.startsWith("missing_function_"))return`Team setup is missing backend function: ${normalizedErrorCode.replace("missing_function_","")}.`;
switch(normalizedErrorCode){
case"team_invite_creation_failed":
return"Could not create team code.";
case"unauthorized":
return"Coach authorization failed. Please sign in again.";
case"coach_user_not_found":
return"Coach account was not found in backend auth users.";
case"missing_rpc":
return"Team setup RPC is missing on the backend.";
case"rpc_permission_denied":
return"Team setup RPC permission was denied.";
case"table_missing":
return"Team setup tables are missing on the backend.";
case"invalid_service_key":
return"Team setup backend key is invalid.";
case"rpc_argument_mismatch":
return"Team setup RPC arguments do not match backend signature.";
case"schema_type_mismatch_teams_id":
return"Team setup backend schema has incompatible teams id types.";
case"unknown_rpc_failure":
return"Team setup RPC failed unexpectedly.";
default:
return"Could not create team.";
}
};
const parseStartupErrorMessage=(error)=>{
const raw=String(error?.message||error||"").toLowerCase();
if(raw.includes("supabase")&&raw.includes("missing"))return"Startup failed: Supabase environment configuration is missing.";
if(raw.includes("config_missing")||raw.includes("config_invalid"))return"Startup failed: Supabase client configuration is invalid.";
if(raw.includes("unauthorized")||raw.includes("forbidden"))return"Startup failed: access was denied while loading app data.";
if(raw.includes("network")||raw.includes("failed to fetch"))return"Startup failed: network request failed while loading app data.";
return"Startup failed due to an unexpected runtime error while loading app data.";
};
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
const DRILL_ACCENTS={"FORM SHOOTING":VOLT,"FREE THROWS":VOLT,"CATCH & SHOOT":VOLT,"BALL HANDLING":VOLT,"MID-RANGE":VOLT,"FLOATERS":VOLT};
const getDrillAccentColor=name=>DRILL_ACCENTS[name]||"#C8FF00";
const isLeaderboardEligible=(players,email)=>players.find(p=>p.email===email)?.hideFromLeaderboards!==true;
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
const _STYLES_CSS=`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@400;500;600;700;800&display=swap'); :root{--bg-0:#0B0D10;--surface-1:#0F1115;--surface-2:#141821;--surface-3:#171D28;--text-1:#E5E7EB;--text-2:#9CA3AF;--text-3:#6B7280;--stroke-1:rgba(255,255,255,0.08);--stroke-2:rgba(255,255,255,0.12);--shadow-0:none;--shadow-1:0 2px 10px rgba(0,0,0,0.35);--shadow-2:0 8px 24px rgba(0,0,0,0.45);--radius-card:20px;--stack-gap:24px;--card-pad:20px;--mini-card-pad:16px;--accent:#C8FF1A;--accent-soft:rgba(200,255,26,0.18);--color-primary:var(--accent);--color-primary-dim:#A3CC00;--color-primary-glow:var(--accent-soft);--color-secondary:var(--text-2);--color-secondary-dim:rgba(156,163,175,0.16);--color-danger:#FF4545;--color-warning:#FFA500;--color-bg-base:var(--bg-0);--color-bg-card:var(--surface-2);--color-bg-elevated:var(--surface-1);--color-bg-subtle:var(--stroke-1);--color-text-primary:var(--text-1);--color-text-secondary:var(--text-2);--color-text-muted:var(--text-3);--tracking-tight:0.04em;--tracking-default:0.06em;--tracking-wide:0.10em;--text-primary:var(--text-1);--text-secondary:var(--text-2);--text-tertiary:var(--text-3);--accent-default:var(--accent);--accent-feed:var(--accent);--accent-drills:var(--accent);--accent-events:var(--accent);--accent-lifting:var(--accent);--accent-sc:var(--accent);--accent-players:var(--accent);--nav-inactive:var(--text-2);--nav-inactive-icon:color-mix(in srgb,var(--text-2) 78%, var(--text-3));--nav-active-text:var(--accent);--nav-indicator-height:3px;--nav-focus:var(--accent-soft);--nav-active-glow:color-mix(in srgb,var(--accent) 32%, transparent);--coach-text-scale-small:1;--coach-text-scale-medium:1;--coach-text-scale-display:1;} :root[data-text-scale="large"]{--coach-text-scale-small:1.12;--coach-text-scale-medium:1.11;--coach-text-scale-display:1.04;} :root[data-text-scale="xl"]{--coach-text-scale-small:1.22;--coach-text-scale-medium:1.20;--coach-text-scale-display:1.06;} *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}body{background:${BG};overflow-x:hidden}.coach-mode{background:#0B0A09!important}.coach-mode input,.coach-mode textarea{font-size:calc(13px * var(--coach-text-scale-medium));line-height:1.4;}input,textarea{font-family:${FB}}.u-allcaps-long{text-transform:uppercase;letter-spacing:var(--tracking-default);font-weight:600}.u-meta-label{text-transform:uppercase;letter-spacing:var(--tracking-tight);color:var(--text-tertiary);font-weight:600;font-size:calc(10px * var(--coach-text-scale-small));}.u-secondary-text{color:var(--text-secondary)}button:focus-visible,a:focus-visible{outline:2px solid var(--page-accent,var(--color-primary,#C8FF00));outline-offset:2px}input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none}input[type=number]{-moz-appearance:textfield}::-webkit-scrollbar{width:0}@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}@keyframes scaleIn{from{opacity:0;transform:scale(.8)}to{opacity:1;transform:scale(1)}}@keyframes glow{0%,100%{box-shadow:0 0 0 transparent}50%{box-shadow:0 0 0 transparent}}@keyframes heroGlow{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}@keyframes rippleOut{0%{transform:scale(0);opacity:.5}100%{transform:scale(4);opacity:0}}@keyframes countUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}@keyframes orbDrift{0%{transform:translate(-50%,-50%) scale(1)}25%{transform:translate(-40%,-60%) scale(1.1)}50%{transform:translate(-60%,-45%) scale(.95)}75%{transform:translate(-45%,-55%) scale(1.05)}100%{transform:translate(-55%,-50%) scale(1)}}@keyframes confettiBurst{0%{transform:translate(0,0) scale(1);opacity:1}100%{opacity:0}}@keyframes particleFly{0%{transform:translate(0,0) scale(1);opacity:1}60%{opacity:.8}100%{transform:var(--fly-to);opacity:0}}@keyframes screenFadeIn{from{opacity:0}to{opacity:1}}@keyframes detailEnter{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}@keyframes ballEntrance{0%{opacity:0;transform:scale(.85)}100%{opacity:1;transform:scale(1)}}@keyframes shadowEntrance{0%{opacity:0;transform:scale(.5)}100%{opacity:1;transform:scale(1)}}@keyframes cardEntrance{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}@keyframes demoEntrance{from{opacity:0}to{opacity:1}}@keyframes metricPop{from{transform:scale(.8);opacity:.6}to{transform:scale(1);opacity:1}}@keyframes flashPress{0%{opacity:1}40%{opacity:1}100%{opacity:0}}@keyframes rankBounce{0%{transform:scale(1)}50%{transform:scale(1.15)}100%{transform:scale(1)}}@keyframes badgeFlash{0%,100%{stroke:#555555}25%,75%{stroke:#C8FF00}50%{stroke:#555555}}.fade-up{animation:fadeUp .4s ease-out both}.screen-fade-in{animation:screenFadeIn .2s ease-out both}.detail-enter{animation:detailEnter .25s ease-out both}.scale-in{animation:scaleIn .35s ease-out both}.btn-v{transition:transform .1s ease,box-shadow .2s ease;position:relative;overflow:hidden}.btn-v:active{transform:scale(.97)}.btn-v::after{content:'';position:absolute;inset:0;background:rgba(255,255,255,.15);opacity:0;pointer-events:none}.btn-v:active::after{animation:flashPress .2s ease-out forwards}.cta-primary,.cta-secondary,.cta-ghost,.cta-danger,.cta-primary-accent,.cta-brand{position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;gap:8px;min-height:calc(54px + ((var(--coach-text-scale-medium) - 1) * 8px));width:calc(100% - 32px)!important;margin-left:16px!important;margin-right:16px!important;height:auto!important;padding:calc(11px + ((var(--coach-text-scale-medium) - 1) * 3px)) 16px!important;border-radius:14px!important;cursor:pointer;font-family:${FB}!important;font-size:calc(13px * var(--coach-text-scale-medium))!important;font-weight:700!important;letter-spacing:var(--tracking-default)!important;text-transform:uppercase;transition:transform .1s ease,box-shadow .15s ease,opacity .2s ease,filter .15s ease,border-color .15s ease,color .15s ease,background .15s ease}.cta-primary,.cta-primary-accent,.cta-brand{border:1px solid color-mix(in srgb,var(--color-primary,var(--team-brand-primary,#C8FF00)) 68%, transparent);color:var(--team-brand-on-primary,var(--team-brand-primary-text,#0B0D10));background:linear-gradient(180deg,rgba(255,255,255,.08) 0%,rgba(255,255,255,0) 100%),var(--color-primary,var(--team-brand-primary,#C8FF00));box-shadow:0 4px 24px color-mix(in srgb,var(--color-primary,var(--team-brand-primary,#C8FF00)) 26%, transparent)}.cta-secondary{border:1px solid color-mix(in srgb,var(--stroke-2,rgba(255,255,255,.12)) 85%, transparent);background:linear-gradient(180deg,rgba(255,255,255,.04),rgba(255,255,255,0)),var(--surface-1,#0F1115);color:var(--text-1,#E5E7EB);box-shadow:var(--shadow-0,none)}.cta-ghost{border:1px solid transparent;background:transparent;color:var(--text-2,#9CA3AF);box-shadow:none}.cta-danger{border:1px solid color-mix(in srgb,var(--color-danger,#FF4545) 62%, transparent);color:#FFFFFF;background:linear-gradient(180deg,rgba(255,255,255,.08) 0%,rgba(255,255,255,0) 100%),color-mix(in srgb,var(--color-danger,#FF4545) 88%, #8B0000 12%);box-shadow:0 4px 20px color-mix(in srgb,var(--color-danger,#FF4545) 32%, transparent)}.cta-primary:active,.cta-primary-accent:active,.cta-brand:active,.cta-secondary:active,.cta-ghost:active,.cta-danger:active{transform:scale(.97)}.cta-primary:active,.cta-primary-accent:active,.cta-brand:active{box-shadow:0 4px 24px color-mix(in srgb,var(--page-accent,var(--color-primary,#C8FF00)) 14%, transparent)}.cta-danger:active{box-shadow:0 4px 18px color-mix(in srgb,var(--color-danger,#FF4545) 20%, transparent)}.cta-primary:hover,.cta-primary-accent:hover,.cta-brand:hover,.cta-secondary:hover,.cta-danger:hover{filter:brightness(1.05)}.cta-ghost:hover{background:rgba(255,255,255,.04);color:var(--text-1,#E5E7EB)}.cta-primary:focus-visible,.cta-primary-accent:focus-visible,.cta-brand:focus-visible{outline:2px solid var(--page-accent,var(--color-primary,#C8FF00));outline-offset:2px}.cta-secondary:focus-visible,.cta-ghost:focus-visible{outline:2px solid var(--stroke-2,rgba(255,255,255,.12));outline-offset:2px}.cta-danger:focus-visible{outline:2px solid var(--color-danger,#FF4545);outline-offset:2px}.cta-primary[disabled],.cta-primary-accent[disabled],.cta-brand[disabled],.cta-primary[data-loading='true'],.cta-primary-accent[data-loading='true'],.cta-brand[data-loading='true'],.cta-secondary[disabled],.cta-secondary[data-loading='true'],.cta-ghost[disabled],.cta-ghost[data-loading='true'],.cta-danger[disabled],.cta-danger[data-loading='true']{opacity:.4;box-shadow:none;cursor:not-allowed}.cta-primary[disabled] .cta-icon,.cta-primary-accent[disabled] .cta-icon,.cta-brand[disabled] .cta-icon,.cta-primary[data-loading='true'] .cta-icon,.cta-primary-accent[data-loading='true'] .cta-icon,.cta-brand[data-loading='true'] .cta-icon,.cta-secondary[disabled] .cta-icon,.cta-secondary[data-loading='true'] .cta-icon,.cta-ghost[disabled] .cta-icon,.cta-ghost[data-loading='true'] .cta-icon,.cta-danger[disabled] .cta-icon,.cta-danger[data-loading='true'] .cta-icon{display:none}.cta-primary[disabled]::before,.cta-primary[data-loading='true']::before,.cta-primary-accent[disabled]::before,.cta-primary-accent[data-loading='true']::before,.cta-brand[disabled]::before,.cta-brand[data-loading='true']::before,.cta-secondary[disabled]::before,.cta-secondary[data-loading='true']::before,.cta-ghost[disabled]::before,.cta-ghost[data-loading='true']::before,.cta-danger[disabled]::before,.cta-danger[data-loading='true']::before{content:'';width:12px;height:12px;border-radius:50%;border:2px solid currentColor;border-right-color:transparent;display:inline-block;animation:spin .7s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}.cta-secondary-link{margin-top:16px;font-family:${FB};font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--text-2,#9CA3AF);background:none;border:none;padding:0;cursor:pointer}.cta-secondary-link:hover,.cta-secondary-link:focus-visible{color:var(--text-1,#E5E7EB);text-decoration:underline}.ch{transition:transform .1s ease,background-color .15s ease,border-color .15s ease}.ch:hover{background:#1A1A1A!important;border-color:rgba(200,255,0,.15)!important}.ch:active{transform:scale(.985)}.tb{background-size:200% 100%;animation:shimmer 3s linear infinite}.cnt-up{animation:countUp .5s ease-out both}.grd-bdr{background:linear-gradient(135deg,${VOLT}15,${ORANGE}10,${CYAN}10);padding:1px;border-radius:17px}.grd-bdr>div{border-radius:16px}.glass-hdr{background:${BG}cc;backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:1px solid ${BORDER_CLR}80;box-shadow:0 4px 30px ${BG}80}.card-glow-v,.card-glow-o,.card-glow-c{box-shadow:var(--shadow-1)}.particle{position:absolute;border-radius:50%;pointer-events:none;animation:particleFly .7s ease-out forwards}@keyframes bbBounce{0%{transform:translateY(0) scaleY(1) scaleX(1)}40%{transform:translateY(8px) scaleY(.7) scaleX(1.3)}70%{transform:translateY(-6px) scaleY(1.1) scaleX(.95)}100%{transform:translateY(0) scaleY(1) scaleX(1)}}@keyframes badgeReveal{0%{transform:scale(0) rotate(-10deg);opacity:0}60%{transform:scale(1.15) rotate(3deg);opacity:1}100%{transform:scale(1) rotate(0);opacity:1}}@keyframes shineSwipe{0%{left:-60%}100%{left:160%}}.badge-pop{animation:badgeReveal .6s cubic-bezier(.34,1.56,.64,1) both}.badge-shine{position:relative;overflow:hidden}.badge-shine::after{content:'';position:absolute;top:0;width:40%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.18),transparent);animation:shineSwipe 1.2s ease .3s}@keyframes slideInRight{from{opacity:0;transform:translateX(30px)}to{opacity:1;transform:translateX(0)}}@keyframes slideInLeft{from{opacity:0;transform:translateX(-30px)}to{opacity:1;transform:translateX(0)}}@keyframes ballSpin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}@keyframes ballBounceIn{0%{transform:scale(0) translateY(40px);opacity:0}50%{transform:scale(1.15) translateY(-10px);opacity:1}70%{transform:scale(.95) translateY(4px)}100%{transform:scale(1) translateY(0)}}@keyframes podiumPulse{0%,100%{box-shadow:0 0 12px var(--pod-c,${VOLT})22}50%{box-shadow:0 0 28px var(--pod-c,${VOLT})33}}.slide-r{animation:slideInRight .3s ease-out both}.slide-l{animation:slideInLeft .3s ease-out both}.ball-spin{animation:ballSpin 8s linear infinite}.auth-ball-enter{animation:ballEntrance .6s cubic-bezier(.34,1.56,.64,1) both}.auth-shadow-enter{animation:shadowEntrance .6s cubic-bezier(.34,1.56,.64,1) both}.auth-card-enter{animation:cardEntrance .4s ease-out .2s both}.auth-demo-enter{animation:demoEntrance .25s ease-out .7s both}.metric-pop{display:inline-block;animation:metricPop .3s ease-out both}.rank-bounce{animation:rankBounce .4s cubic-bezier(.34,1.56,.64,1)}.rank-badge-flash{animation:badgeFlash .6s ease-in-out 2}.ball-bounce{animation:ballBounceIn .7s cubic-bezier(.34,1.56,.64,1) both}.podium-glow{animation:podiumPulse 2s ease-in-out infinite}.grad-text{background-clip:text;-webkit-background-clip:text;-webkit-text-fill-color:transparent}.page{--page-accent:var(--accent-default);--nav-accent:var(--accent-default);}.page[data-accent="feed"]{--page-accent:var(--accent-feed);--nav-accent:var(--accent-feed);}.page[data-accent="drills"]{--page-accent:var(--accent-drills);--nav-accent:var(--accent-drills);}.page[data-accent="events"]{--page-accent:var(--accent-events);--nav-accent:var(--accent-events);}.page[data-accent="sc"]{--page-accent:var(--accent-sc);--nav-accent:var(--accent-sc);}.page[data-accent="players"]{--page-accent:var(--accent-players);--nav-accent:var(--accent-players);}.page-header{margin-top:8px;margin-bottom:16px;}.page-title{text-transform:uppercase;letter-spacing:var(--tracking-default);max-width:100%;word-break:break-word;}.page-identity-bar{height:3px;width:56px;margin-top:10px;border-radius:999px;background:var(--page-accent);opacity:0.95;}.accent-card{position:relative;overflow:hidden;}.accent-card::before{content:"";position:absolute;left:0;top:12px;bottom:12px;width:3px;border-radius:999px;background:var(--page-accent);opacity:0.85;}.bottom-nav .tab{color:var(--nav-inactive);opacity:.9;padding-top:calc(8px + ((var(--coach-text-scale-medium) - 1) * 4px));padding-bottom:calc(6px + ((var(--coach-text-scale-medium) - 1) * 4px));}.bottom-nav .tab .tab-icon{color:var(--nav-inactive-icon);transition:color 150ms ease-out,filter 150ms ease-out,opacity 150ms ease-out;line-height:1;opacity:.86;}.bottom-nav .tab .tab-label{color:var(--nav-inactive);font-size:calc(10px * var(--coach-text-scale-medium));font-weight:500;opacity:.92;transition:color 150ms ease-out,font-weight 150ms ease-out,opacity 150ms ease-out;}.bottom-nav .tab::after{content:"";position:absolute;top:2px;left:50%;transform:translateX(-50%);width:22px;height:var(--nav-indicator-height);border-radius:999px;background:var(--tab-accent,var(--nav-accent));opacity:0;transition:opacity 150ms ease-out;}.bottom-nav .tab.is-active,.bottom-nav .tab.active{color:var(--nav-active-text);opacity:1;}.bottom-nav .tab.is-active .tab-icon,.bottom-nav .tab.active .tab-icon{color:var(--tab-accent,var(--nav-accent));opacity:1;filter:drop-shadow(0 0 3px var(--nav-active-glow));}.bottom-nav .tab.is-active .tab-label,.bottom-nav .tab.active .tab-label{color:var(--tab-accent,var(--nav-accent));font-weight:600;opacity:1;}.bottom-nav .tab.is-active::after,.bottom-nav .tab.active::after{opacity:0.82;}.bottom-nav .tab:focus-visible{outline:2px solid var(--nav-focus);outline-offset:3px;border-radius:10px;}@media(prefers-reduced-motion:reduce){*,.fade-up,.scale-in,.slide-r,.slide-l,.ball-spin,.ball-bounce,.badge-pop,.cnt-up,.podium-glow,.tb,.btn-v,.ch{animation:none!important;transition:none!important}}
.coach-mode .page-title,.coach-mode .pageHeaderText h1,.coach-mode .heroStatLbl,.coach-mode .sidebar-nav .nav-title,.coach-mode .insights-panel .panel-title{letter-spacing:0.08em;line-height:1.15;}
.coach-mode .pageHeaderText p,.coach-mode .coach-tools-trigger,.coach-mode .coach-tools-trigger__chevron,.coach-mode .placeholder,.coach-mode .sidebar-nav .nav-item{color:rgba(255,255,255,0.78);}
.coach-mode .pageHeaderText p,.coach-mode .placeholder{line-height:1.4;}
`;
const _PAGE_SIGNATURE_CSS=`
.pageShell{--pageAccent:#B8FF00;--pageAccentGlow:rgba(184,255,0,.35);--pageAccentBg:rgba(184,255,0,.08);--page-accent:#B8FF00;--page-accent-soft:rgba(184,255,0,.08);--page-accent-border:rgba(184,255,0,.35);display:flex;flex-direction:column;gap:var(--stack-gap);}
.pageShell{--surface-panel:var(--surface-2);--surface-panel-strong:var(--surface-3);--surface-border:color-mix(in srgb,var(--stroke-1) 88%, rgba(255,255,255,0.02));--surface-border-strong:var(--stroke-2);--surface-radius:var(--radius-card);--surface-shadow:var(--shadow-1);--surface-shadow-strong:var(--shadow-2);}
.pageHeader{margin:0 0 14px;padding:14px 14px 10px;border-radius:16px;border:1px solid color-mix(in srgb,var(--pageAccent) 28%, transparent);background:linear-gradient(135deg,var(--pageAccentBg),rgba(10,10,10,.96) 55%);box-shadow:0 8px 24px rgba(0,0,0,.3);}
.pageHeader{border-radius:var(--surface-radius);border:1px solid var(--surface-border);background:linear-gradient(180deg,color-mix(in srgb,var(--surface-panel-strong) 88%, #000),var(--surface-panel));box-shadow:var(--surface-shadow);}
.pageHeaderTop{display:flex;align-items:center;gap:12px;flex-wrap:wrap;}
.pageHeaderBadge{width:48px;height:48px;border-radius:14px;border:1px solid color-mix(in srgb,var(--headerAccent) 42%, var(--surface-border));background:color-mix(in srgb,var(--surface-panel-strong) 84%, var(--headerAccent) 16%);display:flex;align-items:center;justify-content:center;color:var(--headerAccent);box-shadow:none;flex-shrink:0;}
.pageHeaderText{min-width:0;flex:1 1 220px;}.pageHeaderText h1{font-family:${FD};font-size:26px;letter-spacing:var(--tracking-default);color:#fff;line-height:1;word-break:break-word;}
.pageHeaderText p{font-family:${FB};font-size:calc(11px * var(--coach-text-scale-medium));color:var(--text-secondary);margin-top:4px;text-transform:uppercase;letter-spacing:var(--tracking-tight);}
.pageHeaderRight{margin-left:auto;flex-shrink:0;}
.pageHeaderPill{padding:6px 10px;border-radius:999px;border:1px solid color-mix(in srgb,var(--pageAccent) 50%, transparent);background:color-mix(in srgb,var(--pageAccent) 14%, #1A1A1A);font-family:${FB};font-size:calc(10px * var(--coach-text-scale-medium));color:var(--pageAccent);font-weight:700;letter-spacing:var(--tracking-tight);text-transform:uppercase;transition:background .15s ease,box-shadow .15s ease,border-color .15s ease,transform .1s ease;}
.pageHeaderPill:hover{background:color-mix(in srgb,var(--pageAccent) 24%, #1A1A1A);border-color:color-mix(in srgb,var(--pageAccent) 62%, transparent);}
.pageHeaderPill:active{transform:translateY(1px);}
.pageHeaderPill:focus-visible{outline:2px solid var(--page-accent);outline-offset:2px;}
.pageHeaderPillBrand{border-color:rgba(200,255,0,.5);background:color-mix(in srgb,#C8FF00 18%, #1A1A1A);color:#C8FF00;}
.pageHeaderPillBrand:hover{background:color-mix(in srgb,#C8FF00 26%, #1A1A1A);border-color:rgba(200,255,0,.68);}
.pageHeaderPillBrand:focus-visible{outline-color:#C8FF00;}
.pageAccentBar{height:3px;width:42%;border-radius:999px;background:color-mix(in srgb,var(--headerAccent) 70%, transparent);box-shadow:none;margin-top:12px;}
.coachEventsSlimHeader{display:none;align-items:center;justify-content:space-between;gap:8px;padding:10px 12px;border-radius:12px;border:1px solid var(--surface-border);background:var(--surface-panel-strong);margin:0 0 12px;min-width:0;box-shadow:var(--surface-shadow);}
.coachEventsSlimHeaderLeft{display:flex;align-items:center;gap:8px;min-width:0;}
.coachEventsSlimHeaderLabel{font-family:${FD};font-size:calc(16px * var(--coach-text-scale-display));letter-spacing:var(--tracking-default);color:#fff;line-height:1;white-space:nowrap;}
.heroModule{position:relative;overflow:hidden;border:1px solid var(--surface-border-strong);border-radius:var(--surface-radius);padding:var(--card-pad);margin-bottom:var(--stack-gap);background:var(--surface-panel-strong);box-shadow:var(--surface-shadow-strong);}
.heroModule::before{content:'';position:absolute;left:0;top:0;width:54px;height:4px;background:var(--pageAccent);}
.heroStats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:10px;}
.heroStat{background:color-mix(in srgb,var(--surface-panel) 86%, #0A0C10);border:1px solid var(--surface-border);border-radius:12px;padding:8px;text-align:center;}
.heroStatVal{font-family:${FD};color:var(--pageAccent);font-size:20px;line-height:1;}
.heroStatLbl{font-family:${FB};font-size:calc(9px * var(--coach-text-scale-medium));color:var(--text-tertiary);letter-spacing:var(--tracking-tight);margin-top:2px;}
.feedListItem{position:relative;padding-left:14px;}
.feedListItem::before{content:'';position:absolute;left:0;top:17px;width:6px;height:6px;border-radius:50%;background:var(--pageAccent);box-shadow:0 0 8px var(--pageAccentGlow);}
.drillsMetrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--stack-gap);margin-bottom:var(--stack-gap);}
.drillsMetricTile{border-left:2px solid rgba(56,232,255,.65);}
.eventsDatePill{display:inline-flex;align-items:center;justify-content:center;min-width:56px;padding:6px 8px;border-radius:999px;background:rgba(255,196,0,.16);border:1px solid rgba(255,196,0,.45);color:#FFC400;font-size:calc(10px * var(--coach-text-scale-medium));font-family:${FB};font-weight:700;letter-spacing:.08em;}
.scSection{border-top:1px solid rgba(91,124,255,.35);padding-top:10px;margin-top:10px;}
.playersAvatarRing{outline:2px solid rgba(184,108,255,.65);outline-offset:1px;border-radius:50%;}
.bottom-nav .tab.is-active::before,.bottom-nav .tab.active::before{display:none;}
.accent-card{background:var(--surface-panel)!important;border:1px solid var(--surface-border)!important;border-radius:var(--surface-radius)!important;box-shadow:var(--surface-shadow)!important;}
.accent-card::before{width:2px!important;top:14px!important;bottom:14px!important;background:color-mix(in srgb,var(--page-accent) 62%, transparent)!important;opacity:.55!important;}
@media(min-width:768px){.pageHeaderBadge{width:56px;height:56px;}.drillsMetrics{grid-template-columns:repeat(2,minmax(0,1fr));}}
@media(max-width:767px){.coachEventsHeaderCard{display:none;}.coachEventsSlimHeader{display:flex;}}


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
  font-size:calc(1em * var(--coach-text-scale-medium));
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
  font-size:calc(1em * var(--coach-text-scale-medium));
}

/* ================================
   ShotLab Depth System (Rec #2)
   Add-only patch: tokens + safe selectors
   ================================ */

:root{
  --bg-0:#0B0D10;

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
  background: color-mix(in srgb, var(--surface-2) 94%, #0A0C10) !important;
  border: 1px solid color-mix(in srgb, var(--stroke-1) 86%, rgba(255,255,255,0.02)) !important;
  border-radius: var(--surface-radius, var(--radius-card)) !important;
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
const _DESKTOP_SHELL_CSS=`:root{--shell-bg:#070707;--panel-bg:rgba(255,255,255,0.04);--panel-border:rgba(255,255,255,0.08);--text-dim:rgba(255,255,255,0.62);} .team-brand .pageHeaderBadge,.team-brand .pageAccentBar{background:var(--team-brand-header-accent)!important;box-shadow:0 0 16px color-mix(in srgb,var(--team-brand-header-accent) 44%, transparent)!important;}.team-brand .pageHeaderPill{border-color:var(--team-brand-badge-border)!important;background:var(--team-brand-badge-bg)!important;color:var(--team-brand-badge-text)!important;}.team-brand .cta-primary,.team-brand .cta-primary-accent{background:linear-gradient(180deg,rgba(255,255,255,.08) 0%,rgba(255,255,255,0) 100%),var(--team-brand-primary)!important;color:var(--team-brand-primary-text)!important;box-shadow:0 4px 24px color-mix(in srgb,var(--team-brand-primary) 30%, transparent)!important;}.team-brand .bottom-nav .tab.is-active,.team-brand .bottom-nav .tab.active{color:var(--team-brand-nav-active)!important;}.team-brand .bottom-nav .tab.is-active::before,.team-brand .bottom-nav .tab.active::before{background:var(--team-brand-nav-active)!important;}.team-brand .chip,.team-brand .badge,[class*="chip"],[class*="badge"]{background:var(--team-brand-badge-bg)!important;border-color:var(--team-brand-badge-border)!important;color:var(--team-brand-badge-text)!important;}.app-shell{min-height:100vh;background:var(--shell-bg);}@media (min-width:1024px){.app-shell.is-desktop{display:grid;grid-template-columns:240px minmax(640px,1fr) 320px;gap:var(--stack-gap);padding:var(--stack-gap);align-items:start;}.sidebar-nav{position:sticky;top:18px;height:calc(100vh - 36px);background:var(--surface-1);border:1px solid var(--stroke-1);border-radius:var(--radius-card);box-shadow:var(--shadow-0);padding:var(--mini-card-pad);overflow:auto;}.sidebar-nav .nav-title{font-size:12px;letter-spacing:0.26em;text-transform:uppercase;color:var(--text-dim);margin:6px 10px 14px;}.sidebar-nav .nav-item{display:flex;align-items:center;gap:10px;padding:12px 12px;border-radius:14px;color:rgba(255,255,255,0.70);cursor:pointer;user-select:none;border:1px solid transparent;transition:background 140ms ease,border-color 140ms ease,transform 120ms ease;width:100%;background:transparent;text-align:left;}.sidebar-nav .nav-item:hover{background:rgba(255,255,255,0.05);transform:translateY(-1px);}.sidebar-nav .nav-item.is-active{background:rgba(198,255,0,0.10);border-color:rgba(198,255,0,0.22);color:#C6FF00;}.shell-main{min-width:0;}.content-wrap{background:var(--surface-1);border:1px solid var(--stroke-1);border-radius:var(--radius-card);box-shadow:var(--shadow-0);padding:var(--card-pad);}.insights-panel{position:sticky;top:18px;height:calc(100vh - 36px);background:var(--surface-1);border:1px solid var(--stroke-1);border-radius:var(--radius-card);box-shadow:var(--shadow-0);padding:var(--mini-card-pad);overflow:auto;}.insights-panel .panel-title{font-size:12px;letter-spacing:0.26em;text-transform:uppercase;color:var(--text-dim);margin:6px 10px 14px;}.insights-panel .placeholder{background:rgba(0,0,0,0.35);border:1px dashed rgba(255,255,255,0.14);border-radius:14px;padding:14px;color:rgba(255,255,255,0.55);font-size:13px;line-height:1.35;}}`;
const Styles=()=><><style>{_STYLES_CSS}</style><style>{_PAGE_SIGNATURE_CSS}</style><style>{_DESKTOP_SHELL_CSS}</style></>;

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
const[view,setView]=useState("auth"),[user,setUser]=useState(null),[drills,setDrills]=useState(DRILLS_INIT),[programDrills,setProgramDrills]=useState(PROGRAM_DRILLS_INIT),[scores,setScores]=useState([]),[players,setPlayers]=useState([]),[playerProfiles,setPlayerProfiles]=useState([]),[events,setEvents]=useState(EVENTS_INIT),[rsvps,setRsvps]=useState([]),[shotLogs,setShotLogs]=useState([]),[challenges,setChallenges]=useState([]),[theme,setTheme]=useState("dark"),[scSessions,setScSessions]=useState(SC_INIT),[scRsvps,setScRsvps]=useState([]),[scLogs,setScLogs]=useState([]),[teams,setTeams]=useState([]),[ready,setReady]=useState(false),[pendingJoinContext,setPendingJoinContext]=useState(null);
const[demoSettingsBusy,setDemoSettingsBusy]=useState(false);
const[startupError,setStartupError]=useState("");
const [homeShotsLeaderboard,setHomeShotsLeaderboard]=useState({status:"idle",rows:[],error:""});
const [homeShotsLeaderboardScope,setHomeShotsLeaderboardScope]=useState("players");
const [statSyncError,setStatSyncError]=useState("");
const [dataDebug,setDataDebug]=useState({join:{enteredCode:"",normalizedCode:"",status:"idle",lookupSource:"none",lookupField:"none",lookupHashPrefix:"",lookupHashSource:"",lookupCount:null,matchedTeamId:"",inviteState:"",expiresAt:null,inviteContextSaved:"no",inviteContextStorageKey:INVITE_CONTEXT_STORAGE_KEY,inviteContextTokenPresent:"no",inviteContextTeamId:"",inviteContextSubject:"",currentUserEmail:"",contextSubjectMatchesUser:"no",update:"idle",error:""},leaderboard:{endpoint:"",httpStatus:null,errorCode:"",resultCount:null,isEmpty:false},createTeam:{teamName:"",endpoint:"",httpStatus:null,errorCode:"",responseSummary:"",teamId:"",joinCode:"",stateUpdated:false,remotePersisted:false,status:"idle"}});
const leaderboardRequestRef=useRef({teamId:null,requestId:0});
const bootMark=(stage,detail="")=>{try{window.__shotlabBootMark?.(stage,detail);}catch{}};
const T=THEMES[theme];
const dataDebugEnabled=typeof window!=="undefined"&&new URLSearchParams(window.location.search).get("dataDebug")==="1";
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

const fetchHomeShotsLeaderboard=useCallback(async(teamId,scope=homeShotsLeaderboardScope)=>{
if(!teamId||!user?.email)return;
const requestId=Date.now();
leaderboardRequestRef.current={teamId,requestId};
setHomeShotsLeaderboard(prev=>({...prev,status:"loading",error:""}));
try{
const url=`/v1/leaderboards/home-shots?team_id=${encodeURIComponent(teamId)}&limit=${HOME_SHOTS_LEADERBOARD_LIMIT}&scope=${encodeURIComponent(scope)}`;
setDataDebug(prev=>({...prev,leaderboard:{...prev.leaderboard,endpoint:url,httpStatus:null,errorCode:"",resultCount:null,isEmpty:false}}));
const res=await fetch(url,{headers:{"x-user-id":user.email}});
const contentType=String(res.headers.get("content-type")||"").toLowerCase();
let body={};
let parseMode="json";
if(contentType.includes("application/json")){
body=await res.json().catch(()=>{parseMode="invalid_json";return{};});
}else{
parseMode="non_json";
await res.text().catch(()=>"");
}
if(!res.ok){
const msg=parseLeaderboardErrorMessage(body?.error,res.status,parseMode==="non_json"?"non_json":"json");
if(leaderboardRequestRef.current.requestId!==requestId)return;
setHomeShotsLeaderboard({status:"error",rows:[],error:msg});
setDataDebug(prev=>({...prev,leaderboard:{...prev.leaderboard,httpStatus:res.status,errorCode:String(body?.error||parseMode||"unknown"),resultCount:0,isEmpty:false}}));
return;
}
const rows=Array.isArray(body?.leaderboard)?body.leaderboard:[];
if(leaderboardRequestRef.current.requestId!==requestId)return;
setHomeShotsLeaderboard({status:"success",rows,error:""});
setDataDebug(prev=>({...prev,leaderboard:{...prev.leaderboard,httpStatus:res.status,errorCode:"",resultCount:rows.length,isEmpty:rows.length===0}}));
}catch{
if(leaderboardRequestRef.current.requestId!==requestId)return;
setHomeShotsLeaderboard({status:"error",rows:[],error:"Leaderboard unavailable."});
setDataDebug(prev=>({...prev,leaderboard:{...prev.leaderboard,httpStatus:null,errorCode:"network_error",resultCount:0,isEmpty:false}}));
}
},[user,homeShotsLeaderboardScope]);

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
ts=[{id:tid,name:"ShotLab Team",ownerCoachId:null,joinCode:generateJoinCode(used),joinCodeUpdatedAt:Date.now(),createdAt:Date.now(),branding:DEFAULT_BRANDING}];
ps.forEach(p=>{map[p.email]=tid});
}else{
coaches.forEach((c,i)=>{const tid=genId("team");const code=generateJoinCode([...used,...ts.map(t=>t.joinCode)]);ts.push({id:tid,name:c.name?`${c.name.split(" ")[0]}'s Team`:`Team ${i+1}`,ownerCoachId:c.email,joinCode:code,joinCodeUpdatedAt:Date.now(),createdAt:Date.now(),branding:DEFAULT_BRANDING});map[c.email]=tid;});
ps.forEach(p=>{if(p.role!=="coach"){const firstCoach=coaches[0];if(firstCoach)map[p.email]=map[firstCoach.email];}});
}
}else{
ts.forEach(t=>{if(t.ownerCoachId)map[t.ownerCoachId]=t.id;});
}
const teamsWithBranding=ts.map(t=>({...t,branding:resolveTeamBranding(t.branding||DEFAULT_BRANDING)}));
const playersMigrated=ps.map(p=>({...p,teamId:p.teamId||map[p.email]||teamsWithBranding[0]?.id||null,hideFromLeaderboards:p.hideFromLeaderboards===true}));
const profilesExisting=rawPlayerProfiles||[];
const profilesMigrated=(profilesExisting.length?profilesExisting:playersMigrated.filter(p=>p.role!=="coach").map(p=>({id:genId("pp"),userId:p.email,teamId:p.teamId,firstName:(p.name||"").split(" ")[0]||"Player",lastName:(p.name||"").split(" ").slice(1).join(" "),createdAt:Date.now()}))).map(pp=>({...pp,teamId:pp.teamId||playersMigrated.find(p=>p.email===pp.userId)?.teamId||ts[0]?.id||null}));
const teamForEmail=e=>playersMigrated.find(p=>p.email===e)?.teamId||ts[0]?.id||null;
const scoresM=(rawScores||[]).map(s=>({...s,playerId:s.playerId||s.email,teamId:s.teamId||teamForEmail(s.email),src:s.src||"home"}));
const eventsM=(rawEvents||[]).map(e=>({...e,teamId:e.teamId||teamForEmail(e.ownerCoachId)}));
const rsvpsM=(rawRsvps||[]).map(r=>({...r,playerId:r.playerId||r.email,teamId:r.teamId||teamForEmail(r.email)}));
const shotM=(rawShotLogs||[]).map(l=>({...l,playerId:l.playerId||l.email,teamId:l.teamId||teamForEmail(l.email)}));
const chM=(rawChallenges||[]).map(c=>({...c,teamId:c.teamId||teamForEmail(c.from),playerId:c.playerId||c.from}));
const scSM=(rawScSessions||[]).map(s=>({...s,teamId:s.teamId||teamForEmail(s.ownerCoachId)}));
const scRM=(rawScRsvps||[]).map(r=>({...r,playerId:r.playerId||r.email,teamId:r.teamId||teamForEmail(r.email)}));
const scLM=(rawScLogs||[]).map(l=>({...l,playerId:l.playerId||l.email,teamId:l.teamId||teamForEmail(l.email)}));
return {playersMigrated,profilesMigrated,teamsMigrated:teamsWithBranding,scoresM,eventsM,rsvpsM,shotM,chM,scSM,scRM,scLM};
},[]);

const navigateToPlayerHome=useCallback(()=>{
if(typeof window==="undefined")return;
const homePath=PLAYER_TAB_PATHS.home||"/";
if(window.location.pathname!==homePath)window.history.replaceState({},"",homePath);
},[]);

const hydratePersistedData=useCallback(async()=>{const[d,pd,s,p,pp,ev,rv,sl,ch,scs,scr,scl,tm,sess,pendingCtx]=await Promise.all([DB.get("sl:drills"),DB.get("sl:program-drills"),DB.get("sl:scores"),DB.get("sl:players"),DB.get("sl:player-profiles"),DB.get("sl:events"),DB.get("sl:rsvps"),DB.get("sl:shotlogs"),DB.get("sl:challenges"),DB.get("sl:sc-sessions"),DB.get("sl:sc-rsvps"),DB.get("sl:sc-logs"),DB.get("sl:teams"),DB.get("sl:session"),DB.get(PENDING_JOIN_CONTEXT_KEY)]);const homeDrillAliases=buildDefaultDrillIdAliases(d,DRILLS_INIT);const programDrillAliases=buildDefaultDrillIdAliases(pd,PROGRAM_DRILLS_INIT);const seededDrills=mergeDefaultDrills(d,DRILLS_INIT);const seededProgramDrills=mergeDefaultDrills(pd,PROGRAM_DRILLS_INIT);setDrills(seededDrills);setProgramDrills(seededProgramDrills);
const normalizedScores=normalizeScoresForDefaultDrills(s,homeDrillAliases,programDrillAliases);const m=migrateData({players:p,playerProfiles:pp,scores:normalizedScores,events:ev,rsvps:rv,shotLogs:sl,challenges:ch,scSessions:scs,scRsvps:scr,scLogs:scl,teams:tm});
setPlayers(m.playersMigrated);setPlayerProfiles(m.profilesMigrated);setTeams(m.teamsMigrated);setScores(m.scoresM);setEvents(m.eventsM);setRsvps(m.rsvpsM);setShotLogs(m.shotM);setChallenges(m.chM);setScSessions(m.scSM);setScRsvps(m.scRM);setScLogs(m.scLM);
await Promise.all([DB.set("sl:drills",seededDrills),DB.set("sl:program-drills",seededProgramDrills),DB.set("sl:players",m.playersMigrated),DB.set("sl:player-profiles",m.profilesMigrated),DB.set("sl:teams",m.teamsMigrated),DB.set("sl:scores",m.scoresM),DB.set("sl:events",m.eventsM),DB.set("sl:rsvps",m.rsvpsM),DB.set("sl:shotlogs",m.shotM),DB.set("sl:challenges",m.chM),DB.set("sl:sc-sessions",m.scSM),DB.set("sl:sc-rsvps",m.scRM),DB.set("sl:sc-logs",m.scLM)]);
if(sess&&sess.email){const found=m.playersMigrated.find(pl=>pl.email===sess.email);if(found){setUser({email:found.email,role:found.role||"player",isCoach:(found.role||"player")==="coach",name:found.name,teamId:found.teamId,hideFromLeaderboards:found.hideFromLeaderboards===true});if(found.role==="coach"&&!found.teamId)setView("create-team");else if(found.role==="player"&&!found.teamId)setView("join-team");else {if((found.role||"player")==="player")navigateToPlayerHome();setView(found.role||"player")}}}
setPendingJoinContext(normalizeStoredInviteContext(pendingCtx)||readInviteContextFromStorage()||null);
return {teams:m.teamsMigrated,players:m.playersMigrated};
},[migrateData,navigateToPlayerHome,normalizeStoredInviteContext,readInviteContextFromStorage]);
const P=useCallback(async(k,v,set,options)=>{set(v);await DB.set(k,v,options)},[]);
const normalizeStoredInviteContext=useCallback((ctx)=>{
if(!ctx||typeof ctx!=="object")return null;
const joinContextToken=String(ctx.joinContextToken||ctx.token||"").trim();
if(!joinContextToken)return null;
return{
joinContextToken,
token:joinContextToken,
inviteId:String(ctx.inviteId||ctx.invite_id||"").trim(),
teamId:String(ctx.teamId||ctx.team_id||"").trim(),
inviteCode:String(ctx.inviteCode||ctx.invite_code||ctx.normalizedCode||"").trim().toUpperCase(),
subject:String(ctx.subject||ctx.subjectKey||ctx.subject_key||"").trim().toLowerCase(),
subjectKey:String(ctx.subject||ctx.subjectKey||ctx.subject_key||"").trim().toLowerCase(),
expiresAt:ctx.expiresAt||ctx.expires_at||null,
createdAt:Number(ctx.createdAt||Date.now()),
};
},[]);
const readInviteContextFromStorage=useCallback(()=>{
if(typeof window==="undefined")return null;
const parse=(raw)=>{if(!raw)return null;try{return JSON.parse(raw);}catch{return null;}};
const sessionValue=parse(window.sessionStorage?.getItem(INVITE_CONTEXT_STORAGE_KEY)||"");
const localValue=parse(window.localStorage?.getItem(INVITE_CONTEXT_STORAGE_KEY)||"");
return normalizeStoredInviteContext(sessionValue||localValue||null);
},[normalizeStoredInviteContext]);
const writeInviteContextToStorage=useCallback((ctx)=>{
if(typeof window==="undefined")return;
const normalized=normalizeStoredInviteContext(ctx);
const serialized=JSON.stringify(normalized||null);
window.sessionStorage?.setItem(INVITE_CONTEXT_STORAGE_KEY,serialized);
window.localStorage?.setItem(INVITE_CONTEXT_STORAGE_KEY,serialized);
},[normalizeStoredInviteContext]);
const savePendingJoinContext=useCallback(async(next)=>{
const normalized=normalizeStoredInviteContext(next);
setPendingJoinContext(normalized||null);
writeInviteContextToStorage(normalized||null);
await DB.set(PENDING_JOIN_CONTEXT_KEY,normalized||null);
},[normalizeStoredInviteContext,writeInviteContextToStorage]);
const startJoinContext=useCallback(async(code,subjectKey)=>{
const normalizedCode=normalizeJoin(code).replace(/[-\s]+/g,"");
const normalizedSubject=String(subjectKey||"").trim().toLowerCase();
setDataDebug(prev=>({...prev,join:{...prev.join,enteredCode:String(code||""),normalizedCode,status:"lookup",lookupSource:"backend_invite_context",lookupField:"team_invites.code_hash",lookupHashPrefix:"",lookupHashSource:"public.hash_invite_code(public.normalize_invite_code(code))",lookupCount:null,matchedTeamId:"",inviteState:"",expiresAt:null,inviteContextSaved:"no",inviteContextStorageKey:INVITE_CONTEXT_STORAGE_KEY,inviteContextTokenPresent:"no",inviteContextTeamId:"",inviteContextSubject:normalizedSubject,currentUserEmail:normalizedSubject,contextSubjectMatchesUser:"no",update:"idle",error:""}}));
if(!normalizedCode)return{ok:false,err:"Enter a valid team code."};
if(!normalizedSubject)return{ok:false,err:"Enter a valid email."};
try{
const res=await fetch("/v1/team-invites/context/start",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({invite_code:normalizedCode,subject_key:normalizedSubject})});
const body=await res.json().catch(()=>({}));
const resolvedNormalizedCode=String(body?.normalized_code||normalizedCode||"");
const resolvedHashPrefix=String(body?.lookup_hash_prefix||"");
const resolvedHashSource=String(body?.hash_source||"public.hash_invite_code(public.normalize_invite_code(code))");
const resolvedLookupCount=Number.isFinite(Number(body?.lookup_count))?Number(body?.lookup_count):0;
const resolvedMatchedTeamId=String(body?.matched_team_id||body?.team_id||"");
const resolvedInviteState=String(body?.invite_state||"");
const resolvedExpiresAt=body?.expires_at||body?.invite_expires_at||null;
if(!res.ok){
const safeError=String(body?.error||"lookup_failed");
setDataDebug(prev=>({...prev,join:{...prev.join,normalizedCode:resolvedNormalizedCode,status:"failed",lookupHashPrefix:resolvedHashPrefix,lookupHashSource:resolvedHashSource,lookupCount:resolvedLookupCount,matchedTeamId:resolvedMatchedTeamId,inviteState:resolvedInviteState,expiresAt:resolvedExpiresAt,inviteContextSaved:"no",inviteContextTokenPresent:"no",inviteContextTeamId:resolvedMatchedTeamId,inviteContextSubject:normalizedSubject,currentUserEmail:normalizedSubject,contextSubjectMatchesUser:"no",error:safeError}}));
if(safeError==="invalid_or_unavailable_code"||safeError==="invalid_code")return{ok:false,err:"Invalid team code."};
return{ok:false,err:"Could not validate team code."};
}
const ctx={joinContextToken:body.join_context_token,token:body.join_context_token,expiresAt:body.expires_at,subject:normalizedSubject,subjectKey:normalizedSubject,inviteId:body.invite_id,teamId:resolvedMatchedTeamId,inviteCode:resolvedNormalizedCode,createdAt:Date.now()};
setDataDebug(prev=>({...prev,join:{...prev.join,normalizedCode:resolvedNormalizedCode,status:"validated",lookupHashPrefix:resolvedHashPrefix,lookupHashSource:resolvedHashSource,lookupCount:Number.isFinite(resolvedLookupCount)&&resolvedLookupCount>0?resolvedLookupCount:1,matchedTeamId:resolvedMatchedTeamId,inviteState:resolvedInviteState,expiresAt:resolvedExpiresAt,error:""}}));
await savePendingJoinContext(ctx);
setDataDebug(prev=>({...prev,join:{...prev.join,inviteContextSaved:"yes",inviteContextStorageKey:INVITE_CONTEXT_STORAGE_KEY,inviteContextTokenPresent:ctx.joinContextToken?"yes":"no",inviteContextTeamId:ctx.teamId||"",inviteContextSubject:ctx.subject||"",currentUserEmail:normalizedSubject,contextSubjectMatchesUser:"yes"}}));
return{ok:true,context:ctx};
}catch{
setDataDebug(prev=>({...prev,join:{...prev.join,status:"failed",lookupCount:0,error:"network_error"}}));
return{ok:false,err:"Could not validate team code."};
}
},[normalizeJoin,savePendingJoinContext]);
const consumeJoinContext=useCallback(async(actor,clientRequestId=null,contextOverride=null)=>{
const currentUserEmail=String(actor?.email||"").trim().toLowerCase();
const resolvedContext=normalizeStoredInviteContext(contextOverride)||normalizeStoredInviteContext(pendingJoinContext)||readInviteContextFromStorage();
if(!currentUserEmail){
setDataDebug(prev=>({...prev,join:{...prev.join,inviteContextSaved:"no",inviteContextStorageKey:INVITE_CONTEXT_STORAGE_KEY,inviteContextTokenPresent:"no",inviteContextTeamId:"",inviteContextSubject:"",currentUserEmail:"",contextSubjectMatchesUser:"no",error:"missing_current_user_email"}}));
return{ok:false,err:"No validated invite context (missing current user email)."};
}
if(!resolvedContext?.joinContextToken){
setDataDebug(prev=>({...prev,join:{...prev.join,inviteContextSaved:"no",inviteContextStorageKey:INVITE_CONTEXT_STORAGE_KEY,inviteContextTokenPresent:"no",inviteContextTeamId:"",inviteContextSubject:"",currentUserEmail,contextSubjectMatchesUser:"no",error:`missing_invite_context:${INVITE_CONTEXT_STORAGE_KEY}`}}));
return{ok:false,err:`No validated invite context (checked ${INVITE_CONTEXT_STORAGE_KEY}).`};
}
const subject=String(resolvedContext.subject||resolvedContext.subjectKey||"").trim().toLowerCase();
const contextSubjectMatchesUser=subject===currentUserEmail?"yes":"no";
setDataDebug(prev=>({...prev,join:{...prev.join,inviteContextSaved:"yes",inviteContextStorageKey:INVITE_CONTEXT_STORAGE_KEY,inviteContextTokenPresent:resolvedContext.joinContextToken?"yes":"no",inviteContextTeamId:resolvedContext.teamId||"",inviteContextSubject:subject||"",currentUserEmail,contextSubjectMatchesUser}}));
if(contextSubjectMatchesUser!=="yes")return{ok:false,err:"Invite context is tied to a different email."};
try{
const res=await fetch("/v1/team-memberships/confirm-context",{method:"POST",headers:{"Content-Type":"application/json","x-user-id":actor.email},body:JSON.stringify({join_context_token:resolvedContext.joinContextToken,subject_key:subject,client_request_id:clientRequestId||genId("join")})});
const body=await res.json().catch(()=>({}));
if(!res.ok)return{ok:false,err:body?.error||"Could not join team."};
await savePendingJoinContext(null);
return{ok:true,teamId:body.team_id||resolvedContext.teamId,status:body.status||"joined"};
}catch{
return{ok:false,err:"Could not join team."};
}
},[pendingJoinContext,normalizeStoredInviteContext,readInviteContextFromStorage,savePendingJoinContext]);

// Load persisted data + restore session
useEffect(()=>{
let canceled=false;
(async()=>{
try{
bootMark("hydration_started");
await hydratePersistedData();
bootMark("hydration_data_loaded");
}catch(error){
if(canceled)return;
bootMark("hydration_failed",String(error?.message||error||"unknown"));
setStartupError(parseStartupErrorMessage(error));
}finally{
if(!canceled)setReady(true);
}
})();
return()=>{canceled=true;};
},[hydratePersistedData]);
useEffect(()=>{
if(ready){
bootMark("app_ready");
window.dispatchEvent(new CustomEvent("shotlab:app-ready"));
}
},[ready]);
useEffect(()=>{
if(!ready||!user||user.role!=="player"||user.teamId)return;
const savedInviteContext=normalizeStoredInviteContext(pendingJoinContext)||readInviteContextFromStorage();
if(!savedInviteContext?.joinContextToken)return;
let canceled=false;
(async()=>{
const r=await consumeJoinContext(user,null,savedInviteContext);
if(canceled||!r.ok||!r.teamId)return;
const np=players.map(p=>p.email===user.email?{...p,teamId:r.teamId}:p);
await P("sl:players",np,setPlayers);
const hasProfile=playerProfiles.some(pp=>pp.userId===user.email&&pp.teamId===r.teamId);
if(!hasProfile){
const parts=(user.name||"Player").trim().split(/\s+/);
await P("sl:player-profiles",[...playerProfiles,{id:genId("pp"),userId:user.email,teamId:r.teamId,firstName:parts[0]||"Player",lastName:parts.slice(1).join(" "),createdAt:Date.now()}],setPlayerProfiles);
}
setUser(prev=>prev?{...prev,teamId:r.teamId}:prev);
navigateToPlayerHome();
setView("player");
})();
return()=>{canceled=true;};
},[ready,user,pendingJoinContext,consumeJoinContext,players,playerProfiles,P,navigateToPlayerHome,normalizeStoredInviteContext,readInviteContextFromStorage]);

// Auth with hashed passwords
const register=async(email,password,name,role)=>{
const existing=players.find(p=>p.email===email);
if(existing)return{ok:false,err:"Account already exists. Please sign in."};
const hashed=hashPw(password);
const np=[...players,{email,name,password:hashed,role,teamId:null,hideFromLeaderboards:false}];
const seededDrills=mergeDefaultDrills(drills,DRILLS_INIT);
const seededProgramDrills=mergeDefaultDrills(programDrills,PROGRAM_DRILLS_INIT);
await Promise.all([
P("sl:players",np,setPlayers),
P("sl:drills",seededDrills,setDrills),
P("sl:program-drills",seededProgramDrills,setProgramDrills),
]);
setUser({email,role,isCoach:role==="coach",name,teamId:null,hideFromLeaderboards:false});setView(role==="coach"?"create-team":"join-team");
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
setUser({email,role:p.role||"player",isCoach:(p.role||"player")==="coach",name:p.name,teamId:p.teamId||null,hideFromLeaderboards:p.hideFromLeaderboards===true});
if((p.role||"player")==="coach"&&!p.teamId)setView("create-team");
else if((p.role||"player")==="player"&&!p.teamId)setView("join-team");
else {if((p.role||"player")==="player")navigateToPlayerHome();setView(p.role||"player");}
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
np=[...np,{email:DEMO_COACH.email,name:DEMO_COACH.name,password:hashPw(DEMO_COACH.password),role:"coach",teamId:null,hideFromLeaderboards:false}];
}
if(!np.find(p=>p.email===DEMO_PLAYER.email)){
np=[...np,{email:DEMO_PLAYER.email,name:DEMO_PLAYER.name,password:hashPw(DEMO_PLAYER.password),role:"player",teamId:null,hideFromLeaderboards:false}];
}
await savePlayers();

const seededDemoPlayer=np.find(p=>p.email===DEMO_PLAYER.email&&p.teamId);
let demoTeam=(seededDemoPlayer&&nts.find(t=>t.id===seededDemoPlayer.teamId))||nts.find(t=>t.ownerCoachId===DEMO_COACH.email);
if(!demoTeam){
demoTeam={id:genId("team"),name:"Demo Team",ownerCoachId:DEMO_COACH.email,joinCode:generateJoinCode(nts.map(t=>t.joinCode)),joinCodeUpdatedAt:Date.now(),createdAt:Date.now(),branding:DEFAULT_BRANDING};
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

const hasPlayerProfile=playerProfiles.some(pp=>pp.userId===DEMO_PLAYER.email&&pp.teamId===demoTeam.id);
if(!hasPlayerProfile){
await P("sl:player-profiles",[...playerProfiles,{id:genId("pp"),userId:DEMO_PLAYER.email,teamId:demoTeam.id,firstName:"Demo",lastName:"Player",createdAt:Date.now()}],setPlayerProfiles);
}

const signedIn=np.find(p=>p.email===acct.email);
if(!signedIn)return{ok:false,err:"Unable to prepare demo account."};
setUser({email:signedIn.email,role:signedIn.role||"player",isCoach:(signedIn.role||"player")==="coach",name:signedIn.name,teamId:demoTeam.id,hideFromLeaderboards:signedIn.hideFromLeaderboards===true});
if(kind!=="coach")navigateToPlayerHome();
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
const endpoint="/v1/coach-signup/bootstrap";
setDataDebug(prev=>({...prev,createTeam:{...prev.createTeam,teamName:String(name||""),endpoint,status:"request_start",httpStatus:null,errorCode:"",responseSummary:"",teamId:"",joinCode:"",stateUpdated:false,remotePersisted:false}}));
let bootstrapBody={};
let bootstrapStatus=0;
try{
const bootstrapRes=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json","x-user-id":user.email},body:JSON.stringify({team_name:san(name)||"Team"})});
bootstrapStatus=bootstrapRes.status;
const contentType=String(bootstrapRes.headers.get("content-type")||"").toLowerCase();
let parseMode="json";
if(contentType.includes("application/json")){
bootstrapBody=await bootstrapRes.json().catch(()=>{parseMode="invalid_json";return{};});
}else{
parseMode="non_json";
await bootstrapRes.text().catch(()=>"");
}
const errorCode=String(bootstrapBody?.error||"");
setDataDebug(prev=>({...prev,createTeam:{...prev.createTeam,httpStatus:bootstrapStatus,errorCode:errorCode||parseMode,responseSummary:bootstrapRes.ok?`invite:${Boolean(bootstrapBody?.invite_code)} team:${Boolean(bootstrapBody?.team_id)}`:`error:${errorCode||parseMode}`,status:bootstrapRes.ok?"response_ok":"response_error"}}));
if(!bootstrapRes.ok)return{ok:false,err:parseCreateTeamErrorMessage(bootstrapStatus,errorCode,parseMode)};
}catch{
setDataDebug(prev=>({...prev,createTeam:{...prev.createTeam,httpStatus:bootstrapStatus||null,errorCode:"network_error",responseSummary:"request_failed",status:"request_failed"}}));
return{ok:false,err:"Network error while creating team."};
}
const code=normalizeJoin(bootstrapBody?.invite_code||"");
const teamId=String(bootstrapBody?.team_id||"").trim();
if(!code||!teamId){
setDataDebug(prev=>({...prev,createTeam:{...prev.createTeam,errorCode:"invalid_response_shape",responseSummary:"missing team_id/invite_code",status:"response_invalid"}}));
return{ok:false,err:"Team setup response was incomplete."};
}
const nt={id:teamId,name:san(name)||"Team",school:san(meta.school||""),level:san(meta.level||""),ownerCoachId:user.email,joinCode:code,joinCodeUpdatedAt:Date.now(),createdAt:Date.now(),branding:DEFAULT_BRANDING};
await P("sl:teams",[...teams,nt],setTeams);
const np=players.map(p=>p.email===user.email?{...p,teamId:nt.id}:p);
await P("sl:players",np,setPlayers);
setUser({...user,teamId:nt.id});setView("coach");
setDataDebug(prev=>({...prev,createTeam:{...prev.createTeam,teamId,joinCode:code,stateUpdated:true,remotePersisted:true,status:"success"}}));
return{ok:true,team:nt};
};
const joinTeam=async(code)=>{
if(!user||user.role!=="player")return{ok:false,err:"Not authorized"};
const normalizedCode=normalizeJoin(code).replace(/[-\s]+/g,"");
setDataDebug(prev=>({...prev,join:{...prev.join,enteredCode:String(code||""),normalizedCode,status:"lookup",lookupSource:"backend_invite_context",lookupField:"team_invites.code_hash",lookupHashPrefix:"",lookupHashSource:"public.hash_invite_code(public.normalize_invite_code(code))",lookupCount:null,matchedTeamId:"",inviteState:"",expiresAt:null,inviteContextSaved:"no",inviteContextStorageKey:INVITE_CONTEXT_STORAGE_KEY,inviteContextTokenPresent:"no",inviteContextTeamId:"",inviteContextSubject:"",currentUserEmail:String(user?.email||"").trim().toLowerCase(),contextSubjectMatchesUser:"no",update:"idle",error:""}}));
let resolvedTeamId=null;
const savedInviteContext=normalizeStoredInviteContext(pendingJoinContext)||readInviteContextFromStorage();
let activeContext=savedInviteContext;
const normalizedUserEmail=String(user.email||"").trim().toLowerCase();
const canUseSavedContext=Boolean(activeContext?.joinContextToken)&&String(activeContext?.subject||activeContext?.subjectKey||"").trim().toLowerCase()===normalizedUserEmail&&(!normalizedCode||!String(activeContext?.inviteCode||"").trim()||String(activeContext?.inviteCode||"").trim()===normalizedCode);
if(!canUseSavedContext){
const ctx=await startJoinContext(normalizedCode,user.email);
if(!ctx.ok){
setDataDebug(prev=>({...prev,join:{...prev.join,status:"failed",lookupCount:0,error:ctx.err||"invalid_code"}}));
return{ok:false,err:ctx.err||"Invalid team code."};
}
activeContext=ctx.context||null;
}
const joined=await consumeJoinContext(user,null,activeContext);
if(!joined.ok){
setDataDebug(prev=>({...prev,join:{...prev.join,status:"failed",lookupCount:0,error:joined.err||"join_failed"}}));
return{ok:false,err:joined.err||"Could not join team."};
}
resolvedTeamId=joined.teamId;
setDataDebug(prev=>({...prev,join:{...prev.join,status:"backend_match",lookupCount:1,matchedTeamId:resolvedTeamId}}));
if(!resolvedTeamId)return{ok:false,err:"Could not resolve team."};
if(user.teamId===resolvedTeamId){navigateToPlayerHome();setView("player");return{ok:true,alreadyJoined:true};}
const np=players.map(p=>p.email===user.email?{...p,teamId:resolvedTeamId}:p);
await P("sl:players",np,setPlayers);
const hasProfile=playerProfiles.some(pp=>pp.userId===user.email&&pp.teamId===resolvedTeamId);
if(!hasProfile){
const parts=(user.name||"Player").trim().split(/\s+/);
await P("sl:player-profiles",[...playerProfiles,{id:genId("pp"),userId:user.email,teamId:resolvedTeamId,firstName:parts[0]||"Player",lastName:parts.slice(1).join(" "),createdAt:Date.now()}],setPlayerProfiles);
}
setUser({...user,teamId:resolvedTeamId});navigateToPlayerHome();setView("player");
setDataDebug(prev=>({...prev,join:{...prev.join,status:"joined",update:"success",error:""}}));
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
const removeRosterPlayer=async(playerEmail)=>{
if(!user||user.role!=="coach"||!user.teamId)return{ok:false,err:"Not authorized"};
if(!requireCoach(user,user.teamId))return{ok:false,err:"Not authorized"};
const email=String(playerEmail||"").trim().toLowerCase();
if(!email)return{ok:false,err:"Player email is required"};
const target=players.find(p=>String(p.email||"").toLowerCase()===email);
if(!target||target.role==="coach"||target.teamId!==user.teamId)return{ok:false,err:"Player not found on roster"};
const nextPlayers=players.map(p=>String(p.email||"").toLowerCase()===email?{...p,teamId:null}:p);
await Promise.all([
P("sl:players",nextPlayers,setPlayers),
P("sl:scores",scores.filter(s=>String(s.playerId||s.email||"").toLowerCase()!==email),setScores),
P("sl:rsvps",rsvps.filter(r=>String(r.playerId||r.email||"").toLowerCase()!==email),setRsvps),
P("sl:shotlogs",shotLogs.filter(l=>String(l.playerId||l.email||"").toLowerCase()!==email),setShotLogs),
P("sl:challenges",challenges.filter(c=>String(c.playerId||"").toLowerCase()!==email&&String(c.from||"").toLowerCase()!==email&&String(c.to||"").toLowerCase()!==email),setChallenges),
P("sl:sc-rsvps",scRsvps.filter(r=>String(r.playerId||r.email||"").toLowerCase()!==email),setScRsvps),
P("sl:sc-logs",scLogs.filter(l=>String(l.playerId||l.email||"").toLowerCase()!==email),setScLogs),
P("sl:player-profiles",playerProfiles.filter(pp=>!(String(pp.userId||"").toLowerCase()===email&&pp.teamId===user.teamId)),setPlayerProfiles),
]);
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
const addScore=async(drillId,score,src="home")=>{
if(!requirePlayer(user,user?.teamId,user?.email))return;
try{
const nextScores=[...scores,{id:genId("score"),email:user.email,playerId:user.email,teamId:user.teamId,name:user.name,drillId,score,date:todayStr(),ts:Date.now(),src}];
await P("sl:scores",nextScores,setScores,{strictRemote:true});
setStatSyncError("");
trackEvent("score_logged",{drillId,score,src});
await fetchHomeShotsLeaderboard(user.teamId,homeShotsLeaderboardScope);
}catch(e){
setStatSyncError("Could not save score to team dashboard. Please try again.");
trackEvent("score_log_failed",{drillId,score,src,error:String(e?.message||"unknown")});
}
};
const updateDrill=async(id,up)=>{if(user?.role!=="coach")return;await P("sl:drills",drills.map(d=>d.id===id?{...d,...up}:d),setDrills)};
const addDrill=async(drill)=>{if(user?.role!=="coach")return;await P("sl:drills",[...drills,{...drill,id:Date.now()}],setDrills)};
const removeDrill=async(id)=>{if(user?.role!=="coach")return;await P("sl:drills",drills.filter(d=>d.id!==id),setDrills)};
const addProgramDrill=async(drill)=>{if(user?.role!=="coach")return{ok:false,err:"Not authorized"};if(countCustomProgramDrills(programDrills)>=7)return{ok:false,err:"Program drill limit reached (7 custom drills)."};await P("sl:program-drills",[...programDrills,{...drill,id:Date.now()}],setProgramDrills);return{ok:true}};
const removeProgramDrill=async(id)=>{if(user?.role!=="coach")return;await P("sl:program-drills",programDrills.filter(d=>d.id!==id),setProgramDrills)};
const toggleRsvp=async(eid)=>{if(!requirePlayer(user,user?.teamId,user?.email))return;const ex=rsvps.find(r=>r.eventId===eid&&r.playerId===user.email&&r.teamId===user.teamId);if(ex){await P("sl:rsvps",rsvps.filter(r=>!(r.eventId===eid&&r.playerId===user.email&&r.teamId===user.teamId)),setRsvps);trackEvent("event_rsvp_removed",{eventId:eid});}else{await P("sl:rsvps",[...rsvps,{eventId:eid,email:user.email,playerId:user.email,teamId:user.teamId,name:user.name,ts:Date.now()}],setRsvps);trackEvent("event_rsvp_added",{eventId:eid});}};
const addEvent=async ev=>{if(user?.role!=="coach"||!user.teamId)return;await P("sl:events",[...events,{...ev,id:Date.now(),teamId:user.teamId,ownerCoachId:user.email}],setEvents);trackEvent("event_created",{eventType:ev.type||"run"})};
const removeEvent=async id=>{if(user?.role!=="coach"||!user.teamId)return;await P("sl:events",events.filter(e=>!(e.id===id&&e.teamId===user.teamId)),setEvents);await P("sl:rsvps",rsvps.filter(r=>!(r.eventId===id&&r.teamId===user.teamId)),setRsvps)};
const removeRsvp=async(eid,email)=>{if(user?.role!=="coach"||!user.teamId)return;await P("sl:rsvps",rsvps.filter(r=>!(r.eventId===eid&&r.playerId===email&&r.teamId===user.teamId)),setRsvps)};
const addRsvp=async(eid,email,name)=>{if(user?.role!=="coach"||!user.teamId)return;if(rsvps.find(r=>r.eventId===eid&&r.playerId===email&&r.teamId===user.teamId))return;await P("sl:rsvps",[...rsvps,{eventId:eid,email,playerId:email,teamId:user.teamId,name,ts:Date.now()}],setRsvps)};
const addShotLog=async(made,date)=>{
if(!requirePlayer(user,user?.teamId,user?.email))return;
try{
const nextLogs=[...shotLogs,{id:genId("shotlog"),email:user.email,playerId:user.email,teamId:user.teamId,name:user.name,made,date,ts:Date.now()}];
await P("sl:shotlogs",nextLogs,setShotLogs,{strictRemote:true});
setStatSyncError("");
trackEvent("shot_log_added",{made,date});
await fetchHomeShotsLeaderboard(user.teamId,homeShotsLeaderboardScope);
}catch(e){
setStatSyncError("Could not save home shots to team dashboard. Please try again.");
trackEvent("shot_log_failed",{made,date,error:String(e?.message||"unknown")});
}
};
const addChallenge=async(ch)=>{if(!requirePlayer(user,user?.teamId,user?.email))return;await P("sl:challenges",[...challenges,{...ch,id:Date.now(),teamId:user.teamId,playerId:user.email,from:user.email,fromName:user.name,status:"pending",ts:Date.now()}],setChallenges);trackEvent("challenge_created",{to:ch.to||null})};
const respondChallenge=async(id,score)=>{if(!requirePlayer(user,user?.teamId,user?.email))return;await P("sl:challenges",challenges.map(c=>c.id===id&&c.teamId===user.teamId&&c.to===user.email?{...c,respScore:score,respTs:Date.now(),status:score>c.score?"won":score===c.score?"tied":"lost"}:c),setChallenges)};
const addScSession=async(s)=>{if(user?.role!=="coach"||!user.teamId)return;await P("sl:sc-sessions",[...scSessions,{...s,id:Date.now(),teamId:user.teamId,ownerCoachId:user.email}],setScSessions);trackEvent("sc_session_created",{sport:s.sport||""})};
const removeScSession=async(id)=>{if(user?.role!=="coach"||!user.teamId)return;await P("sl:sc-sessions",scSessions.filter(s=>!(s.id===id&&s.teamId===user.teamId)),setScSessions);await P("sl:sc-rsvps",scRsvps.filter(r=>!(r.sessionId===id&&r.teamId===user.teamId)),setScRsvps)};
const toggleScRsvp=async(sid)=>{if(!requirePlayer(user,user?.teamId,user?.email))return;const ex=scRsvps.find(r=>r.sessionId===sid&&r.playerId===user.email&&r.teamId===user.teamId);if(ex){await P("sl:sc-rsvps",scRsvps.filter(r=>!(r.sessionId===sid&&r.playerId===user.email&&r.teamId===user.teamId)),setScRsvps);trackEvent("sc_rsvp_removed",{sessionId:sid});}else{await P("sl:sc-rsvps",[...scRsvps,{sessionId:sid,email:user.email,playerId:user.email,teamId:user.teamId,name:user.name,ts:Date.now()}],setScRsvps);trackEvent("sc_rsvp_added",{sessionId:sid});}};
const addScLog=async(log)=>{if(!requirePlayer(user,user?.teamId,user?.email))return;await P("sl:sc-logs",[{...log,id:Date.now(),email:user.email,playerId:user.email,teamId:user.teamId,name:user.name},...scLogs],setScLogs)};
const toggleLeaderboardVisibility=async()=>{if(!user||user.role!=="player")return;const np=players.map(p=>p.email===user.email?{...p,hideFromLeaderboards:!(p.hideFromLeaderboards===true)}:p);await P("sl:players",np,setPlayers);const updated=np.find(p=>p.email===user.email);if(updated)setUser(prev=>prev?{...prev,hideFromLeaderboards:updated.hideFromLeaderboards===true}:prev)};
useEffect(()=>{
if(view!=="coach"||!user?.teamId)return;
let cancelled=false;
const refreshScores=async()=>{
const latest=await DB.get("sl:scores");
if(cancelled||!Array.isArray(latest))return;
setScores(latest.map(s=>({...s,playerId:s.playerId||s.email,teamId:s.teamId||null,src:s.src||"home"})));
};
refreshScores();
const pollId=setInterval(refreshScores,15000);
const onFocus=()=>{refreshScores();};
window.addEventListener("focus",onFocus);
return()=>{cancelled=true;clearInterval(pollId);window.removeEventListener("focus",onFocus);};
},[view,user?.teamId]);
const saveTeamBranding=async(nextBranding)=>{
if(user?.role!=="coach"||!user?.teamId)return{ok:false,err:"Not authorized"};
const team=teams.find(t=>t.id===user.teamId);
if(!team)return{ok:false,err:"Team not found"};
const mergedBranding=resolveTeamBranding({
...(team.branding||{}),
...(nextBranding||{}),
updatedAt:Date.now(),
updatedBy:user.email,
version:Number(team.branding?.version||DEFAULT_BRANDING.version||1)+1,
});
const nextTeams=teams.map(t=>t.id===team.id?{...t,branding:mergedBranding}:t);
await P("sl:teams",nextTeams,setTeams);
trackEvent("team_branding_saved",{teamId:team.id});
return{ok:true};
};
const onLoadDemoData=async()=>{
if(demoSettingsBusy)return;
setDemoSettingsBusy(true);
try{
const activeTeam=teams.find(team=>team.id===user?.teamId)||null;
const bundle=buildDemoDataBundle({teamId:activeTeam?.id,coachEmail:user?.email,team:activeTeam?{...activeTeam,createdAt:activeTeam.createdAt||Date.now()}:undefined});
await applyDemoData(bundle);
await hydratePersistedData();
}finally{
setDemoSettingsBusy(false);
}
};
const onClearDemoData=async()=>{
if(demoSettingsBusy)return;
setDemoSettingsBusy(true);
try{
await clearDemoData();
await hydratePersistedData();
}finally{
setDemoSettingsBusy(false);
}
};
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
const resolvedTeamBranding=resolveTeamBranding(myTeam?.branding||DEFAULT_BRANDING);
const coachTextSize=COACH_TEXT_SIZES.includes(resolvedTeamBranding?.textScale)?resolvedTeamBranding.textScale:"standard";

useEffect(()=>{initAnalytics();trackBackendEvent("app_loaded",{path:window.location.pathname});},[]);
useEffect(()=>{if(ready&&user&&["coach","player"].includes(view))trackEvent("screen_view",{screen:view,role:user.role||"player"});},[ready,user,view,trackEvent]);
useEffect(()=>{const onErr=(e)=>trackEvent("app_error",{kind:"error",message:e?.message||"unknown"});const onRej=(e)=>trackEvent("app_error",{kind:"unhandledrejection",message:e?.reason?.message||String(e?.reason||"unknown")});window.addEventListener("error",onErr);window.addEventListener("unhandledrejection",onRej);return()=>{window.removeEventListener("error",onErr);window.removeEventListener("unhandledrejection",onRej);};},[trackEvent]);
useEffect(()=>{
if(!ready||!user?.teamId||!["coach","player"].includes(view))return;
fetchHomeShotsLeaderboard(user.teamId,homeShotsLeaderboardScope);
},[ready,user?.teamId,view,homeShotsLeaderboardScope,fetchHomeShotsLeaderboard]);

if(!ready)return <><Styles/><div style={{minHeight:"100dvh",background:BG,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:24,position:"relative",overflow:"hidden"}}><CourtBG opacity={.015}/><div style={{position:"relative",zIndex:1,textAlign:"center"}}><SLLogo size={72} glow/><div style={{fontFamily:FD,fontSize:14,color:VOLT,letterSpacing:6,marginTop:16,animation:"pulse 1.5s infinite"}}>LOADING</div></div></div></>;
if(startupError)return <><Styles/><div style={{minHeight:"100dvh",background:BG,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}><div style={{width:"100%",maxWidth:520,background:CARD_BG,border:`1px solid rgba(255,69,69,0.45)`,borderRadius:16,padding:20}}><div style={{fontFamily:FD,color:"#FF8B8B",fontSize:20,letterSpacing:2,marginBottom:8}}>STARTUP ERROR</div><div style={{fontFamily:FB,color:"#FFB5B5",fontSize:13,lineHeight:1.55}}>{startupError}</div><div style={{fontFamily:FB,color:MUTED,fontSize:11,marginTop:12}}>Check deployment environment variables and network access, then reload.</div><button onClick={()=>window.location.reload()} className="btn-v cta-primary" style={{marginTop:14}}>RELOAD</button></div></div></>;

const dataDebugPanel=dataDebugEnabled?<div style={{position:"fixed",right:12,bottom:12,zIndex:60,width:"min(360px, calc(100vw - 24px))",maxHeight:"45vh",overflow:"auto",background:"rgba(8,8,8,0.94)",border:"1px solid rgba(255,255,255,0.18)",borderRadius:10,padding:10,fontFamily:"system-ui,-apple-system,Segoe UI,Roboto,sans-serif",fontSize:11,color:"#E5E7EB"}}><div style={{fontWeight:700,letterSpacing:"0.06em",marginBottom:6,color:"#C8FF1A"}}>DATA DEBUG (?dataDebug=1)</div><div>User: {user?.email||"none"}</div><div>Role: {user?.role||"none"}</div><div>Team ID: {user?.teamId||"none"}</div><div>Team Code: {myTeam?.joinCode||"none"}</div><hr style={{borderColor:"rgba(255,255,255,0.14)"}}/><div>Create team name: {dataDebug.createTeam.teamName||"none"}</div><div>Create endpoint: {dataDebug.createTeam.endpoint||"none"}</div><div>Create status: {dataDebug.createTeam.status||"none"}</div><div>Create HTTP status: {dataDebug.createTeam.httpStatus==null?"n/a":dataDebug.createTeam.httpStatus}</div><div>Create error code: {dataDebug.createTeam.errorCode||"none"}</div><div>Create response summary: {dataDebug.createTeam.responseSummary||"none"}</div><div>Returned teamId: {dataDebug.createTeam.teamId||"none"}</div><div>Returned joinCode: {dataDebug.createTeam.joinCode||"none"}</div><div>Coach state updated: {dataDebug.createTeam.stateUpdated?"yes":"no"}</div><div>Remote persisted: {dataDebug.createTeam.remotePersisted?"yes":"no"}</div><hr style={{borderColor:"rgba(255,255,255,0.14)"}}/><div>Join code entered: {dataDebug.join.enteredCode||"none"}</div><div>Normalized code: {dataDebug.join.normalizedCode||"none"}</div><div>Lookup source: {dataDebug.join.lookupSource}</div><div>Lookup field: {dataDebug.join.lookupField}</div><div>Lookup hash prefix: {dataDebug.join.lookupHashPrefix||"none"}</div><div>Lookup hash source: {dataDebug.join.lookupHashSource||"none"}</div><div>Join status: {dataDebug.join.status}</div><div>Lookup count: {dataDebug.join.lookupCount==null?"n/a":dataDebug.join.lookupCount}</div><div>Matched teamId: {dataDebug.join.matchedTeamId||"none"}</div><div>Invite state: {dataDebug.join.inviteState||"none"}</div><div>Invite expiresAt: {dataDebug.join.expiresAt||"none"}</div><div>Invite context saved: {dataDebug.join.inviteContextSaved||"no"}</div><div>Invite context storage key: {dataDebug.join.inviteContextStorageKey||"none"}</div><div>Invite context token present: {dataDebug.join.inviteContextTokenPresent||"no"}</div><div>Invite context teamId: {dataDebug.join.inviteContextTeamId||"none"}</div><div>Invite context subject: {dataDebug.join.inviteContextSubject||"none"}</div><div>Current user email: {dataDebug.join.currentUserEmail||"none"}</div><div>Context subject matches user: {dataDebug.join.contextSubjectMatchesUser||"no"}</div><div>Profile update: {dataDebug.join.update}</div><div>Join error: {dataDebug.join.error||"none"}</div><hr style={{borderColor:"rgba(255,255,255,0.14)"}}/><div>Leaderboard endpoint: {dataDebug.leaderboard.endpoint||"none"}</div><div>HTTP status: {dataDebug.leaderboard.httpStatus==null?"n/a":dataDebug.leaderboard.httpStatus}</div><div>Error code: {dataDebug.leaderboard.errorCode||"none"}</div><div>Result count: {dataDebug.leaderboard.resultCount==null?"n/a":dataDebug.leaderboard.resultCount}</div><div>Empty data: {dataDebug.leaderboard.isEmpty?"yes":"no"}</div></div>:null;

return <TeamBrandingProvider branding={resolvedTeamBranding}><Styles/>
{view==="auth"&&<div className="screen-fade-in"><Auth onLogin={login} onRegister={register} onDemo={demoSignIn} onCreateJoinContext={startJoinContext}/></div>}{view==="create-team"&&<div className="screen-fade-in"><CreateTeam onCreate={createTeam} u={user}/></div>} 
{view==="join-team"&&<div className="screen-fade-in"><JoinTeam onJoin={joinTeam} u={user} pendingJoinContext={pendingJoinContext} onClearPendingJoinContext={()=>savePendingJoinContext(null)}/></div>}
{view==="player"&&<div className="screen-fade-in"><Player u={user} drills={drills} programDrills={programDrills} scores={scopedScores} addScore={addScore} events={scopedEvents} rsvps={scopedRsvps} toggleRsvp={toggleRsvp} shotLogs={scopedShotLogs} addShotLog={addShotLog} challenges={scopedChallenges} addChallenge={addChallenge} respondChallenge={respondChallenge} players={scopedPlayers} T={T} theme={theme} setTheme={setTheme} scSessions={scopedScSessions} scRsvps={scopedScRsvps} toggleScRsvp={toggleScRsvp} scLogs={scopedScLogs} addScLog={addScLog} logout={logout} deleteAccount={deleteAccount} toggleLeaderboardVisibility={toggleLeaderboardVisibility} homeShotsLeaderboard={homeShotsLeaderboard} leaderboardScope={homeShotsLeaderboardScope} onLeaderboardScopeChange={setHomeShotsLeaderboardScope} refreshHomeShotsLeaderboard={()=>fetchHomeShotsLeaderboard(user?.teamId,homeShotsLeaderboardScope)} statSyncError={statSyncError}/></div>}
{view==="coach"&&<div className="screen-fade-in"><Coach u={user} team={myTeam} regenerateJoinCode={regenerateJoinCode} addRosterPlayer={addRosterPlayer} removeRosterPlayer={removeRosterPlayer} playerProfiles={playerProfiles.filter(pp=>pp.teamId===user?.teamId)} drills={drills} programDrills={programDrills} scores={scopedScores} players={scopedPlayers} updateDrill={updateDrill} addDrill={addDrill} removeDrill={removeDrill} addProgramDrill={addProgramDrill} removeProgramDrill={removeProgramDrill} events={scopedEvents} rsvps={scopedRsvps} addEvent={addEvent} removeEvent={removeEvent} removeRsvp={removeRsvp} addRsvp={addRsvp} scSessions={scopedScSessions} scRsvps={scopedScRsvps} scLogs={scopedScLogs} addScSession={addScSession} removeScSession={removeScSession} shotLogs={scopedShotLogs} logout={logout} deleteAccount={deleteAccount} openTeamBranding={()=>setView("coach-branding")} coachTextSize={coachTextSize} demoSettingsBusy={demoSettingsBusy} onLoadDemoData={onLoadDemoData} onClearDemoData={onClearDemoData} homeShotsLeaderboard={homeShotsLeaderboard} leaderboardScope={homeShotsLeaderboardScope} onLeaderboardScopeChange={setHomeShotsLeaderboardScope} refreshHomeShotsLeaderboard={()=>fetchHomeShotsLeaderboard(user?.teamId,homeShotsLeaderboardScope)}/></div>}
{view==="coach-branding"&&user?.role==="coach"&&<div className="screen-fade-in"><CoachTeamBrandingScreen branding={resolvedTeamBranding} onSave={saveTeamBranding} onBack={()=>setView("coach")} teamName={myTeam?.name||"Team"}/></div>}
{dataDebugPanel}
</TeamBrandingProvider>;
}
// ═══════════════════════════════════════
// AUTH
// ═══════════════════════════════════════
function Auth({onLogin,onRegister,onDemo,onCreateJoinContext}){
const[mode,setMode]=useState("login"),[role,setRole]=useState("player"),[email,setEmail]=useState(""),[password,setPassword]=useState(""),[name,setName]=useState(""),[inviteCode,setInviteCode]=useState(""),[err,setErr]=useState("");
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
if(role==="player"&&inviteCode.trim()){
const invite=await onCreateJoinContext(inviteCode,id);
if(!invite?.ok){setErr(invite?.err||"Team code is invalid or expired.");return}
}
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
      {role==="player"&&<>
        <label style={{fontFamily:FB,color:"#A0A0A0",fontSize:10,fontWeight:700,letterSpacing:3,display:"block",marginBottom:6}}>TEAM CODE</label>
        <input type="text" value={inviteCode} onChange={e=>{setInviteCode(e.target.value.toUpperCase());setErr("")}} placeholder="ENTER COACH CODE" style={{...inp,marginBottom:14,textTransform:"uppercase",letterSpacing:2}} onFocus={e=>{e.target.style.borderColor=VOLT;e.target.style.boxShadow="0 0 0 3px rgba(200,255,0,0.08)"}} onBlur={e=>{e.target.style.borderColor="#333333";e.target.style.boxShadow="none"}}/>
      </>}
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
      <button onClick={()=>doDemo("player")} className="btn-v" style={{height:44,padding:"0 20px",background:"#213217",color:"#E6FFD0",fontFamily:FB,fontSize:12,fontWeight:700,letterSpacing:"0.08em",border:"1px solid #78FF4D",boxShadow:"0 0 0 1px rgba(120,255,77,0.2), 0 8px 20px rgba(72,168,44,0.25)",borderRadius:10,cursor:"pointer",textTransform:"uppercase"}}>Demo Player</button>
      <button onClick={()=>doDemo("coach")} className="btn-v" style={{height:44,padding:"0 20px",background:"#213217",color:"#E6FFD0",fontFamily:FB,fontSize:12,fontWeight:700,letterSpacing:"0.08em",border:"1px solid #78FF4D",boxShadow:"0 0 0 1px rgba(120,255,77,0.2), 0 8px 20px rgba(72,168,44,0.25)",borderRadius:10,cursor:"pointer",textTransform:"uppercase"}}>Demo Coach</button>
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

function JoinTeam({u,onJoin,pendingJoinContext,onClearPendingJoinContext}){
const[code,setCode]=useState("");const[err,setErr]=useState("");
const submit=async()=>{const r=await onJoin(code);if(!r.ok)setErr(r.err||"Could not join team")};
return <div style={{minHeight:"100dvh",background:BG,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}><div style={{width:"100%",maxWidth:420,background:CARD_BG,border:`1px solid ${BORDER_CLR}`,borderRadius:16,padding:24}}><h2 style={{fontFamily:FD,color:LIGHT,letterSpacing:2,margin:"0 0 8px"}}>JOIN TEAM</h2><p style={{fontFamily:FB,color:MUTED,fontSize:12,margin:"0 0 16px"}}>Hey {u?.name}, enter your coach's team code.</p>{pendingJoinContext?.token&&<div style={{border:`1px solid ${BORDER_CLR}`,background:BG,borderRadius:10,padding:10,marginBottom:10,fontFamily:FB,fontSize:11,color:T.SUB}}>Validated invite context is saved for {pendingJoinContext.subjectKey}. <button onClick={onClearPendingJoinContext} style={{marginLeft:8,background:"transparent",border:"none",color:VOLT,cursor:"pointer",fontWeight:700}}>Clear</button></div>}<input value={code} onChange={e=>{setCode(e.target.value.toUpperCase());setErr("")}} placeholder="TEAM CODE" style={{width:"100%",padding:12,marginBottom:10,background:BG,color:LIGHT,border:`1px solid ${BORDER_CLR}`,borderRadius:10,textTransform:"uppercase",letterSpacing:2}}/>{err&&<div style={{color:"#FF4545",fontFamily:FB,fontSize:12,marginBottom:10}}>{err}</div>}<button onClick={submit} className="btn-v cta-primary" style={{}}>JOIN TEAM</button></div></div>;
}

// ═══════════════════════════════════════
// PLAYER SCREEN — Dual Dashboard
// ═══════════════════════════════════════
function Player({u,drills,programDrills,scores,addScore,events,rsvps,toggleRsvp,shotLogs,addShotLog,challenges,addChallenge,respondChallenge,players,T,theme,setTheme,scSessions,scRsvps,toggleScRsvp,scLogs,addScLog,logout,deleteAccount,toggleLeaderboardVisibility,homeShotsLeaderboard,leaderboardScope,onLeaderboardScopeChange,refreshHomeShotsLeaderboard,statSyncError=""}){
const canAccessTab=useCallback((nextTab)=>{
  if(nextTab==="players")return u.isCoach;
  if(nextTab==="duels")return !u.isCoach;
  return true;
},[u.isCoach]);
const tabFromPath=useCallback((path)=>{
  const normalized=path==="/"?"/":path.replace(/\/+$/,"")||"/";
  const nextTab=PLAYER_PATH_TABS[normalized]||"home";
  return canAccessTab(nextTab)?nextTab:"home";
},[canAccessTab]);
const initialTab = tabFromPath(window.location.pathname);
const[tab,setTab]=useState(initialTab),[active,setActive]=useState(null),[input,setInput]=useState(""),[saved,setSaved]=useState(false),[shareData,setShareData]=useState(null),[confetti,setConfetti]=useState(false);
const[shotMade,setShotMade]=useState(""),[shotDate,setShotDate]=useState(todayStr()),[shotSaved,setShotSaved]=useState(false);
const[challTarget,setChallTarget]=useState(""),[showChallForm,setShowChallForm]=useState(false);
const[badgeReveal,setBadgeReveal]=useState(null),[pullY,setPullY]=useState(0);
const[showShotStats,setShowShotStats]=useState(false);
const[isNarrow,setIsNarrow]=useState(typeof window!=="undefined"?window.innerWidth<768:false);
const[isDesktop,setIsDesktop]=useState(typeof window!=="undefined"?window.innerWidth>=1024:false);
const slideClass="screen-fade-in";
const switchTab=(k)=>{setTab(k);setActive(null);setShowShotStats(false);
const nextPath=PLAYER_TAB_PATHS[k]||"/";
if(window.location.pathname!==nextPath)window.history.pushState({},"",nextPath);}
useEffect(()=>{const onResize=()=>{setIsNarrow(window.innerWidth<768);setIsDesktop(window.innerWidth>=1024)};window.addEventListener("resize",onResize);return()=>window.removeEventListener("resize",onResize);},[]);
useEffect(()=>{
  const onPop=()=>{setTab(tabFromPath(window.location.pathname));setActive(null);setShowShotStats(false)};
  window.addEventListener("popstate",onPop);
  return ()=>window.removeEventListener("popstate",onPop);
},[tabFromPath]);
useEffect(()=>{
  if(!canAccessTab(tab)){
    setTab("home");
    if(window.location.pathname!=="/")window.history.replaceState({},"","/");
  }
},[tab,canAccessTab]);
const my=useMemo(()=>scores.filter(s=>s.email===u.email),[scores,u]);
const homeScores=useMemo(()=>my.filter(s=>s.src==="home"||!s.src),[my]);
const programScores=useMemo(()=>my.filter(s=>s.src==="program"),[my]);
const total=useMemo(()=>homeScores.reduce((a,s)=>a+s.score,0),[homeScores]);
const totalMakes=total;
const today=todayStr();
const todayS=useMemo(()=>homeScores.filter(s=>s.date===today),[homeScores,today]);
const todayProgramScores=useMemo(()=>programScores.filter(s=>s.date===today),[programScores,today]);
const streak=useMemo(()=>calcStreak(homeScores),[homeScores]);
const earnedBadges=useMemo(()=>getEarnedBadges(streak),[streak]);
const myRsvps=useMemo(()=>rsvps.filter(r=>r.email===u.email).length,[rsvps,u]);
const tier=useMemo(()=>getTier(myRsvps),[myRsvps]);

// Notification dots for nav
const unrsvpEvents=useMemo(()=>{const up=events.filter(e=>e.date>=today);return up.filter(e=>!rsvps.some(r=>r.eventId===e.id&&r.email===u.email)).length},[events,rsvps,u,today]);
const soonSC=useMemo(()=>{const d2=new Date();d2.setDate(d2.getDate()+2);const cut=`${d2.getFullYear()}-${String(d2.getMonth()+1).padStart(2,"0")}-${String(d2.getDate()).padStart(2,"0")}`;return scSessions.filter(s=>s.date>=today&&s.date<=cut&&!scRsvps.some(r=>r.sessionId===s.id&&r.email===u.email)).length},[scSessions,scRsvps,u,today]);

const[pbReveal,setPbReveal]=useState(null);
const[submitting,setSubmitting]=useState(false);
const[drillBarW,setDrillBarW]=useState(0);
useEffect(()=>{const target=drills.length>0?Math.round(todayS.length/drills.length*100):0;const timer=setTimeout(()=>{if(target===0){setDrillBarW(8);setTimeout(()=>setDrillBarW(0),200);}else{setDrillBarW(target);}},300);return()=>clearTimeout(timer);},[]);
const activeMode=tab==="duels"?"program":"home";
const activeScores=activeMode==="program"?programScores:homeScores;
const handleLog=()=>{if(submitting||!active)return;const v=parseInt(input);if(isNaN(v)||v<0||(hasDrillMax(active)&&v>active.max))return;setSubmitting(true);const oldStreak=streak;
const prevBest=activeScores.filter(s=>s.drillId===active.id).reduce((m,s)=>Math.max(m,s.score),0);
const isPB=v>prevBest&&prevBest>0;
addScore(active.id,v,activeMode);playScore();const pct=hasDrillMax(active)?Math.round(v/active.max*100):null;setShareData({drill:active.name,score:v,max:hasDrillMax(active)?active.max:null,pct,name:u.name,streak,date:todayStr(),drillId:active.id,icon:active.icon,badges:earnedBadges,isPB,prevBest,src:activeMode});setSaved(true);setConfetti(true);setInput("");setTimeout(()=>setConfetti(false),1200);
if(isPB){setTimeout(()=>{setPbReveal({drill:active.name,score:v,prev:prevBest});setTimeout(()=>setPbReveal(null),3000)},400)}
if(activeMode!=="program"){setTimeout(()=>{const ns=calcStreak([...homeScores,{date:todayStr()}]);const nb=STREAK_BADGES.find(b=>oldStreak<b.days&&ns>=b.days);if(nb){playUnlock();setBadgeReveal(nb);setTimeout(()=>setBadgeReveal(null),3500)}},700)}
};
const closeShare=()=>{setSaved(false);setActive(null);setShareData(null);setShowChallForm(false);setChallTarget("");setSubmitting(false);switchTab(activeMode==="program"?"duels":"home")};
const sendChallenge=()=>{if(!challTarget)return;addChallenge({to:challTarget,toName:players.find(p=>p.email===challTarget)?.name||challTarget.split("@")[0],drillId:shareData.drillId,drillName:shareData.drill,score:shareData.score,max:shareData.max});setShowChallForm(false);setChallTarget("");closeShare()};

// Pull-to-refresh
const[tStart,setTStart]=useState(0);
const onTS=e=>{setTStart(e.touches[0].clientY)};
const onTM=e=>{if(!tStart)return;const el=e.currentTarget;if(el.scrollTop>0)return;const dy=Math.max(0,Math.min(70,(e.touches[0].clientY-tStart)*.35));setPullY(dy)};
const onTE=()=>{if(pullY>40){setPullY(50);setTimeout(()=>setPullY(0),700)}else setPullY(0);setTStart(0)};
const playerNavItems=[
  {k:"home",l:"Home",accentVar:"--accent-feed",svg:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>},
  ...(u.isCoach
    ? [{k:"players",l:"Players",accentVar:"--accent-players",svg:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6"/><path d="M23 11h-6"/></svg>}]
    : [{k:"duels",l:"Program Log",accentVar:"--accent-drills",svg:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h10"/></svg>}]),
  {k:"log-drill",l:"AT Home Log",accentVar:"--accent-drills",svg:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h10"/></svg>},
  {k:"sc",l:"Lifting",accentVar:"--accent-lifting",svg:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6.5 6.5h-2a1 1 0 00-1 1v9a1 1 0 001 1h2M17.5 6.5h2a1 1 0 011 1v9a1 1 0 01-1 1h-2M6.5 12h11M1.5 9.5v5M22.5 9.5v5"/></svg>,dot:soonSC>0?VOLT:null},
  {k:"program",l:"Events",accentVar:"--accent-events",svg:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4M16 2v4"/><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18"/></svg>,dot:unrsvpEvents>0?VOLT:null},
  {k:"profile",l:"Profile",accentVar:"--accent-players",svg:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>},
];

return <div className={`app-shell ${isDesktop?"is-desktop":"is-mobile"}`}>
{isDesktop&&<aside className="sidebar-nav" aria-label="Player navigation"><div className="nav-title">PLAYER DASHBOARD</div>{playerNavItems.map(item=>{const active=tab===item.k;return <button key={item.k} className={`nav-item ${active?"is-active":""}`} onClick={()=>switchTab(item.k)}>{item.svg}<span>{item.l}</span></button>;})}</aside>}
<main className="shell-main"><div className="content-wrap"><div className={`team-brand ${u.isCoach?"coach-mode ":""}page`} data-accent={tab} style={{minHeight:"100dvh",background:u.isCoach?"#0B0A09":T.BG,display:"flex",flexDirection:"column",fontFamily:FB,position:"relative",transition:"background .3s"}}>
<BrandBackdrop/>
{statSyncError&&<div style={{position:"relative",zIndex:2,margin:"10px 12px 0",padding:"10px 12px",borderRadius:10,border:"1px solid rgba(255,69,69,0.45)",background:"rgba(255,69,69,0.10)",color:"#FFB5B5",fontFamily:FB,fontSize:11,fontWeight:600,letterSpacing:"0.02em"}}>{statSyncError}</div>}
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

{/* Header — Glassmorphism */}
<div style={{position:"sticky",top:0,zIndex:10,height:64,padding:isDesktop?"max(0px,env(safe-area-inset-top)) 16px 0":"max(0px,env(safe-area-inset-top)) 20px 0",background:TOKENS.BG_BASE,borderBottom:`1px solid ${TOKENS.BG_SUBTLE}`}}>
  <div style={{height:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
    <div style={{display:"flex",alignItems:"center",gap:12,minWidth:0}}>
      <button aria-label="Open profile" onClick={()=>switchTab("profile")} style={{width:36,height:36,borderRadius:"50%",background:"#1E1E1E",border:"1.5px solid #C8FF00",boxShadow:u.isCoach?"0 0 0 4px rgba(200, 255, 0, 0.15)":"none",color:"#FFFFFF",fontSize:14,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",padding:0,cursor:"pointer",fontFamily:FB,flexShrink:0}}>{(u.name||"?")[0].toUpperCase()}</button>
      <div style={{minWidth:0}}><div style={{fontFamily:FB,color:VOLT,fontSize:10,letterSpacing:"0.15em",fontWeight:700,textTransform:"uppercase",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{(()=>{
        const allDone=todayS.length>=drills.length;const shotsToday=shotLogs.filter(s=>s.email===u.email&&s.date===today).reduce((a,s)=>a+s.made,0);
        if(allDone&&shotsToday>0)return <span style={{color:VOLT}}>ALL DRILLS COMPLETE · {streak}D STREAK 🔥</span>;
        if(todayS.length>0)return <span>{todayS.length}/{drills.length} DRILLS · {shotsToday>0?shotsToday+" SHOTS · ":""}{streak}D STREAK</span>;
        return u.isCoach?"YOUR PROGRAM AWAITS":"TODAY'S MISSION AWAITS";
      })()}</div><div style={{display:"flex",alignItems:"center",gap:8,marginTop:1}}><div style={{fontFamily:FD,color:TOKENS.TEXT_PRIMARY,fontSize:20,fontWeight:900,letterSpacing:1.5,textTransform:"uppercase",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{u.name.toUpperCase()}</div>{u.isCoach&&<span style={{background:"rgba(200, 255, 0, 0.12)",border:"1px solid #C8FF00",borderRadius:20,padding:"2px 8px",fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.10em",color:"#C8FF00",display:"inline-flex",alignItems:"center",gap:4}}><WhistleIcon size={9} color="#C8FF00"/>COACH</span>}</div></div>
    </div>
    <div style={{display:"flex",gap:6,alignItems:"center"}}>
      <BrandWordmark size={20} small/>
      <button aria-label="Toggle theme" onClick={()=>setTheme(t=>t==="dark"?"light":"dark")} style={{background:T.SURFACE,border:`1px solid ${T.BORDER}`,borderRadius:12,color:T.MUT,width:44,height:44,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .3s"}}>
        {theme==="dark"?<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
        :<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>}
      </button>
      <button aria-label="Log out" onClick={logout} style={{background:T.SURFACE,border:`1px solid ${T.BORDER}`,borderRadius:12,color:T.MUT,width:44,height:44,cursor:"pointer",fontSize:14,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>&#10005;</button>
    </div>
  </div>

</div>
{u.isCoach&&<div style={{height:28,background:"linear-gradient(90deg, rgba(200, 255, 0, 0.08) 0%, transparent 100%)",borderBottom:"1px solid rgba(200, 255, 0, 0.12)",display:"flex",alignItems:"center",padding:"0 16px",gap:8}}><WhistleIcon size={12} color="#C8FF00"/><span style={{fontFamily:FB,fontSize:9,textTransform:"uppercase",letterSpacing:"var(--tracking-tight)",color:"rgba(200, 255, 0, 0.84)"}}>COACH VIEW — FULL ACCESS</span></div>}

<div style={{flex:1,padding:isDesktop?"14px 20px 36px":"16px 20px 124px",overflowY:"auto",overflowX:"hidden",position:"relative",zIndex:1,transform:`translateY(${pullY}px)`,transition:pullY?"none":"transform .3s",width:"100%",maxWidth:isDesktop?"none":760,margin:"0 auto"}} onTouchStart={isDesktop?undefined:onTS} onTouchMove={isDesktop?undefined:onTM} onTouchEnd={isDesktop?undefined:onTE}>
  {/* Pull-to-refresh basketball */}
  {pullY>5&&<div style={{position:"absolute",top:-44,left:"50%",transform:"translateX(-50%)",textAlign:"center",opacity:Math.min(pullY/30,1)}}>
    <svg width="24" height="24" viewBox="0 0 40 40" fill="none" style={{animation:pullY>40?"bbBounce .5s ease infinite":"none"}}><circle cx="20" cy="20" r="17" stroke={ORANGE} strokeWidth="2.5"/><path d="M3 20h34" stroke={ORANGE} strokeWidth="1.5"/><path d="M20 3v34" stroke={ORANGE} strokeWidth="1.5"/><path d="M8 5c4.5 5 6.5 9 6.5 15s-2 10-6.5 15" stroke={ORANGE} strokeWidth="1.5" fill="none"/><path d="M32 5c-4.5 5-6.5 9-6.5 15s2 10 6.5 15" stroke={ORANGE} strokeWidth="1.5" fill="none"/></svg>
    <div style={{fontFamily:FB,color:ORANGE,fontSize:8,letterSpacing:2,marginTop:2}}>{pullY>40?"REFRESHING":"PULL"}</div>
  </div>}

  {tab!=="home"&&!active&&<button onClick={()=>switchTab("home")} style={{background:"none",border:"none",color:VOLT,fontFamily:FB,fontSize:13,cursor:"pointer",fontWeight:700,letterSpacing:2,marginBottom:16,padding:0}}>&#8592; DASHBOARD</button>}

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
      const nextEventBadge=nextEvent?`Next · ${nextEvent.date.slice(5).replace("-","/")}`:"Schedule";
      const homeStats=[{label:"Makes Today",value:<AnimNum v={totalMakes} c={VOLT} size={26}/>,color:VOLT},{label:"Training Streak",value:formatStreakDays(streak),color:CYAN},{label:"Drills Completed",value:`${todayS.length}/${drills.length}`,color:LIGHT}];
      const programStats=[{label:"Next Team Event",value:nextEventLabel,color:LIGHT},{label:"Upcoming Events",value:upcomingEventsCount,color:VOLT},{label:"Attendance Rate",value:attendancePct,color:CYAN}];
      return <div style={{marginBottom:28}}>
        <section style={{marginBottom:18,padding:"16px 4px 0"}} aria-label="Training mode selector">
          <div style={{fontFamily:FD,color:LIGHT,fontSize:26,letterSpacing:2.8,textTransform:"uppercase",lineHeight:1}}>TRAINING MODE</div>
          <div style={{fontFamily:FB,color:T.SUB,fontSize:12,fontWeight:600,letterSpacing:"0.03em",marginTop:6}}>Choose how you’re training today</div>
        </section>
        <div style={{display:"grid",gridTemplateColumns:isNarrow?"1fr":"repeat(2,minmax(0,1fr))",gap:isNarrow?18:16,alignItems:"stretch"}}>
          <ModeCard title="AT HOME" subtitle="Solo drills & shot tracking" titleColor={VOLT} subtitleColor={VOLT} variant="active" actionLabel={null} icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={VOLT} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5L12 3l9 6.5"/><path d="M19 13v6a1 1 0 01-1 1H6a1 1 0 01-1-1v-6"/></svg>} stats={homeStats} accent="home" isActive={tab==="log-drill"} onClick={()=>setTab("log-drill")}/>
          <ModeCard title="PROGRAM" subtitle="Team events & verified attendance" titleColor={CYAN} subtitleColor={CYAN} variant="active" infoLayout={"schedule"} actionLabel={nextEventBadge} icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={VOLT} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4M16 2v4"/><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18"/></svg>} stats={programStats} accent="program" isActive={tab==="duels"} onClick={()=>switchTab("duels")}/>
        </div>
      </div>
    })()}

    {/* ══════ HOME SHOTS LEADERBOARD ══════ */}
    <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
      {HOME_SHOTS_LEADERBOARD_SCOPES.map((scopeOption) => {
        const isActive = leaderboardScope === scopeOption.key;
        return (
          <button
            key={scopeOption.key}
            type="button"
            onClick={() => onLeaderboardScopeChange(scopeOption.key)}
            style={{
              ...HOME_SHOTS_SCOPE_BUTTON_BASE_STYLE,
              border: isActive ? "1px solid var(--accent)" : "1px solid var(--stroke-1)",
              background: isActive ? "var(--accent-soft)" : "var(--surface-1)",
              color: isActive ? "var(--accent)" : "var(--text-2)",
              fontFamily: FB,
            }}
          >
            {scopeOption.label}
          </button>
        );
      })}
    </div>
    <HomeShotsLeaderboardCard
      title={`TOP 10 ${leaderboardScope==="coaches"?"COACH":"PLAYER"} HOME SHOTS`}
      status={homeShotsLeaderboard?.status||"idle"}
      rows={homeShotsLeaderboard?.rows||[]}
      error={homeShotsLeaderboard?.error||""}
      onRetry={refreshHomeShotsLeaderboard}
    />
  </div>}

  {/* ═════════════ AT HOME (sub-screen) ═════════════ */}
  {(tab==="log-drill")&&!active&&!showShotStats&&<div className="fade-up">
    
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={VOLT} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5L12 3l9 6.5"/><path d="M19 13v6a1 1 0 01-1 1H6a1 1 0 01-1-1v-6"/></svg>
      <div style={{fontFamily:FD,color:VOLT,fontSize:22,letterSpacing:3}}>AT HOME</div>
    </div>
    <div style={{fontFamily:FB,color:MUTED,fontSize:12,marginBottom:24,fontWeight:500}}>Log your daily drills and track shots — all on the honor system.</div>

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
      <button className="btn-v cta-primary" onClick={()=>{const v=parseInt(shotMade);if(isNaN(v)||v<=0)return;addShotLog(v,shotDate);setShotSaved(true);setShotMade("");setTimeout(()=>setShotSaved(false),1800)}} style={{opacity:shotSaved?.7:1}}>
        {shotSaved?"✓ SAVED":"LOG SHOTS"}
      </button>
      {(()=>{const t=shotLogs.filter(s=>s.email===u.email&&s.date===today).reduce((a,s)=>a+s.made,0);return t>0?<div style={{fontFamily:FB,color:MUTED,fontSize:11,textAlign:"center",marginTop:8}}>{t} makes logged today</div>:null})()}
      <button onClick={()=>setShowShotStats(true)} className="cta-secondary-link" style={{width:"100%",textAlign:"center",opacity:.85}}>VIEW SHOT STATS →</button>
    </div>

    <DividerDot/>

    {/* ── DAILY DRILLS (PRIMARY ACTION) ── */}
    <div style={{fontFamily:FB,color:todayS.length>=drills.length&&drills.length>0?"#FFFFFF":VOLT,fontSize:10,letterSpacing:3,fontWeight:700,marginBottom:8}}>DAILY DRILLS · {todayS.length}/{drills.length} DONE</div>
    <div style={{width:"100%",height:4,background:"#242424",borderRadius:2,overflow:"hidden",marginBottom:12}}><div style={{width:`${drills.length>0?Math.min(100,Math.round(todayS.length/drills.length*100)):0}%`,height:"100%",background:VOLT,borderRadius:2,transition:"width .25s ease"}}/></div>
    {drills.map(d=>{const done=todayS.find(s=>s.drillId===d.id);
      return <button key={d.id} className="ch" onClick={()=>!done&&setActive(d)} style={{width:"100%",display:"flex",alignItems:"center",gap:14,background:CARD_BG,border:`1px solid ${done?"rgba(200, 255, 0, 0.20)":BORDER_CLR}`,borderRadius:16,padding:"16px",marginBottom:12,cursor:done?"default":"pointer",textAlign:"left",opacity:done?.6:1}}>
        <div style={{width:48,height:48,display:"flex",alignItems:"center",justifyContent:"center",background:"#1E1E1E",borderRadius:12,flexShrink:0}}><DrillIcon type={d.icon} size={22} color={done?VOLT+"99":VOLT}/></div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontFamily:FB,color:LIGHT,fontSize:14,fontWeight:700,letterSpacing:1}}>{d.name}</div>
          <div style={{color:T.MUT,fontSize:11,marginTop:2,fontWeight:500}}>{d.desc}</div>
        </div>
        {done?<div style={{width:36,height:36,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><svg width="16" height="16" viewBox="0 0 20 20"><path d="M5 10l4 4 6-7" stroke={VOLT} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
         :<div style={{width:36,height:36,borderRadius:10,background:"rgba(200, 255, 0, 0.10)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .1s ease"}}><svg width="16" height="16" viewBox="0 0 16 16"><path d="M6 3l5 5-5 5" stroke={VOLT} strokeWidth="2" fill="none" strokeLinecap="round"/></svg></div>}
      </button>})}
  </div>}

  {/* ═════ SHOT STATS sub-screen ═════ */}
  {tab==="log-drill"&&showShotStats&&!active&&<div className="fade-up">
    <button onClick={()=>setShowShotStats(false)} style={{background:"none",border:"none",color:VOLT,fontFamily:FB,fontSize:13,cursor:"pointer",fontWeight:700,letterSpacing:2,marginBottom:20,padding:0}}>&#8592; BACK TO DRILLS</button>
    <ShotTracker u={u} shotLogs={shotLogs} addShotLog={addShotLog} shotMade={shotMade} setShotMade={setShotMade} shotDate={shotDate} setShotDate={setShotDate} shotSaved={shotSaved} setShotSaved={setShotSaved}/>
  </div>}


  {/* ═════════════ ACTIVE DRILL INPUT ═════════════ */}
  {(tab==="home"||tab==="log-drill"||tab==="duels")&&active&&<div className="detail-enter" style={{textAlign:"center",paddingTop:12,position:"relative"}}>
    {confetti&&<ConfettiBurst/>}
    {saved&&shareData?<div className="fade-up" style={{padding:"16px 0"}}>
      {/* ── SHAREABLE WORKOUT CARD ── */}
      <ShareCard data={shareData}/>
      {/* Challenge button */}
      {!showChallForm?<div style={{display:"flex",gap:8,marginTop:16}}>
        <button className="btn-v cta-primary" onClick={closeShare} style={{width:"100%"}}>DONE</button>
        {shareData?.src!=="program"&&<button className="btn-v cta-primary" onClick={()=>setShowChallForm(true)} style={{width:"100%"}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={BG} strokeWidth="2.5" strokeLinecap="round"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>CHALLENGE
        </button>}
      </div>
      :<div className="fade-up" style={{marginTop:16,background:CARD_BG,borderRadius:16,padding:"20px 18px",border:`1px solid ${ORANGE}33`,textAlign:"left"}}>
        <div style={{fontFamily:FD,color:ORANGE,fontSize:16,letterSpacing:3,marginBottom:4}}>SEND A CHALLENGE</div>
        <div style={{fontFamily:FB,color:MUTED,fontSize:11,marginBottom:14}}>Dare a teammate to beat your {shareData.score}{shareData.max?`/${shareData.max}`:""} on {shareData.drill}</div>
        {shareData?.src==="program"?<div style={{fontFamily:FB,color:T.SUB,fontSize:11}}>Program scores save directly to the team program leaderboard.</div>:players.filter(p=>p.email!==u.email).length===0?<div style={{fontFamily:FB,color:MUTED,fontSize:12,textAlign:"center",padding:16}}>No other players yet. They need to log in first.</div>
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
    :<><button onClick={()=>{setActive(null);if(tab==="home")switchTab("log-drill");if(tab==="duels")switchTab("duels")}} style={{background:"none",border:"none",color:activeMode==="program"?CYAN:VOLT,fontFamily:FB,fontSize:13,cursor:"pointer",fontWeight:700,letterSpacing:2,marginBottom:32,padding:"8px 16px"}}>&#8592; BACK</button>
      <div style={{width:100,height:100,borderRadius:22,background:`linear-gradient(135deg,${SURFACE},${CARD_BG})`,border:`1px solid ${activeMode==="program"?CYAN+"40":BORDER_CLR}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 24px",boxShadow:activeMode==="program"?`0 0 24px ${CYAN}14`:"none"}}><DrillIcon type={active.icon} size={48} color={activeMode==="program"?CYAN:undefined}/></div>
      <h2 style={{fontFamily:FD,color:activeMode==="program"?CYAN:LIGHT,fontSize:36,letterSpacing:4,margin:"0 0 8px"}}>{active.name}</h2>
      <p style={{fontFamily:FB,color:activeMode==="program"?CYAN: MUTED,fontSize:14,margin:"0 auto 6px",maxWidth:280,lineHeight:1.6,textShadow:activeMode==="program"?`0 0 18px ${CYAN}22`:"none"}}>{active.desc}</p>
      {/* Personal Best + Average */}
      {(()=>{const ds=activeScores.filter(s=>s.drillId===active.id);const pb=ds.reduce((m,s)=>Math.max(m,s.score),0);const avg=ds.length?Math.round(ds.reduce((a,s)=>a+s.score,0)/ds.length*10)/10:0;const statAccent=activeMode==="program"?CYAN:ORANGE;
        return ds.length>0?<div style={{display:"flex",gap:8,justifyContent:"center",margin:"12px 0 6px"}}>
          <div style={{background:CARD_BG,borderRadius:10,padding:"8px 16px",border:`1px solid ${statAccent}33`,textAlign:"center"}}>
            <div style={{fontFamily:FD,color:statAccent,fontSize:18}}>{pb}</div>
            <div style={{fontFamily:FB,color:activeMode==="program"?CYAN:MUTED,fontSize:8,letterSpacing:2,fontWeight:600}}>YOUR PB</div>
          </div>
          <div style={{background:CARD_BG,borderRadius:10,padding:"8px 16px",border:`1px solid ${BORDER_CLR}`,textAlign:"center"}}>
            <div style={{fontFamily:FD,color:activeMode==="program"?CYAN:VOLT,fontSize:18}}>{avg}</div>
            <div style={{fontFamily:FB,color:activeMode==="program"?CYAN:MUTED,fontSize:8,letterSpacing:2,fontWeight:600}}>AVG</div>
          </div>
          <div style={{background:CARD_BG,borderRadius:10,padding:"8px 16px",border:`1px solid ${BORDER_CLR}`,textAlign:"center"}}>
            <div style={{fontFamily:FD,color:activeMode==="program"?CYAN:LIGHT,fontSize:18}}>{ds.length}</div>
            <div style={{fontFamily:FB,color:activeMode==="program"?CYAN:MUTED,fontSize:8,letterSpacing:2,fontWeight:600}}>LOGGED</div>
          </div>
        </div>:null})()}
      {active.instructions&&<div style={{margin:"12px auto 0",maxWidth:300,background:CARD_BG,borderRadius:12,padding:"14px 16px",border:`1px solid ${BORDER_CLR}`,textAlign:"left"}}>
        <div style={{fontFamily:FD,color:CYAN,fontSize:10,letterSpacing:3,marginBottom:6,display:"flex",alignItems:"center",gap:6}}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
          COACH NOTES
        </div>
        <p style={{fontFamily:FB,color:CYAN,fontSize:12,lineHeight:1.6,margin:0,whiteSpace:"pre-wrap",textShadow:`0 0 18px ${CYAN}18`}}>{active.instructions}</p>
      </div>}
      {/* Motivational line */}
      <div style={{fontFamily:FB,color:activeMode==="program"?CYAN:"#555555",fontSize:12,fontStyle:"italic",letterSpacing:1,margin:"20px 0 8px",fontWeight:500,textShadow:activeMode==="program"?`0 0 16px ${CYAN}18`:"none"}}>{["Lock in.","No shortcuts.","This rep counts.","Earn it.","Be honest with yourself.","Own the work.","Details matter.","Trust the process.","Stay disciplined.","Championship habits."][Math.floor((active.id*7+new Date().getDate())%10)]}</div>
      {hasDrillMax(active)&&<div style={{fontFamily:FD,color:activeMode==="program"?CYAN:T.SUB,fontSize:13,letterSpacing:3,marginBottom:28}}>MAX: {active.max}</div>}
      {/* Score input with reactive color */}
      {(()=>{const v=parseInt(input)||0;const pct=hasDrillMax(active)&&active.max>0?v/active.max:0;const glowColor=hasDrillMax(active)?(pct>=.9?VOLT:pct>=.6?ORANGE:pct>.01?"#FF4545":VOLT):VOLT;const borderColor=v>0?glowColor:VOLT;
        return <div style={{display:"flex",alignItems:"baseline",justifyContent:"center",gap:8,marginBottom:40}}>
        <input autoFocus type="number" min="0" max={hasDrillMax(active)?active.max:undefined} value={input} onChange={e=>{setInput(e.target.value);playTick()}} onKeyDown={e=>e.key==="Enter"&&handleLog()} placeholder="0" style={{width:120,padding:"24px 8px",background:BG,border:`2px solid ${borderColor}`,borderRadius:20,color:borderColor,fontFamily:FD,fontSize:64,textAlign:"center",outline:"none",letterSpacing:2,boxShadow:v>0?`0 0 30px ${glowColor}20,0 0 60px ${glowColor}08`:`0 0 20px ${VOLT}15`,transition:"border-color .3s,color .3s,box-shadow .3s"}}/>
        {hasDrillMax(active)&&<div style={{fontFamily:FD,color:T.SUB,fontSize:32}}>/{active.max}</div>}
      </div>})()}
      {/* Score quality indicator */}
      {(()=>{const v=parseInt(input)||0;if(v<=0||!hasDrillMax(active))return null;const pct=Math.round(v/active.max*100);const label=pct>=90?"ELITE":pct>=75?"STRONG":pct>=50?"SOLID":"KEEP PUSHING";const c=pct>=90?VOLT:pct>=75?VOLT:pct>=50?ORANGE:"#FF4545";
        return <div className="fade-up" style={{fontFamily:FB,color:c,fontSize:10,fontWeight:700,letterSpacing:3,marginBottom:16,marginTop:-20,transition:"color .3s"}}>{pct}% — {label}</div>})()}
      <button className="btn-v cta-primary" onClick={handleLog} style={{maxWidth:300,margin:"0 auto"}}>LOG SCORE &#8594;</button>
    </>}
  </div>}

  {/* ═════════════ PROGRAM (Coach-Verified) ═════════════ */}
  {tab==="program"&&<div className={slideClass} key="program"><SectionHero icon={<EventIcon type="star" size={28} color={VOLT}/>} title="PROGRAM EVENTS" subtitle="Official workouts and attendance" accent={VOLT} deco={<EventIcon type="run" size={16} color={VOLT}/>} isCoach={u.isCoach}/><EventsPanel events={events} rsvps={rsvps} user={u} toggleRsvp={toggleRsvp} scores={scores} drills={drills}/></div>}



  {/* ═════════════ PROGRAM LOG ═════════════ */}
  {tab==="duels"&&!active&&<div className="fade-up">
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h10"/></svg>
      <div style={{fontFamily:FD,color:CYAN,fontSize:22,letterSpacing:3}}>PROGRAM LOG</div>
    </div>
    <div style={{fontFamily:FB,color:CYAN,fontSize:12,marginBottom:24,fontWeight:500,textShadow:`0 0 18px ${CYAN}18`}}>Log your coach-assigned program drills and keep the team leaderboard moving.</div>

    <div style={{fontFamily:FB,color:CYAN,fontSize:10,letterSpacing:3,fontWeight:700,marginBottom:8,textShadow:`0 0 16px ${CYAN}18`}}>PROGRAM DRILLS · {todayProgramScores.length}/{programDrills.length} DONE</div>
    <div style={{width:"100%",height:4,background:"#242424",borderRadius:2,overflow:"hidden",marginBottom:12}}><div style={{width:`${programDrills.length>0?Math.min(100,Math.round(todayProgramScores.length/programDrills.length*100)):0}%`,height:"100%",background:CYAN,borderRadius:2,transition:"width .25s ease"}}/></div>
    {programDrills.map(d=>{const done=todayProgramScores.find(s=>s.drillId===d.id);
      return <button key={d.id} className="ch" onClick={()=>!done&&setActive(d)} style={{width:"100%",display:"flex",alignItems:"center",gap:14,background:CARD_BG,border:`1px solid ${done?CYAN+"20":BORDER_CLR}`,borderRadius:16,padding:"16px",marginBottom:12,cursor:done?"default":"pointer",textAlign:"left",opacity:done?.6:1}}>
        <div style={{width:48,height:48,display:"flex",alignItems:"center",justifyContent:"center",background:"#1E1E1E",borderRadius:12,flexShrink:0}}><DrillIcon type={d.icon} size={22} color={done?CYAN+"99":CYAN}/></div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontFamily:FB,color:CYAN,fontSize:14,fontWeight:700,letterSpacing:1,textShadow:`0 0 16px ${CYAN}16`}}>{d.name}</div>
          <div style={{color:CYAN,fontSize:11,marginTop:2,fontWeight:500,textShadow:`0 0 14px ${CYAN}12`}}>{d.desc}</div>
        </div>
        {done?<div style={{width:36,height:36,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><svg width="16" height="16" viewBox="0 0 20 20"><path d="M5 10l4 4 6-7" stroke={CYAN} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
         :<div style={{width:36,height:36,borderRadius:10,background:"rgba(0, 229, 255, 0.10)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .1s ease"}}><svg width="16" height="16" viewBox="0 0 16 16"><path d="M6 3l5 5-5 5" stroke={CYAN} strokeWidth="2" fill="none" strokeLinecap="round"/></svg></div>}
      </button>})}
  </div>}

  {/* ═════════════ CHALLENGES ═════════════ */}
  {u.isCoach&&tab==="players"&&<div className={slideClass} key="players"><PlayersScreen/></div>}

  {/* ═════════════ STRENGTH & CONDITIONING ═════════════ */}
  {tab==="sc"&&<div className={slideClass} key="sc"><SectionHero icon={<LiftIcon size={28} color="#A0A0A0"/>} title="STRENGTH & CONDITIONING" subtitle="Log sessions and build consistency" accent="#A0A0A0" deco={<LiftIcon size={16} color="#A0A0A0"/>} isCoach={u.isCoach}/><SCPanel sessions={scSessions} scRsvps={scRsvps} user={u} toggleScRsvp={toggleScRsvp} scLogs={scLogs} addScLog={addScLog} players={players}/></div>}

  {/* ═════════════ PROFILE — Offseason Resume ═════════════ */}
  {tab==="profile"&&<div className={slideClass} key="profile"><ProfilePage u={u} scores={scores} shotLogs={shotLogs} drills={drills} programDrills={programDrills} rsvps={rsvps} scRsvps={scRsvps} challenges={challenges} streak={streak} earnedBadges={earnedBadges} T={T} deleteAccount={deleteAccount} onToggleLeaderboardVisibility={toggleLeaderboardVisibility}/></div>}
</div>

{!isDesktop&&<NavBar items={playerNavItems} active={tab} onChange={switchTab}/>} 

  </div></div></main>
{isDesktop&&<aside className="insights-panel"><div className="panel-title">PLAYER INSIGHTS</div><div className="placeholder">Add widgets here later (goals, reminders, coach notes, and progress snapshots).</div></aside>}
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
<div style={{fontFamily:FD,fontSize:72,color:VOLT,lineHeight:.9,letterSpacing:2}}>{data.score}{data.max?<span style={{color:MUTED,fontSize:32}}>/{data.max}</span>:null}</div>
{/* Personal Best badge */}
{data.isPB&&<div style={{display:"inline-flex",alignItems:"center",gap:6,background:ORANGE+"15",borderRadius:10,padding:"6px 16px",border:`1px solid ${ORANGE}33`,marginTop:12}}>
<span style={{fontFamily:FD,color:ORANGE,fontSize:16,letterSpacing:3}}>★ NEW PERSONAL BEST</span>
</div>}
{/* Accuracy ring */}
{typeof data.pct==="number"&&<div style={{margin:"16px auto 12px",width:80,position:"relative"}}>
<svg width="80" height="40" viewBox="0 0 80 40">
<path d="M5 35 A 35 35 0 0 1 75 35" fill="none" stroke="#242424" strokeWidth="6" strokeLinecap="round"/>
<path d="M5 35 A 35 35 0 0 1 75 35" fill="none" stroke={pcol} strokeWidth="6" strokeLinecap="round" strokeDasharray={`${pct*1.1} 110`}/>
</svg>
<div style={{position:"absolute",bottom:0,left:"50%",transform:"translateX(-50%)",fontFamily:FD,color:pcol,fontSize:18}}>{pct}%</div>
</div>}
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
const v=parseInt(respInput);if(isNaN(v)||v<0||(hasDrillMax(ch)&&v>ch.max))return;
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
          <div style={{fontFamily:FD,color:ORANGE,fontSize:24}}>{ch.score}{hasDrillMax(ch)&&<span style={{color:MUTED,fontSize:14}}>/{ch.max}</span>}</div>
          <div style={{fontFamily:FB,color:MUTED,fontSize:8,letterSpacing:1}}>TO BEAT</div>
        </div>
      </div>
      {respSaved===ch.id?<div style={{textAlign:"center",padding:8}}><div style={{fontFamily:FD,color:VOLT,fontSize:18,letterSpacing:3}}>RESPONSE LOGGED!</div></div>
      :isResp?<div className="fade-up">
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
          <div style={{flex:1}}><div style={{fontFamily:FB,color:"#A0A0A0",fontSize:10,letterSpacing:2,fontWeight:700,marginBottom:6}}>YOUR SCORE</div>
            <input autoFocus type="number" min="0" max={hasDrillMax(ch)?ch.max:undefined} value={respInput} onChange={e=>setRespInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleRespond(ch)} placeholder="0" style={{width:"100%",padding:"14px 8px",background:BG,border:`2px solid ${ORANGE}`,borderRadius:14,color:ORANGE,fontFamily:FD,fontSize:36,textAlign:"center",outline:"none"}}/>
          </div>
          {hasDrillMax(ch)&&<div style={{fontFamily:FD,color:T.SUB,fontSize:24,paddingTop:20}}>/{ch.max}</div>}
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

  return <div key={ch.id+"-"+ch.ts} style={{display:"flex",alignItems:"center",gap:12,background:CARD_BG,borderRadius:14,padding:"14px 16px",marginBottom:6,border:`1px solid ${isPending?ORANGE+"22":BORDER_CLR}`}}>
    <div style={{width:40,height:40,borderRadius:12,background:resultColor+"12",border:`1px solid ${resultColor}33`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
      {isPending?<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
      :won?<svg width="16" height="16" viewBox="0 0 20 20"><path d="M5 10l4 4 6-7" stroke={VOLT} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
      :tied?<span style={{fontFamily:FD,color:"#C8FF00",fontSize:14}}>=</span>
      :<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF4545" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>}
    </div>
    <div style={{flex:1,minWidth:0}}>
      <div style={{fontFamily:FD,color:LIGHT,fontSize:13,letterSpacing:1}}>{isMine?"YOU":"YOU"} vs {oppName.toUpperCase()}</div>
      <div style={{fontFamily:FB,color:T.SUB,fontSize:10,marginTop:1}}>{ch.drillName} &#183; {isPending?<span style={{color:ORANGE}}>Waiting for response</span>:<span style={{color:resultColor,fontWeight:700}}>{resultText}</span>}</div>
    </div>
    <div style={{textAlign:"right",flexShrink:0}}>
      {isPending?<div style={{fontFamily:FD,color:ORANGE,fontSize:18}}>{ch.score}{hasDrillMax(ch)&&<span style={{color:MUTED,fontSize:11}}>/{ch.max}</span>}</div>
      :<><div style={{fontFamily:FD,color:won?VOLT:"#FF4545",fontSize:16}}>{myScore||"-"}<span style={{color:MUTED,fontSize:10}}> v </span><span style={{color:won?"#FF4545":VOLT}}>{oppScore}</span></div>
        {hasDrillMax(ch)&&<div style={{fontFamily:FB,color:MUTED,fontSize:8}}>/{ch.max}</div>}</>}
    </div>
  </div>;
})}

  </div>;
}

// ═══════════════════════════════════════
// STRENGTH & CONDITIONING PANEL
// ═══════════════════════════════════════
function SCPanel({sessions,scRsvps,user,toggleScRsvp,scLogs,addScLog,players}){
const[showBoard,setShowBoard]=useState(false),[expanded,setExpanded]=useState(null);
const[newLog,setNewLog]=useState({date:todayStr(),time:"",place:"School",sport:""}),[logErr,setLogErr]=useState(""),[logSaved,setLogSaved]=useState(false);
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

const board=useMemo(()=>{const m={};scRsvps.forEach(r=>{if(!isLeaderboardEligible(players,r.email))return;if(!m[r.email])m[r.email]={email:r.email,name:r.name,count:0};m[r.email].count++});return Object.values(m).sort((a,b)=>b.count-a.count)},[scRsvps,players]);

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
  setNewLog({date:todayStr(),time:"",place:"School",sport:""});
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
    <FF l="TIME" v={newLog.time} set={v=>setNewLog({...newLog,time:v})} ph="e.g. 7:00 AM"/>
    <div style={{gridColumn:"1 / -1"}}><FF l="PLACE" v={newLog.place} set={v=>setNewLog({...newLog,place:v})} opts={["School","Private Trainer","Gym Membership","At Home"]}/></div>
    <div style={{gridColumn:"1 / -1"}}><FF l="SPORT" v={newLog.sport} set={v=>setNewLog({...newLog,sport:v})} ph="Basketball"/></div>
  </div>
  {logErr&&<div style={{fontFamily:FB,color:"#FF4545",fontSize:11,marginTop:8}}>{logErr}</div>}
  {logSaved&&<div style={{fontFamily:FB,color:SC_COLOR,fontSize:11,marginTop:8}}>Session logged.</div>}
  <button className="btn-v cta-primary" onClick={handleAddScLog} style={{marginTop:10}}>ADD SESSION</button>
</div></div>

<div style={{marginBottom:16,background:"#141414",border:"1px solid #242424",borderRadius:16,minHeight:100,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",padding:"16px"}}>
  <div style={{fontFamily:FD,color:"#C8FF00",fontSize:48,fontWeight:900,lineHeight:1}}>{myScLogs.length}</div>
  <div style={{fontFamily:FB,color:"#A0A0A0",fontSize:11,letterSpacing:"0.08em",fontWeight:700,marginTop:8,textTransform:"uppercase"}}>TOTAL S&C SESSIONS LOGGED</div>
</div>

{/* Upcoming sessions */}
<SH isCoach={typeof u!=="undefined"&&u?.isCoach} t="UPCOMING SESSIONS" s={`${upcoming.length} SCHEDULED`}/>
{upcoming.length===0&&<Empty t="No upcoming sessions" action="Your coach will add S&C sessions here. Check back soon!" icon={<LiftIcon size={40} color="#555555"/>}/>}
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
      <button className="btn-v cta-primary" onClick={()=>toggleScRsvp(s.id)} style={{}}>
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


function StatTile({value,label,color,style}){
return <div style={{background:CARD_BG,border:`1px solid ${BORDER_CLR}`,borderRadius:14,padding:"12px 10px",minHeight:98,display:"flex",flexDirection:"column",justifyContent:"space-between",boxShadow:"inset 0 1px 0 rgba(255,255,255,0.02)",...style}}><div style={{fontFamily:FD,color:color||LIGHT,fontSize:24,lineHeight:1.05,wordBreak:"break-word"}}>{value}</div><div style={{fontFamily:FB,color:TOKENS.TEXT_SECONDARY,fontSize:10,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase"}}>{label}</div></div>
}

function ModeCard({title,subtitle,icon,stats,accent="home",variant="active",infoLayout="equal",isActive,onClick,actionLabel="Open",titleColor=LIGHT,subtitleColor}){
const a=MODE_CARD_ACCENTS[accent]||MODE_CARD_ACCENTS.home;
const v=MODE_CARD_VARIANTS[variant]||MODE_CARD_VARIANTS.active;
const infoLayoutConfig=MODE_CARD_INFO_LAYOUTS[infoLayout]||MODE_CARD_INFO_LAYOUTS.equal;
const baseBorder=isActive?`1.5px solid ${a.glow}`:`1.5px solid ${MODE_CARD_TOKENS.BASE_BORDER}`;
const baseShadow=isActive?`0 14px 32px rgba(0,0,0,.45), 0 0 0 1px ${a.glow} inset`:MODE_CARD_TOKENS.BASE_SHADOW;
const chipBackground=v.chipBackground==="accent"?a.chipBackground:v.chipBackground;
const chipBorder=v.chipBorder==="accent"?a.chipBorder:v.chipBorder;
const chipColor=v.chipColor==="accent"?a.chipColor:v.chipColor;
const ctaBackground=v.ctaBackground==="accent"?a.ctaBackground:v.ctaBackground;
const ctaShadow=v.ctaShadow==="accent"?a.ctaShadow:v.ctaShadow;
const themedIcon=isValidElement(icon)?cloneElement(icon,{stroke:a.iconStroke,color:a.iconStroke}):icon;
return <button type="button" onClick={onClick} className="mode-card" style={{"--glow":a.glow,width:"100%",background:`radial-gradient(circle at 12% 10%, ${a.tint} 0%, transparent 55%), ${MODE_CARD_TOKENS.BASE_BG}`,border:baseBorder,borderRadius:24,padding:22,cursor:"pointer",textAlign:"left",position:"relative",overflow:"hidden",minHeight:272,display:"flex",flexDirection:"column",justifyContent:"space-between",boxShadow:baseShadow,transition:"transform .12s ease, border-color .2s ease, box-shadow .2s ease"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=a.glow;e.currentTarget.style.boxShadow=`0 16px 34px rgba(0,0,0,.48), 0 0 0 1px ${a.glow} inset, 0 0 24px ${a.glow}`}} onMouseLeave={e=>{e.currentTarget.style.border=baseBorder;e.currentTarget.style.boxShadow=baseShadow;e.currentTarget.style.transform="scale(1)"}} onMouseDown={e=>{e.currentTarget.style.transform="scale(0.99)";e.currentTarget.style.boxShadow=`0 0 0 2px ${a.glow}, 0 14px 28px rgba(0,0,0,.45)`}} onMouseUp={e=>{e.currentTarget.style.transform="scale(1)"}} onFocus={e=>{e.currentTarget.style.outline="none";e.currentTarget.style.boxShadow=`0 0 0 3px ${a.focusRing}, 0 14px 28px rgba(0,0,0,.45), 0 0 0 1px ${a.glow} inset`}} onBlur={e=>{e.currentTarget.style.boxShadow=baseShadow;e.currentTarget.style.transform="scale(1)"}}>
  {v.showTopAccent&&<div aria-hidden="true" style={{position:"absolute",top:0,left:0,right:0,height:4,background:`linear-gradient(90deg, ${a.topAccentStart}, ${a.topAccentEnd})`,opacity:.9}}/>}
  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,marginBottom:16}}>
    <div style={{display:"flex",alignItems:"center",gap:12,minWidth:0}}>
      <div style={{width:50,height:50,borderRadius:14,background:MODE_CARD_TOKENS.ICON_INNER,border:`${v.iconBorderWidth} solid ${a.glow}`,boxShadow:v.iconGlow.replaceAll("var(--glow)",a.glow),display:"flex",alignItems:"center",justifyContent:"center",color:a.iconStroke,flexShrink:0}}>{themedIcon}</div>
      <div style={{minWidth:0}}>
        <div style={{fontFamily:FD,color:titleColor,fontSize:22,letterSpacing:2.5,lineHeight:1,textTransform:"uppercase"}}>{title}</div>
        <div style={{fontFamily:FB,color:subtitleColor||chipColor,fontSize:11,fontWeight:600,marginTop:5,letterSpacing:"0.04em"}}>{subtitle}</div>
      </div>
    </div>
    <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
      {actionLabel&&<div style={{fontFamily:FB,color:chipColor,fontSize:10,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",padding:"7px 10px",borderRadius:999,border:chipBorder,background:chipBackground,whiteSpace:"nowrap"}}>{actionLabel}</div>}
      <div style={{width:38,height:38,borderRadius:10,background:ctaBackground,border:`1.5px solid ${a.glow}`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:ctaShadow.replaceAll("var(--glow)",a.glow)}}><svg width="16" height="16" viewBox="0 0 16 16"><path d="M6 3l5 5-5 5" stroke={a.iconStroke} strokeWidth="2.2" fill="none" strokeLinecap="round"/></svg></div>
    </div>
  </div>
  <div style={infoLayoutConfig.container}>{stats.map((s,index)=><StatTile key={s.label} value={s.value} label={s.label} color={s.color} style={infoLayoutConfig.getTileStyle(index,stats.length)}/>)}</div>
</button>
}

// ═══════════════════════════════════════
// DASHBOARD LEADERBOARD — The hero section
// ═══════════════════════════════════════
function DashboardLeaderboard({scores,drills,programDrills,user,scRsvps,rsvps,shotLogs,players}){
const[mode,setMode]=useState("home");
const[sub,setSub]=useState("total");
const medals=[VOLT,"#A0A0A0","#A0A0A0"];
const homeScores=useMemo(()=>scores.filter(s=>s.src==="home"||!s.src),[scores]);
const progScores=useMemo(()=>scores.filter(s=>s.src==="program"),[scores]);

const leaderboardEligible=useMemo(()=>new Set(players.filter(p=>p.role!=="coach"&&isLeaderboardEligible(players,p.email)).map(p=>p.email)),[players]);
const board=useMemo(()=>{
if(mode==="home"){
if(sub==="shots"){
const m={};shotLogs.forEach(s=>{if(!m[s.email])m[s.email]={email:s.email,name:s.name||s.email,total:0};m[s.email].total+=s.made});return Object.values(m).filter(entry=>leaderboardEligible.has(entry.email)).sort((a,b)=>b.total-a.total);
}
if(sub==="total"){
// Combine drill scores + shot logs
const m={};
homeScores.forEach(s=>{if(!m[s.email])m[s.email]={email:s.email,name:s.name||s.email,total:0};m[s.email].total+=s.score});
shotLogs.forEach(s=>{if(!m[s.email])m[s.email]={email:s.email,name:s.name||s.email,total:0};m[s.email].total+=s.made});
return Object.values(m).filter(entry=>leaderboardEligible.has(entry.email)).sort((a,b)=>b.total-a.total);
}
// Per-drill
const did=parseInt(sub);const m={};
homeScores.filter(s=>s.drillId===did).forEach(s=>{if(!m[s.email])m[s.email]={email:s.email,name:s.name||s.email,total:0};m[s.email].total+=s.score});
return Object.values(m).filter(entry=>leaderboardEligible.has(entry.email)).sort((a,b)=>b.total-a.total);
}
// Program
if(sub==="events"){
const m={};rsvps.forEach(r=>{if(!m[r.email])m[r.email]={email:r.email,name:r.name,total:0};m[r.email].total++});return Object.values(m).filter(entry=>leaderboardEligible.has(entry.email)).sort((a,b)=>b.total-a.total);
}
if(sub==="sc"){
const m={};scRsvps.forEach(r=>{if(!m[r.email])m[r.email]={email:r.email,name:r.name,total:0};m[r.email].total++});return Object.values(m).filter(entry=>leaderboardEligible.has(entry.email)).sort((a,b)=>b.total-a.total);
}
if(sub.startsWith("prog-")){const did=parseInt(sub.slice(5));const m={};progScores.filter(s=>s.drillId===did).forEach(s=>{if(!m[s.email])m[s.email]={email:s.email,name:s.name||s.email,total:0};m[s.email].total+=s.score});return Object.values(m).filter(entry=>leaderboardEligible.has(entry.email)).sort((a,b)=>b.total-a.total);}
const m={};progScores.forEach(s=>{if(!m[s.email])m[s.email]={email:s.email,name:s.name||s.email,total:0};m[s.email].total+=s.score});
return Object.values(m).filter(entry=>leaderboardEligible.has(entry.email)).sort((a,b)=>b.total-a.total);
},[homeScores,progScores,mode,sub,scores,scRsvps,rsvps,shotLogs,programDrills,leaderboardEligible]);

const isHome=mode==="home";
const accentColor=isHome?VOLT:CYAN;
const unit=sub==="shots"?"makes":sub==="events"?"events":sub==="sc"?"sessions":"makes";
const title=isHome?"AT HOME":"PROGRAM";
const modeStyles={
home:{accent:VOLT,bg:"rgba(200, 255, 0, 0.14)",glow:"0 0 18px rgba(200, 255, 0, 0.28)",label:"🏠"},
prog:{accent:CYAN,bg:"rgba(0, 229, 255, 0.14)",glow:"0 0 18px rgba(0, 229, 255, 0.28)",label:"📅"}
};

// Swap sub when switching modes
const switchMode=(m)=>{setMode(m);setSub(m==="home"?"total":"events")};

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
      [{k:"total",l:"ALL"},{k:"shots",l:"SHOTS"},...drills.map(d=>({k:String(d.id),l:d.name}))].map(t=>
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
{board.length===0&&<Empty t={`No ${unit} logged yet`} action="Log a drill score to get on the board!" onTap={null}/>}

{/* YOUR POSITION — sticky anchor */}
{(()=>{const myIdx=board.findIndex(p=>p.email===user.email);const myEntry=board[myIdx];
  if(myIdx<0)return null;
  return <div style={{background:"rgba(10, 12, 14, 0.94)",backgroundClip:"padding-box",borderRadius:14,padding:"12px 16px",marginBottom:14,border:`2px solid ${accentColor}44`,display:"flex",alignItems:"center",gap:12,position:"sticky",top:0,zIndex:5,backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)"}}>
    <div style={{width:4,height:28,borderRadius:2,background:accentColor,flexShrink:0}}/>
    <div style={{fontFamily:FD,color:accentColor,fontSize:24}}>#{myIdx+1}</div>
    <div style={{flex:1,minWidth:0}}>
      <div style={{fontFamily:FB,color:LIGHT,fontSize:12,fontWeight:700,letterSpacing:1}}>YOUR POSITION</div>
      <div style={{fontFamily:FB,color:T.SUB,fontSize:10,marginTop:1}}>{myEntry.total} {unit}</div>
    </div>
    {myIdx>0&&<div style={{fontFamily:FB,color:T.SUB,fontSize:9,fontWeight:600,letterSpacing:1}}>{board[myIdx-1].total-myEntry.total} to #{myIdx}</div>}
  </div>})()}

{board.map((p,i)=>{
  const isMe=p.email===user.email;
  const isLeader=i===0&&board.length>1;
  const isTop3=i<3;
  const leaderTotal=board[0]?.total||1;
  const pct=Math.round((p.total/leaderTotal)*100);
  const rowBg=i%2===0?CARD_BG:T.SURFACE;

  if(isLeader) return <div key={p.email} className="podium-glow" style={{"--pod-c":accentColor,display:"flex",alignItems:"center",gap:14,background:"rgba(10, 12, 14, 0.94)",backgroundClip:"padding-box",borderRadius:16,padding:"20px 18px",marginBottom:12,border:`2px solid ${accentColor}33`,position:"relative",overflow:"hidden"}}>
    <div style={{position:"absolute",top:0,left:0,width:4,height:"100%",background:accentColor,borderRadius:"4px 0 0 4px"}}/>
    <div style={{width:32,height:32,borderRadius:9,background:`${accentColor}18`,border:`2px solid ${accentColor}`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:FD,fontSize:14,color:accentColor,flexShrink:0}}>👑</div>
    <div className="playersAvatarRing"><Av n={p.name} sz={40} email={p.email}/></div>
    <div style={{flex:1,minWidth:0}}>
      <div style={{fontFamily:FB,color:LIGHT,fontSize:15,fontWeight:700,letterSpacing:1}}>{p.name.toUpperCase()}{isMe&&<span style={{fontFamily:FB,fontSize:9,fontWeight:700,padding:"2px 6px",borderRadius:4,background:accentColor,color:BG,marginLeft:6,letterSpacing:1}}>YOU</span>}</div>
      <div style={{fontFamily:FB,color:accentColor,fontSize:9,letterSpacing:2,fontWeight:700,marginTop:2}}>#1</div>
    </div>
    <div style={{textAlign:"right",flexShrink:0}}>
      <div style={{fontFamily:FD,fontSize:28,color:accentColor}}>{p.total}</div>
      <div style={{fontFamily:FB,color:MUTED,fontSize:8,letterSpacing:1,fontWeight:600}}>{unit.toUpperCase()}</div>
    </div>
  </div>;

  return <div key={p.email} style={{display:"flex",alignItems:"center",gap:12,background:isMe?"rgba(10, 12, 14, 0.94)":rowBg,backgroundClip:"padding-box",borderRadius:12,padding:"14px 14px",marginBottom:isTop3?10:8,border:isMe?`2px solid ${accentColor}44`:`1px solid ${BORDER_CLR}`,position:"relative",overflow:"hidden"}}>
    {isTop3&&<div style={{position:"absolute",top:0,left:0,width:3,height:"100%",background:accentColor+"66",borderRadius:"3px 0 0 3px"}}/>}
    {isMe&&<div style={{position:"absolute",top:0,left:0,width:3,height:"100%",background:accentColor,borderRadius:"3px 0 0 3px"}}/>}
    <RB r={i+1} m={medals}/>
    <Av n={p.name} sz={32} email={p.email}/>
    <div style={{flex:1,minWidth:0}}>
      <div style={{fontFamily:FB,color:isMe?LIGHT:LIGHT,fontSize:13,fontWeight:isMe?700:600,letterSpacing:1}}>{p.name.toUpperCase()}{isMe&&<span style={{fontFamily:FB,fontSize:8,fontWeight:700,padding:"1px 5px",borderRadius:4,background:accentColor,color:BG,marginLeft:6,letterSpacing:1,verticalAlign:"middle"}}>YOU</span>}</div>
      <div style={{marginTop:5,height:3,borderRadius:2,background:T.TRACK,overflow:"hidden"}}>
        <div style={{width:`${pct}%`,height:"100%",background:isMe?accentColor:isTop3?accentColor:accentColor+"66",borderRadius:2,transition:"width .4s ease"}}/>
      </div>
    </div>

    <DividerDot/>

    {/* ── DAILY DRILLS (PRIMARY ACTION) ── */}
    <div style={{fontFamily:FB,color:VOLT,fontSize:10,letterSpacing:3,fontWeight:700,marginBottom:10}}>DAILY DRILLS · {todayS.length}/{drills.length} DONE</div>
    {drills.map(d=>{const done=todayS.find(s=>s.drillId===d.id);const pct=done&&hasDrillMax(d)?Math.round(done.score/d.max*100):0;
      return <button key={d.id} className="ch" onClick={()=>!done&&setActive(d)} style={{width:"100%",display:"flex",alignItems:"center",gap:14,background:CARD_BG,border:`1px solid ${done?VOLT+"22":BORDER_CLR}`,borderRadius:16,padding:"16px 18px",marginBottom:10,cursor:done?"default":"pointer",textAlign:"left",opacity:done?.65:1}}>
        <div style={{width:46,height:46,display:"flex",alignItems:"center",justifyContent:"center",background:BG,borderRadius:12,border:`1px solid ${done?VOLT+"44":BORDER_CLR}`,flexShrink:0,position:"relative"}}><DrillIcon type={d.icon} size={22} color={done?VOLT+"88":VOLT}/>{done&&<div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",background:BG+"cc",borderRadius:12}}><svg width="16" height="16" viewBox="0 0 20 20"><path d="M5 10l4 4 6-7" stroke={VOLT} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg></div>}</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontFamily:FB,color:LIGHT,fontSize:14,fontWeight:700,letterSpacing:1}}>{d.name}</div>
          <div style={{color:T.MUT,fontSize:11,marginTop:2,fontWeight:500}}>{d.desc}</div>
        </div>
        {done?<div style={{textAlign:"right",flexShrink:0}}>
          <div style={{fontFamily:FD,color:VOLT,fontSize:18}}>{done.score}{hasDrillMax(d)&&<span style={{color:MUTED,fontSize:11}}>/{d.max}</span>}</div>
          {hasDrillMax(d)&&<div style={{width:40,height:3,background:T.TRACK,borderRadius:2,marginTop:4,overflow:"hidden"}}><div style={{width:`${pct}%`,height:"100%",background:pct>=80?VOLT:pct>=50?ORANGE:"#FF4545",borderRadius:2}}/></div>}
        </div>
        :<div style={{width:44,height:44,borderRadius:10,background:VOLT+"11",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><svg width="12" height="12" viewBox="0 0 16 16"><path d="M6 3l5 5-5 5" stroke={VOLT} strokeWidth="2" fill="none" strokeLinecap="round"/></svg></div>}
      </button>})}
    <div style={{textAlign:"right",flexShrink:0}}>
      <div style={{fontFamily:FD,color:isMe?accentColor:isTop3?accentColor:LIGHT,fontSize:20}}>{p.total}</div>
      <div style={{fontFamily:FB,color:MUTED,fontSize:8,letterSpacing:1,fontWeight:500}}>{unit.toUpperCase()}</div>
    </div>
  </div>;
})}
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
    <button className="btn-v cta-primary" onClick={handleLog} style={{}}>
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
    const weeks=[];const d=new Date();d.setDate(d.getDate()-d.getDay());// start of current week
    for(let w=0;w<12;w++){const week=[];for(let day=0;day<7;day++){const dd=new Date(d);dd.setDate(dd.getDate()-(11-w)*7+day);const ds=`${dd.getFullYear()}-${String(dd.getMonth()+1).padStart(2,"0")}-${String(dd.getDate()).padStart(2,"0")}`;const count=dayMap[ds]||0;const isFuture=ds>today;week.push({date:ds,count,isFuture,isToday:ds===today})}weeks.push(week)}
    const maxCount=Math.max(1,...Object.values(dayMap));
    const getColor=(c)=>{if(c===0)return BORDER_CLR;const intensity=Math.min(c/Math.max(maxCount*.6,20),1);const r=parseInt(VOLT.slice(1,3),16);const g=parseInt(VOLT.slice(3,5),16);const b=parseInt(VOLT.slice(5,7),16);return `rgba(${r},${g},${b},${.15+intensity*.85})`};
    return <div style={{overflowX:"auto",paddingBottom:8}}>
      <div style={{display:"flex",gap:3,minWidth:"fit-content"}}>
        <div style={{display:"flex",flexDirection:"column",gap:3,paddingTop:2,marginRight:2}}>{["S","M","T","W","T","F","S"].map((d,i)=>i%2===1?<div key={i} style={{fontFamily:FB,fontSize:7,color:MUTED,height:12,lineHeight:"12px",textAlign:"right"}}>{d}</div>:<div key={i} style={{height:12}}/>)}</div>
        {weeks.map((week,wi)=><div key={wi} style={{display:"flex",flexDirection:"column",gap:3}}>{week.map((day,di)=>
          <div key={di} title={`${day.date}: ${day.count} makes`} style={{width:12,height:12,borderRadius:2,background:day.isFuture?"transparent":getColor(day.count),border:day.isToday?`1.5px solid ${ORANGE}`:day.isFuture?"none":`1px solid ${day.count?getColor(day.count):BORDER_CLR}44`,opacity:day.isFuture?.2:1,transition:"background .3s"}}/>
        )}</div>)}
      </div>
      <div style={{display:"flex",alignItems:"center",gap:4,marginTop:8,justifyContent:"flex-end"}}>
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
// EVENTS PANEL (Player Program View)
// ═══════════════════════════════════════
function EventsPanel({events,rsvps,user,toggleRsvp,scores,drills}){
const[expanded,setExpanded]=useState(null),[showBoard,setShowBoard]=useState(false),[lbMode,setLbMode]=useState("attend"),[rankFx,setRankFx]=useState(false),[lastRank,setLastRank]=useState(null);
const sorted=useMemo(()=>[...events].sort((a,b)=>a.date.localeCompare(b.date)),[events]);
const upcoming=sorted.filter(e=>e.date>=todayStr()),past=sorted.filter(e=>e.date<todayStr());
const myRsvps=rsvps.filter(r=>r.email===user.email).length,myTier=getTier(myRsvps);useEffect(()=>{if(lastRank===null){setLastRank(myTier.name);return;}if(lastRank!==myTier.name){setRankFx(true);setLastRank(myTier.name);const t=setTimeout(()=>setRankFx(false),650);return ()=>clearTimeout(t);}},[myTier.name,lastRank]);

const attendBoard=useMemo(()=>{const m={};rsvps.forEach(r=>{if(!m[r.email])m[r.email]={email:r.email,name:r.name,count:0};m[r.email].count++});return Object.values(m).sort((a,b)=>b.count-a.count)},[rsvps]);
const medals=[VOLT,"#A0A0A0","#A0A0A0"];

return <div className="fade-up">
{/* Events banner — structured, timeline-oriented */}
<div style={{background:`linear-gradient(135deg,${VOLT}04,${CARD_BG})`,borderRadius:18,padding:"20px 22px",marginBottom:16,border:`1px solid ${BORDER_CLR}`,position:"relative",overflow:"hidden"}}>

<div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
<div style={{width:42,height:42,borderRadius:12,background:`${VOLT}08`,border:`1px solid ${VOLT}15`,display:"flex",alignItems:"center",justifyContent:"center"}}>
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={VOLT} strokeWidth="2"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
</div>
<div>
<div style={{fontFamily:FD,color:LIGHT,fontSize:16,letterSpacing:3}}>PROGRAM EVENTS</div>
<div style={{fontFamily:FB,color:MUTED,fontSize:11,marginTop:2}}>Official workouts & verified attendance</div>
</div>
</div>
{/* Timeline strip — next 3 events as dots */}
{upcoming.length>0&&<div style={{display:"flex",alignItems:"center",gap:0,paddingLeft:4}}>
<div style={{flex:1,display:"flex",alignItems:"center"}}>
{upcoming.slice(0,3).map((ev,i)=>{
const going=rsvps.some(r=>r.eventId===ev.id&&r.email===user.email);
return <div key={ev.id} style={{display:"flex",alignItems:"center",flex:1}}>
<div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
<div style={{width:10,height:10,borderRadius:"50%",background:going?VOLT:BORDER_CLR,border:going?`2px solid ${VOLT}`:`2px solid ${MUTED}44`,boxShadow:going?`0 0 8px ${VOLT}44`:"none"}}/>
<div style={{fontFamily:FB,fontSize:8,fontWeight:700,letterSpacing:1,color:going?VOLT:MUTED,whiteSpace:"nowrap"}}>{ev.date.slice(5)}</div>
</div>
{i<Math.min(upcoming.length,3)-1&&<div style={{flex:1,height:1,background:`linear-gradient(90deg,${going?VOLT+"44":BORDER_CLR},${BORDER_CLR})`,margin:"0 6px",marginBottom:14}}/>}
</div>})}
</div>
{upcoming.length>3&&<div style={{fontFamily:FB,fontSize:9,color:MUTED,marginLeft:8,marginBottom:14}}>+{upcoming.length-3}</div>}
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
  {(()=>{const nx=[...TIERS].find(t=>t.min>myRsvps);if(!nx)return <div style={{fontFamily:FB,color:"#A0A0A0",fontSize:12,marginTop:8}}>MAX RANK ACHIEVED</div>;const p=Math.round(myRsvps/nx.min*100);return <div style={{marginTop:8}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontFamily:FB,color:"#A0A0A0",fontSize:12}}>{nx.min-myRsvps} more to <span style={{color:LIGHT,fontWeight:700}}>{nx.name}</span></span><span style={{fontFamily:FB,color:"#555555",fontSize:11}}>{p}%</span></div><div style={{height:4,background:"#242424",borderRadius:2,overflow:"hidden"}}><div style={{width:`${p}%`,height:"100%",background:"#C8FF00",borderRadius:2}}/></div><div style={{fontFamily:FB,color:"#555555",fontSize:10,letterSpacing:"0.10em",marginTop:6}}>NEXT RANK: {nx.name}</div></div>})()}
</div>

{/* Leaderboard toggle */}
<button onClick={()=>setShowBoard(!showBoard)} className="ch" style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",background:`linear-gradient(135deg,${CARD_BG},#141414)`,border:`1px solid ${BORDER_CLR}`,borderRadius:14,padding:"14px 18px",marginBottom:16,cursor:"pointer",textAlign:"left"}}>
  <div style={{display:"flex",alignItems:"center",gap:10}}><div style={{width:36,height:36,borderRadius:10,background:ORANGE+"15",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>&#128293;</div><div><div style={{fontFamily:FD,color:LIGHT,fontSize:14,letterSpacing:2}}>LEADERBOARD</div><div style={{fontFamily:FB,color:T.SUB,fontSize:10,marginTop:1}}>Attendance, scores & streaks</div></div></div>
  <svg width="14" height="14" viewBox="0 0 16 16" style={{transform:showBoard?"rotate(90deg)":"none",transition:"transform .2s"}}><path d="M6 3l5 5-5 5" stroke={VOLT} strokeWidth="2" fill="none" strokeLinecap="round"/></svg>
</button>

{showBoard&&<div className="fade-up" style={{marginBottom:20}}>
  <div style={{display:"flex",gap:4,marginBottom:14}}>{[{k:"attend",l:"ATTENDANCE"},{k:"overall",l:"DRILL SCORES"},{k:"streaks",l:"STREAKS"}].map(t=><button key={t.k} onClick={()=>setLbMode(t.k)} style={{flex:1,padding:"9px 4px",borderRadius:10,border:lbMode===t.k?"none":`1px solid ${BORDER_CLR}`,cursor:"pointer",fontFamily:FD,fontSize:12,letterSpacing:1,background:lbMode===t.k?CYAN:CARD_BG,color:lbMode===t.k?BG:MUTED}}>{t.l}</button>)}</div>
  {lbMode==="attend"&&<>{attendBoard.length===0&&<Empty t="No RSVPs yet"/>}{attendBoard.map((p,i)=>{const t=getTier(p.count);return <div key={p.email} style={{display:"flex",alignItems:"center",gap:12,background:CARD_BG,borderRadius:12,padding:"12px 14px",marginBottom:6,border:`1px solid ${p.email===user.email?VOLT+"33":BORDER_CLR}`}}><RB r={i+1} m={medals}/><Av n={p.name} sz={30} email={p.email}/><div style={{flex:1,display:"flex",alignItems:"center",gap:6}}><span style={{fontFamily:FD,color:LIGHT,fontSize:13,letterSpacing:1}}>{p.name.toUpperCase()}</span><span className="tb" style={{fontFamily:FB,fontSize:8,fontWeight:700,letterSpacing:1,padding:"1px 6px",borderRadius:3,color:t.color,background:`linear-gradient(90deg,${t.bg},${t.color}18,${t.bg})`}}>{t.name}</span></div><div style={{fontFamily:FD,color:t.color,fontSize:18}}>{p.count}</div></div>})}</>}
  {lbMode==="overall"&&<>{(()=>{const m={};scores.forEach(s=>{if(!m[s.email])m[s.email]={email:s.email,name:s.name||s.email,total:0};m[s.email].total+=s.score});const a=Object.values(m).sort((a,b)=>b.total-a.total);return a.length===0?<Empty t="No scores yet"/>:a.map((p,i)=><div key={p.email} style={{display:"flex",alignItems:"center",gap:12,background:CARD_BG,borderRadius:12,padding:"12px 14px",marginBottom:6,border:`1px solid ${p.email===user.email?VOLT+"33":BORDER_CLR}`}}><RB r={i+1} m={medals}/><Av n={p.name} sz={30} email={p.email}/><div style={{flex:1,fontFamily:FD,color:LIGHT,fontSize:13,letterSpacing:1}}>{p.name.toUpperCase()}{p.email===user.email?" (YOU)":""}</div><div style={{fontFamily:FD,color:VOLT,fontSize:18}}>{p.total}</div></div>)})()}</>}
  {lbMode==="streaks"&&<>{(()=>{const es=[...new Set(scores.map(s=>s.email))];const st=es.map(e=>({email:e,name:scores.find(s=>s.email===e)?.name||e,streak:calcStreak(scores.filter(s=>s.email===e))})).sort((a,b)=>b.streak-a.streak);return st.length===0?<Empty t="No streaks yet"/>:st.map((p,i)=><div key={p.email} style={{display:"flex",alignItems:"center",gap:12,background:CARD_BG,borderRadius:12,padding:"12px 14px",marginBottom:6,border:`1px solid ${p.email===user.email?VOLT+"33":BORDER_CLR}`}}><RB r={i+1} m={medals}/><Av n={p.name} sz={30} email={p.email}/><div style={{flex:1,fontFamily:FD,color:LIGHT,fontSize:13,letterSpacing:1}}>{p.name.toUpperCase()}</div><div style={{fontFamily:FD,color:ORANGE,fontSize:18}}>{p.streak} &#128293;</div></div>)})()}</>}
</div>}

{/* Upcoming */}
<SH isCoach={typeof u!=="undefined"&&u?.isCoach} t="UPCOMING EVENTS" s={`${upcoming.length} SCHEDULED`}/>
{upcoming.length===0&&<Empty t="NO EVENTS SCHEDULED" action="Your coach will post workouts and events here" cta="NOTIFY MY COACH" ctaVariant="secondary" icon={<EventIcon type="clinic" size={48} color="#555555"/>}/>}
{upcoming.map(ev=>{const evR=rsvps.filter(r=>r.eventId===ev.id);const going=evR.some(r=>r.email===user.email);const exp=expanded===ev.id;
  return <div key={ev.id} style={{marginBottom:12}}>
    <div className="ch" style={{width:"100%",background:`linear-gradient(135deg,${CARD_BG},#141414)`,border:`1px solid ${going?VOLT+"33":BORDER_CLR}`,borderRadius:exp?"16px 16px 0 0":16,padding:"18px 20px",textAlign:"left",position:"relative",overflow:"hidden"}}>
      {going&&<div style={{position:"absolute",top:0,left:0,width:4,height:"100%",background:VOLT,borderRadius:"4px 0 0 4px"}}/>}
      <div style={{display:"flex",alignItems:"flex-start",gap:14,cursor:"pointer"}} onClick={()=>setExpanded(exp?null:ev.id)}>
        <div style={{width:50,height:50,borderRadius:14,background:BG,border:`1px solid ${BORDER_CLR}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><EventIcon type={ev.type} size={24} color={going?CYAN:MUTED}/></div>
        <div style={{flex:1,minWidth:0}}><div style={{fontFamily:FD,color:LIGHT,fontSize:17,letterSpacing:2}}>{ev.title}</div><div style={{fontFamily:FB,color:MUTED,fontSize:11,marginTop:3}}><span style={{color:VOLT,fontWeight:700}}>{ev.date}</span> &#183; {ev.time}</div><div style={{fontFamily:FB,color:T.SUB,fontSize:10,marginTop:1}}>{ev.location}</div></div>
        <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:8,flexShrink:0}}>
          <div style={{textAlign:"right"}}><div style={{fontFamily:FD,color:evR.length>0?VOLT:MUTED,fontSize:20}}>{evR.length}</div><div style={{fontFamily:FB,color:MUTED,fontSize:9,letterSpacing:1}}>GOING</div></div>
        </div>
      </div>
      {/* Inline quick-RSVP pill */}
      <button onClick={(e)=>{e.stopPropagation();toggleRsvp(ev.id)}} style={{marginTop:12,padding:"8px 0",width:"100%",borderRadius:10,border:"none",background:VOLT,cursor:"pointer",fontFamily:FD,fontSize:12,letterSpacing:3,color:BG,display:"flex",alignItems:"center",justifyContent:"center",gap:6,transition:"all .2s"}}>
        {going?<><svg width="14" height="14" viewBox="0 0 20 20"><path d="M5 10l4 4 6-7" stroke={BG} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>I'M GOING</>:"RSVP →"}
      </button>
    </div>
    {exp&&<div className="fade-up" style={{background:SURFACE,borderRadius:"0 0 16px 16px",padding:"16px 20px",border:`1px solid ${BORDER_CLR}`,borderTop:"none"}}>
      <p style={{fontFamily:FB,color:MUTED,fontSize:13,lineHeight:1.6,marginBottom:14}}>{ev.desc}</p>
      <button className="btn-v cta-primary" onClick={()=>toggleRsvp(ev.id)} style={{marginBottom:14}}>
        {going?"&#10003; I'M GOING":"RSVP NOW &#8594;"}
      </button>
      {evR.length>0&&<div><div style={{fontFamily:FB,color:T.SUB,fontSize:10,letterSpacing:2,marginBottom:8,fontWeight:600}}>WHO'S GOING</div><div style={{display:"flex",flexWrap:"wrap",gap:6}}>
        {evR.map((r,i)=>{const tr=getTier(rsvps.filter(rr=>rr.email===r.email).length);return <div key={i} style={{display:"flex",alignItems:"center",gap:6,background:CARD_BG,borderRadius:8,padding:"6px 10px",border:`1px solid ${BORDER_CLR}`}}><Av n={r.name} sz={22} email={r.email}/><span style={{fontFamily:FB,color:LIGHT,fontSize:11,fontWeight:600}}>{r.name}</span>{tr.min>=2&&<span style={{fontFamily:FB,fontSize:7,fontWeight:700,letterSpacing:1,padding:"1px 4px",borderRadius:3,color:tr.color,background:tr.bg}}>{tr.name}</span>}</div>})}
      </div></div>}
    </div>}
  </div>})}

{past.length>0&&<><div style={{marginTop:8}}><SH isCoach={typeof u!=="undefined"&&u?.isCoach} t="PAST EVENTS" s={`${past.length} COMPLETED`}/></div>
  {past.map(ev=>{const evR=rsvps.filter(r=>r.eventId===ev.id);const was=evR.some(r=>r.email===user.email);return <div key={ev.id} style={{display:"flex",alignItems:"center",gap:12,background:CARD_BG,borderRadius:14,padding:"12px 16px",marginBottom:6,border:`1px solid ${BORDER_CLR}`,opacity:.5}}><EventIcon type={ev.type} size={20} color={MUTED}/><div style={{flex:1,minWidth:0}}><div style={{fontFamily:FD,color:MUTED,fontSize:13,letterSpacing:2}}>{ev.title}</div><div style={{fontFamily:FB,color:T.SUB,fontSize:10,marginTop:1}}>{ev.date}</div></div>{was&&<span style={{fontFamily:FB,fontSize:9,fontWeight:700,padding:"3px 7px",borderRadius:5,color:VOLT,background:VOLT+"15",letterSpacing:1}}>ATTENDED</span>}<span style={{fontFamily:FD,color:MUTED,fontSize:13}}>{evR.length}</span></div>})}</>}

  </div>;
}


// ═══════════════════════════════════════
// COACH SCREEN
// ═══════════════════════════════════════
function Coach({u,team,regenerateJoinCode,addRosterPlayer,removeRosterPlayer,playerProfiles,drills,programDrills,scores,players,updateDrill,addDrill,removeDrill,addProgramDrill,removeProgramDrill,events,rsvps,addEvent,removeEvent,removeRsvp,addRsvp,scSessions,scRsvps,scLogs=[],addScSession,removeScSession,shotLogs,logout,deleteAccount,openTeamBranding,coachTextSize="standard",demoSettingsBusy=false,onLoadDemoData,onClearDemoData,homeShotsLeaderboard,leaderboardScope,onLeaderboardScopeChange,refreshHomeShotsLeaderboard}){
const[tab,setTab]=useState("feed"),[editD,setEditD]=useState(null),[eName,setEName]=useState(""),[eDesc,setEDesc]=useState(""),[eInstr,setEInstr]=useState(""),[eMax,setEMax]=useState(""),[eIcon,setEIcon]=useState("ft"),[selP,setSelP]=useState(null),[showAdd,setShowAdd]=useState(false),[expEv,setExpEv]=useState(null),[ne,setNe]=useState({title:"",date:"",time:"",location:"",desc:"",type:"run"}),[addEmail,setAddEmail]=useState(""),[showAddSC,setShowAddSC]=useState(false),[nsc,setNsc]=useState({sport:"",date:"",time:"",sessionType:"School"});
const[showNewDrill,setShowNewDrill]=useState(false),[nd,setNd]=useState({name:"",desc:"",max:"",icon:"ft",instructions:""}),[programErr,setProgramErr]=useState(""),[newProgramDrill,setNewProgramDrill]=useState({name:"",desc:"",max:"",icon:"ft"});
const[eventFilter,setEventFilter]=useState("all");
const customProgramDrillCount=countCustomProgramDrills(programDrills);
const[nudged,setNudged]=useState([]);
const[confirmDelete,setConfirmDelete]=useState(null);const[codeErr,setCodeErr]=useState("");const[newProfile,setNewProfile]=useState({firstName:"",lastName:"",jerseyNumber:""});const[profileErr,setProfileErr]=useState("");
const ups=useMemo(()=>players.filter(p=>p.role!=="coach"&&p.teamId===u?.teamId).map(p=>({email:p.email,name:p.name||String(p.email||"").split("@")[0].replace(/[._-]/g," ").replace(/\b\w/g,c=>c.toUpperCase())})),[players,u?.teamId]);
const allKnown=useMemo(()=>{const m={};players.forEach(p=>m[p.email]=p.name);scores.forEach(s=>{if(!m[s.email])m[s.email]=s.name||s.email});return Object.entries(m).map(([email,name])=>({email,name}))},[players,scores]);
const today=todayStr(),todayS=scores.filter(s=>s.date===today);
const saveDrill=()=>{const m=parseInt(eMax);updateDrill(editD.id,{name:san(eName),desc:san(eDesc),instructions:san(eInstr),max:m>0?m:null,icon:eIcon});setEditD(null)};
const handleAddDrill=()=>{if(!nd.name)return;const m=parseInt(nd.max);addDrill({name:san(nd.name).toUpperCase(),desc:san(nd.desc),max:m>0?m:null,icon:nd.icon,instructions:san(nd.instructions)});setNd({name:"",desc:"",max:"",icon:"ft",instructions:""});setShowNewDrill(false)};
const handleAddProgramDrill=async()=>{if(!newProgramDrill.name)return;const m=parseInt(newProgramDrill.max);const r=await addProgramDrill({name:san(newProgramDrill.name).toUpperCase(),desc:san(newProgramDrill.desc),max:m>0?m:null,icon:newProgramDrill.icon,instructions:""});if(!r.ok){setProgramErr(r.err||"Could not add drill");return;}setProgramErr("");setNewProgramDrill({name:"",desc:"",max:"",icon:"ft"});};
const handleRemoveDrill=(id)=>{setConfirmDelete(id)};
const confirmDrillDelete=()=>{if(confirmDelete)removeDrill(confirmDelete);setConfirmDelete(null)};
const handleAddEvent=()=>{if(!ne.title||!ne.date)return;addEvent({...ne,title:san(ne.title),desc:san(ne.desc),location:san(ne.location)});setNe({title:"",date:"",time:"",location:"",desc:"",type:"run"});setShowAdd(false)};

const handleAddWalkin=(evId)=>{
const e=addEmail.trim().toLowerCase();if(!e)return;
const known=allKnown.find(p=>p.email===e);
const name=known?.name||e.split("@")[0].replace(/[._-]/g," ").replace(/\b\w/g,c=>c.toUpperCase());
addRsvp(evId,e,name);setAddEmail("")};
const handleAddSC=()=>{if(!nsc.sport||!nsc.date)return;addScSession({...nsc,sport:san(nsc.sport),sessionType:san(nsc.sessionType||"School")});setNsc({sport:"",date:"",time:"",sessionType:"School"});setShowAddSC(false)};
const totalPlayers=ups.length;
const activeTodayCount=new Set(todayS.map(s=>s.email)).size;
const sortedEvents=useMemo(()=>[...events].sort((a,b)=>a.date.localeCompare(b.date)),[events]);
const eventFilterPills=useMemo(()=>[
  {label:"All",value:"all"},
  {label:"Practice",value:"run"},
  {label:"Game",value:"game"},
  {label:"Camp",value:"clinic"},
  {label:"Meeting",value:"recovery"},
],[]);
const filteredEvents=useMemo(()=>eventFilter==="all"?sortedEvents:sortedEvents.filter(ev=>String(ev.type||"").toLowerCase()===eventFilter.toLowerCase()),[sortedEvents,eventFilter]);
const nextEvent=sortedEvents.find(e=>e.date>=today);
const nextEventDateFormatted=nextEvent?new Date(`${nextEvent.date}T00:00:00`).toLocaleDateString(undefined,{month:"short",day:"numeric"}):"None";
const rsvpsByEvent=useMemo(()=>{const buckets=new Map();for(const rsvp of rsvps){if(!buckets.has(rsvp.eventId))buckets.set(rsvp.eventId,[]);buckets.get(rsvp.eventId).push(rsvp);}return buckets;},[rsvps]);
const attendanceCountByEmail=useMemo(()=>{const counts=new Map();for(const rsvp of rsvps){counts.set(rsvp.email,(counts.get(rsvp.email)||0)+1);}return counts;},[rsvps]);
const availableWalkInByEvent=useMemo(()=>{const byEvent=new Map();for(const ev of sortedEvents){const attendees=new Set((rsvpsByEvent.get(ev.id)||[]).map(r=>r.email));byEvent.set(ev.id,allKnown.filter(p=>!attendees.has(p.email)));}return byEvent;},[allKnown,sortedEvents,rsvpsByEvent]);
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
  {k:"branding",l:"Brand",accentVar:"--accent",svg:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l8 4v6c0 4.5-3 7.7-8 8-5-.3-8-3.5-8-8V7l8-4z"/><path d="M9.5 12.5l1.8 1.8 3.2-3.2"/></svg>},
];
const handleNavChange=(k)=>{
  if(k==="branding"){
    openTeamBranding();
    return;
  }
  setTab(k);setEditD(null);setSelP(null);setShowAdd(false);setExpEv(null);setShowAddSC(false)
};
const [isDesktop,setIsDesktop]=useState(()=>typeof window!=="undefined"?window.innerWidth>=1024:false);
const [showMiniHeader,setShowMiniHeader]=useState(false);
const heroRef=useRef(null);
const isOverviewTab=tab==="feed";
const coachTabs=["feed","drills","events","sc","players"];
const isCoachTab=u.isCoach&&coachTabs.includes(tab);
const showFullCommandCenter=isCoachTab&&tab==="feed";
const handleManageEventsScroll=useCallback(()=>document.getElementById("coach-events-management")?.scrollIntoView({behavior:"smooth"}),[]);
const handleToggleAddEvent=useCallback(()=>setShowAdd(true),[]);
const coachTextScale=COACH_TEXT_SIZES.includes(coachTextSize)?coachTextSize:"standard";

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

return <div className={`app-shell ${isDesktop?"is-desktop":"is-mobile"}`} data-text-scale={coachTextScale}>
{isDesktop&&<aside className="sidebar-nav" aria-label="Coach navigation"><div className="nav-title">COACH DASHBOARD</div>{navItems.map(item=>{const active=tab===item.k;return <button key={item.k} className={`nav-item ${active?"is-active":""}`} onClick={()=>handleNavChange(item.k)}>{item.svg}<span>{item.l}</span></button>;})}</aside>}
<main className="shell-main"><div className="content-wrap"><div className={`team-brand ${u.isCoach?"coach-mode ":""}page`} data-accent={u.isCoach&&["feed","drills","events","sc","players"].includes(tab)?tab:"feed"} style={{minHeight:"100dvh",background:u.isCoach?"#0B0A09":BG,display:"flex",flexDirection:"column",fontFamily:FB,position:"relative"}}><BrandBackdrop/>
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
  wordmark={<BrandWordmark size={16} small/>}
  borderColor={BORDER_CLR}
  mutedColor={MUTED}
  onLogout={logout}
/>
<div style={{position:"relative",zIndex:1,padding:"max(20px,env(safe-area-inset-top)) 20px 0"}}>
{u?.isCoach&&<div style={{display:"flex",justifyContent:"flex-end",marginBottom:10}}><button onClick={openTeamBranding} style={{padding:"8px 12px",borderRadius:10,border:"1px solid var(--team-brand-badge-border)",background:"var(--team-brand-badge-bg)",color:"var(--team-brand-badge-text)",fontFamily:FB,fontSize:12,fontWeight:700,cursor:"pointer"}}>Team Branding Settings</button></div>}
<CoachHero
  heroRef={heroRef}
  userName={u.name}
  accentColor={ORANGE}
  borderColor={BORDER_CLR}
  mutedColor={MUTED}
  wordmark={<BrandWordmark size={isOverviewTab?20:18} small/>}
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
{u.isCoach&&<div style={{height:28,background:"linear-gradient(90deg, rgba(200, 255, 0, 0.08) 0%, transparent 100%)",borderBottom:"1px solid rgba(200, 255, 0, 0.12)",display:"flex",alignItems:"center",padding:"0 16px",gap:8}}><WhistleIcon size={12} color="#C8FF00"/><span style={{fontFamily:FB,fontSize:9,textTransform:"uppercase",letterSpacing:"var(--tracking-tight)",color:"rgba(200, 255, 0, 0.84)"}}>COACH VIEW — FULL ACCESS</span></div>}

<div style={{flex:1,padding:`${showMiniHeader?"88px":"16px"} 20px 110px`,overflowY:"auto",position:"relative",zIndex:showAdd?40:1}}>
  {/* FEED */}
  {tab==="feed"&&<div className="page pageShell page-feed fade-up" data-accent="feed" style={shellVars("feed")}><PageHeader title="FEED" subtitle="Daily team activity and momentum" accent="lime" icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></svg>} actionLabel="Coach Mode" />
    <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
      {HOME_SHOTS_LEADERBOARD_SCOPES.map((scopeOption) => {
        const isActive = leaderboardScope === scopeOption.key;
        return (
          <button
            key={scopeOption.key}
            type="button"
            onClick={() => onLeaderboardScopeChange(scopeOption.key)}
            style={{
              ...HOME_SHOTS_SCOPE_BUTTON_BASE_STYLE,
              border: isActive ? "1px solid var(--accent)" : "1px solid var(--stroke-1)",
              background: isActive ? "var(--accent-soft)" : "var(--surface-1)",
              color: isActive ? "var(--accent)" : "var(--text-2)",
              fontFamily: FB,
            }}
          >
            {scopeOption.label}
          </button>
        );
      })}
    </div>
    <HomeShotsLeaderboardCard
      title={`TOP 10 ${leaderboardScope==="coaches"?"COACH":"PLAYER"} HOME SHOTS`}
      status={homeShotsLeaderboard?.status||"idle"}
      rows={homeShotsLeaderboard?.rows||[]}
      error={homeShotsLeaderboard?.error||""}
      onRetry={refreshHomeShotsLeaderboard}
    />
    <div className="heroModule"><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}><div><div style={{fontFamily:FD,color:PAGE_ACCENTS.feed.accent,fontSize:12,letterSpacing:"var(--tracking-default)"}}>TODAY'S PULSE</div><div style={{fontFamily:FB,color:T.SUB,fontSize:10}}>Who's active, streaking, and needs attention</div></div><button className="pageHeaderPill pageHeaderPillBrand" onClick={()=>setTab("players")}>View Team</button></div>
    {/* Coach dashboard pulse */}
    <div className="accent-card" style={{background:`linear-gradient(155deg, color-mix(in srgb,var(--accent) 12%, transparent), ${CARD_BG} 72%)`,borderRadius:18,padding:"20px 20px",border:`1px solid color-mix(in srgb,var(--accent) 28%, transparent)`,marginBottom:20,position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:0,left:0,width:4,height:"100%",background:"var(--accent)",borderRadius:"4px 0 0 4px"}}/>
      
      <div style={{fontFamily:FD,color:"var(--accent)",fontSize:12,letterSpacing:"var(--tracking-default)",marginBottom:12}}>TODAY'S PULSE</div>
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
        return inactive.length>0?<div style={{fontFamily:FB,color:T.SUB,fontSize:10,fontWeight:600,letterSpacing:1}}>
          • {inactive.length} player{inactive.length>1?"s":""} haven't logged this week: {inactive.slice(0,3).map(p=>p.name.split(" ")[0]).join(", ")}{inactive.length>3?` +${inactive.length-3} more`:""}
        </div>:<div style={{fontFamily:FB,color:VOLT,fontSize:10,fontWeight:600,letterSpacing:1}}>✓ All players active this week</div>
      })()}
    </div>

    

    </div>
    <SH isCoach={typeof u!=="undefined"&&u?.isCoach} t="ACTIVITY FEED" s="ALL SOURCES" identity/><div className="accent-card" style={{background:SURFACE,border:`1px solid ${BORDER_CLR}`,borderRadius:16,padding:"6px 14px",marginTop:12}}>{scores.length===0&&<Empty t="No scores yet" action="Once your players start logging drills, their activity will appear here. Invite players to get momentum started." cta="Invite Players" onTap={()=>setTab("players")} icon={<svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></svg>}/>}{scores.slice(-20).reverse().map((s,i)=>{const drillList=(s.src==="program"?programDrills:drills);const dr=drillList.find(d=>d.id===s.drillId);const pct=dr&&hasDrillMax(dr)?Math.round(s.score/dr.max*100):null;const isHome=s.src==="home"||!s.src;return <div key={i} className="feedListItem" style={{display:"flex",alignItems:"center",gap:12,padding:"14px 10px",borderBottom:`1px solid ${BORDER_CLR}33`,borderRadius:12,background:i%2===0?"rgba(255,255,255,0.01)":"transparent"}}><Av n={s.name||s.email} sz={36} email={s.email}/><div style={{flex:1,minWidth:0}}><div style={{color:LIGHT,fontSize:13,fontWeight:700,display:"flex",alignItems:"center",gap:6}}>{s.name||s.email}<span style={{fontFamily:FB,fontSize:8,fontWeight:700,letterSpacing:1,padding:"1px 6px",borderRadius:999,color:isHome?"#0B0D10":LIGHT,background:isHome?"var(--accent)":LIGHT+"10"}}>{isHome?"HOME":"PROGRAM"}</span></div><div style={{color:T.MUT,fontSize:11,marginTop:2,fontWeight:500}}>{dr?.name} &#183; {s.date}</div></div><div style={{textAlign:"right",flexShrink:0}}><div style={{fontFamily:FD,color:VOLT,fontSize:18}}>{s.score}{hasDrillMax(dr)&&<span style={{color:MUTED,fontSize:12}}>/{dr?.max}</span>}</div>{typeof pct==="number"&&<div style={{fontSize:10,fontWeight:700,color:pct>=70?"var(--accent)":T.SUB}}>{pct}%</div>}</div></div>})}</div></div>}

  {/** DRILLS */}
  {tab==="drills"&&!editD&&<div className="page pageShell fade-up" data-accent="drills" id="coach-drills-management" style={shellVars("drills")}><PageHeader title="DRILLS" subtitle="Skill plans, assignments, and drill library" accent="cyan" icon={<DrillIcon type="ft" size={22} color={PAGE_ACCENTS.drills.accent}/>} actionLabel="Add" onAction={()=>setShowNewDrill(true)} /><div className="heroModule"><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}><div><div style={{fontFamily:FD,color:PAGE_ACCENTS.drills.accent,fontSize:12,letterSpacing:"var(--tracking-default)"}}>QUICK START DRILL</div><div style={{fontFamily:FB,color:T.SUB,fontSize:10}}>{drills.length} total drills ready to start</div></div><button className="pageHeaderPill pageHeaderPillBrand" onClick={()=>setShowNewDrill(true)}>Start</button></div><div className="drillsMetrics"><div className="heroStat drillsMetricTile"><div className="heroStatVal">{drills.length}</div><div className="heroStatLbl">ACTIVE</div></div><div className="heroStat drillsMetricTile"><div className="heroStatVal">{programDrills.length}</div><div className="heroStatLbl">PROGRAM</div></div></div><button className="pageHeaderPill" onClick={()=>document.getElementById("coach-drills-management")?.scrollIntoView({behavior:"smooth"})}>Manage Drills</button></div>
    <SH isCoach={typeof u!=="undefined"&&u?.isCoach} t="Drill Management" s={`${drills.length} active`} identity/>
    <div style={{fontFamily:FB,color:MUTED,fontSize:11,marginBottom:16,lineHeight:1.5}}>Customize the drills your players see in their "At Home" section. Each drill gets its own leaderboard.</div>
    <div className="accent-card" style={{background:SURFACE,border:`1px solid ${BORDER_CLR}`,borderRadius:14,padding:14,marginBottom:16}}>
      <div style={{fontFamily:FD,color:PAGE_ACCENTS.drills.accent,fontSize:12,letterSpacing:"var(--tracking-default)",marginBottom:6}}>PROGRAM SHOOTING DRILLS ({customProgramDrillCount}/7 CUSTOM)</div>
      <div style={{fontFamily:FB,color:T.SUB,fontSize:10,marginBottom:10}}>The 7 demo defaults are seeded automatically. Coaches can still add up to 7 custom program drills for player score tracking and per-drill team leaderboards.</div>
      <div style={{display:"grid",gridTemplateColumns:"1.2fr 1fr .7fr",gap:6,marginBottom:8}}>
        <input value={newProgramDrill.name} onChange={e=>{setNewProgramDrill({...newProgramDrill,name:e.target.value});setProgramErr("")}} placeholder="Drill name" style={{padding:9,background:BG,border:`1px solid ${BORDER_CLR}`,borderRadius:8,color:LIGHT}}/>
        <input value={newProgramDrill.desc} onChange={e=>setNewProgramDrill({...newProgramDrill,desc:e.target.value})} placeholder="Description" style={{padding:9,background:BG,border:`1px solid ${BORDER_CLR}`,borderRadius:8,color:LIGHT}}/>
        <input value={newProgramDrill.max} onChange={e=>setNewProgramDrill({...newProgramDrill,max:e.target.value})} type="number" placeholder="Max (optional)" style={{padding:9,background:BG,border:`1px solid ${BORDER_CLR}`,borderRadius:8,color:LIGHT}}/>
      </div>
      <div style={{display:"flex",gap:5,marginBottom:8}}>{ICONS.map(ic=><button key={`prog-${ic}`} onClick={()=>setNewProgramDrill({...newProgramDrill,icon:ic})} style={{width:34,height:34,borderRadius:8,border:`1px solid ${newProgramDrill.icon===ic?PAGE_ACCENTS.drills.accent+"55":BORDER_CLR}`,background:newProgramDrill.icon===ic?PAGE_ACCENTS.drills.glow:BG,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><DrillIcon type={ic} size={14} color={newProgramDrill.icon===ic?PAGE_ACCENTS.drills.accent:MUTED}/></button>)}</div>
      <button onClick={handleAddProgramDrill} disabled={customProgramDrillCount>=7} className="btn-v cta-primary" style={{opacity:customProgramDrillCount>=7?.6:1}}>+ ADD PROGRAM DRILL</button>
      {programErr&&<div style={{fontFamily:FB,color:"#FF4545",fontSize:10,marginTop:6}}>{programErr}</div>}
      <div style={{marginTop:12}}>{programDrills.length===0?<div style={{fontFamily:FB,color:T.SUB,fontSize:10}}>No program drills yet.</div>:programDrills.map(pd=>{const b=scores.filter(s=>s.src==="program"&&s.drillId===pd.id&&isLeaderboardEligible(players,s.email)).reduce((m,s)=>{m[s.email]=(m[s.email]||0)+s.score;return m;},{});const lead=Object.entries(b).sort((a,b)=>b[1]-a[1]).slice(0,3);return <div key={pd.id} style={{display:"flex",alignItems:"center",gap:10,background:CARD_BG,border:`1px solid ${BORDER_CLR}`,borderRadius:12,padding:"10px 12px",marginBottom:8}}><div style={{width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:8,background:BG,border:`1px solid ${BORDER_CLR}`,flexShrink:0}}><DrillIcon type={pd.icon} size={14}/></div><div style={{flex:1,minWidth:0}}><div style={{fontFamily:FB,color:LIGHT,fontSize:11,fontWeight:700}}>{pd.name}</div><div style={{fontFamily:FB,color:MUTED,fontSize:9,marginTop:1}}>Leaderboard: {lead.length===0?"No scores":lead.map(([email,total],i)=>`#${i+1} ${(players.find(p=>p.email===email)?.name||email.split("@")[0])} ${total}`).join(" · ")}</div></div>{pd.isDefaultDemo?<span style={{background:"transparent",border:`1px solid ${BORDER_CLR}`,borderRadius:8,color:MUTED,padding:"5px 8px",fontSize:9,fontWeight:700,letterSpacing:".04em"}}>DEMO DEFAULT</span>:<button onClick={()=>removeProgramDrill(pd.id)} style={{background:"transparent",border:"1px solid #FF454544",borderRadius:8,color:"#FF6A6A",padding:"5px 8px",fontSize:9,fontWeight:700,cursor:"pointer",letterSpacing:".04em"}}>DELETE</button>}</div>})}</div>
    </div>

    {drills.map(d=>{const dS=scores.filter(s=>s.drillId===d.id);const avg=dS.length?Math.round(dS.reduce((a,s)=>a+s.score,0)/dS.length*10)/10:0;return <div key={d.id} style={{background:CARD_BG,border:`1px solid ${BORDER_CLR}`,borderRadius:16,padding:"14px 14px 12px",marginBottom:10}}>
      <div style={{display:"flex",alignItems:"center",gap:14,textAlign:"left"}}>
        <div style={{width:44,height:44,display:"flex",alignItems:"center",justifyContent:"center",background:BG,borderRadius:12,border:`1px solid ${BORDER_CLR}`,flexShrink:0}}><DrillIcon type={d.icon} size={22}/></div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontFamily:FB,color:LIGHT,fontSize:14,fontWeight:700,letterSpacing:1}}>{d.name}</div>
          <div style={{color:T.SUB,fontSize:10,marginTop:2,fontWeight:500}}>{d.desc}</div>
          <div style={{color:MUTED,fontSize:9,marginTop:4,fontWeight:600}}>{hasDrillMax(d)?`MAX: ${d.max} · `:""}{dS.length} logged · Avg: {avg}</div>
        </div>
      </div>
      <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:12,paddingTop:10,borderTop:`1px solid ${BORDER_CLR}66`}}>
        <button className="pageHeaderPill" onClick={()=>{setEditD(d);setEName(d.name);setEDesc(d.desc);setEInstr(d.instructions||"");setEMax(hasDrillMax(d)?String(d.max):"");setEIcon(d.icon||"ft")}} style={{minHeight:34,padding:"0 12px",fontSize:10}}>Edit</button>
        {d.isDefaultDemo?<span style={{minHeight:34,background:"transparent",border:`1px solid ${BORDER_CLR}`,borderRadius:999,display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"0 12px",color:MUTED,fontFamily:FB,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:".06em"}}>DEMO DEFAULT</span>:<button onClick={()=>handleRemoveDrill(d.id)} style={{minHeight:34,background:"transparent",border:`1px solid #FF454544`,borderRadius:999,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"0 12px",color:"#FF6A6A",fontFamily:FB,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:".06em"}}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
          Delete
        </button>}
      </div>
    </div>})}

    {/* Add new drill */}
    {!showNewDrill?<button onClick={()=>setShowNewDrill(true)} className="btn-v cta-primary" style={{marginTop:8}}>+ ADD DRILL</button>
    :<div className="fade-up" style={{background:SURFACE,borderRadius:16,padding:"22px 18px",border:`1px solid ${BORDER_CLR}`,marginTop:8}}>
      <div style={{fontFamily:FD,color:VOLT,fontSize:16,letterSpacing:3,marginBottom:16}}>NEW DRILL</div>
      <FF l="DRILL NAME" v={nd.name} set={v=>setNd({...nd,name:v})} ph="e.g. STEP-BACK JUMPER"/>
      <FF l="SHORT DESCRIPTION" v={nd.desc} set={v=>setNd({...nd,desc:v})} ph="Brief description for players"/>
      <div style={{display:"flex",gap:8}}>
        <div style={{flex:1}}><FF l="MAX SCORE" v={nd.max} set={v=>setNd({...nd,max:v})} tp="number" ph="Optional"/></div>
        <div style={{flex:1}}>
          <label style={{fontFamily:FB,color:"#A0A0A0",fontSize:11,fontWeight:700,letterSpacing:3,display:"block",marginBottom:8}}>ICON</label>
          <div style={{display:"flex",gap:4,marginBottom:14}}>{ICONS.map(ic=><button key={ic} onClick={()=>setNd({...nd,icon:ic})} style={{width:44,height:44,borderRadius:10,background:nd.icon===ic?VOLT+"22":BG,border:`1px solid ${nd.icon===ic?VOLT:BORDER_CLR}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><DrillIcon type={ic} size={16} color={nd.icon===ic?VOLT:MUTED}/></button>)}</div>
        </div>
      </div>
      <FF l="DETAILED INSTRUCTIONS (OPTIONAL)" v={nd.instructions} set={v=>setNd({...nd,instructions:v})} ta ph="Coaching cues, setup details..."/>
      <div style={{display:"flex",gap:8}}>
        <button onClick={()=>{setShowNewDrill(false);setNd({name:"",desc:"",max:"",icon:"ft",instructions:""})}} style={{flex:1,padding:"13px",background:"transparent",color:MUTED,fontFamily:FD,fontSize:14,letterSpacing:2,border:`1px solid ${BORDER_CLR}`,borderRadius:10,cursor:"pointer"}}>CANCEL</button>
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
  {tab==="events"&&<div className="page pageShell fade-up accent-card" data-accent="events" id="coach-events-management" style={shellVars("events")}>
    {isDesktop?<>
      <div className="coachEventsHeaderCard"><PageHeader title="EVENTS" subtitle="Schedule team moments and track attendance" accent="amber" icon={<EventIcon type="event" size={22} color={PAGE_ACCENTS.events.accent}/>} /></div>
      {nextEvent&&<div className="heroModule"><div style={{fontFamily:FD,color:PAGE_ACCENTS.events.accent,fontSize:12,letterSpacing:"var(--tracking-default)"}}>NEXT EVENT</div><div style={{fontFamily:FB,color:LIGHT,fontSize:12,fontWeight:700,marginTop:4}}>{nextEvent.title}</div><div style={{fontFamily:FB,color:T.SUB,fontSize:10,marginTop:4}}>{nextEvent.date} {nextEvent.time}</div><div style={{fontFamily:FB,color:T.SUB,fontSize:10,marginTop:2}}>📍 {nextEvent.location}</div></div>}
      <div style={{background:SURFACE,border:`1px solid ${BORDER_CLR}`,borderRadius:16,padding:14,marginBottom:12}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:10,marginBottom:events.length===0?0:8}}>
          <div>
            <div style={{fontFamily:FD,color:LIGHT,fontSize:14,letterSpacing:"var(--tracking-tight)"}}>EVENT MANAGEMENT</div>
            <div style={{fontFamily:FB,color:T.SUB,fontSize:11,marginTop:4}}>{events.length} total scheduled</div>
          </div>
          {events.length>0&&<button onClick={handleToggleAddEvent} className="btn-v cta-primary" style={{margin:0,minHeight:42,height:42,padding:"0 14px",borderRadius:12,whiteSpace:"nowrap"}}>+ ADD EVENT</button>}
        </div>
        {events.length===0&&<div style={{marginTop:6,padding:"14px 12px",textAlign:"center",background:BG,border:`1px solid ${BORDER_CLR}`,borderRadius:14}}>
          <div style={{width:44,height:44,borderRadius:12,border:`1px solid ${VOLT}33`,background:`${VOLT}12`,display:"inline-flex",alignItems:"center",justifyContent:"center",marginBottom:8}}><EventIcon type="event" size={20} color={VOLT}/></div>
          <div style={{fontFamily:FB,color:LIGHT,fontSize:13,fontWeight:700}}>No events scheduled yet</div>
          <div style={{fontFamily:FB,color:T.SUB,fontSize:11,marginTop:6,lineHeight:1.45,maxWidth:360,marginLeft:"auto",marginRight:"auto"}}>Create your first event to organize practices, games, camps, or meetings.</div>
          <button onClick={handleToggleAddEvent} className="btn-v cta-primary" style={{margin:"12px 0 0",width:"100%",minHeight:46,height:46,borderRadius:12,fontSize:12}}>+ ADD EVENT</button>
        </div>}
      </div>
      {events.length>0&&<div style={{display:"flex",gap:8,overflowX:"auto",overflowY:"hidden",whiteSpace:"nowrap",flexWrap:"nowrap",maxWidth:"100%",paddingBottom:4,marginBottom:14}}>
        {eventFilterPills.map(pill=>{const active=eventFilter===pill.value;return <button key={pill.label} onClick={()=>setEventFilter(pill.value)} style={{flexShrink:0,padding:"8px 14px",borderRadius:999,border:`1px solid ${active?VOLT+"66":BORDER_CLR}`,background:active?VOLT:SURFACE,color:active?"#111827":(T.SUB||LIGHT),fontFamily:FB,fontSize:11,fontWeight:700,letterSpacing:"var(--tracking-tight)",textTransform:"uppercase",cursor:"pointer"}}>{pill.label}</button>})}
      </div>}
    </>:<>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,padding:"6px 2px 10px",borderBottom:`1px solid ${BORDER_CLR}`,marginBottom:12}}>
        <div style={{display:"flex",alignItems:"center",gap:6,minWidth:0}}><EventIcon type="event" size={14} color={VOLT}/><span style={{fontFamily:FD,fontSize:13,color:LIGHT,letterSpacing:1}}>EVENTS</span></div>
        <div style={{fontFamily:FB,fontSize:10,color:T.SUB,fontWeight:700,textTransform:"uppercase",letterSpacing:".08em",whiteSpace:"nowrap"}}>{events.length} total</div>
      </div>
      <button onClick={handleToggleAddEvent} className="btn-v cta-primary" style={{margin:"0 0 12px",width:"100%",minHeight:44,height:44,borderRadius:12,fontSize:12}}>+ ADD EVENT</button>
      {events.length===0?<div style={{display:"inline-block",maxWidth:"100%",background:SURFACE,border:`1px solid ${BORDER_CLR}`,borderRadius:14,padding:"14px 12px",marginBottom:12,textAlign:"center"}}>
        <div style={{width:40,height:40,borderRadius:11,border:`1px solid ${VOLT}33`,background:`${VOLT}12`,display:"inline-flex",alignItems:"center",justifyContent:"center",marginBottom:8}}><EventIcon type="event" size={18} color={VOLT}/></div>
        <div style={{fontFamily:FB,color:LIGHT,fontSize:13,fontWeight:700}}>No events scheduled</div>
        <div style={{fontFamily:FB,color:T.SUB,fontSize:11,marginTop:6,lineHeight:1.4}}>Create your first event to organize practices, games, camps, or meetings.</div>
      </div>:<div style={{display:"grid",gap:8,marginBottom:10}}>
        {(() => {
          const parseTime=(time="")=>{const m=String(time).trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i);if(!m)return Number.MAX_SAFE_INTEGER;let hour=Number(m[1]);const minute=Number(m[2]||"0");const meridiem=(m[3]||"").toUpperCase();if(meridiem==="PM"&&hour<12)hour+=12;if(meridiem==="AM"&&hour===12)hour=0;return hour*60+minute;};
          const grouped=[...events].sort((a,b)=>a.date.localeCompare(b.date)||parseTime(a.time)-parseTime(b.time)).reduce((acc,ev)=>{(acc[ev.date]=acc[ev.date]||[]).push(ev);return acc;},{});
          return Object.entries(grouped).map(([dateKey,dateEvents])=>{const d=new Date(`${dateKey}T00:00:00`);const weekday=d.toLocaleDateString(undefined,{weekday:"short"}).toUpperCase();const monthDay=d.toLocaleDateString(undefined,{month:"short",day:"numeric"}).toUpperCase();
          return <div key={dateKey} style={{display:"grid",gap:6}}>
            <div style={{display:"flex",alignItems:"baseline",gap:7,padding:"2px 2px 0"}}><span style={{fontFamily:FB,color:T.SUB,fontSize:9,fontWeight:700,letterSpacing:".1em"}}>{weekday}</span><span style={{fontFamily:FD,color:LIGHT,fontSize:14,letterSpacing:1}}>{monthDay}</span></div>
            {dateEvents.map(ev=><div key={ev.id} style={{background:"rgba(20,24,33,0.82)",border:`1px solid ${BORDER_CLR}`,borderRadius:12,padding:"11px 12px",display:"grid",gap:5,maxWidth:"100%"}}>
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8}}>
                <div style={{fontFamily:FB,color:LIGHT,fontSize:13,fontWeight:700,lineHeight:1.25,minWidth:0,wordBreak:"break-word"}}>{ev.title}</div>
                <span style={{padding:"2px 7px",borderRadius:999,background:`${VOLT}1A`,border:`1px solid ${VOLT}55`,fontFamily:FB,color:VOLT,fontSize:9,fontWeight:700,textTransform:"uppercase",flexShrink:0}}>{ev.type||"event"}</span>
              </div>
              <div style={{fontFamily:FB,color:T.SUB,fontSize:10,lineHeight:1.25}}>{ev.date}</div>
              <div style={{fontFamily:FB,color:T.SUB,fontSize:10,lineHeight:1.25}}>{ev.time||"TBD"}</div>
              <div style={{fontFamily:FB,color:T.SUB,fontSize:10,lineHeight:1.25,wordBreak:"break-word"}}>📍 {ev.location||"Location TBD"}</div>
            </div>)}
          </div>});
        })()}
      </div>}
    </>}

    {showAdd&&<div className="fade-up" style={{position:"fixed",inset:0,zIndex:90,display:"flex",alignItems:isDesktop?"flex-end":"stretch",paddingTop:0,overscrollBehavior:"none"}}>
      {isDesktop&&<button aria-label="Close create event form" onClick={()=>setShowAdd(false)} style={{position:"absolute",inset:0,border:"none",background:"rgba(0,0,0,0.70)",cursor:"pointer"}}/>}
      {isDesktop?<>
      <button aria-label="Close create event form" onClick={()=>setShowAdd(false)} style={{position:"absolute",inset:0,border:"none",background:"rgba(0,0,0,0.70)",cursor:"pointer"}}/>
      <div role="dialog" aria-modal="true" aria-label="Create event" style={{position:"relative",zIndex:1,width:"100%",maxWidth:"100vw",height:isDesktop?"auto":"100dvh",maxHeight:isDesktop?"88dvh":"100dvh",borderRadius:isDesktop?"20px 20px 0 0":"0",background:SURFACE,border:`1px solid ${BORDER_CLR}`,borderBottom:"none",boxShadow:isDesktop?"0 -14px 30px rgba(0,0,0,0.45)":"none",display:"flex",flexDirection:"column",overflow:"hidden",minHeight:0,touchAction:"pan-y",paddingBottom:isDesktop?0:"max(10px, env(safe-area-inset-bottom, 0px))"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:isDesktop?"16px 18px":"12px 14px",borderBottom:`1px solid ${BORDER_CLR}`,flexShrink:0,gap:10}}>
          {isDesktop?<div style={{fontFamily:FD,color:LIGHT,fontSize:18,letterSpacing:2,textAlign:"left",paddingRight:34}}>CREATE EVENT</div>:<><button onClick={()=>setShowAdd(false)} style={{background:"none",border:"none",color:T.SUB,fontFamily:FB,fontSize:12,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",cursor:"pointer",padding:"4px 0"}}>Cancel</button><div style={{fontFamily:FB,color:LIGHT,fontSize:14,fontWeight:700,letterSpacing:".04em",textAlign:"center",flex:1}}>New Event</div><button aria-label="Close" onClick={()=>setShowAdd(false)} style={{background:"none",border:`1px solid ${BORDER_CLR}`,color:T.SUB,borderRadius:8,width:28,height:28,display:"grid",placeItems:"center",cursor:"pointer",fontSize:16,lineHeight:1}}>×</button></>}
          {isDesktop&&<button aria-label="Close" onClick={()=>setShowAdd(false)} style={{background:"none",border:`1px solid ${BORDER_CLR}`,color:T.SUB,borderRadius:8,width:32,height:32,display:"grid",placeItems:"center",cursor:"pointer",fontSize:18,lineHeight:1}}>×</button>}
        </div>
        <div style={{padding:isDesktop?"16px 18px":"12px 12px",overflowY:"auto",flex:1,minHeight:0,paddingBottom:isDesktop?18:90}}>
          <FF l="TITLE" v={ne.title} set={v=>setNe({...ne,title:v})} ph="Open Gym Run"/>
          <div style={{display:isDesktop?"grid":"block",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <FF l="DATE" v={ne.date} set={v=>setNe({...ne,date:v})} tp="date"/>
            <FF l="TIME" v={ne.time} set={v=>setNe({...ne,time:v})} ph="6:00 PM"/>
          </div>
          <FF l="LOCATION" v={ne.location} set={v=>setNe({...ne,location:v})} ph="Main Gym — Court 1"/>
          <FF l="DESCRIPTION" v={ne.desc} set={v=>setNe({...ne,desc:v})} ta ph="Details, what to bring, and arrival notes"/>
          <div style={{marginBottom:14}}>
            <label style={{fontFamily:FB,color:"#A0A0A0",fontSize:11,fontWeight:700,letterSpacing:3,display:"block",marginBottom:8}}>TYPE</label>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{["run","clinic","game","challenge","recovery"].map(t=><button key={t} onClick={()=>setNe({...ne,type:t})} style={{padding:"8px 12px",borderRadius:999,border:`1px solid ${ne.type===t?VOLT:BORDER_CLR}`,background:ne.type===t?VOLT+"22":BG,color:ne.type===t?VOLT:T.SUB,fontFamily:FB,fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",cursor:"pointer"}}>{t}</button>)}</div>
          </div>
        </div>
        <div style={{padding:isDesktop?"12px 18px 16px":"10px 12px",borderTop:`1px solid ${BORDER_CLR}`,background:SURFACE,position:isDesktop?"static":"sticky",bottom:0,zIndex:2}}>
          <button className="btn-v cta-primary" onClick={handleAddEvent} style={{width:"100%",margin:0,minHeight:44,height:44,borderRadius:10}}>CREATE EVENT</button>
        </div>
      </div>
      </>:<div role="dialog" aria-modal="true" aria-label="Create event" style={{position:"relative",zIndex:100,width:"100%",height:"100%",maxHeight:"100%",background:BG,display:"flex",flexDirection:"column",overflow:"hidden",minHeight:0,paddingBottom:"max(10px, env(safe-area-inset-bottom, 0px))"}}>
        <div style={{position:"sticky",top:0,zIndex:2,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"max(12px, env(safe-area-inset-top, 0px)) 14px 12px",borderBottom:`1px solid ${BORDER_CLR}`,background:BG,gap:10,flexShrink:0}}>
          <button onClick={()=>setShowAdd(false)} style={{background:"none",border:"none",color:T.SUB,fontFamily:FB,fontSize:12,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",cursor:"pointer",padding:0}}>Cancel</button>
          <div style={{fontFamily:FD,color:LIGHT,fontSize:16,letterSpacing:1.5,textAlign:"center",flex:1}}>CREATE EVENT</div>
          <button aria-label="Close" onClick={()=>setShowAdd(false)} style={{background:"none",border:`1px solid ${BORDER_CLR}`,color:T.SUB,borderRadius:8,width:28,height:28,display:"grid",placeItems:"center",cursor:"pointer",fontSize:16,lineHeight:1}}>×</button>
        </div>
        <div style={{padding:"12px 12px 132px",overflowY:"auto",flex:1,minHeight:0,WebkitOverflowScrolling:"touch"}}>
          <FF l="TITLE" v={ne.title} set={v=>setNe({...ne,title:v})} ph="Open Gym Run"/>
          <div style={{display:"block"}}>
            <FF l="DATE" v={ne.date} set={v=>setNe({...ne,date:v})} tp="date"/>
            <FF l="TIME" v={ne.time} set={v=>setNe({...ne,time:v})} ph="6:00 PM"/>
          </div>
          <FF l="LOCATION" v={ne.location} set={v=>setNe({...ne,location:v})} ph="Main Gym — Court 1"/>
          <FF l="DESCRIPTION" v={ne.desc} set={v=>setNe({...ne,desc:v})} ta ph="Details, what to bring, and arrival notes"/>
          <div style={{marginBottom:14}}>
            <label style={{fontFamily:FB,color:"#A0A0A0",fontSize:11,fontWeight:700,letterSpacing:3,display:"block",marginBottom:8}}>TYPE</label>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{["run","clinic","game","challenge","recovery"].map(t=><button key={t} onClick={()=>setNe({...ne,type:t})} style={{padding:"8px 12px",borderRadius:999,border:`1px solid ${ne.type===t?VOLT:BORDER_CLR}`,background:ne.type===t?VOLT+"22":BG,color:ne.type===t?VOLT:T.SUB,fontFamily:FB,fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",cursor:"pointer"}}>{t}</button>)}</div>
          </div>
        </div>
        <div style={{position:"sticky",bottom:0,zIndex:2,padding:"10px 12px max(10px, env(safe-area-inset-bottom, 0px))",borderTop:`1px solid ${BORDER_CLR}`,background:BG,flexShrink:0}}>
          <button className="btn-v cta-primary" onClick={handleAddEvent} style={{width:"100%",margin:0,minHeight:44,height:44,borderRadius:10}}>CREATE EVENT</button>
        </div>
      </div>}
    </div>}

    {isDesktop&&filteredEvents.map(ev=>{const evR=rsvpsByEvent.get(ev.id)||[];const isExp=expEv===ev.id;const quickAddPlayers=availableWalkInByEvent.get(ev.id)||[];
      return <div key={ev.id} className="accent-card" style={{background:CARD_BG,border:`1px solid ${BORDER_CLR}`,borderRadius:14,marginBottom:10,overflow:"hidden"}}>
        <button className="ch" onClick={()=>setExpEv(expEv===ev.id?null:ev.id)} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,padding:"14px 16px",background:"none",border:"none",cursor:"pointer",textAlign:"left"}}>
          <div style={{minWidth:0}}>
            <div style={{fontFamily:FB,color:LIGHT,fontSize:13,fontWeight:700}}>{ev.title}</div>
            <div style={{fontFamily:FB,color:T.SUB,fontSize:10,marginTop:2}}>{ev.date} · {ev.time}</div>
            <div style={{fontFamily:FB,color:T.SUB,fontSize:10,marginTop:2}}>📍 {ev.location}</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
            <span style={{padding:"4px 8px",borderRadius:999,border:`1px solid ${VOLT}55`,background:`${VOLT}1A`,fontFamily:FB,color:VOLT,fontSize:9,fontWeight:700,textTransform:"uppercase"}}>{ev.type||"event"}</span>
            <span style={{fontFamily:FB,color:T.SUB,fontSize:10}}>{evR.length} RSVPs</span>
          </div>
        </button>
        {isExp&&<div className="fade-up" style={{background:SURFACE,borderRadius:"0 0 14px 14px",padding:"16px 16px",borderTop:`1px solid ${BORDER_CLR}`}}>
          <p style={{fontFamily:FB,color:MUTED,fontSize:12,lineHeight:1.5,marginBottom:12}}>{ev.desc}</p>
          <div style={{fontFamily:FB,color:"#A0A0A0",fontSize:10,letterSpacing:2,fontWeight:700,marginBottom:8}}>ATTENDEES ({evR.length})</div>
          {evR.length===0&&<p style={{fontFamily:FB,color:T.SUB,fontSize:11,marginBottom:10}}>No attendees yet</p>}
          {evR.map((r,i)=>{const t=getTier(attendanceCountByEmail.get(r.email)||0);return <div key={i} style={{display:"flex",alignItems:"center",gap:8,background:CARD_BG,borderRadius:10,padding:"9px 12px",marginBottom:5,border:`1px solid ${BORDER_CLR}`}}>
            <Av n={r.name} sz={26} email={r.email}/><div style={{flex:1,minWidth:0}}><div style={{display:"flex",alignItems:"center",gap:5}}><span style={{fontFamily:FB,color:LIGHT,fontSize:12,fontWeight:600}}>{r.name}</span>{t.min>=2&&<span style={{fontFamily:FB,fontSize:7,fontWeight:700,padding:"1px 4px",borderRadius:3,color:t.color,background:t.bg}}>{t.name}</span>}</div><div style={{fontFamily:FB,color:T.SUB,fontSize:9,marginTop:1}}>{r.email}</div></div>
            <button onClick={()=>removeRsvp(ev.id,r.email)} style={{background:"#FF454512",border:"1px solid #FF454533",borderRadius:7,color:"#FF4545",fontFamily:FD,fontSize:9,letterSpacing:1,padding:"4px 8px",cursor:"pointer",display:"flex",alignItems:"center",gap:3,whiteSpace:"nowrap"}}><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#FF4545" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>NO-SHOW</button>
          </div>})}
          <div style={{marginTop:12,padding:"14px 14px",background:CARD_BG,borderRadius:12,border:`1px solid ${BORDER_CLR}`}}>
            <div style={{fontFamily:FB,color:VOLT,fontSize:10,letterSpacing:2,fontWeight:700,marginBottom:8}}>+ ADD WALK-IN ATTENDEE</div>
            <div style={{fontFamily:FB,color:T.MUT,fontSize:10,marginBottom:8}}>Give credit to players who showed up without an RSVP</div>
            {quickAddPlayers.length>0&&<div style={{marginBottom:10}}>
              <div style={{fontFamily:FB,color:T.MUT,fontSize:9,letterSpacing:1,marginBottom:6,fontWeight:600}}>KNOWN PLAYERS</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                {quickAddPlayers.map(p=><button key={p.email} onClick={()=>addRsvp(ev.id,p.email,p.name)} style={{display:"flex",alignItems:"center",gap:5,background:BG,border:`1px solid ${BORDER_CLR}`,borderRadius:8,padding:"5px 10px",cursor:"pointer",transition:"border-color .2s"}} onMouseEnter={e=>e.currentTarget.style.borderColor=CYAN+"66"} onMouseLeave={e=>e.currentTarget.style.borderColor=BORDER_CLR}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={VOLT} strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg><span style={{fontFamily:FB,color:LIGHT,fontSize:11,fontWeight:600}}>{p.name}</span></button>)}
              </div>
            </div>}
            <div style={{display:"flex",gap:6}}>
              <input value={addEmail} onChange={e=>setAddEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleAddWalkin(ev.id)} placeholder="email@example.com" style={{flex:1,padding:"10px 12px",background:BG,border:`1px solid ${BORDER_CLR}`,borderRadius:10,color:LIGHT,fontSize:16,fontFamily:FB,outline:"none"}} onFocus={e=>e.target.style.borderColor=CYAN+"66"} onBlur={e=>e.target.style.borderColor=BORDER_CLR}/>
              <button onClick={()=>handleAddWalkin(ev.id)} style={{padding:"10px 16px",background:"var(--page-accent)",color:"#000000",fontFamily:FD,fontSize:13,letterSpacing:2,border:"none",borderRadius:10,cursor:"pointer",whiteSpace:"nowrap"}}>ADD</button>
            </div>
          </div>
          <button onClick={()=>removeEvent(ev.id)} className="btn-v cta-danger" style={{marginTop:14}}><span className="cta-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF4545" strokeWidth="2"><path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg></span>DELETE EVENT</button>
        </div>}
      </div>})}
  </div>}

  {tab==="players"&&!selP&&<div className="page pageShell" data-accent="players" style={shellVars("players")}><PageHeader title="PLAYERS" subtitle="Roster insights, development, and availability" accent="purple" icon={<UsersIcon size={20} color={PAGE_ACCENTS.players.accent}/>} actionLabel="Add" onAction={()=>document.getElementById("coach-add-player-form")?.scrollIntoView({behavior:"smooth"})} /><div className="heroModule"><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}><div><div style={{fontFamily:FD,color:PAGE_ACCENTS.players.accent,fontSize:12,letterSpacing:"var(--tracking-default)"}}>ROSTER SNAPSHOT</div><div style={{fontFamily:FB,color:T.SUB,fontSize:10}}>{ups.length} players on roster</div></div></div></div>
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
    <CoachRoster players={players} scores={scores} shotLogs={shotLogs} drills={drills} nudged={nudged} setNudged={setNudged} onRemovePlayer={removeRosterPlayer}/>
    {/* Tap any player in roster for detail */}
    <div style={{marginTop:16}}>
      <SH isCoach={typeof u!=="undefined"&&u?.isCoach} t="PLAYER DETAILS" s="TAP TO VIEW"/>
      {ups.map((p,i)=>{const ps=scores.filter(s=>s.email===p.email);const tot=ps.reduce((a,s)=>a+s.score,0);
        return <div key={i} className="ch" onClick={()=>setSelP(p)} role="button" tabIndex={0} onKeyDown={e=>{if(e.key==="Enter"||e.key===" ")setSelP(p);}} style={{width:"100%",display:"flex",alignItems:"center",gap:12,background:CARD_BG,border:`1px solid ${BORDER_CLR}`,borderRadius:14,padding:"14px 16px",marginBottom:8,cursor:"pointer",textAlign:"left"}}>
          <Av n={p.name} sz={36} email={p.email}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontFamily:FB,color:LIGHT,fontSize:13,fontWeight:700}}>{p.name.toUpperCase()}</div>
            <div style={{fontFamily:FB,color:T.SUB,fontSize:10,marginTop:2}}>{tot} makes · {rsvps.filter(r=>r.email===p.email).length} events</div>
          </div>
          <button onClick={async(e)=>{e.stopPropagation();await removeRosterPlayer(p.email);if(selP?.email===p.email)setSelP(null);}} style={{background:"#FF454512",border:"1px solid #FF454533",borderRadius:8,color:"#FF4545",fontFamily:FB,fontSize:10,fontWeight:700,letterSpacing:"0.06em",padding:"6px 10px",cursor:"pointer"}}>REMOVE</button>
          <svg width="12" height="12" viewBox="0 0 16 16"><path d="M6 3l5 5-5 5" stroke={VOLT} strokeWidth="2" fill="none" strokeLinecap="round"/></svg>
        </div>})}
    </div>
    {/* Account management — required by App Store §5.1.1(v) */}
    <div style={{marginTop:32,paddingTop:20,borderTop:`1px solid ${BORDER_CLR}44`}}>
      <div style={{background:CARD_BG,border:`1px solid ${BORDER_CLR}`,borderRadius:14,padding:"14px 14px 12px",marginBottom:14}}>
        <div style={{fontFamily:FD,color:LIGHT,fontSize:14,letterSpacing:2,marginBottom:6}}>DEMO SETTINGS</div>
        <p style={{fontFamily:FB,color:T.SUB,fontSize:10,lineHeight:1.5,marginBottom:12}}>Load or clear demo data using the shared demo tools.</p>
        <div style={{display:"grid",gap:8}}>
          <button onClick={onLoadDemoData} disabled={demoSettingsBusy} className="btn-v cta-secondary" style={{width:"100%",margin:0,minHeight:42,height:42,borderRadius:10,opacity:demoSettingsBusy?0.5:1}}>LOAD DEMO DATA</button>
          <button onClick={onClearDemoData} disabled={demoSettingsBusy} className="btn-v cta-danger" style={{width:"100%",margin:0,minHeight:42,height:42,borderRadius:10,opacity:demoSettingsBusy?0.5:1}}>CLEAR DEMO DATA</button>
        </div>
      </div>
      <button onClick={deleteAccount} style={{width:"100%",padding:"12px",background:"transparent",border:`1px solid #FF454533`,borderRadius:10,cursor:"pointer",fontFamily:FB,fontSize:12,color:"#FF4545",fontWeight:600,letterSpacing:1}}>Delete My Coach Account & Data</button>
      <p style={{fontFamily:FB,color:MUTED,fontSize:9,textAlign:"center",marginTop:8}}>Removes your account. Player data and drills are preserved.</p>
    </div>
  </div>}
  {tab==="players"&&selP&&<div className="fade-up"><button onClick={()=>setSelP(null)} style={{background:"none",border:"none",color:VOLT,fontFamily:FB,fontSize:13,cursor:"pointer",fontWeight:700,letterSpacing:2,marginBottom:20}}>&#8592; BACK</button><div style={{textAlign:"center",marginBottom:24}}><Av n={selP.name} sz={64} email={selP.email} style={{margin:"0 auto 14px"}}/><div style={{fontFamily:FD,color:LIGHT,fontSize:24,letterSpacing:2}}>{selP.name.toUpperCase()}</div><div style={{color:MUTED,fontSize:12,marginTop:4}}>{selP.email}</div><div style={{display:"flex",gap:8,justifyContent:"center",marginTop:12,flexWrap:"wrap"}}><span style={{fontFamily:FB,fontSize:10,fontWeight:700,padding:"3px 8px",borderRadius:5,color:VOLT,background:VOLT+"15"}}>HOME: {scores.filter(s=>s.email===selP.email&&(s.src==="home"||!s.src)).length}</span><span style={{fontFamily:FB,fontSize:10,fontWeight:700,padding:"3px 8px",borderRadius:5,color:LIGHT,background:LIGHT+"10"}}>PROGRAM: {scores.filter(s=>s.email===selP.email&&s.src==="program").length}</span><span style={{fontFamily:FB,fontSize:10,fontWeight:700,padding:"3px 8px",borderRadius:5,color:ORANGE,background:ORANGE+"15"}}>{rsvps.filter(r=>r.email===selP.email).length} EVENTS</span></div></div><HistPanel sc={scores.filter(s=>s.email===selP.email)} dr={drills} programDr={programDrills}/></div>}

  {/* ═════════════ S&C MANAGEMENT ═════════════ */}
  {tab==="sc"&&<div className="page pageShell fade-up" data-accent="sc" style={shellVars("sc")}><PageHeader title="S&C" subtitle="Strength blocks, readiness, and recovery" accent="blue" icon={<LiftIcon size={22} color={PAGE_ACCENTS.sc.accent}/>} actionLabel={showAddSC?"Close":"Add"} onAction={()=>setShowAddSC(!showAddSC)} /><div className="heroModule"><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}><div><div style={{fontFamily:FD,color:PAGE_ACCENTS.sc.accent,fontSize:12,letterSpacing:"var(--tracking-default)"}}>TODAY'S LIFT</div><div style={{fontFamily:FB,color:T.SUB,fontSize:10}}>{scSessions[0]?`${scSessions[0].sport||scSessions[0].title} · ${scSessions[0].date}`:"No lift scheduled"}</div></div><button className="pageHeaderPill" onClick={()=>setShowAddSC(true)}>Add Session</button></div><div className="heroStats"><div className="heroStat"><div className="heroStatVal">{scSessions.length}</div><div className="heroStatLbl">SESSIONS</div></div><div className="heroStat"><div className="heroStatVal">{scRsvps.length}</div><div className="heroStatLbl">RSVPS</div></div><div className="heroStat"><div className="heroStatVal">{scLogs.length}</div><div className="heroStatLbl">LOGS</div></div></div></div>
    <SH isCoach={typeof u!=="undefined"&&u?.isCoach} t="S&C SESSIONS" s={`${scSessions.length} TOTAL`} identity/>
    <div className="accent-card" style={{marginBottom:16,paddingLeft:10,paddingRight:10,paddingTop:10,paddingBottom:10}}>
      <div style={{display:"flex",justifyContent:"flex-end"}}>
        <button
          className="pageHeaderPill btn-v"
          onClick={()=>setShowAddSC(!showAddSC)}
          style={{
            minHeight:40,
            padding:"0 18px",
            fontSize:11,
            letterSpacing:2,
            borderColor:"color-mix(in srgb,var(--page-accent) 60%, transparent)",
            background:"color-mix(in srgb,var(--page-accent) 16%, #111826)",
            boxShadow:"0 10px 24px color-mix(in srgb,var(--page-accent) 12%, transparent)",
            gap:6
          }}
        >
          {showAddSC?"CANCEL":"+ ADD SESSION"}
        </button>
      </div>
    {showAddSC&&<div className="fade-up" style={{background:CARD_BG,borderRadius:16,padding:"20px 18px",marginTop:12,border:`1px solid ${BORDER_CLR}`}}>
      <FF l="SPORT" v={nsc.sport} set={v=>setNsc({...nsc,sport:v})} ph="e.g. Basketball"/>
      <label style={{fontFamily:FB,color:"#A0A0A0",fontSize:"calc(11px * var(--coach-text-scale-medium))",fontWeight:700,letterSpacing:3,display:"block",marginBottom:8}}>PLACE</label>
      <select value={nsc.sessionType||"School"} onChange={e=>setNsc({...nsc,sessionType:e.target.value})} style={{width:"100%",height:52,padding:"0 16px",background:"#141414",border:"1px solid #333333",borderRadius:12,color:LIGHT,fontSize:"calc(14px * var(--coach-text-scale-medium))",fontFamily:FB,fontWeight:500,outline:"none",marginBottom:14}}>
        <option value="School">School</option>
        <option value="Private Trainer">Private Trainer</option>
        <option value="Gym Membership">Gym Membership</option>
        <option value="At Home">At Home</option>
      </select>
      <div style={{display:"flex",gap:8}}><div style={{flex:1}}><FF l="DATE" v={nsc.date} set={v=>setNsc({...nsc,date:v})} tp="date"/></div><div style={{flex:1}}><FF l="TIME" v={nsc.time} set={v=>setNsc({...nsc,time:v})} ph="6:00 AM"/></div></div>
      <button className="btn-v cta-primary" onClick={handleAddSC} style={{}}>CREATE SESSION</button>
    </div>}
    </div>
    {scSessions.sort((a,b)=>a.date.localeCompare(b.date)).map(s=>{const sr=scRsvps.filter(r=>r.sessionId===s.id);
      return <div key={s.id} className="scSection" style={{display:"flex",alignItems:"center",gap:12,background:CARD_BG,borderRadius:12,padding:"14px 16px",marginBottom:8,border:`1px solid ${BORDER_CLR}`}}>
        <div style={{width:40,height:40,borderRadius:10,background:"#A0A0A012",border:"1px solid #A0A0A033",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A0A0A0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6.5 6.5h-2a1 1 0 00-1 1v9a1 1 0 001 1h2M17.5 6.5h2a1 1 0 011 1v9a1 1 0 01-1 1h-2M6.5 12h11M1.5 9.5v5M22.5 9.5v5"/></svg>
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontFamily:FD,color:LIGHT,fontSize:14,letterSpacing:1}}>{s.sport||s.title}</div>
          <div style={{fontFamily:FB,color:T.SUB,fontSize:10,marginTop:2}}>{s.date} &#183; {s.time} &#183; {s.sessionType||"School"} &#183; <span style={{color:"#A0A0A0"}}>{sr.length} RSVPs</span></div>
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
function HistPanel({sc,dr,programDr=[]}){
const sorted=useMemo(()=>[...sc].sort((a,b)=>(b.ts||0)-(a.ts||0)),[sc]);
const grouped=useMemo(()=>{const m={};sorted.forEach(s=>{if(!m[s.date])m[s.date]=[];m[s.date].push(s)});return Object.entries(m)},[sorted]);
const findDrillForScore=score=>((score?.src||"home")==="program"?programDr:dr).find(d=>d.id===score.drillId);
return <div><SH isCoach={typeof u!=="undefined"&&u?.isCoach} t="SCORE HISTORY" s="ALL SOURCES"/>{grouped.length===0&&<Empty t="No scores yet"/>}{grouped.map(([date,entries])=><div key={date} style={{marginBottom:24}}><div style={{fontFamily:FD,color:T.SUB,fontSize:12,letterSpacing:4,marginBottom:8}}>{date}</div>{entries.map((s,i)=>{const d=findDrillForScore(s);const pct=d&&hasDrillMax(d)?Math.round(s.score/d.max*100):null;const isH=s.src==="home"||!s.src;return <div key={i} style={{display:"flex",alignItems:"center",gap:12,background:CARD_BG,borderRadius:12,padding:"12px 16px",marginBottom:5,border:`1px solid ${BORDER_CLR}`}}><div style={{width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",background:BG,borderRadius:8,flexShrink:0}}><DrillIcon type={d?.icon} size={18}/></div><div style={{flex:1}}><div style={{fontFamily:FD,color:LIGHT,fontSize:13,letterSpacing:2,display:"flex",alignItems:"center",gap:6}}>{d?.name}<span style={{fontFamily:FB,fontSize:7,fontWeight:700,padding:"1px 4px",borderRadius:3,color:isH?VOLT:CYAN,background:isH?VOLT+"15":CYAN+"15"}}>{isH?"HOME":"PROG"}</span></div></div><div style={{textAlign:"right"}}><div style={{fontFamily:FD,color:isH?VOLT:CYAN,fontSize:16}}>{s.score}{hasDrillMax(d)&&<span style={{color:MUTED,fontSize:11}}>/{d?.max}</span>}</div>{typeof pct==="number"&&<div style={{fontFamily:FB,fontSize:9,fontWeight:700,color:pct>=80?"#C8FF00":pct>=50?"#FFA500":"#FF4545"}}>{pct}%</div>}</div></div>})}</div>)}</div>;
}

// ═══════════════════════════════════════
// PLAYER PROFILE — Offseason Resume
// ═══════════════════════════════════════
function ProfilePage({u,scores,shotLogs,drills,programDrills=[],rsvps,scRsvps,challenges,streak,earnedBadges,T,deleteAccount,onToggleLeaderboardVisibility}){
const[confirmDel,setConfirmDel]=useState(false);
const my=useMemo(()=>scores.filter(s=>s.email===u.email),[scores,u]);
const homeScores=useMemo(()=>my.filter(s=>s.src==="home"||!s.src),[my]);
const programScores=useMemo(()=>my.filter(s=>s.src==="program"),[my]);
const totalMakes=homeScores.reduce((a,s)=>a+s.score,0);
const totalProgramMakes=programScores.reduce((a,s)=>a+s.score,0);
const totalShots=shotLogs.filter(s=>s.email===u.email).reduce((a,s)=>a+s.made,0);
const sessionsLogged=[...new Set(homeScores.map(s=>s.date))].length;
const programSessionsLogged=[...new Set(programScores.map(s=>s.date))].length;
const eventsAttended=rsvps.filter(r=>r.email===u.email).length;
const scCount=scRsvps.filter(r=>r.email===u.email).length;
const challWon=challenges.filter(c=>(c.from===u.email&&c.status==="lost")||(c.to===u.email&&c.status==="won")).length;
const challTotal=challenges.filter(c=>c.from===u.email||c.to===u.email).length;
const hasReportCardData=(totalMakes+totalProgramMakes+totalShots+sessionsLogged+programSessionsLogged+eventsAttended+scCount+challTotal)>0;
const bestStreak=useMemo(()=>{const ds=[...new Set(homeScores.map(s=>s.date))].sort();let max=0,cur=0,prev=null;
ds.forEach(d=>{const dt=new Date(d);if(prev){const diff=(dt-prev)/(1000*60*60*24);cur=diff<=1?cur+1:1}else cur=1;max=Math.max(max,cur);prev=dt});return max},[homeScores]);

// Per-drill stats with personal bests, averages, trends
const drillStats=useMemo(()=>[...drills.map(d=>({...d,src:"home"})),...programDrills.map(d=>({...d,src:"program"}))].map(d=>{
const sourceScores=d.src==="program"?programScores:homeScores;
const ds=sourceScores.filter(s=>s.drillId===d.id).sort((a,b)=>(a.ts||0)-(b.ts||0));
const pb=ds.reduce((m,s)=>Math.max(m,s.score),0);
const avg=ds.length?Math.round(ds.reduce((a,s)=>a+s.score,0)/ds.length*10)/10:0;
const last10=ds.slice(-10).map(s=>s.score);
// Trend: compare first half avg vs second half avg of last 10
let trend="flat";
if(last10.length>=4){const mid=Math.floor(last10.length/2);const first=last10.slice(0,mid).reduce((a,v)=>a+v,0)/mid;const second=last10.slice(mid).reduce((a,v)=>a+v,0)/(last10.length-mid);if(second>first*1.05)trend="up";else if(second<first*0.95)trend="down"}
return{...d,pb,avg,count:ds.length,last10,trend};
}),[drills,programDrills,homeScores,programScores]);

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

  <div style={{fontFamily:FB,color:VOLT,fontSize:9,letterSpacing:5,fontWeight:700,marginBottom:12}}>{hasReportCardData?"OFFSEASON REPORT CARD":"SEASON IN PROGRESS"}</div>
  <Av n={u.name} sz={64} email={u.email} style={{margin:"0 auto 14px"}}/>
  <div style={{fontFamily:FD,color:LIGHT,fontSize:32,letterSpacing:4,lineHeight:1}}>{u.name.toUpperCase()}</div>
  <div style={{fontFamily:FB,color:MUTED,fontSize:11,marginTop:6,letterSpacing:2}}>{hasReportCardData?"OFFSEASON 2026":"KEEP LOGGING WORKOUTS TO BUILD YOUR CARD"}</div>

  {/* Big stats row */}
  <div style={{display:"flex",gap:6,marginTop:20,justifyContent:"center"}}>
    {[{v:totalMakes+totalProgramMakes+totalShots,l:"TOTAL MAKES",c:VOLT},{v:formatStreakDays(bestStreak),l:"BEST STREAK",c:ORANGE},{v:eventsAttended,l:"EVENTS",c:CYAN}].map(s=>
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
      :sessionsLogged>0?`${sessionsLogged} training sessions logged`
      :null;
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
    {[{v:totalMakes+totalProgramMakes+totalShots,l:"MAKES",c:VOLT},{v:sessionsLogged+programSessionsLogged,l:"SESSIONS",c:LIGHT},{v:streak,l:"STREAK",c:ORANGE}].map(s=>
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
  <StatRow label="At Home Drill Makes" value={totalMakes}/><StatRow label="Program Drill Makes" value={totalProgramMakes} color={CYAN}/>
  <StatRow label="Shot Tracker Makes" value={totalShots} color={ORANGE}/>
  <StatRow label="Events Attended" value={eventsAttended} color={CYAN}/>
  <StatRow label="S&C Sessions" value={scCount} color="#A0A0A0"/>
  <StatRow label="Challenges" value={`${challWon}/${challTotal}`} color={ORANGE} sub={challTotal>0?`${Math.round(challWon/challTotal*100)}% win rate`:"No challenges yet"}/>
  <StatRow label="Best Streak" value={formatStreakDays(bestStreak)} color={ORANGE}/>
  <div style={{height:4}}/>
</div>

<ShotLabCharts scores={scores} drills={drills} programDrills={programDrills} user={u} />

{/* Per-drill breakdown with PBs and trends */}
<div style={{fontFamily:FB,color:T.SUB,fontSize:10,letterSpacing:3,fontWeight:700,marginBottom:12}}>DRILL BREAKDOWN</div>
{drillStats.map(d=>{const accentColor=d.src==="program"?CYAN:getDrillAccentColor(d.name);return <div key={`${d.src}-${d.id}`} style={{background:CARD_BG,borderRadius:14,padding:"16px 18px",border:`1px solid ${BORDER_CLR}`,borderLeft:`5px solid ${accentColor}`,marginBottom:10}}>
  <div style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:12}}>
    <DrillIcon type={d.icon} size={20} color={accentColor}/>
    <div style={{flex:1,minWidth:0}}>
      <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}><div style={{fontFamily:FB,color:LIGHT,fontSize:13,fontWeight:700,letterSpacing:1}}>{d.name}</div><span style={{fontFamily:FB,fontSize:8,fontWeight:700,letterSpacing:1,padding:"2px 6px",borderRadius:999,color:d.src==="program"?CYAN:VOLT,background:d.src==="program"?CYAN+"15":VOLT+"15"}}>{d.src==="program"?"PROGRAM":"AT HOME"}</span></div>
      {d.desc&&<div style={{fontFamily:FB,color:T.SUB,fontSize:10,lineHeight:1.5,marginTop:4}}>{d.desc}</div>}
    </div>
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

<div style={{background:CARD_BG,borderRadius:16,padding:"14px 16px",border:`1px solid ${BORDER_CLR}`,marginBottom:24}}>
  <div style={{fontFamily:FB,color:T.SUB,fontSize:10,letterSpacing:3,fontWeight:700,marginBottom:10}}>PRIVACY</div>
  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,marginBottom:8}}>
    <div>
      <div style={{fontFamily:FB,color:LIGHT,fontSize:13,fontWeight:700}}>Hide me from leaderboards</div>
      <div style={{fontFamily:FB,color:T.SUB,fontSize:10,marginTop:2}}>Coach can still view your workouts and progress.</div>
    </div>
    <button onClick={onToggleLeaderboardVisibility} style={{minWidth:88,height:34,borderRadius:999,border:`1px solid ${u.hideFromLeaderboards?BORDER_CLR:VOLT+"66"}`,background:u.hideFromLeaderboards?"transparent":VOLT+"16",color:u.hideFromLeaderboards?MUTED:VOLT,fontFamily:FB,fontSize:10,fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",cursor:"pointer"}}>{u.hideFromLeaderboards?"OFF":"ON"}</button>
  </div>
  <div style={{fontFamily:FB,color:MUTED,fontSize:10}}>{u.hideFromLeaderboards?"You are hidden from public leaderboard rankings.":"You are visible in team leaderboards."}</div>
</div>

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
function CoachRoster({players,scores,shotLogs,drills,nudged,setNudged,onRemovePlayer}){
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
    <button onClick={()=>onRemovePlayer?.(p.email)} style={{minHeight:34,padding:"0 12px",borderRadius:8,border:"1px solid #FF454533",background:"#FF454510",cursor:"pointer",fontFamily:FB,fontSize:10,fontWeight:700,letterSpacing:"0.06em",color:"#FF4545",whiteSpace:"nowrap",width:"100%"}}>
      REMOVE
    </button>
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
function SLLogo({size=60,glow=false,opacity:op=1,style:sx}){const {tokens}=useTeamBranding();const logoAccent=tokens?.colors?.logoAccent||"var(--team-brand-logo-accent,var(--accent))";return <img src="data:image/png;base64,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" alt="SL" width={size} height={size} style={{display:"block",objectFit:"contain",opacity:op,borderRadius:size*.18,...(glow?{filter:`drop-shadow(0 0 ${size*.15}px ${logoAccent})`}:{}),...sx}}/>}

function calcStreak(sc){const ds=[...new Set(sc.map(s=>s.date))].sort().reverse();let c=0,d=new Date();for(let i=0;i<400;i++){const s=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;if(ds.includes(s)){c++;d.setDate(d.getDate()-1)}else if(i===0){d.setDate(d.getDate()-1)}else break}return c}
function formatStreakDays(days){return `${days} ${days===1?"Day":"Days"}`}
function hashCode(s){let h=0;for(let i=0;i<s.length;i++){h=((h<<5)-h)+s.charCodeAt(i);h|=0}return Math.abs(h)}
const AVG=[["#C8FF00","#00E5FF"],["#C8FF00","#C8FF00"],["#00E5FF","#C8FF00"],["#C8FF00","#C8FF00"],["#A0A0A0","#00E5FF"],["#C8FF00","#C8FF00"],["#C8FF00","#00E5FF"],["#C8FF00","#C8FF00"]];
function AnimNum({v,c=VOLT,big,size}){const[display,setDisplay]=useState(0);const[isVisible,setIsVisible]=useState(false);useEffect(()=>{setIsVisible(false);const fadeIn=requestAnimationFrame(()=>setIsVisible(true));if(typeof v!=="number"){setDisplay(v);return()=>cancelAnimationFrame(fadeIn)}let cancelled=false;const end=v;const dur=600;const t0=Date.now();const step=()=>{if(cancelled)return;const elapsed=Date.now()-t0;const prog=Math.min(elapsed/dur,1);const eased=1-Math.pow(1-prog,3);setDisplay(Math.round(eased*end));if(prog<1)requestAnimationFrame(step)};step();return()=>{cancelAnimationFrame(fadeIn);cancelled=true}},[v]);return <span className="cnt-up" style={{fontFamily:FD,color:c,fontSize:size||(big?42:26),letterSpacing:1,lineHeight:1,fontWeight:700,opacity:isVisible?1:0,transition:"opacity 150ms ease"}}>{display}</span>}
function BrandWordmark({size=30,small}){
const {branding,tokens}=useTeamBranding();
const logoAccent=tokens?.colors?.logoAccent||"var(--team-brand-logo-accent,var(--accent))";
const logoHeight=Math.max(32,Math.round(size*(small?2.75:2.25)));
if(branding?.logoUrl){
  return <div style={{display:"flex",alignItems:"center",justifyContent:"center",minWidth:0,maxWidth:"100%",width:"100%"}}>
    <img src={branding.logoUrl} alt={`${branding?.teamName||"Team"} logo`} style={{height:logoHeight,maxHeight:"98%",maxWidth:"100%",objectFit:"contain"}}/>
  </div>;
}
if(branding?.logoMarkUrl){
  return <div style={{display:"flex",alignItems:"center",gap:8,minWidth:0}}>
    <img src={branding.logoMarkUrl} alt="Team logo mark" style={{height:logoHeight*0.9,width:logoHeight*0.9,objectFit:"contain"}}/>
    <div style={{fontFamily:FD,fontSize:size,lineHeight:.85,letterSpacing:small?1.5:3,fontWeight:900,whiteSpace:"nowrap"}}><span style={{color:LIGHT}}>SHOT</span><span style={{color:logoAccent}}>LAB</span></div>
  </div>;
}
return <div style={{fontFamily:FD,fontSize:size,lineHeight:.85,letterSpacing:small?1.5:3,fontWeight:900,whiteSpace:"nowrap"}}><span style={{color:LIGHT}}>SHOT</span><span style={{color:logoAccent}}>LAB</span></div>
}
function BrandBackdrop(){return <><div style={{position:"fixed",inset:0,background:"radial-gradient(ellipse 80% 40% at 50% 0%, rgba(200, 255, 0, 0.04) 0%, transparent 100%)",pointerEvents:"none",zIndex:0}}/><div style={{position:"fixed",left:"50%",top:"50%",transform:"translate(-50%,-35%)",opacity:.03,pointerEvents:"none",zIndex:0,width:180}}><SLLogo size={180}/></div></>}
function SectionHero({icon,title,subtitle,accent=VOLT,deco,isCoach=false}){return <div style={{marginBottom:12}}><div style={{height:80,display:"flex",alignItems:"center",gap:14}}><div style={{width:42,height:42,borderRadius:12,background:accent+"12",border:`1px solid ${accent}33`,display:"flex",alignItems:"center",justifyContent:"center",position:"relative",flexShrink:0}}>{icon}{deco&&<div style={{position:"absolute",bottom:-6,right:-6,opacity:.6}}>{deco}</div>}</div><div><div className="u-allcaps-long" style={{fontFamily:FD,fontSize:24,color:"var(--text-1)",lineHeight:1,display:"flex",alignItems:"center",gap:6}}>{title}{isCoach&&<ShieldIcon size={12} color="var(--text-3)" style={{opacity:.5,pointerEvents:"none"}}/>}</div><div className="u-secondary-text" style={{fontFamily:FB,fontSize:12,marginTop:4}}>{subtitle}</div></div></div><div style={{height:1,background:BORDER_CLR}}/></div>}
function SC({l,v,c=VOLT,big,small,fire,accent}){const inner=<div style={{flex:big?1.6:1,background:`linear-gradient(145deg,${SURFACE},${CARD_BG})`,borderRadius:16,padding:big?"22px 18px":"14px 12px",position:"relative",overflow:"hidden"}}>{fire&&<div style={{position:"absolute",top:6,right:8,fontSize:14}}>🔥</div>}{typeof v==="number"?<AnimNum v={v} c={c} big={big}/>:<div style={{fontFamily:FD,color:c,fontSize:big?42:26,letterSpacing:1,lineHeight:1}}>{v}</div>}<div style={{fontFamily:FB,color:T.SUB,fontSize:9,letterSpacing:3,marginTop:big?6:4,fontWeight:600}}>{l}</div></div>;if(accent)return <div className="grd-bdr" style={{flex:big?1.6:1}}>{inner}</div>;return <div style={{flex:big?1.6:1}}><div style={{border:`1px solid ${BORDER_CLR}`,borderRadius:16}}>{inner}</div></div>}
function SH({t,s,isCoach=false}){return <AppHeader variant="utility" eyebrow={s||undefined} title={t} brandLockup={isCoach?<ShieldIcon size={12} color="var(--text-3)" style={{opacity:.5,pointerEvents:"none"}}/>:null} />}
function Av({n,sz=36,style:x,email,isCoach=false}){const idx=email?hashCode(email)%AVG.length:hashCode(n||"?")%AVG.length;const[c1,c2]=AVG[idx];return <div style={{width:sz,height:sz,borderRadius:"50%",background:`linear-gradient(135deg,${VOLT}44,${VOLT}22)`,border:`2px solid ${VOLT}55`,color:VOLT,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:FD,fontSize:sz*.42,flexShrink:0,letterSpacing:1,boxShadow:`0 0 12px ${VOLT}22${isCoach?", 0 0 0 4px rgba(200, 255, 0, 0.15)":""}`,...x}}>{(n||"?")[0].toUpperCase()}</div>}
function ConfettiBurst(){const particles=useMemo(()=>Array.from({length:24},(_,i)=>{const angle=(i/24)*360*(Math.PI/180);const dist=60+Math.random()*80;const x=Math.cos(angle)*dist;const y=Math.sin(angle)*dist-20;const colors=[VOLT,ORANGE,CYAN,"#C8FF00","#C8FF00","#FFFFFF"];return {x,y,color:colors[i%colors.length],size:3+Math.random()*4,delay:Math.random()*0.15}}),[]);return <div style={{position:"absolute",top:"30%",left:"50%",zIndex:20,pointerEvents:"none"}}>{particles.map((p,i)=><div key={i} className="particle" style={{width:p.size,height:p.size,background:p.color,left:0,top:0,"–fly-to":`translate(${p.x}px,${p.y}px) scale(0)`,animationDelay:`${p.delay}s`,animationDuration:".7s"}}/>)}</div>}
function CourtDivider({color=VOLT,my=20}){return <div style={{margin:`${my}px 0`,position:"relative",height:24,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}><svg width="100%" height="24" viewBox="0 0 400 24" preserveAspectRatio="none" fill="none" style={{position:"absolute",inset:0,opacity:.12}}><line x1="0" y1="12" x2="160" y2="12" stroke={color} strokeWidth="1"/><path d="M160 12Q200 -4 240 12" stroke={color} strokeWidth="1" fill="none"/><line x1="240" y1="12" x2="400" y2="12" stroke={color} strokeWidth="1"/></svg><div style={{width:6,height:6,borderRadius:"50%",background:color,opacity:.15,position:"relative",zIndex:1}}/></div>}
function DividerDot(){return <div style={{display:"flex",alignItems:"center",gap:10,width:"100%",margin:"14px 0"}}><div style={{height:1,background:BORDER_CLR,flex:1}}/><div style={{width:4,height:4,borderRadius:"50%",background:VOLT}}/><div style={{height:1,background:BORDER_CLR,flex:1}}/></div>}
function RB({r,m,small}){const t=r<=3;return <div style={{width:small?22:28,height:small?22:28,borderRadius:small?5:7,background:t?m[r-1]+"18":"transparent",border:t?`1.5px solid ${m[r-1]}44`:`1px solid ${BORDER_CLR}`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:FD,fontSize:small?11:14,color:t?m[r-1]:"#555555",flexShrink:0}}>{r}</div>}
function Empty({t,action,onTap,cta="GET STARTED",ctaVariant="primary",icon=<DrillIcon type="sb" size={48} color="#555555"/>}){return <div style={{textAlign:"center",padding:"40px 20px"}}><div style={{opacity:.8,display:"inline-flex",alignItems:"center",justifyContent:"center",color:"#555555"}}>{icon}</div><p className="u-allcaps-long" style={{fontFamily:FD,color:LIGHT,fontSize:18,marginTop:14,lineHeight:1.2}}>{t}</p>{action&&<p className="u-secondary-text" style={{fontFamily:FB,fontSize:13,margin:"8px auto 0",lineHeight:1.5,fontWeight:500,maxWidth:260}}>{action}</p>}<button onClick={onTap||(()=>{})} className={`btn-v ${ctaVariant==="secondary"?"cta-secondary":"cta-primary"}`} style={{marginTop:14}}>{cta}</button></div>}
function LiftIcon({size=24,color="#A0A0A0"}){return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6.5 6.5h-2a1 1 0 00-1 1v9a1 1 0 001 1h2M17.5 6.5h2a1 1 0 011 1v9a1 1 0 01-1 1h-2M6.5 12h11M1.5 9.5v5M22.5 9.5v5"/></svg>}
function FF({l,v,set,ph,tp,ta,opts}){return <><label style={{fontFamily:FB,color:"#A0A0A0",fontSize:"calc(11px * var(--coach-text-scale-medium))",fontWeight:700,letterSpacing:3,display:"block",marginBottom:8}}>{l}</label>{ta?<textarea value={v} onChange={e=>set(e.target.value)} placeholder={ph} style={{width:"100%",padding:"13px 16px",background:"#141414",border:"1px solid #333333",borderRadius:12,color:LIGHT,fontSize:"calc(14px * var(--coach-text-scale-medium))",fontFamily:FB,outline:"none",minHeight:70,resize:"vertical",lineHeight:1.6,marginBottom:14,transition:"border-color .15s ease, box-shadow .15s ease"}} onFocus={e=>{e.target.style.borderColor=VOLT;e.target.style.boxShadow="0 0 0 3px rgba(200,255,0,0.08)"}} onBlur={e=>{e.target.style.borderColor="#333333";e.target.style.boxShadow="none"}}/>:opts?<select value={v} onChange={e=>set(e.target.value)} style={{width:"100%",height:52,padding:"0 16px",background:"#141414",border:"1px solid #333333",borderRadius:12,color:LIGHT,fontSize:"calc(14px * var(--coach-text-scale-medium))",fontFamily:FB,fontWeight:500,outline:"none",marginBottom:14,transition:"border-color .15s ease, box-shadow .15s ease"}} onFocus={e=>{e.target.style.borderColor=VOLT;e.target.style.boxShadow="0 0 0 3px rgba(200,255,0,0.08)"}} onBlur={e=>{e.target.style.borderColor="#333333";e.target.style.boxShadow="none"}}>{opts.map(o=><option key={o} value={o}>{o}</option>)}</select>:<input type={tp||"text"} value={v} onChange={e=>set(e.target.value)} placeholder={ph} style={{width:"100%",height:52,padding:"0 16px",background:"#141414",border:"1px solid #333333",borderRadius:12,color:LIGHT,fontSize:"calc(14px * var(--coach-text-scale-medium))",fontFamily:FB,fontWeight:500,outline:"none",marginBottom:14,transition:"border-color .15s ease, box-shadow .15s ease"}} onFocus={e=>{e.target.style.borderColor=VOLT;e.target.style.boxShadow="0 0 0 3px rgba(200,255,0,0.08)"}} onBlur={e=>{e.target.style.borderColor="#333333";e.target.style.boxShadow="none"}}/>}</>}
function NavBar({items,active,onChange}){
const navAccent=PAGE_ACCENTS[active]?.accent||PAGE_ACCENTS.feed.accent;
return <nav className="bottom-nav" role="navigation" aria-label="Main navigation" style={{"--nav-accent":navAccent,position:"fixed",left:0,right:0,bottom:0,display:"flex",justifyContent:"space-evenly",alignItems:"center",height:"calc(64px + ((var(--coach-text-scale-medium) - 1) * 12px))",paddingBottom:"env(safe-area-inset-bottom)",background:"var(--surface-1)",borderTop:"1px solid var(--stroke-1)",zIndex:20}}>{items.map(t=>{const a=active===t.k;
const tabAccent="var(--nav-active-text,var(--nav-accent))";
return <button key={t.k} aria-label={t.l} aria-current={a?"page":undefined} className={`tab ${a?"is-active active":""}`} onClick={()=>onChange(t.k)} style={{"--tab-accent":tabAccent,flex:1,minWidth:48,minHeight:"calc(48px + ((var(--coach-text-scale-medium) - 1) * 10px))",height:"100%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"calc(4px + ((var(--coach-text-scale-medium) - 1) * 3px))",padding:"8px 4px 6px",position:"relative",background:"none",border:"none",cursor:"pointer",transition:"color 150ms ease-out",outlineOffset:2}}>
<div className="tab-icon" style={{position:"relative"}}>{t.svg}</div>
<div className="tab-label" style={{fontFamily:FB,fontSize:"calc(10px * var(--coach-text-scale-medium))",letterSpacing:"0.05em",textTransform:"uppercase",lineHeight:1.2,whiteSpace:"nowrap"}}>{t.l}</div>
</button>})}</nav>}
