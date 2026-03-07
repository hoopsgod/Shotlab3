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
    minHeight:64,
    borderRadius:12,
    border:"1px solid var(--stroke-1)",
    background:"var(--surface-2)",
    padding:"12px",
    display:"flex",
    flexDirection:"column",
    justifyContent:"center",
    cursor:"pointer",
    textAlign:"left",
  };

  const quickBtn=(isPrimary)=>({
    height:48,
    minWidth:128,
    borderRadius:12,
    border:`1px solid ${isPrimary?"var(--accent)":"var(--stroke-2)"}`,
    background:isPrimary?"var(--accent)":"transparent",
    color:isPrimary?"#0B0D10":"var(--text-2)",
    fontFamily:FB,
    fontSize:13,
    fontWeight:700,
    letterSpacing:"0.02em",
    textTransform:"none",
    padding:"0 16px",
    cursor:"pointer",
    boxShadow:"none",
    whiteSpace:"nowrap",
  });

  const compactActionBtn=(isPrimary)=>({
    minHeight:44,
    minWidth:44,
    borderRadius:12,
    border:`1px solid ${isPrimary?"var(--accent)":"var(--stroke-2)"}`,
    background:isPrimary?"var(--accent)":"transparent",
    color:isPrimary?"#0B0D10":"var(--text-3)",
    fontFamily:FB,
    fontSize:11,
    fontWeight:700,
    letterSpacing:"0.02em",
    textTransform:"none",
    padding:"0 12px",
    cursor:"pointer",
  });

  if(isCompact){
    return (
      <section style={{padding:"8px 16px 16px"}}>
        <style>{`.cc-tools-btn:focus-visible,.cc-action-btn:focus-visible{outline:2px solid var(--accent);outline-offset:2px;}`}</style>

        <div style={{minHeight:64,border:"1px solid var(--stroke-1)",borderRadius:16,background:"var(--surface-2)",padding:"12px 12px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
          <div style={{display:"flex",alignItems:"center",gap:12,minWidth:0}}>
            <span aria-hidden="true" style={{width:24,height:24,borderRadius:999,border:"1px solid var(--stroke-1)",display:"inline-flex",alignItems:"center",justifyContent:"center",color:"var(--text-3)",fontSize:13,flexShrink:0}}>⚡</span>
            <h2 className="u-allcaps-long" style={{fontFamily:FD,fontSize:13,color:"var(--text-secondary)",margin:0,whiteSpace:"nowrap"}}>Coach Tools</h2>
          </div>

          <div style={{display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
            <button type="button" onClick={onAddPlayer} aria-label="Add player" className="cc-tools-btn cc-action-btn" style={compactActionBtn(primaryQuickAction==="addPlayer")}>+ Player</button>
            <button type="button" onClick={onAddDrill} aria-label="Add drill" className="cc-tools-btn cc-action-btn" style={compactActionBtn(primaryQuickAction==="addDrill")}>+ Drill</button>
            <button type="button" onClick={onScheduleEvent} aria-label="Schedule event" className="cc-tools-btn cc-action-btn" style={compactActionBtn(primaryQuickAction==="scheduleEvent")}>+ Event</button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section style={{padding:"12px 16px 16px"}}>
      <style>{`.cc-action-btn:focus-visible{outline:2px solid var(--accent);outline-offset:2px;}`}</style>
      <div style={{marginTop:4,marginBottom:12,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <h2 className="u-allcaps-long" style={{fontFamily:FD,fontSize:13,color:"var(--text-secondary)",margin:0}}>
          Coach Command Center
        </h2>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(3, minmax(0, 1fr))",gap:12}}>
        <button type="button" onClick={onPlayersClick} className="cc-action-btn" style={{...metricBase,border:highlightPlayersAttention?"1px solid rgba(255,69,69,0.45)":metricBase.border,boxShadow:"none"}}>
          <div style={{fontFamily:FB,fontSize:11,fontWeight:700,letterSpacing:"0.02em",color:"var(--text-2)",lineHeight:1.2,overflow:"hidden",textOverflow:"ellipsis"}}>Players</div>
          <div style={{marginTop:4,fontFamily:FD,fontSize:23,fontWeight:900,lineHeight:1,color:"var(--accent)"}}>{totalPlayers}</div>
          <div style={{marginTop:4,fontFamily:FB,fontSize:10,color:"var(--text-2)",letterSpacing:"0.01em",lineHeight:1.3}}>{highlightPlayersAttention?"Needs check-ins":"On track"}</div>
        </button>

        <button type="button" onClick={onActiveTodayClick} className="cc-action-btn" style={metricBase}>
          <div style={{fontFamily:FB,fontSize:11,fontWeight:700,letterSpacing:"0.02em",color:"var(--text-2)",lineHeight:1.2,overflow:"hidden",textOverflow:"ellipsis"}}>Active Today</div>
          <div style={{marginTop:4,fontFamily:FD,fontSize:23,fontWeight:900,lineHeight:1,color:"var(--text-1)"}}>{activeTodayCount}</div>
          <div style={{marginTop:4,fontFamily:FB,fontSize:10,color:"var(--text-2)",letterSpacing:"0.01em",lineHeight:1.3}}>Session logs</div>
        </button>

        <button type="button" onClick={onNextEventClick} className="cc-action-btn" style={metricBase}>
          <div style={{fontFamily:FB,fontSize:11,fontWeight:700,letterSpacing:"0.02em",color:"var(--text-2)",lineHeight:1.2,overflow:"hidden",textOverflow:"ellipsis"}}>Next Event</div>
          <div style={{marginTop:4,fontFamily:FD,fontSize:16,fontWeight:900,lineHeight:1,color:"var(--text-1)"}}>{nextEventDateFormatted}</div>
          <div style={{marginTop:4,fontFamily:FB,fontSize:10,color:"var(--text-2)",letterSpacing:"0.01em",lineHeight:1.3}}>Timeline</div>
        </button>
      </div>

      <div style={{marginTop:12,overflowX:"auto",whiteSpace:"nowrap",paddingBottom:4}}>
        <div style={{display:"flex",gap:12}}>
          <button type="button" onClick={onAddPlayer} className="cc-action-btn" style={quickBtn(primaryQuickAction==="addPlayer")}>+ Add Player</button>
          <button type="button" onClick={onAddDrill} className="cc-action-btn" style={quickBtn(primaryQuickAction==="addDrill")}>+ Add Drill</button>
          <button type="button" onClick={onScheduleEvent} className="cc-action-btn" style={quickBtn(primaryQuickAction==="scheduleEvent")}>+ Schedule Event</button>
          <button type="button" onClick={onLogScore} className="cc-action-btn" style={quickBtn(false)}>+ Log Score</button>
        </div>
      </div>

      <div style={{margin:"12px 0 4px",padding:"12px",border:"1px solid var(--stroke-1)",borderRadius:16,background:"var(--surface-2)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
          <div>
            <div style={{fontFamily:FB,fontSize:11,color:"var(--text-2)",fontWeight:700,letterSpacing:"0.02em"}}>Team code</div>
            <div style={{fontFamily:FB,fontSize:10,color:"var(--text-2)",letterSpacing:"0.01em",lineHeight:1.35,marginTop:4}}>Share with players to join roster</div>
          </div>
          <div style={{fontFamily:FD,fontSize:"clamp(20px, 5vw, 24px)",color:"var(--text-1)",letterSpacing:4,lineHeight:1,maxWidth:"52%",overflow:"hidden",textOverflow:"ellipsis"}}>{joinCode||"—"}</div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:12,marginTop:12}}>
          <button onClick={onCopyJoinCode} className="cc-action-btn" style={{height:48,padding:"0 16px",fontSize:11,border:"1px solid var(--stroke-2)",background:"transparent",color:"var(--text-2)",borderRadius:12,cursor:"pointer",fontWeight:700,letterSpacing:"0.02em"}}>Copy code</button>
          <button onClick={onRegenerateJoinCode} className="cc-action-btn" style={{height:48,padding:"0 16px",fontSize:11,border:"1px solid var(--stroke-2)",background:"transparent",color:"var(--text-2)",borderRadius:12,cursor:"pointer",fontWeight:700,letterSpacing:"0.02em"}}>Regenerate</button>
        </div>
        {codeErr&&<div style={{color:"#FF4545",fontSize:11,marginTop:8}}>{codeErr}</div>}
      </div>
    </section>
  );
}
