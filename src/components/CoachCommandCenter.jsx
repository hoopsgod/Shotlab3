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
    border:"1px solid rgba(200,255,0,0.2)",
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
    border:`1px solid ${isPrimary?"rgba(200,255,0,0.75)":"rgba(200,255,0,0.30)"}`,
    background:isPrimary?"#C8FF00":"rgba(10, 10, 10, 0.72)",
    color:isPrimary?"#0B0A09":"#C8FF00",
    
    padding:"0 16px",
    cursor:"pointer",
    boxShadow:isPrimary?"0 4px 14px rgba(200,255,0,0.28)":"none",
    whiteSpace:"nowrap",
  });

  const compactActionBtn=(isPrimary)=>({
    minHeight:44,
    minWidth:44,
    borderRadius:10,
    border:`1px solid ${isPrimary?"rgba(200,255,0,0.45)":"rgba(200,255,0,0.25)"}`,
    background:isPrimary?"rgba(200,255,0,0.16)":"rgba(20,20,20,0.66)",
    color:"#C8FF00",
    
    padding:"0 10px",
    cursor:"pointer",
  });

  if(isCompact){
    return (
      <section style={{padding:"8px 12px 12px"}}>
        <style>{`.cc-tools-btn:focus-visible{outline:2px solid #C8FF00;outline-offset:2px;}`}</style>

        <div style={{minHeight:62,border:"1px solid rgba(200,255,0,0.2)",borderRadius:14,background:"linear-gradient(180deg, rgba(255,255,255,0.02), rgba(0,0,0,0.22))",padding:"8px 10px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
          <div style={{display:"flex",alignItems:"center",gap:8,minWidth:0}}>
            <span aria-hidden="true" style={{width:24,height:24,borderRadius:999,border:"1px solid rgba(200,255,0,0.35)",display:"inline-flex",alignItems:"center",justifyContent:"center",color:"#C8FF00",fontSize:13,flexShrink:0}}>⚡</span>
            <h2 className="type-h2" style={{color:"var(--text-secondary)",margin:0,whiteSpace:"nowrap"}}>Coach Tools</h2>
          </div>

          <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
            <button type="button" onClick={onAddPlayer} aria-label="Add player" className="cc-tools-btn btn-text" style={compactActionBtn(primaryQuickAction==="addPlayer")}>+ Player</button>
            <button type="button" onClick={onAddDrill} aria-label="Add drill" className="cc-tools-btn btn-text" style={compactActionBtn(primaryQuickAction==="addDrill")}>+ Drill</button>
            <button type="button" onClick={onScheduleEvent} aria-label="Schedule event" className="cc-tools-btn btn-text" style={compactActionBtn(primaryQuickAction==="scheduleEvent")}>+ Event</button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section style={{padding:"12px 12px 14px"}}>
      <div style={{marginTop:2,marginBottom:10,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <h2 className="type-h2" style={{color:"var(--text-secondary)",margin:0}}>
          Coach Command Center
        </h2>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(3, minmax(0, 1fr))",gap:8}}>
        <button type="button" onClick={onPlayersClick} style={{...metricBase,border:highlightPlayersAttention?"1px solid rgba(255,69,69,0.45)":metricBase.border,boxShadow:highlightPlayersAttention?"0 0 0 1px rgba(255,69,69,0.25), 0 0 14px rgba(255,69,69,0.15)":"none"}}>
          <div className="type-label" style={{color:"var(--text-tertiary)",overflow:"hidden",textOverflow:"ellipsis"}}>Players</div>
          <div className="type-metric metric--sm" style={{marginTop:4,color:"#C8FF00"}}>{totalPlayers}</div>
        </button>

        <button type="button" onClick={onActiveTodayClick} style={metricBase}>
          <div className="type-label" style={{color:"var(--text-tertiary)",overflow:"hidden",textOverflow:"ellipsis"}}>Active Today</div>
          <div className="type-metric metric--sm" style={{marginTop:4,color:"#C8FF00"}}>{activeTodayCount}</div>
        </button>

        <button type="button" onClick={onNextEventClick} style={metricBase}>
          <div className="type-label" style={{color:"var(--text-tertiary)",overflow:"hidden",textOverflow:"ellipsis"}}>Next Event</div>
          <div className="type-metric metric--sm" style={{marginTop:5,color:"#C8FF00"}}>{nextEventDateFormatted}</div>
        </button>
      </div>

      <div style={{marginTop:10,overflowX:"auto",whiteSpace:"nowrap",paddingBottom:2}}>
        <div style={{display:"flex",gap:8}}>
          <button type="button" onClick={onAddPlayer} className="btn-text" style={quickBtn(primaryQuickAction==="addPlayer")}>+ Add Player</button>
          <button type="button" onClick={onAddDrill} className="btn-text" style={quickBtn(primaryQuickAction==="addDrill")}>+ Add Drill</button>
          <button type="button" onClick={onScheduleEvent} className="btn-text" style={quickBtn(primaryQuickAction==="scheduleEvent")}>+ Schedule Event</button>
          <button type="button" onClick={onLogScore} className="btn-text" style={quickBtn(false)}>+ Log Score</button>
        </div>
      </div>

      <div style={{margin:"10px 0 4px",padding:"14px 14px",border:"1px solid rgba(200,255,0,0.20)",borderRadius:14,background:"linear-gradient(120deg, rgba(200,255,0,0.09) 0%, rgba(200,255,0,0.03) 35%, rgba(20,20,20,0.9) 100%)"}}>
        <div className="type-label" style={{color:"#C8FF00"}}>TEAM CODE</div>
        <div style={{display:"flex",alignItems:"center",gap:8,marginTop:8,flexWrap:"wrap"}}>
          <div className="type-metric metric--sm" style={{color:"#FFFFFF",letterSpacing:"0.18em",minWidth:114}}>{joinCode||"—"}</div>
          <button onClick={onCopyJoinCode} className="btn-text" style={{padding:"8px 12px",border:"1px solid #242424",background:"#141414",color:"#FFFFFF",borderRadius:10,cursor:"pointer"}}>COPY</button>
          <button onClick={onRegenerateJoinCode} className="btn-text" style={{padding:"8px 12px",border:"1px solid #242424",background:"#141414",color:"#FFFFFF",borderRadius:10,cursor:"pointer"}}>REGENERATE</button>
        </div>
        {codeErr&&<div className="type-sub" style={{color:"#FF4545",marginTop:6}}>{codeErr}</div>}
      </div>
    </section>
  );
}
