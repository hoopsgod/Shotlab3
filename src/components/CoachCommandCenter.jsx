import React, { useMemo, useState } from "react";
import {
  DominantObjectiveCard,
  MetricStrip,
  ProgressiveDisclosure,
} from "./VisualHierarchy.jsx";

const FB="'Barlow Condensed','Arial Narrow','Helvetica Neue',sans-serif";

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
      <section style={{padding:"8px 12px 12px"}} data-testid="coach-command-center-compact">
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,borderTop:"1px solid var(--stroke-1)",borderBottom:"1px solid var(--stroke-1)",padding:"9px 0"}}>
          <div style={{minWidth:0}}>
            <div style={{fontFamily:FB,fontSize:10,color:"var(--text-3)",fontWeight:800,letterSpacing:"0.08em",textTransform:"uppercase"}}>Coach tools</div>
            <div style={{fontFamily:FB,fontSize:12,color:"var(--text-2)",marginTop:2}}>Keep the current workspace focused.</div>
          </div>
          <button type="button" onClick={primaryAction.onClick} style={{minHeight:42,borderRadius:11,border:"1px solid var(--accent)",background:"var(--accent)",color:"#0b0d10",fontFamily:FB,fontSize:11,fontWeight:800,textTransform:"uppercase",padding:"8px 13px",cursor:"pointer",whiteSpace:"nowrap"}}>{primaryAction.label}</button>
        </div>
      </section>
    );
  }

  return (
    <section style={{padding:"12px 12px 14px"}} data-testid="coach-command-center-full">
      <DominantObjectiveCard
        eyebrow="Today’s command"
        title={primaryAction.label}
        description="Take the highest-value action first. Roster, schedule, and supporting tools remain available below without competing for attention."
        actionLabel={primaryAction.label}
        onAction={primaryAction.onClick}
        badge={highlightPlayersAttention?"Roster follow-up":"Program ready"}
        testId="coach-primary-objective"
      />

      <MetricStrip
        testId="coach-primary-metrics"
        items={metrics.map((metric)=>({
          label:metric.label,
          value:<button type="button" onClick={metric.onClick} style={{border:0,background:"transparent",color:"inherit",font:"inherit",padding:0,cursor:"pointer"}}>{metric.value}</button>,
          detail:metric.detail,
        }))}
      />

      <ProgressiveDisclosure
        title="Program tools"
        summary="Secondary actions and team access code"
        testId="coach-secondary-tools"
      >
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:8}}>
          {secondaryActions.map((action)=><button key={action.key} type="button" onClick={action.onClick} style={{minHeight:44,borderRadius:11,border:"1px solid var(--stroke-1)",background:"rgba(255,255,255,0.025)",color:"var(--text-2)",fontFamily:FB,fontSize:11,fontWeight:800,textTransform:"uppercase",cursor:"pointer",padding:"8px"}}>{action.label}</button>)}
        </div>
        <div style={{marginTop:14,paddingTop:14,borderTop:"1px solid var(--stroke-1)"}}>
          <div style={{fontFamily:FB,fontSize:10,color:"var(--text-3)",fontWeight:800,letterSpacing:"0.08em",textTransform:"uppercase"}}>Team access code</div>
          <p style={{margin:"5px 0 0",fontFamily:FB,fontSize:12,color:"var(--text-2)"}}>Share this code with athletes to join the program.</p>
          <div style={{display:"flex",alignItems:"center",gap:8,marginTop:9,flexWrap:"wrap"}}>
            <div style={{fontFamily:"'Bebas Neue','Impact','Arial Black',sans-serif",fontSize:26,color:"var(--text-1)",letterSpacing:4,minWidth:112}}>{joinCode||"—"}</div>
            <button type="button" onClick={()=>{onCopyJoinCode?.();setCopied(true);setTimeout(()=>setCopied(false),1600);}} style={{minHeight:40,borderRadius:10,border:"1px solid var(--accent)",background:"var(--accent)",color:"#0b0d10",fontFamily:FB,fontSize:11,fontWeight:800,padding:"8px 12px",cursor:"pointer"}}>Copy</button>
            <button type="button" onClick={onRegenerateJoinCode} style={{minHeight:40,borderRadius:10,border:"1px solid var(--stroke-1)",background:"transparent",color:"var(--text-2)",fontFamily:FB,fontSize:11,fontWeight:800,padding:"8px 12px",cursor:"pointer"}}>Regenerate</button>
          </div>
          {copied?<div style={{color:"var(--accent)",fontSize:11,marginTop:7,fontWeight:700}}>Copied to clipboard.</div>:null}
          {codeErr?<div style={{color:"#FF6969",fontSize:11,marginTop:7}}>{codeErr}</div>:null}
        </div>
      </ProgressiveDisclosure>
    </section>
  );
}
