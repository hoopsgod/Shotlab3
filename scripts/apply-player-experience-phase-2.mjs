import fs from "node:fs";

const path = "src/App.jsx";
let source = fs.readFileSync(path, "utf8");

const replaceOnce = (label, from, to) => {
  if (!source.includes(from)) throw new Error(`${label}: anchor missing`);
  source = source.replace(from, to);
};

replaceOnce(
  "component imports",
  'import PlayerDailyCommandCenter from "./components/PlayerDailyCommandCenter.jsx";\n',
  'import PlayerDailyCommandCenter from "./components/PlayerDailyCommandCenter.jsx";\nimport { PlayerWorkspaceCommandBar, PlayerWorkspaceEmptyState, PlayerWorkspaceFilterRail } from "./components/PlayerOperationalWorkspace.jsx";\n'
);

replaceOnce(
  "selector imports",
  'import { derivePlayerDailyCommandCenter } from "./lib/playerDailyCommandCenter.js";\n',
  'import { derivePlayerDailyCommandCenter } from "./lib/playerDailyCommandCenter.js";\nimport { buildAtHomeWorkspaceModel, buildEventsWorkspaceModel, buildLeaderboardWorkspaceModel, buildProfileWorkspaceModel, buildProgramWorkspaceModel, buildStrengthWorkspaceModel, filterAtHomeDrills, filterProgramSessionBlocks } from "./lib/playerOperationalWorkspaces.js";\n'
);

replaceOnce(
  "workspace filter state",
  'const[pbReveal,setPbReveal]=useState(null);\n',
  'const[homeDrillFilter,setHomeDrillFilter]=useState("all");\nconst[programDrillFilter,setProgramDrillFilter]=useState("all");\nconst[pbReveal,setPbReveal]=useState(null);\n'
);

replaceOnce(
  "workspace models",
  'const playerDashboardLeaderboardStatus=playerLeaderboardState.status==="success"||playerDashboardHomeLeaderboardRows.length>0?"success":playerLeaderboardState.status;\n',
  `const playerDashboardLeaderboardStatus=playerLeaderboardState.status==="success"||playerDashboardHomeLeaderboardRows.length>0?"success":playerLeaderboardState.status;
const playerWeeklyMakes=useMemo(()=>{const cutoff=new Date(\`${today}T00:00:00\`);cutoff.setDate(cutoff.getDate()-6);const start=\`${cutoff.getFullYear()}-${String(cutoff.getMonth()+1).padStart(2,"0")}-${String(cutoff.getDate()).padStart(2,"0")}\`;return shotLogs.filter((row)=>rowMatchesPlayerIdentity(row)&&(!u?.teamId||!String(row?.teamId||row?.team_id||"")||String(row?.teamId||row?.team_id)===String(u.teamId))&&String(row?.date||"")>=start).reduce((sum,row)=>sum+Number(row?.made||0),0);},[shotLogs,rowMatchesPlayerIdentity,u?.teamId,today]);
const atHomeWorkspaceModel=useMemo(()=>buildAtHomeWorkspaceModel({today,userEmail:u?.email,teamId:u?.teamId,drills,todayScores:todayS,shotLogs,streak,dailyGoal:PLAYER_DAILY_SHOT_TARGET}),[today,u?.email,u?.teamId,drills,todayS,shotLogs,streak]);
const programWorkspaceModel=useMemo(()=>buildProgramWorkspaceModel({programDrills,todayScores:todayProgramScores,allScores:programScores,coachPriorities}),[programDrills,todayProgramScores,programScores,coachPriorities]);
const eventsWorkspaceModel=useMemo(()=>buildEventsWorkspaceModel({events,rsvps,userEmail:u?.email,teamId:u?.teamId,today}),[events,rsvps,u?.email,u?.teamId,today]);
const strengthWorkspaceModel=useMemo(()=>buildStrengthWorkspaceModel({sessions:scSessions,rsvps:scRsvps,logs:scLogs,userEmail:u?.email,teamId:u?.teamId,today}),[scSessions,scRsvps,scLogs,u?.email,u?.teamId,today]);
const leaderboardWorkspaceModel=useMemo(()=>buildLeaderboardWorkspaceModel({rows:playerDashboardLeaderboardRows,userEmail:u?.email,weeklyMakes:playerWeeklyMakes,streak}),[playerDashboardLeaderboardRows,u?.email,playerWeeklyMakes,streak]);
const profileWorkspaceModel=useMemo(()=>buildProfileWorkspaceModel({shotLogs,scores,rsvps,scLogs,userEmail:u?.email,teamId:u?.teamId,streak}),[shotLogs,scores,rsvps,scLogs,u?.email,u?.teamId,streak]);
const visibleHomeDrills=useMemo(()=>filterAtHomeDrills({drills,todayScores:todayS,filter:homeDrillFilter}),[drills,todayS,homeDrillFilter]);
const visibleProgramSessionBlocks=useMemo(()=>filterProgramSessionBlocks({blocks:programSessionBlocks.grouped,todayScores:todayProgramScores,filter:programDrillFilter}),[programSessionBlocks.grouped,todayProgramScores,programDrillFilter]);
`
);

replaceOnce(
  "workspace action handler",
  `const handleDailyCommandAction=useCallback((action={})=>{
  const target=action?.target||"home";
  const candidateDrills=target==="duels"?programDrills:drills;
  const actionDrill=action?.drillId?candidateDrills.find((drill)=>String(drill?.id||drill?.drillId||drill?.drill_id||"")===String(action.drillId)):null;
  switchTab(target);
  if(actionDrill)window.setTimeout(()=>setActive(actionDrill),0);
},[drills,programDrills,switchTab]);
`,
  `const handleDailyCommandAction=useCallback((action={})=>{
  const target=action?.target||"home";
  const candidateDrills=target==="duels"?programDrills:drills;
  const actionDrill=action?.drillId?candidateDrills.find((drill)=>String(drill?.id||drill?.drillId||drill?.drill_id||"")===String(action.drillId)):null;
  switchTab(target);
  if(actionDrill)window.setTimeout(()=>setActive(actionDrill),0);
},[drills,programDrills,switchTab]);
const handlePlayerWorkspaceAction=useCallback((action={})=>{
  if(action?.focus==="shot-stats"){switchTab("log-drill");setShowShotStats(true);return;}
  handleDailyCommandAction(action);
},[handleDailyCommandAction,switchTab]);
const handleAtHomeMetric=useCallback((metric)=>{if(metric?.filter){setHomeDrillFilter(metric.filter);return;}handlePlayerWorkspaceAction(metric?.action||atHomeWorkspaceModel.primaryAction);},[atHomeWorkspaceModel.primaryAction,handlePlayerWorkspaceAction]);
const handleProgramMetric=useCallback((metric)=>{if(metric?.filter){setProgramDrillFilter(metric.filter);return;}handlePlayerWorkspaceAction(metric?.action||programWorkspaceModel.primaryAction);},[programWorkspaceModel.primaryAction,handlePlayerWorkspaceAction]);
`
);

replaceOnce(
  "at home legacy heading",
  `    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={VOLT} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5L12 3l9 6.5"/><path d="M19 13v6a1 1 0 01-1 1H6a1 1 0 01-1-1v-6"/></svg>
      <div style={{fontFamily:FD,color:VOLT,fontSize:22,letterSpacing:3}}>AT HOME</div>
    </div>
    <div style={{fontFamily:FB,color:MUTED,fontSize:12,marginBottom:24,fontWeight:500}}>Log your daily drills and track shots — all on the honor system.</div>
`,
  `    <PlayerWorkspaceCommandBar model={atHomeWorkspaceModel} activeMetric={homeDrillFilter==="open"?"open":homeDrillFilter==="completed"?"complete":""} onAction={handlePlayerWorkspaceAction} onMetric={handleAtHomeMetric} testId="player-at-home-workspace"/>
    <PlayerWorkspaceFilterRail value={homeDrillFilter} onChange={setHomeDrillFilter} ariaLabel="At Home drill filters" testId="player-at-home-filter-rail" options={[{value:"all",label:"All drills",count:drills.length},{value:"open",label:"Open",count:atHomeWorkspaceModel.metrics.find(metric=>metric.id==="open")?.value||0},{value:"completed",label:"Completed",count:atHomeWorkspaceModel.metrics.find(metric=>metric.id==="complete")?.value||0}]}/>
`
);

replaceOnce(
  "at home drill rows",
  '    {drills.map(d=>{const done=todayS.find(s=>s.drillId===d.id);\n',
  '    {visibleHomeDrills.length===0&&<PlayerWorkspaceEmptyState title={homeDrillFilter==="open"?"All assigned drills are complete":"No completed drills yet"} detail={homeDrillFilter==="open"?"Your daily drill block is finished. Add quality makes or review your stats.":"Complete a drill and it will appear here."} actionLabel={homeDrillFilter==="open"?"Review shot stats":"Show open drills"} onAction={()=>homeDrillFilter==="open"?setShowShotStats(true):setHomeDrillFilter("open")}/>}\n    {visibleHomeDrills.map(d=>{const done=todayS.find(s=>s.drillId===d.id);\n'
);

replaceOnce(
  "events workspace",
  '{tab==="program"&&<div className={slideClass} key="program"><SectionHero icon={<EventIcon type="star" size={28} color={VOLT}/>} title="PROGRAM EVENTS" subtitle="Official workouts and attendance" accent={VOLT} deco={<EventIcon type="run" size={16} color={VOLT}/>} isCoach={u.isCoach}/><EventsPanel events={events} rsvps={rsvps} user={u} toggleRsvp={toggleRsvp} scores={scores} drills={drills} onCompletionCue={pushCompletionCue}/></div>}\n',
  '{tab==="program"&&<div className={slideClass} key="program"><PlayerWorkspaceCommandBar model={eventsWorkspaceModel} onAction={handlePlayerWorkspaceAction} onMetric={()=>document.querySelector("[data-testid=player-events-operational-list]")?.scrollIntoView({behavior:"smooth",block:"start"})} testId="player-events-workspace"/><div data-testid="player-events-operational-list"><EventsPanel events={events} rsvps={rsvps} user={u} toggleRsvp={toggleRsvp} scores={scores} drills={drills} onCompletionCue={pushCompletionCue}/></div></div>}\n'
);

replaceOnce(
  "program legacy heading",
  `    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h10"/></svg>
      <div style={{fontFamily:FD,color:CYAN,fontSize:22,letterSpacing:3}}>PROGRAM LOG</div>
    </div>
    <div style={{fontFamily:FB,color:CYAN,fontSize:12,marginBottom:24,fontWeight:500,textShadow:\`0 0 18px \${CYAN}18\`}}>Log your coach-assigned program drills and keep the team leaderboard moving.</div>
`,
  `    <PlayerWorkspaceCommandBar model={programWorkspaceModel} activeMetric={programDrillFilter==="open"?"open":programDrillFilter==="completed"?"complete":""} onAction={handlePlayerWorkspaceAction} onMetric={handleProgramMetric} testId="player-program-workspace"/>
    <PlayerWorkspaceFilterRail value={programDrillFilter} onChange={setProgramDrillFilter} ariaLabel="Program drill filters" testId="player-program-filter-rail" options={[{value:"all",label:"Full plan",count:programDrills.length},{value:"open",label:"Open",count:programWorkspaceModel.metrics.find(metric=>metric.id==="open")?.value||0},{value:"completed",label:"Completed",count:programWorkspaceModel.metrics.find(metric=>metric.id==="complete")?.value||0}]}/>
`
);

replaceOnce(
  "program filtered blocks",
  '    {programSessionBlocks.grouped.map((block,blockIndex)=><div key={block.phase}',
  '    {visibleProgramSessionBlocks.length===0&&<PlayerWorkspaceEmptyState title={programDrillFilter==="open"?"Program plan complete":"No completed Program drills yet"} detail={programDrillFilter==="open"?"Every coach-assigned drill is complete for today.":"Complete a Program drill and it will appear here."} actionLabel={programDrillFilter==="open"?"Review rankings":"Show open drills"} onAction={()=>programDrillFilter==="open"?switchTab("leaderboards"):setProgramDrillFilter("open")}/>}\n    {visibleProgramSessionBlocks.map((block,blockIndex)=><div key={block.phase}'
);

replaceOnce(
  "leaderboards workspace",
  '  {tab==="leaderboards"&&!active&&<div className={slideClass} key="leaderboards">\n    <PremiumLeaderboardsHub',
  '  {tab==="leaderboards"&&!active&&<div className={slideClass} key="leaderboards">\n    <PlayerWorkspaceCommandBar model={leaderboardWorkspaceModel} onAction={handlePlayerWorkspaceAction} onMetric={(metric)=>handlePlayerWorkspaceAction(metric?.action||{target:"leaderboards"})} testId="player-leaderboards-workspace"/>\n    <PremiumLeaderboardsHub'
);

replaceOnce(
  "strength workspace",
  '{tab==="sc"&&<div className={slideClass} key="sc"><SectionHero icon={<LiftIcon size={28} color="#A0A0A0"/>} title="STRENGTH & CONDITIONING" subtitle="Log sessions and build consistency" accent="#A0A0A0" deco={<LiftIcon size={16} color="#A0A0A0"/>} isCoach={u.isCoach}/><SCPanel sessions={scSessions} scRsvps={scRsvps} user={u} toggleScRsvp={toggleScRsvp} scLogs={scLogs} addScLog={addScLog} players={players} onCompletionCue={pushCompletionCue}/></div>}\n',
  '{tab==="sc"&&<div className={slideClass} key="sc"><PlayerWorkspaceCommandBar model={strengthWorkspaceModel} onAction={handlePlayerWorkspaceAction} onMetric={()=>document.querySelector("[data-testid=player-strength-operational-panel]")?.scrollIntoView({behavior:"smooth",block:"start"})} testId="player-strength-workspace"/><div data-testid="player-strength-operational-panel"><SCPanel sessions={scSessions} scRsvps={scRsvps} user={u} toggleScRsvp={toggleScRsvp} scLogs={scLogs} addScLog={addScLog} players={players} onCompletionCue={pushCompletionCue}/></div></div>}\n'
);

replaceOnce(
  "profile workspace",
  '{tab==="profile"&&<div className={slideClass} key="profile"><ProfilePage u={u} scores={scores} shotLogs={shotLogs} drills={drills} programDrills={programDrills} programScores={programScores} rsvps={rsvps} events={events} players={players} scRsvps={scRsvps} challenges={challenges} streak={streak} earnedBadges={earnedBadges} T={T} deleteAccount={deleteAccount} onToggleLeaderboardVisibility={toggleLeaderboardVisibility}/></div>}\n',
  '{tab==="profile"&&<div className={slideClass} key="profile"><PlayerWorkspaceCommandBar model={profileWorkspaceModel} onAction={handlePlayerWorkspaceAction} onMetric={(metric)=>handlePlayerWorkspaceAction(metric?.action||{target:"profile"})} testId="player-profile-workspace"/><ProfilePage u={u} scores={scores} shotLogs={shotLogs} drills={drills} programDrills={programDrills} programScores={programScores} rsvps={rsvps} events={events} players={players} scRsvps={scRsvps} challenges={challenges} streak={streak} earnedBadges={earnedBadges} T={T} deleteAccount={deleteAccount} onToggleLeaderboardVisibility={toggleLeaderboardVisibility}/></div>}\n'
);

fs.writeFileSync(path, source);
console.log("Player Experience Phase 2 integration applied.");
