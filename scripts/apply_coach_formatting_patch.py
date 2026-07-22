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
    "  visible={showMiniHeader}\n",
    "  visible={!isOverviewTab||showMiniHeader}\n",
    "compact header visibility",
)

old_header_block = '''<CoachDashboardHeader
  heroRef={heroRef}
  userName={u.name}
  onOpenTeamBranding={openTeamBranding}
/>
{isCoachTab&&<CoachCommandCenter
  variant={showFullCommandCenter?"full":"compact"}
  totalPlayers={totalPlayers}
  activeTodayCount={activeTodayCount}
  nextEventDateFormatted={nextEventDateFormatted}
  highlightPlayersAttention={highlightPlayersAttention}
  primaryQuickAction={primaryQuickAction}
  onPlayersClick={()=>setTab("players")}
  onActiveTodayClick={()=>setTab("players")}
  onNextEventClick={()=>setTab("events")}
  onAddPlayer={()=>jumpToSection("players","coach-add-player-form")}
  onAddDrill={()=>jumpToSection("drills","coach-drills-management")}
  onScheduleEvent={openEventCreateFlow}
  onLogScore={handleLogScoreAction}
  joinCode={team?.joinCode}
  onCopyJoinCode={()=>navigator.clipboard?.writeText(team?.joinCode||"")}
  onRegenerateJoinCode={async()=>{const r=await regenerateJoinCode(team?.id);if(!r.ok)setCodeErr(r.err||"Failed")}}
  codeErr={codeErr}
/>}'''

new_header_block = '''{isOverviewTab&&<>
<CoachDashboardHeader
  heroRef={heroRef}
  userName={u.name}
  onOpenTeamBranding={openTeamBranding}
/>
<CoachCommandCenter
  variant="full"
  totalPlayers={totalPlayers}
  activeTodayCount={activeTodayCount}
  nextEventDateFormatted={nextEventDateFormatted}
  highlightPlayersAttention={highlightPlayersAttention}
  primaryQuickAction={primaryQuickAction}
  onPlayersClick={()=>setTab("players")}
  onActiveTodayClick={()=>setTab("players")}
  onNextEventClick={()=>setTab("events")}
  onAddPlayer={()=>jumpToSection("players","coach-add-player-form")}
  onAddDrill={()=>jumpToSection("drills","coach-drills-management")}
  onScheduleEvent={openEventCreateFlow}
  onLogScore={handleLogScoreAction}
  joinCode={team?.joinCode}
  onCopyJoinCode={()=>navigator.clipboard?.writeText(team?.joinCode||"")}
  onRegenerateJoinCode={async()=>{const r=await regenerateJoinCode(team?.id);if(!r.ok)setCodeErr(r.err||"Failed")}}
  codeErr={codeErr}
/>
</>}'''

app = replace_once(app, old_header_block, new_header_block, "home-only coach identity and command")

app = replace_once(
    app,
    'padding:`${showMiniHeader?"74px":"12px"} 16px 104px`',
    'padding:`${(!isOverviewTab||showMiniHeader)?"74px":"12px"} 16px 104px`',
    "non-home compact header spacing",
)

app = replace_once(
    app,
    'className="page pageShell page-feed fade-up"',
    'className="page pageShell page-feed coach-home-dashboard fade-up"',
    "coach home compact stack class",
)

old_practice_metrics = '''          <MetricStrip items={[
            {label:"Readiness",value:readinessCopy,detail:"Athletes active"},
            {label:"Time",value:session?.time||"TBD",detail:"Session start"},
            {label:"RSVP",value:session?`${rsvpPct}%`:"—",detail:"Participation"},
          ]}/>'''

new_practice_metrics = '''          <div data-testid="coach-practice-status-row" style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:0,marginTop:9,borderTop:"1px solid var(--stroke-1)",borderBottom:"1px solid var(--stroke-1)"}}>
            {[
              {label:"Readiness",value:readinessCopy},
              {label:"Time",value:session?.time||"TBD"},
              {label:"RSVP",value:session?`${rsvpPct}%`:"—"},
            ].map((item,index)=><div key={item.label} style={{minWidth:0,padding:"9px 7px",textAlign:"center",borderLeft:index?"1px solid var(--stroke-1)":"none"}}><div style={{fontFamily:FD,color:"var(--text-1)",fontSize:16,lineHeight:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{item.value}</div><div style={{fontFamily:FB,color:"var(--text-3)",fontSize:9,fontWeight:700,letterSpacing:"0.05em",textTransform:"uppercase",marginTop:4}}>{item.label}</div></div>)}
          </div>'''

app = replace_once(app, old_practice_metrics, new_practice_metrics, "compact practice status")

app_path.write_text(app)
print("coach formatting patch complete")
