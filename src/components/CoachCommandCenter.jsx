import React, { useMemo, useState } from "react";

const FB="'Barlow Condensed','Arial Narrow','Helvetica Neue',sans-serif";
const FD="'Bebas Neue','Impact','Arial Black',sans-serif";

const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
const pct=(value,total)=>total>0?Math.round((Math.max(0,value)/total)*100):0;

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

const cardStyle={
  border:"1px solid var(--stroke-1)",
  borderRadius:14,
  background:"linear-gradient(158deg, rgba(255,255,255,0.035), rgba(0,0,0,0.16))",
  padding:"12px",
};

function MiniList({ title, items, emptyText, testId }) {
  return <section data-testid={testId} style={cardStyle}>
    <div style={{fontFamily:FB,fontSize:9,color:"var(--text-3)",fontWeight:900,letterSpacing:"0.09em",textTransform:"uppercase"}}>{title}</div>
    <div style={{display:"grid",gap:7,marginTop:9}}>
      {items.length===0?<div style={{fontFamily:FB,fontSize:11,color:"var(--text-3)",lineHeight:1.4}}>{emptyText}</div>:items.map((item,index)=><div key={`${item.title}-${index}`} style={{display:"grid",gridTemplateColumns:"8px 1fr auto",alignItems:"center",gap:8,paddingTop:index?7:0,borderTop:index?"1px solid rgba(255,255,255,0.07)":"none"}}>
        <span aria-hidden="true" style={{width:7,height:7,borderRadius:999,background:item.tone||"var(--accent)",boxShadow:`0 0 12px ${item.tone||"var(--accent)"}66`}}/>
        <div style={{minWidth:0}}>
          <div style={{fontFamily:FB,color:"var(--text-1)",fontSize:11,fontWeight:800,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{item.title}</div>
          {item.detail?<div style={{fontFamily:FB,color:"var(--text-3)",fontSize:9,marginTop:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{item.detail}</div>:null}
        </div>
        {item.meta?<span style={{fontFamily:FB,color:item.tone||"var(--text-2)",fontSize:9,fontWeight:900,whiteSpace:"nowrap"}}>{item.meta}</span>:null}
      </div>)}
    </div>
  </section>;
}

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
  teamHealthScore,
  attentionItems=[],
  momentumItems=[],
  activityItems=[],
  upcomingItems=[],
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
  const rosterSize=Math.max(0,Number(totalPlayers)||0);
  const activeCount=Math.max(0,Number(activeTodayCount)||0);
  const activePct=pct(activeCount,rosterSize);
  const calculatedHealth=clamp(Math.round((activePct*0.62)+(nextEventDateFormatted?28:10)+(highlightPlayersAttention?-10:10)),0,100);
  const health=Number.isFinite(Number(teamHealthScore))?clamp(Math.round(Number(teamHealthScore)),0,100):calculatedHealth;
  const healthLabel=health>=85?"Program strong":health>=65?"Building momentum":"Needs attention";
  const healthTone=health>=85?"var(--semantic-success)":health>=65?"var(--semantic-warning)":"var(--semantic-danger)";

  const resolvedAttention=attentionItems.length?attentionItems:(highlightPlayersAttention?[{title:"Roster follow-up",detail:"One or more athletes need coach attention",meta:"Review",tone:"var(--semantic-warning)"}]:[]);
  const resolvedMomentum=momentumItems.length?momentumItems:(activeCount>0?[{title:`${activeCount} athlete${activeCount===1?"":"s"} active today`,detail:`${activePct}% of the roster has logged activity`,meta:"Rising",tone:"var(--semantic-success)"}]:[]);
  const resolvedActivity=activityItems.length?activityItems:(activeCount>0?[{title:"Team activity is moving",detail:"Open Players to review today's athlete work",meta:"Today",tone:"var(--accent)"}]:[]);
  const resolvedUpcoming=upcomingItems.length?upcomingItems:(nextEventDateFormatted?[{title:"Next team session",detail:nextEventDateFormatted,meta:"Open",tone:"var(--semantic-info)"}]:[]);

  if(isCompact){
    return (
      <section style={{padding:"6px 12px 8px"}} data-testid="coach-command-center-compact">
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,borderBottom:"1px solid var(--stroke-1)",padding:"7px 0 10px"}}>
          <div style={{minWidth:0}}>
            <div style={{fontFamily:FB,fontSize:9,color:"var(--text-3)",fontWeight:800,letterSpacing:"0.08em",textTransform:"uppercase"}}>Coach command</div>
            <div style={{fontFamily:FB,fontSize:11,color:"var(--text-2)",marginTop:2}}>{health}% team health · {activeCount} active today</div>
          </div>
          <button type="button" onClick={primaryAction.onClick} style={{minHeight:40,borderRadius:10,border:"1px solid var(--accent)",background:"var(--accent)",color:"#0b0d10",fontFamily:FB,fontSize:10,fontWeight:800,textTransform:"uppercase",padding:"7px 12px",cursor:"pointer",whiteSpace:"nowrap"}}>{primaryAction.label}</button>
        </div>
      </section>
    );
  }

  return (
    <section style={{padding:"4px 12px 12px"}} data-testid="coach-command-center-full">
      <div data-testid="coach-team-health" style={{...cardStyle,padding:"15px",background:"linear-gradient(145deg, color-mix(in srgb, var(--accent) 12%, rgba(18,20,23,0.98)), rgba(5,6,8,0.96) 72%)",boxShadow:"0 18px 40px rgba(0,0,0,0.24)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:14}}>
          <div style={{minWidth:0}}>
            <div style={{fontFamily:FB,fontSize:9,color:"var(--accent)",fontWeight:900,letterSpacing:"0.11em",textTransform:"uppercase"}}>Team health</div>
            <div style={{display:"flex",alignItems:"baseline",gap:8,marginTop:5}}><span style={{fontFamily:FD,fontSize:42,lineHeight:0.95,color:"var(--text-1)",letterSpacing:"0.02em"}}>{health}</span><span style={{fontFamily:FB,fontSize:11,color:healthTone,fontWeight:900}}>{healthLabel}</span></div>
            <div style={{fontFamily:FB,fontSize:10,color:"var(--text-3)",marginTop:6}}>Training activity, roster attention, and schedule readiness.</div>
          </div>
          <button type="button" onClick={primaryAction.onClick} style={{flexShrink:0,minHeight:44,borderRadius:11,border:"1px solid var(--accent)",background:"var(--accent)",color:"#0b0d10",fontFamily:FB,fontSize:10,fontWeight:900,textTransform:"uppercase",padding:"8px 13px",cursor:"pointer",whiteSpace:"nowrap"}}>{primaryAction.label}</button>
        </div>
        <div aria-label={`Team health ${health} percent`} style={{height:7,borderRadius:999,background:"rgba(255,255,255,0.08)",overflow:"hidden",marginTop:13}}><div style={{width:`${health}%`,height:"100%",borderRadius:999,background:healthTone,boxShadow:`0 0 16px ${healthTone}` ,transition:"width 420ms ease"}}/></div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:1,marginTop:13,border:"1px solid var(--stroke-1)",borderRadius:11,overflow:"hidden"}}>
          {[
            {label:"Roster",value:rosterSize,detail:highlightPlayersAttention?"Review":"Ready",onClick:onPlayersClick},
            {label:"Active Today",value:activeCount,detail:`${activePct}%`,onClick:onActiveTodayClick},
            {label:"Next Session",value:nextEventDateFormatted||"—",detail:nextEventDateFormatted?"Scheduled":"Not set",onClick:onNextEventClick},
          ].map((metric)=><button key={metric.label} type="button" onClick={metric.onClick} style={{minWidth:0,border:0,borderLeft:metric.label!=="Roster"?"1px solid var(--stroke-1)":"none",background:"rgba(255,255,255,0.018)",padding:"10px 7px",cursor:"pointer",textAlign:"center"}}><div style={{fontFamily:FD,color:"var(--text-1)",fontSize:18,lineHeight:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{metric.value}</div><div style={{fontFamily:FB,color:"var(--text-3)",fontSize:8,fontWeight:800,letterSpacing:"0.05em",textTransform:"uppercase",marginTop:5}}>{metric.label}</div><div style={{fontFamily:FB,color:"var(--text-2)",fontSize:8,marginTop:2}}>{metric.detail}</div></button>)}
        </div>
      </div>

      <div data-testid="coach-command-grid" style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:8,marginTop:9}}>
        <MiniList title="Needs attention" items={resolvedAttention} emptyText="No urgent athlete follow-up is currently surfaced." testId="coach-needs-attention"/>
        <MiniList title="Team momentum" items={resolvedMomentum} emptyText="Momentum signals will appear after athlete activity." testId="coach-team-momentum"/>
        <MiniList title="Live activity" items={resolvedActivity} emptyText="Recent team activity will appear here." testId="coach-live-activity"/>
        <MiniList title="Upcoming" items={resolvedUpcoming} emptyText="Create the next event to establish the team rhythm." testId="coach-upcoming"/>
      </div>

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
