// Default ShotLab training drill catalog and normalization helpers.
// Extracted from App.jsx to keep the application shell focused on orchestration.

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
export const mergeDefaultDrills=(existing=[],defaults=[])=>{const list=Array.isArray(existing)?existing:[];const index=defaults===DEFAULT_PROGRAM_DRILLS?DEFAULT_PROGRAM_DRILL_INDEX:DEFAULT_HOME_DRILL_INDEX;const custom=[];const seenDefaults=new Set();list.forEach(item=>{const match=findMatchingDefaultDrill(item,index);if(match){if(seenDefaults.has(match.slug))return;seenDefaults.add(match.slug);custom.push({...item,...match,id:match.id,slug:match.slug,isDefaultDemo:true,mode:match.mode});return;}custom.push(item);});defaults.forEach(def=>{if(!seenDefaults.has(def.slug))custom.push(def);});return custom;};
export const buildDefaultDrillIdAliases=(existing=[],defaults=[])=>{const aliases=new Map();const index=defaults===DEFAULT_PROGRAM_DRILLS?DEFAULT_PROGRAM_DRILL_INDEX:DEFAULT_HOME_DRILL_INDEX;(Array.isArray(existing)?existing:[]).forEach(item=>{const match=findMatchingDefaultDrill(item,index);if(!match)return;aliases.set(String(match.id),match.id);if(item?.id!=null)aliases.set(String(item.id),match.id);if(item?.slug)aliases.set(item.slug,match.id);});defaults.forEach(def=>{aliases.set(String(def.id),def.id);aliases.set(def.slug,def.id);});return aliases;};
export const normalizeScoresForDefaultDrills=(scores=[],homeAliases=new Map(),programAliases=new Map())=>(Array.isArray(scores)?scores:[]).map(score=>{const src=score?.src||"home";const aliases=src==="program"?programAliases:homeAliases;const nextDrillId=aliases.get(String(score?.drillId))||score?.drillId;return nextDrillId===score?.drillId&&src===score?.src?score:{...score,src,drillId:nextDrillId};});
export const isInSeasonProgramDrill=drill=>drill?.inSeason===true||drill?.in_season===true;
export const countCustomProgramDrills=list=>(Array.isArray(list)?list:[]).filter(d=>!isInSeasonProgramDrill(d)&&!findMatchingDefaultDrill(d,DEFAULT_PROGRAM_DRILL_INDEX)).length;
export const countCustomInSeasonProgramDrills=list=>(Array.isArray(list)?list:[]).filter(d=>isInSeasonProgramDrill(d)&&!findMatchingDefaultDrill(d,DEFAULT_PROGRAM_DRILL_INDEX)).length;
export const DRILLS_INIT=DEFAULT_HOME_DRILLS;
export const PROGRAM_DRILLS_INIT=DEFAULT_PROGRAM_DRILLS;
export const ICONS=["ft","3p","mr","fl","sb"];
export const hasDrillMax=drill=>Number.isFinite(Number(drill?.max))&&Number(drill.max)>0;
