from pathlib import Path

app_path = Path("src/App.jsx")
app = app_path.read_text()


def replace_once(text: str, old: str, new: str, label: str) -> str:
    if new in text:
        print(f"{label}: already applied")
        return text
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected one match, found {count}")
    print(f"{label}: applied")
    return text.replace(old, new, 1)


app = replace_once(
    app,
    "  visible={!isOverviewTab||showMiniHeader}\n",
    "  visible={showMiniHeader}\n",
    "hide mini coach header on non-home pages",
)

app = replace_once(
    app,
    'padding:`${(!isOverviewTab||showMiniHeader)?"74px":"12px"} 16px 104px`',
    'padding:`${showMiniHeader?"74px":"12px"} 16px 104px`',
    "remove non-home header spacer",
)

old_wrapper = '{tab==="events"&&<div className="page pageShell fade-up accent-card" data-accent="events" id="coach-events-management" style={shellVars("events")}><DashboardReturnButton onClick={()=>setTab("feed")} />'
new_wrapper = '{tab==="events"&&<div className={`page pageShell fade-up ${isDesktop?"accent-card":"coach-events-mobile-surface"}`} data-accent="events" id="coach-events-management" style={isDesktop?shellVars("events"):{...shellVars("events"),padding:0,border:0,background:"transparent",boxShadow:"none"}}>{isDesktop&&<DashboardReturnButton onClick={()=>setTab("feed")} />}'
app = replace_once(app, old_wrapper, new_wrapper, "remove mobile events accent shell and return pill")

start_marker = '</>:<div data-testid="coach-events-mobile-page">'
end_marker = '\n\n    {showAdd&&<div'
start = app.find(start_marker)
if start == -1:
    if 'data-testid="coach-events-mobile-header"' in app:
        print("mobile events surface: already applied")
    else:
        raise SystemExit("mobile events surface: start marker not found")
else:
    end = app.find(end_marker, start)
    if end == -1:
        raise SystemExit("mobile events surface: end marker not found")
    new_mobile = '''</>:<div data-testid="coach-events-mobile-page" style={{maxWidth:560,margin:"0 auto",padding:"0 2px"}}>
      <header data-testid="coach-events-mobile-header" style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:14,padding:"4px 2px 14px",borderBottom:`1px solid ${BORDER_CLR}`}}>
        <div style={{minWidth:0}}>
          <div style={{fontFamily:FB,color:"var(--semantic-info)",fontSize:9,fontWeight:800,letterSpacing:".12em",textTransform:"uppercase"}}>Team schedule</div>
          <h1 style={{fontFamily:FD,color:LIGHT,fontSize:30,lineHeight:.95,letterSpacing:1.2,margin:"6px 0 0"}}>EVENTS</h1>
          <p style={{fontFamily:FB,color:T.SUB,fontSize:11,lineHeight:1.4,margin:"7px 0 0"}}>{events.length?`${events.length} scheduled team ${events.length===1?"event":"events"}. Manage timing, location, and attendance.`:"Plan practices, games, camps, and team meetings in one place."}</p>
        </div>
        {events.length>0&&<button data-testid="coach-events-mobile-create-event" onClick={openEventCreateFlow} type="button" style={{flexShrink:0,minHeight:40,borderRadius:10,border:`1px solid ${VOLT}`,background:VOLT,color:"#0b0d10",fontFamily:FB,fontSize:10,fontWeight:900,letterSpacing:".04em",textTransform:"uppercase",padding:"0 14px",cursor:"pointer"}}>+ ADD</button>}
      </header>
      {eventSaveError&&<div role="alert" style={{marginTop:12,padding:"10px 12px",borderRadius:10,background:"rgba(255,69,69,0.12)",border:"1px solid rgba(255,69,69,0.45)",color:"#FFD2D2",fontFamily:FB,fontSize:12,fontWeight:700}}>Event could not be saved. Please try again.</div>}
      {events.length===0?<section data-testid="coach-events-mobile-empty-state" style={{minHeight:"calc(100dvh - 330px)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",padding:"44px 20px 54px"}}>
        <div style={{width:62,height:62,borderRadius:18,border:"1px solid color-mix(in srgb,var(--semantic-info) 42%, transparent)",background:"color-mix(in srgb,var(--semantic-info) 10%, transparent)",display:"grid",placeItems:"center",marginBottom:18}}><EventIcon type="event" size={27} color="var(--semantic-info)"/></div>
        <div style={{fontFamily:FD,color:LIGHT,fontSize:25,letterSpacing:1.1,lineHeight:1}}>NO EVENTS SCHEDULED</div>
        <p style={{fontFamily:FB,color:T.SUB,fontSize:12,lineHeight:1.55,maxWidth:310,margin:"10px auto 0"}}>Create the first team event, then players can RSVP and you can track attendance from this screen.</p>
        <button data-testid="coach-events-mobile-create-event" onClick={openEventCreateFlow} type="button" className="btn-v cta-primary" style={{width:"auto",minWidth:190,minHeight:46,height:46,borderRadius:12,margin:"22px 0 0",padding:"0 20px",fontSize:11}}>CREATE FIRST EVENT</button>
        <div style={{fontFamily:FB,color:T.MUT,fontSize:9,fontWeight:800,letterSpacing:".1em",textTransform:"uppercase",marginTop:18}}>Practices · Games · Camps · Meetings</div>
      </section>:<div style={{display:"grid",gap:16,paddingTop:14,paddingBottom:18}}>
        {(() => {
          const parseTime=(time="")=>{const m=String(time).trim().match(/^(\\d{1,2})(?::(\\d{2}))?\\s*(AM|PM)?$/i);if(!m)return Number.MAX_SAFE_INTEGER;let hour=Number(m[1]);const minute=Number(m[2]||"0");const meridiem=(m[3]||"").toUpperCase();if(meridiem==="PM"&&hour<12)hour+=12;if(meridiem==="AM"&&hour===12)hour=0;return hour*60+minute;};
          const grouped=[...events].sort((a,b)=>a.date.localeCompare(b.date)||parseTime(a.time)-parseTime(b.time)).reduce((acc,ev)=>{(acc[ev.date]=acc[ev.date]||[]).push(ev);return acc;},{});
          return Object.entries(grouped).map(([dateKey,dateEvents])=>{const d=new Date(`${dateKey}T00:00:00`);const weekday=d.toLocaleDateString(undefined,{weekday:"short"}).toUpperCase();const monthDay=d.toLocaleDateString(undefined,{month:"short",day:"numeric"}).toUpperCase();
          return <section key={dateKey} style={{display:"grid",gap:8}}>
            <div style={{display:"flex",alignItems:"baseline",gap:7,padding:"0 2px"}}><span style={{fontFamily:FB,color:"var(--semantic-info)",fontSize:9,fontWeight:800,letterSpacing:".1em"}}>{weekday}</span><span style={{fontFamily:FD,color:LIGHT,fontSize:15,letterSpacing:1}}>{monthDay}</span></div>
            {dateEvents.map((ev,eventIdx)=>{const evCoachRsvps=coachEventRsvpRows(ev.id);const evCoachRsvpNames=evCoachRsvps.map(coachRsvpLabel);const missing=Math.max(allKnown.length-evCoachRsvps.length,0);return <article key={ev.id} style={{background:"rgba(255,255,255,0.025)",border:`1px solid ${eventIdx===0?"color-mix(in srgb,var(--semantic-info) 38%, var(--stroke-1))":BORDER_CLR}`,borderRadius:14,padding:"13px 14px",display:"grid",gap:9,maxWidth:"100%"}}>
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:10}}>
                <div style={{minWidth:0}}><div style={{fontFamily:FB,color:LIGHT,fontSize:14,fontWeight:800,lineHeight:1.2,wordBreak:"break-word"}}>{ev.title}</div><div style={{fontFamily:FB,color:T.SUB,fontSize:10,lineHeight:1.35,marginTop:4}}>{ev.time||"TBD"} · {ev.location||"Location TBD"}</div></div>
                <span style={{padding:"3px 8px",borderRadius:999,background:"color-mix(in srgb,var(--semantic-info) 10%, transparent)",border:"1px solid color-mix(in srgb,var(--semantic-info) 34%, transparent)",fontFamily:FB,color:"var(--semantic-info)",fontSize:9,fontWeight:800,textTransform:"uppercase",flexShrink:0}}>{ev.type||"event"}</span>
              </div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,paddingTop:8,borderTop:`1px solid ${BORDER_CLR}`}}>
                <div style={{display:"flex",gap:7,flexWrap:"wrap"}}><span style={{fontFamily:FB,color:SUCCESS,fontSize:10,fontWeight:800}}>{evCoachRsvps.length} confirmed</span><span style={{fontFamily:FB,color:missing>0?WARNING:T.SUB,fontSize:10,fontWeight:800}}>{missing} missing</span></div>
                <button type="button" onClick={()=>setExpEv(ev.id)} style={{border:0,background:"transparent",color:VOLT,fontFamily:FB,fontSize:10,fontWeight:900,padding:"4px 0",cursor:"pointer"}}>MANAGE →</button>
              </div>
              {evCoachRsvpNames.length>0&&<div style={{fontFamily:FB,color:T.SUB,fontSize:10,lineHeight:1.4,wordBreak:"break-word"}}>{evCoachRsvpNames.join(", ")}</div>}
            </article>})}
          </section>});
        })()}
      </div>}
    </div>}'''
    app = app[:start] + new_mobile + app[end:]
    print("mobile events surface: applied")

app_path.write_text(app)
print("mobile events redesign patch complete")
