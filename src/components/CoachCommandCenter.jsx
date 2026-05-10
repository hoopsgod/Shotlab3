import React from "react";
import { useMemo, useState } from "react";

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
      <div style={{borderRadius:18,border:"1px solid color-mix(in srgb,var(--accent) 30%, transparent)",background:"linear-gradient(145deg, color-mix(in srgb,var(--accent) 17%, transparent), rgba(9,11,14,0.92) 58%)",boxShadow:"0 20px 36px rgba(0,0,0,0.32)",padding:"15px 14px"}}>
        <div style={{fontFamily:FD,fontSize:15,color:"var(--text-1)",letterSpacing:"0.04em",textTransform:"uppercase"}}>Coach Command Center</div>
        <p style={{margin:"6px 0 12px",fontFamily:FB,fontSize:13,color:"var(--text-2)",letterSpacing:"0.01em"}}>Drive today’s training flow with one tap, then manage roster and sessions below.</p>
        <button type="button" onClick={primaryAction.onClick} style={{height:48,width:"100%",borderRadius:12,border:"1px solid var(--accent)",background:"var(--accent)",color:"#0B0D10",fontFamily:FB,fontSize:14,fontWeight:800,letterSpacing:"0.04em",textTransform:"uppercase",cursor:"pointer",boxShadow:"0 8px 24px color-mix(in srgb,var(--accent) 32%, transparent)"}}>{primaryAction.label}</button>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:7,marginTop:8}}>
          {secondaryActions.slice(0,3).map((action)=><button key={action.key} type="button" onClick={action.onClick} style={{height:38,borderRadius:10,border:"1px solid var(--stroke-1)",background:"rgba(255,255,255,0.03)",color:"var(--text-2)",fontFamily:FB,fontSize:11,fontWeight:700,letterSpacing:"0.03em",textTransform:"uppercase",cursor:"pointer"}}>{action.short.replace("+ ","")}</button>)}
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(3, minmax(0, 1fr))",gap:8,marginTop:10}}>
        <button type="button" onClick={onPlayersClick} style={{...metricBase,border:highlightPlayersAttention?"1px solid rgba(255,69,69,0.45)":metricBase.border}}><div style={{fontFamily:FB,fontSize:10,fontWeight:700,letterSpacing:"0.05em",color:"var(--text-tertiary)",textTransform:"uppercase"}}>Roster Depth</div><div style={{marginTop:6,fontFamily:FD,fontSize:25,lineHeight:1,color:"var(--accent)"}}>{totalPlayers}</div></button>
        <button type="button" onClick={onActiveTodayClick} style={metricBase}><div style={{fontFamily:FB,fontSize:10,fontWeight:700,letterSpacing:"0.05em",color:"var(--text-tertiary)",textTransform:"uppercase"}}>Athletes Active</div><div style={{marginTop:6,fontFamily:FD,fontSize:25,lineHeight:1,color:"var(--text-1)"}}>{activeTodayCount}</div></button>
        <button type="button" onClick={onNextEventClick} style={metricBase}><div style={{fontFamily:FB,fontSize:10,fontWeight:700,letterSpacing:"0.05em",color:"var(--text-tertiary)",textTransform:"uppercase"}}>Next Session</div><div style={{marginTop:7,fontFamily:FD,fontSize:16,lineHeight:1,color:"var(--text-1)"}}>{nextEventDateFormatted}</div></button>
      </div>

      <div style={{margin:"10px 0 4px",padding:"14px 14px",border:"1px solid var(--stroke-1)",borderRadius:14,background:"linear-gradient(165deg, rgba(255,255,255,0.03), rgba(0,0,0,0.28))"}}>
        <div className="u-meta-label" style={{fontFamily:FB,fontSize:10,color:"var(--text-2)"}}>TEAM ACCESS CODE</div>
        <p style={{margin:"6px 0 0",fontFamily:FB,fontSize:12,color:"var(--text-2)",letterSpacing:"0.01em"}}>Share this code with athletes to join your program instantly.</p>
        <div style={{display:"flex",alignItems:"center",gap:8,marginTop:8,flexWrap:"wrap"}}>
          <div style={{fontFamily:FD,fontSize:25,color:"var(--text-1)",letterSpacing:4,minWidth:114,lineHeight:1}}>{joinCode||"—"}</div>
          <button onClick={() => { onCopyJoinCode?.(); setCopied(true); setTimeout(() => setCopied(false), 1600); }} style={{padding:"10px 14px",fontSize:11,border:"1px solid var(--accent)",background:"var(--accent)",color:"#0B0D10",borderRadius:10,cursor:"pointer",fontWeight:700,letterSpacing:"0.03em",minHeight:40}}>COPY CODE</button>
          <button onClick={onRegenerateJoinCode} style={{padding:"10px 14px",fontSize:11,border:"1px solid var(--stroke-1)",background:"var(--surface-1)",color:"var(--text-2)",borderRadius:10,cursor:"pointer",fontWeight:700,letterSpacing:"0.03em",minHeight:40}}>REGENERATE</button>
        </div>
        {copied && <div style={{color:"var(--accent)",fontSize:11,marginTop:8,fontWeight:700,letterSpacing:"0.03em"}}>Copied to clipboard.</div>}
        {codeErr&&<div style={{color:"#FF4545",fontSize:11,marginTop:6}}>{codeErr}</div>}
      </div>
    </section>
  );
}
