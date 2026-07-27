import fs from "node:fs";

const path = "src/App.jsx";
let source = fs.readFileSync(path, "utf8");

const replaceOnce = (label, from, to) => {
  if (!source.includes(from)) throw new Error(`${label}: anchor missing`);
  source = source.replace(from, to);
};

replaceOnce(
  "component import",
  'import { CoachActivityIntelligencePanel, CoachDrillsOperationalPanel, CoachEventIntelligenceDrawer, CoachLeaderboardOperationalPanel, CoachPlayerIntelligenceDrawer, CoachSeasonComparisonPanel, CoachStrengthOperationalPanel } from "./components/CoachDashboardPhase2.jsx";\n',
  'import { CoachActivityIntelligencePanel, CoachDrillsOperationalPanel, CoachEventIntelligenceDrawer, CoachLeaderboardOperationalPanel, CoachPlayerIntelligenceDrawer, CoachSeasonComparisonPanel, CoachStrengthOperationalPanel } from "./components/CoachDashboardPhase2.jsx";\nimport PlayerDailyCommandCenter from "./components/PlayerDailyCommandCenter.jsx";\n'
);

replaceOnce(
  "selector import",
  'import { buildActivityIntelligenceRows, buildDrillIntelligenceRows, buildEventIntelligenceModel, buildLeaderboardIntelligenceRows, buildPlayerIntelligenceModel, buildSeasonComparisonModel, buildStrengthIntelligenceRows, filterActivityIntelligenceRows, filterDrillIntelligenceRows, filterLeaderboardIntelligenceRows, filterStrengthIntelligenceRows } from "./lib/coachOperationalIntelligence.js";\n',
  'import { buildActivityIntelligenceRows, buildDrillIntelligenceRows, buildEventIntelligenceModel, buildLeaderboardIntelligenceRows, buildPlayerIntelligenceModel, buildSeasonComparisonModel, buildStrengthIntelligenceRows, filterActivityIntelligenceRows, filterDrillIntelligenceRows, filterLeaderboardIntelligenceRows, filterStrengthIntelligenceRows } from "./lib/coachOperationalIntelligence.js";\nimport { derivePlayerDailyCommandCenter } from "./lib/playerDailyCommandCenter.js";\n'
);

replaceOnce(
  "completion cue next action",
  'pushCompletionCue({title:activeMode==="program"?"Program drill completed":"Drill completed",detail:`${active.name} · ${v}${hasDrillMax(active)?`/${active.max}`:""} logged`,momentum:`${Math.max(1,streak+(activeMode==="program"?0:1))}-day momentum`,next:activeMode==="program"?"Review Program leaderboard":"Log shots or complete your next drill"});',
  'pushCompletionCue({title:activeMode==="program"?"Program drill completed":"Drill completed",detail:`${active.name} · ${v}${hasDrillMax(active)?`/${active.max}`:""} logged`,momentum:`${Math.max(1,streak+(activeMode==="program"?0:1))}-day momentum`,next:activeMode==="program"?"Review Program leaderboard":"Continue today’s plan",nextAction:{target:activeMode==="program"?"duels":"home"}});'
);

replaceOnce(
  "daily action handler",
  'const playerMobileSecondaryItems=[\n  getPlayerNavItem("program",{mobileLabel:"Events",description:"Team schedule and RSVPs"}),\n  getPlayerNavItem("sc",{mobileLabel:"Lifting",description:"Strength and conditioning"}),\n  {k:"leaderboards",l:"Leaderboards",mobileLabel:"Rankings",description:"Current and all-time team rankings",accentVar:"--accent-feed",svg:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>},\n  getPlayerNavItem("profile",{mobileLabel:"Profile",description:"Progress, settings, and account"}),\n].filter(Boolean);\n\n\nreturn <div className={`app-shell performance-shell performance-shell--player ${isDesktop?"is-desktop":"is-mobile"}`} data-workspace-tab={tab}>',
  'const playerMobileSecondaryItems=[\n  getPlayerNavItem("program",{mobileLabel:"Events",description:"Team schedule and RSVPs"}),\n  getPlayerNavItem("sc",{mobileLabel:"Lifting",description:"Strength and conditioning"}),\n  {k:"leaderboards",l:"Leaderboards",mobileLabel:"Rankings",description:"Current and all-time team rankings",accentVar:"--accent-feed",svg:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>},\n  getPlayerNavItem("profile",{mobileLabel:"Profile",description:"Progress, settings, and account"}),\n].filter(Boolean);\nconst handleDailyCommandAction=useCallback((action={})=>{\n  const target=action?.target||"home";\n  const candidateDrills=target==="duels"?programDrills:drills;\n  const actionDrill=action?.drillId?candidateDrills.find((drill)=>String(drill?.id||drill?.drillId||drill?.drill_id||"")===String(action.drillId)):null;\n  switchTab(target);\n  if(actionDrill)window.setTimeout(()=>setActive(actionDrill),0);\n},[drills,programDrills,switchTab]);\n\nreturn <div className={`app-shell performance-shell performance-shell--player ${isDesktop?"is-desktop":"is-mobile"}`} data-workspace-tab={tab}>'
);

const cueRegex = /\{completionCue&&<div className="fade-up" style=\{\{position:"sticky",top:70,zIndex:18,margin:"8px 12px 0",padding:"12px 14px",borderRadius:14,background:"linear-gradient\(155deg, rgba\(200,255,26,0\.14\), rgba\(94,208,255,0\.08\)\)",border:"1px solid rgba\(200,255,26,0\.34\)",boxShadow:"0 12px 24px rgba\(0,0,0,0\.25\)"\}\}>[\s\S]*?<\/div>\}/;
if (!cueRegex.test(source)) throw new Error("completion banner: anchor missing");
source = source.replace(cueRegex, `{completionCue&&<div className="fade-up" data-testid="player-completion-cue" style={{position:"sticky",top:70,zIndex:18,margin:"8px 12px 0",padding:"12px 14px",borderRadius:14,background:"linear-gradient(155deg, rgba(200,255,26,0.14), rgba(94,208,255,0.08))",border:"1px solid rgba(200,255,26,0.34)",boxShadow:"0 12px 24px rgba(0,0,0,0.25)"}}>
  <div style={{fontFamily:FB,color:VOLT,fontSize:10,fontWeight:700,letterSpacing:"0.08em"}}>COMPLETED</div>
  <div style={{fontFamily:FD,color:LIGHT,fontSize:17,letterSpacing:1.2,marginTop:2}}>{completionCue.title}</div>
  <div style={{fontFamily:FB,color:T.SUB,fontSize:11,marginTop:2}}>{completionCue.detail}</div>
  <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:8}}>
    <span style={{fontFamily:FB,fontSize:10,color:CYAN,border:"1px solid rgba(94,208,255,0.28)",borderRadius:999,padding:"3px 8px"}}>{completionCue.momentum}</span>
    <span style={{fontFamily:FB,fontSize:10,color:LIGHT,border:"1px solid rgba(255,255,255,0.16)",borderRadius:999,padding:"3px 8px"}}>Next: {completionCue.next}</span>
  </div>
  {completionCue.nextAction&&<button type="button" onClick={()=>{handleDailyCommandAction(completionCue.nextAction);setCompletionCue(null);}} style={{marginTop:10,minHeight:44,width:"100%",border:0,borderRadius:10,background:VOLT,color:"#071007",fontFamily:FB,fontSize:11,fontWeight:800,letterSpacing:"0.08em",cursor:"pointer"}}>CONTINUE →</button>}
</div>}`);

replaceOnce(
  "daily model",
  '      const coachPresenceTimestamp=today===todayStr()?"Updated today":"Recently updated";\n      return <div className="player-home-compact-dashboard" style={{marginBottom:24,display:"grid",gap:"var(--player-dashboard-gap, 14px)"}}>',
  '      const coachPresenceTimestamp=today===todayStr()?"Updated today":"Recently updated";\n      const dailyCommandModel=derivePlayerDailyCommandCenter({today,userEmail:u?.email,teamId:u?.teamId,todayMakes:todaysMakes,weeklyMakes,dailyGoal,weeklyGoal:coachWeeklyMakesTarget,streak,leaderboardRank,drills,programDrills,todayHomeScores:todayS,todayProgramScores,events,rsvps,scSessions,scRsvps,shotLogs:normalizedShotLogs,scLogs:normalizedScLogs,coachPriorities});\n      return <div className="player-home-compact-dashboard" style={{marginBottom:24,display:"grid",gap:"var(--player-dashboard-gap, 14px)"}}>'
);

const objectiveRegex = /        <DominantObjectiveCard[\s\S]*?testId="player-primary-objective"[\s\S]*?<\/DominantObjectiveCard>\n        <MetricStrip[\s\S]*?testId="player-primary-metrics"[\s\S]*?\/>\n/;
if (!objectiveRegex.test(source)) throw new Error("command center replacement: anchor missing");
source = source.replace(objectiveRegex, '        <PlayerDailyCommandCenter model={dailyCommandModel} onAction={handleDailyCommandAction}/>\n');

replaceOnce(
  "quick shot completion cue",
  'if(result?.ok){if(result.mode==="local_pending"){setShotSaveNotice("Saved locally — team sync pending");setTimeout(()=>setShotSaveNotice(""),4200);}setShotSaved(true);setShotMade("");setTimeout(()=>setShotSaved(false),1800)}',
  'if(result?.ok){pushCompletionCue({title:"Shots logged",detail:`${validation.made} makes added to today’s total`,momentum:"Daily progress updated",next:"Return to the command center",nextAction:{target:"home"}});if(result.mode==="local_pending"){setShotSaveNotice("Saved locally — team sync pending");setTimeout(()=>setShotSaveNotice(""),4200);}setShotSaved(true);setShotMade("");setTimeout(()=>setShotSaved(false),1800)}'
);

fs.writeFileSync(path, source);
console.log("Player Experience Phase 1 integration applied.");
