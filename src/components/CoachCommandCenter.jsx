import React from "react";

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
  const isCompact=variant==="compact";
  const metricBase={
    minHeight:56,
    borderRadius:12,
    border:"1px solid var(--stroke-1)",
    background:"linear-gradient(180deg, rgba(255,255,255,0.02), rgba(0,0,0,0.25))",
    padding:"10px 10px",
    display:"flex",
    flexDirection:"column",
    justifyContent:"center",
    cursor:"pointer",
    textAlign:"left",
  };

  const quickBtn=(isPrimary)=>({
    height:44,
    minWidth:130,
    borderRadius:999,
    border:`1px solid ${isPrimary?"var(--accent)":"var(--stroke-1)"}`,
    background:isPrimary?"var(--accent)":"var(--surface-1)",
    color:isPrimary?"#0B0D10":"var(--text-2)",
    fontFamily:FB,
    fontSize:13,
    fontWeight:700,
    letterSpacing:"var(--tracking-default)",
    textTransform:"uppercase",
    padding:"0 16px",
    cursor:"pointer",
    boxShadow:"none",
    whiteSpace:"nowrap",
  });

  const compactActionBtn=(isPrimary)=>({
    minHeight:44,
    minWidth:44,
    borderRadius:10,
    border:`1px solid ${isPrimary?"var(--accent)":"var(--stroke-1)"}`,
    background:isPrimary?"var(--accent-soft)":"var(--surface-2)",
    color:isPrimary?"var(--accent)":"var(--text-2)",
    fontFamily:FB,
    fontSize:10,
    fontWeight:700,
    letterSpacing:"var(--tracking-tight)",
    textTransform:"uppercase",
    padding:"0 10px",
    cursor:"pointer",
  });

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
            <button type="button" onClick={onAddPlayer} aria-label="Add player" className="cc-tools-btn" style={compactActionBtn(primaryQuickAction==="addPlayer")}>+ Player</button>
            <button type="button" onClick={onAddDrill} aria-label="Add drill" className="cc-tools-btn" style={compactActionBtn(primaryQuickAction==="addDrill")}>+ Drill</button>
            <button type="button" onClick={onScheduleEvent} aria-label="Schedule event" className="cc-tools-btn" style={compactActionBtn(primaryQuickAction==="scheduleEvent")}>+ Event</button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section style={{padding:"12px 12px 14px"}}>
      <div style={{marginTop:2,marginBottom:10,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <h2 className="u-allcaps-long" style={{fontFamily:FD,fontSize:13,color:"var(--text-secondary)",margin:0}}>
          Coach Command Center
        </h2>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(3, minmax(0, 1fr))",gap:8}}>
        <button type="button" onClick={onPlayersClick} style={{...metricBase,border:highlightPlayersAttention?"1px solid rgba(255,69,69,0.45)":metricBase.border,boxShadow:"none"}}>
          <div style={{fontFamily:FB,fontSize:10,fontWeight:700,letterSpacing:"var(--tracking-default)",color:"var(--text-tertiary)",textTransform:"uppercase",overflow:"hidden",textOverflow:"ellipsis"}}>Players</div>
          <div style={{marginTop:4,fontFamily:FD,fontSize:23,fontWeight:900,lineHeight:1,color:"var(--accent)"}}>{totalPlayers}</div>
        </button>

        <button type="button" onClick={onActiveTodayClick} style={metricBase}>
          <div style={{fontFamily:FB,fontSize:10,fontWeight:700,letterSpacing:"var(--tracking-default)",color:"var(--text-tertiary)",textTransform:"uppercase",overflow:"hidden",textOverflow:"ellipsis"}}>Active Today</div>
          <div style={{marginTop:4,fontFamily:FD,fontSize:23,fontWeight:900,lineHeight:1,color:"var(--text-1)"}}>{activeTodayCount}</div>
        </button>

        <button type="button" onClick={onNextEventClick} style={metricBase}>
          <div style={{fontFamily:FB,fontSize:10,fontWeight:700,letterSpacing:"var(--tracking-default)",color:"var(--text-tertiary)",textTransform:"uppercase",overflow:"hidden",textOverflow:"ellipsis"}}>Next Event</div>
          <div style={{marginTop:5,fontFamily:FD,fontSize:16,fontWeight:900,lineHeight:1,color:"var(--text-1)"}}>{nextEventDateFormatted}</div>
        </button>
      </div>

      <div style={{marginTop:10,overflowX:"auto",whiteSpace:"nowrap",paddingBottom:2}}>
        <div style={{display:"flex",gap:8}}>
          <button type="button" onClick={onAddPlayer} style={quickBtn(primaryQuickAction==="addPlayer")}>+ Add Player</button>
          <button type="button" onClick={onAddDrill} style={quickBtn(primaryQuickAction==="addDrill")}>+ Add Drill</button>
          <button type="button" onClick={onScheduleEvent} style={quickBtn(primaryQuickAction==="scheduleEvent")}>+ Schedule Event</button>
          <button type="button" onClick={onLogScore} style={quickBtn(false)}>+ Log Score</button>
        </div>
      </div>

      <div style={{margin:"10px 0 4px",padding:"14px 14px",border:"1px solid var(--stroke-1)",borderRadius:14,background:"var(--surface-2)"}}>
        <div className="u-meta-label" style={{fontFamily:FB,fontSize:10,color:"var(--text-2)"}}>TEAM CODE</div>
        <div style={{display:"flex",alignItems:"center",gap:8,marginTop:8,flexWrap:"wrap"}}>
          <div style={{fontFamily:FD,fontSize:25,color:"var(--text-1)",letterSpacing:4,minWidth:114,lineHeight:1}}>{joinCode||"—"}</div>
          <button onClick={onCopyJoinCode} style={{padding:"8px 12px",fontSize:10,border:"1px solid var(--stroke-1)",background:"var(--surface-1)",color:"var(--text-1)",borderRadius:10,cursor:"pointer",fontWeight:700,letterSpacing:"var(--tracking-wide)"}}>COPY</button>
          <button onClick={onRegenerateJoinCode} style={{padding:"8px 12px",fontSize:10,border:"1px solid var(--stroke-1)",background:"var(--surface-1)",color:"var(--text-1)",borderRadius:10,cursor:"pointer",fontWeight:700,letterSpacing:"var(--tracking-tight)"}}>REGENERATE</button>
        </div>
        {codeErr&&<div style={{color:"#FF4545",fontSize:11,marginTop:6}}>{codeErr}</div>}
      </div>
    </section>
  );
}
