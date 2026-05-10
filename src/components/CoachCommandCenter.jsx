import React from "react";
import { useMemo, useState } from "react";
import { DSButton, DSCard, DSChip, DSMetricCard } from "./ui/designSystem";

const FB="'Barlow Condensed','Arial Narrow','Helvetica Neue',sans-serif";
const FD="'Bebas Neue','Impact','Arial Black',sans-serif";

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
    { key:"addPlayer", label:"+ Add Player", short:"+ Player", onClick:onAddPlayer },
    { key:"addDrill", label:"+ Add Drill", short:"+ Drill", onClick:onAddDrill },
    { key:"scheduleEvent", label:"+ Schedule Event", short:"+ Event", onClick:onScheduleEvent },
    { key:"logScore", label:"+ Log Score", short:"+ Score", onClick:onLogScore },
  ],[onAddDrill,onAddPlayer,onLogScore,onScheduleEvent]);
  const primaryAction=quickActions.find((action)=>action.key===primaryQuickAction) || quickActions[0];
  const secondaryActions=quickActions.filter((action)=>action.key!==primaryAction.key);

  const metricBase={
    minHeight:72,
    borderRadius:14,
    border:"1px solid color-mix(in srgb, var(--accent) 12%, var(--stroke-1))",
    background:"linear-gradient(165deg, rgba(255,255,255,0.06), rgba(0,0,0,0.32) 62%)",
    padding:"12px 12px",
    display:"flex",
    flexDirection:"column",
    justifyContent:"center",
    cursor:"pointer",
    textAlign:"left",
    boxShadow:"inset 0 1px 0 rgba(255,255,255,0.06)",
  };

  if(isCompact){
    return (
      <section style={{padding:"8px 12px 12px"}}>
        <style>{`.cc-tools-btn:focus-visible{outline:2px solid var(--accent);outline-offset:2px;}`}</style>
        <div style={{minHeight:62,border:"1px solid var(--stroke-1)",borderRadius:14,background:"linear-gradient(180deg, rgba(255,255,255,0.02), rgba(0,0,0,0.22))",padding:"8px 10px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
          <div style={{display:"flex",alignItems:"center",gap:8,minWidth:0}}>
            <span aria-hidden="true" style={{width:24,height:24,borderRadius:999,border:"1px solid var(--stroke-1)",display:"inline-flex",alignItems:"center",justifyContent:"center",color:"var(--text-3)",fontSize:13,flexShrink:0}}>⚡</span>
            <h2 className="u-allcaps-long" style={{fontFamily:FD,fontSize:13,color:"var(--text-secondary)",margin:0,whiteSpace:"nowrap"}}>Coach Tools</h2>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
            {quickActions.slice(0,3).map((action)=><button key={action.key} type="button" onClick={action.onClick} aria-label={action.label} className="cc-tools-btn" style={{minHeight:46,minWidth:44,borderRadius:10,border:`1px solid ${primaryQuickAction===action.key?"var(--accent)":"var(--stroke-1)"}`,background:primaryQuickAction===action.key?"var(--accent-soft)":"var(--surface-2)",color:primaryQuickAction===action.key?"var(--accent)":"var(--text-2)",fontFamily:FB,fontSize:10,fontWeight:700,letterSpacing:"0.03em",textTransform:"uppercase",padding:"0 10px",cursor:"pointer"}}>{action.short}</button>)}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section style={{padding:"12px 12px 14px"}}>
      <DSCard accent style={{borderRadius:18,border:"1px solid color-mix(in srgb,var(--accent) 30%, transparent)",boxShadow:"0 20px 36px rgba(0,0,0,0.32)",padding:"15px 14px"}}>
        <div style={{fontFamily:FD,fontSize:15,color:"var(--text-1)",letterSpacing:"0.04em",textTransform:"uppercase"}}>Coach Command Center</div>
        <p style={{margin:"6px 0 12px",fontFamily:FB,fontSize:13,color:"var(--text-2)",letterSpacing:"0.01em"}}>Drive today’s training flow with one tap, then manage roster and sessions below.</p>
        <DSButton type="button" variant="primary" onClick={primaryAction.onClick} style={{height:48,width:"100%",fontFamily:FB,fontSize:14,fontWeight:800,letterSpacing:"0.04em"}}>{primaryAction.label}</DSButton>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:7,marginTop:8}}>
          {secondaryActions.slice(0,3).map((action)=><DSChip key={action.key} onClick={action.onClick} style={{height:38,fontFamily:FB,background:"rgba(255,255,255,0.03)"}}>{action.short.replace("+ ","")}</DSChip>)}
        </div>
      </DSCard>

      <div style={{display:"grid",gridTemplateColumns:"repeat(3, minmax(0, 1fr))",gap:8,marginTop:10}}>
        <DSMetricCard label="Roster Depth" value={totalPlayers} onClick={onPlayersClick} style={{...metricBase,border:highlightPlayersAttention?"1px solid rgba(255,69,69,0.45)":metricBase.border,fontFamily:FB}} valueStyle={{fontFamily:FD,fontSize:25,color:"var(--accent)"}} />
        <DSMetricCard label="Athletes Active" value={activeTodayCount} onClick={onActiveTodayClick} style={{...metricBase,fontFamily:FB}} valueStyle={{fontFamily:FD,fontSize:25}} />
        <DSMetricCard label="Next Session" value={nextEventDateFormatted} onClick={onNextEventClick} style={{...metricBase,fontFamily:FB}} valueStyle={{fontFamily:FD,fontSize:16,marginTop:7}} />
      </div>

      <div style={{margin:"10px 0 4px",padding:"14px 14px",border:"1px solid var(--stroke-1)",borderRadius:14,background:"linear-gradient(165deg, rgba(255,255,255,0.03), rgba(0,0,0,0.28))"}}>
        <div className="u-meta-label" style={{fontFamily:FB,fontSize:10,color:"var(--text-2)"}}>TEAM ACCESS CODE</div>
        <p style={{margin:"6px 0 0",fontFamily:FB,fontSize:12,color:"var(--text-2)",letterSpacing:"0.01em"}}>Share this code with athletes to join your program instantly.</p>
        <div style={{display:"flex",alignItems:"center",gap:8,marginTop:8,flexWrap:"wrap"}}>
          <div style={{fontFamily:FD,fontSize:25,color:"var(--text-1)",letterSpacing:4,minWidth:114,lineHeight:1}}>{joinCode||"—"}</div>
          <DSButton onClick={() => { onCopyJoinCode?.(); setCopied(true); setTimeout(() => setCopied(false), 1600); }} variant="primary" style={{fontSize:11,minHeight:40}}>COPY CODE</DSButton>
          <DSButton onClick={onRegenerateJoinCode} variant="secondary" style={{fontSize:11,minHeight:40}}>REGENERATE</DSButton>
        </div>
        {copied && <div style={{color:"var(--accent)",fontSize:11,marginTop:8,fontWeight:700,letterSpacing:"0.03em"}}>Copied to clipboard.</div>}
        {codeErr&&<div style={{color:"#FF4545",fontSize:11,marginTop:6}}>{codeErr}</div>}
      </div>
    </section>
  );
}
