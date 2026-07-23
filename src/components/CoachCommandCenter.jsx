import React, { useMemo, useState } from "react";
import { MetricStrip } from "./VisualHierarchy.jsx";

const FB="'Barlow Condensed','Arial Narrow','Helvetica Neue',sans-serif";
const FD="'Bebas Neue','Impact','Arial Black',sans-serif";

const utilityButtonStyle={
  flex:"0 0 auto",
  minHeight:40,
  padding:"0 12px",
  borderRadius:10,
  border:"1px solid var(--stroke-1)",
  background:"rgba(255,255,255,0.022)",
  color:"var(--text-2)",
  fontFamily:FB,
  fontSize:10,
  fontWeight:800,
  letterSpacing:"0.04em",
  textTransform:"uppercase",
  cursor:"pointer",
  whiteSpace:"nowrap",
};

export default function CoachCommandCenter({
  variant="full",
  totalPlayers,
  activeTodayCount,
  nextEventDateFormatted,
  highlightPlayersAttention,
  primaryQuickAction,
  onPlayersClick,
  onActiveTodayClick,
  onNextEventClick,
  onAddPlayer,
  onAddDrill,
  onScheduleEvent,
  onLogScore,
  joinCode,
  onCopyJoinCode,
  onRegenerateJoinCode,
  codeErr,
}) {
  const [copied, setCopied] = useState(false);
  const isCompact=variant==="compact";
  const quickActions=useMemo(()=>[
    { key:"addPlayer", label:"Add Player", onClick:onAddPlayer },
    { key:"addDrill", label:"Add Drill", onClick:onAddDrill },
    { key:"scheduleEvent", label:"Create Event", onClick:onScheduleEvent },
    { key:"logScore", label:"Log Score", onClick:onLogScore },
  ],[onAddDrill,onAddPlayer,onLogScore,onScheduleEvent]);
  const primaryAction=quickActions.find((action)=>action.key===primaryQuickAction) || quickActions[0];
  const secondaryActions=quickActions.filter((action)=>action.key!==primaryAction.key);
  const metrics=[
    { label:"Roster", value:totalPlayers ?? 0, detail:highlightPlayersAttention?"Needs attention":"Active players", onClick:onPlayersClick },
    { label:"Active Today", value:activeTodayCount ?? 0, detail:"Training activity", onClick:onActiveTodayClick },
    { label:"Next Session", value:nextEventDateFormatted || "—", detail:"Team schedule", onClick:onNextEventClick },
  ];

  if(isCompact){
    return (
      <section style={{padding:"6px 12px 8px"}} data-testid="coach-command-center-compact">
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,borderBottom:"1px solid var(--stroke-1)",padding:"7px 0 10px"}}>
          <div style={{minWidth:0}}>
            <div style={{fontFamily:FB,fontSize:9,color:"var(--text-3)",fontWeight:800,letterSpacing:"0.08em",textTransform:"uppercase"}}>Coach tools</div>
            <div style={{fontFamily:FB,fontSize:11,color:"var(--text-2)",marginTop:2}}>Quick access for this workspace.</div>
          </div>
          <button type="button" onClick={primaryAction.onClick} style={{minHeight:40,borderRadius:10,border:"1px solid var(--accent)",background:"var(--accent)",color:"#0b0d10",fontFamily:FB,fontSize:10,fontWeight:800,textTransform:"uppercase",padding:"7px 12px",cursor:"pointer",whiteSpace:"nowrap"}}>{primaryAction.label}</button>
        </div>
      </section>
    );
  }

  return (
    <section style={{padding:"4px 12px 10px"}} data-testid="coach-command-center-full">
      <div data-testid="coach-primary-objective" style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:14,padding:"12px 0",borderTop:"1px solid var(--stroke-1)",borderBottom:"1px solid var(--stroke-1)"}}>
        <div style={{minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            <span style={{fontFamily:FB,fontSize:9,color:"var(--accent)",fontWeight:800,letterSpacing:"0.1em",textTransform:"uppercase"}}>Today’s command</span>
            <span style={{fontFamily:FB,fontSize:9,color:highlightPlayersAttention?"var(--semantic-warning)":"var(--semantic-success)",fontWeight:800}}>{highlightPlayersAttention?"Roster follow-up":"Program ready"}</span>
          </div>
          <div style={{fontFamily:FD,fontSize:22,color:"var(--text-1)",letterSpacing:"0.035em",lineHeight:1,marginTop:5,textTransform:"uppercase"}}>{primaryAction.label}</div>
          <div style={{fontFamily:FB,fontSize:11,color:"var(--text-3)",marginTop:4,lineHeight:1.35}}>Start here, then use the compact tools below as needed.</div>
        </div>
        <button type="button" onClick={primaryAction.onClick} style={{flexShrink:0,minHeight:46,borderRadius:12,border:"1px solid var(--accent)",background:"var(--accent)",color:"#0b0d10",fontFamily:FB,fontSize:11,fontWeight:900,textTransform:"uppercase",padding:"9px 15px",cursor:"pointer",whiteSpace:"nowrap"}}>{primaryAction.label}</button>
      </div>

      <MetricStrip
        testId="coach-primary-metrics"
        items={metrics.map((metric)=>({
          label:metric.label,
          value:<button type="button" onClick={metric.onClick} style={{border:0,background:"transparent",color:"inherit",font:"inherit",padding:0,cursor:"pointer"}}>{metric.value}</button>,
          detail:metric.detail,
        }))}
      />

      <div data-testid="coach-secondary-tools" role="group" aria-label="Coach utility actions" style={{display:"flex",alignItems:"center",gap:7,overflowX:"auto",padding:"10px 0 4px",scrollbarWidth:"none"}}>
        {secondaryActions.map((action)=><button key={action.key} type="button" onClick={action.onClick} style={utilityButtonStyle}>{action.label}</button>)}
      </div>

      <div data-testid="coach-team-code-bar" style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,marginTop:7,padding:"9px 0 2px",borderTop:"1px solid var(--stroke-1)"}}>
        <div style={{minWidth:0}}>
          <div style={{fontFamily:FB,fontSize:9,color:"var(--text-3)",fontWeight:800,letterSpacing:"0.08em",textTransform:"uppercase"}}>Team code</div>
          <div style={{fontFamily:FD,fontSize:20,color:"var(--text-1)",letterSpacing:3,lineHeight:1.1,marginTop:3}}>{joinCode||"—"}</div>
          {codeErr?<div style={{color:"var(--semantic-danger)",fontFamily:FB,fontSize:10,marginTop:3}}>{codeErr}</div>:null}
        </div>
        <div style={{display:"flex",gap:6,flexShrink:0}}>
          <button type="button" onClick={()=>{onCopyJoinCode?.();setCopied(true);setTimeout(()=>setCopied(false),1600);}} style={{...utilityButtonStyle,border:"1px solid var(--accent)",color:"var(--accent)"}}>{copied?"Copied":"Copy"}</button>
          <button type="button" onClick={onRegenerateJoinCode} style={utilityButtonStyle}>New code</button>
        </div>
      </div>
    </section>
  );
}
