const APP_SUFFIX = "/src/App.jsx";

function replaceRequired(source, label, needle, replacement) {
  if (!source.includes(needle)) {
    throw new Error(`Player workspaces Phase 2 transform failed: missing ${label}`);
  }
  return source.replace(needle, replacement);
}

export function applyPlayerWorkspacesPhase2(source) {
  let next = String(source || "");

  next = replaceRequired(
    next,
    "workspace import anchor",
    'import PlayerDailyCommandCenter from "./components/PlayerDailyCommandCenter.jsx";',
    'import PlayerDailyCommandCenter from "./components/PlayerDailyCommandCenter.jsx";\nimport { PlayerAtHomeWorkspace, PlayerProgramWorkspace } from "./components/PlayerTrainingWorkspaces.jsx";'
  );

  next = replaceRequired(
    next,
    "At Home legacy header",
    `{(tab==="log-drill")&&!active&&!showShotStats&&<div className="fade-up">\n    \n    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>\n      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={VOLT} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5L12 3l9 6.5"/><path d="M19 13v6a1 1 0 01-1 1H6a1 1 0 01-1-1v-6"/></svg>\n      <div style={{fontFamily:FD,color:VOLT,fontSize:22,letterSpacing:3}}>AT HOME</div>\n    </div>\n    <div style={{fontFamily:FB,color:MUTED,fontSize:12,marginBottom:24,fontWeight:500}}>Log your daily drills and track shots — all on the honor system.</div>`,
    `{(tab==="log-drill")&&!active&&!showShotStats&&<div className="fade-up">\n    <PlayerAtHomeWorkspace\n      today={today}\n      userEmail={u?.email||""}\n      shotLogs={shotLogs}\n      drills={drills}\n      todayScores={todayS}\n      onOpenDrill={setActive}\n      onViewStats={()=>setShowShotStats(true)}\n    />`
  );

  next = replaceRequired(
    next,
    "Program legacy header",
    `{tab==="duels"&&!active&&<div className="fade-up">\n    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>\n      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h10"/></svg>\n      <div style={{fontFamily:FD,color:CYAN,fontSize:22,letterSpacing:3}}>PROGRAM LOG</div>\n    </div>\n    <div style={{fontFamily:FB,color:CYAN,fontSize:12,marginBottom:24,fontWeight:500,textShadow:\`0 0 18px \${CYAN}18\`}}>Log your coach-assigned program drills and keep the team leaderboard moving.</div>\n\n    <div style={{fontFamily:FB,color:CYAN,fontSize:10,letterSpacing:3,fontWeight:700,marginBottom:8,textShadow:\`0 0 16px \${CYAN}18\`}}>PROGRAM DRILLS · {todayProgramScores.length}/{programDrills.length} DONE</div>\n    <div style={{width:"100%",height:4,background:"#242424",borderRadius:2,overflow:"hidden",marginBottom:12}}><div style={{width:\`\${programDrills.length>0?Math.min(100,Math.round(todayProgramScores.length/programDrills.length*100)):0}%\`,height:"100%",background:CYAN,borderRadius:2,transition:"width .25s ease"}}/></div>`,
    `{tab==="duels"&&!active&&<div className="fade-up">\n    <PlayerProgramWorkspace\n      programDrills={programDrills}\n      todayProgramScores={todayProgramScores}\n      nextPriorityId={programSessionBlocks?.nextPriority}\n      onOpenDrill={setActive}\n    />`
  );

  return next;
}

export default function playerWorkspacesPhase2Plugin() {
  return {
    name: "shotlab-player-workspaces-phase-2",
    enforce: "pre",
    transform(code, id) {
      const cleanId = String(id || "").split("?")[0].replaceAll("\\", "/");
      if (!cleanId.endsWith(APP_SUFFIX)) return null;
      return { code: applyPlayerWorkspacesPhase2(code), map: null };
    },
  };
}
