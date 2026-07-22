from pathlib import Path

path = Path("src/App.jsx")
text = path.read_text()


def replace_once(old, new, label):
    global text
    if new in text:
        print(f"{label}: already applied")
        return
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected one match, found {count}")
    text = text.replace(old, new, 1)
    print(f"{label}: applied")


def replace_span(start_marker, end_marker, replacement, label):
    global text
    if replacement in text:
        print(f"{label}: already applied")
        return
    start = text.find(start_marker)
    if start < 0:
        raise SystemExit(f"{label}: start marker missing")
    end = text.find(end_marker, start)
    if end < 0:
        raise SystemExit(f"{label}: end marker missing")
    text = text[:start] + replacement + text[end:]
    print(f"{label}: applied")


def wrap_section(start_marker, next_marker, open_tag, close_tag, label):
    global text
    start = text.find(start_marker)
    if start < 0:
        if open_tag in text:
            print(f"{label}: already applied")
            return
        raise SystemExit(f"{label}: start marker missing")
    end = text.find(next_marker, start)
    if end < 0:
        raise SystemExit(f"{label}: next marker missing")
    segment = text[start:end]
    open_end = segment.find(">")
    close_start = segment.rfind("</section>")
    if open_end < 0 or close_start < 0:
        raise SystemExit(f"{label}: section boundaries missing")
    segment = open_tag + segment[open_end + 1:close_start] + close_tag + segment[close_start + 10:]
    text = text[:start] + segment + text[end:]
    print(f"{label}: applied")


replace_once(
    'import PremiumLeaderboardsHub from "./components/PremiumLeaderboardsHub";\n',
    'import PremiumLeaderboardsHub from "./components/PremiumLeaderboardsHub";\nimport { DominantObjectiveCard, MetricStrip, ProgressiveDisclosure, QuietSection } from "./components/VisualHierarchy.jsx";\n',
    "hierarchy imports",
)

replace_once(
    '''<div className="player-quick-actions" aria-label="Player quick actions" style={{display:"flex",gap:8,justifyContent:"flex-end",alignItems:"center",padding:"8px 20px 0",position:"relative",zIndex:2}}>
  <button type="button" aria-label="Profile" onClick={()=>switchTab("profile")} style={{minHeight:38,padding:"0 12px",borderRadius:10,border:`1px solid ${BORDER_CLR}`,background:CARD_BG,color:LIGHT,fontFamily:FB,fontSize:11,fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",cursor:"pointer"}}>Profile</button>
  <button type="button" aria-label="Logout" onClick={logout} style={{minHeight:38,padding:"0 12px",borderRadius:10,border:`1px solid ${BORDER_CLR}`,background:CARD_BG,color:LIGHT,fontFamily:FB,fontSize:11,fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",cursor:"pointer"}}>Logout</button>
</div>''',
    '''<div className="player-quick-actions" aria-label="Player quick actions" style={{display:"flex",gap:12,justifyContent:"flex-end",alignItems:"center",padding:"5px 20px 0",position:"relative",zIndex:2}}>
  <button type="button" aria-label="Profile" onClick={()=>switchTab("profile")} style={{minHeight:34,padding:"0 2px",border:0,background:"transparent",color:T.SUB,fontFamily:FB,fontSize:10,fontWeight:800,letterSpacing:"0.06em",textTransform:"uppercase",cursor:"pointer"}}>Profile</button>
  <button type="button" aria-label="Logout" onClick={logout} style={{minHeight:34,padding:"0 2px",border:0,background:"transparent",color:T.MUT,fontFamily:FB,fontSize:10,fontWeight:800,letterSpacing:"0.06em",textTransform:"uppercase",cursor:"pointer"}}>Logout</button>
</div>''',
    "quiet player quick actions",
)

player_objective = '''<DominantObjectiveCard
          eyebrow="Today’s mission"
          title={coachTodayFocus}
          description={missionStatus}
          actionLabel={missionCtaLabel}
          onAction={()=>switchTab("log-drill")}
          badge={missionMomentumBadge}
          testId="player-primary-objective"
        >
          <div style={{height:7,borderRadius:999,background:"rgba(255,255,255,0.1)",overflow:"hidden"}}><div style={{height:"100%",width:`${Math.max(6,dailyPct)}%`,background:"var(--accent)",transition:"width .2s ease"}}/></div>
          <div style={{display:"flex",justifyContent:"space-between",fontFamily:FB,fontSize:12,color:T.SUB,marginTop:6}}><span>{todaysMakes}/{dailyGoal} makes</span><span>{dailyPct}% complete</span></div>
        </DominantObjectiveCard>
        <MetricStrip
          testId="player-primary-metrics"
          items={[
            {label:"Today",value:todaysMakes,detail:`${dailyPct}% of daily goal`},
            {label:"This Week",value:weeklyMakes,detail:`${weeklyPct}% of weekly goal`},
            {label:"Streak",value:formatStreakDays(streak),detail:`${todayS.length}/${drills.length} drills`},
          ]}
        />
        '''
replace_span(
    '<section className="player-dashboard-card player-dashboard-missionHero"',
    '<section className="player-dashboard-card player-dashboard-cardCompact" aria-label="Upcoming Schedule"',
    player_objective,
    "player primary objective",
)

player_schedule = '''<ProgressiveDisclosure
          title="Upcoming schedule"
          summary={upcomingScheduleItems.length?`${upcomingScheduleItems.length} scheduled · ${unresolvedBadgeLabel}`:"No sessions scheduled"}
          testId="player-upcoming-schedule"
        >
          {upcomingScheduleItems.length===0?<div style={{fontFamily:FB,color:T.SUB,fontSize:13,lineHeight:1.5}}>No upcoming event or S&amp;C session is scheduled yet.</div>:<div style={{display:"grid",gridTemplateColumns:isNarrow?"1fr":"repeat(2,minmax(0,1fr))",gap:10}}>
            {upcomingScheduleItems.map(item=><div key={item.kind} style={{borderTop:"1px solid var(--stroke-1)",padding:"11px 2px",minWidth:0}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}><span style={{fontFamily:FB,color:item.kind==="sc"?"#A0A0A0":VOLT,fontSize:10,fontWeight:800,letterSpacing:"0.08em"}}>{item.label}</span><span style={{fontFamily:FB,color:item.rsvpStatus==="Going"?VOLT:"#FFCE73",fontSize:10}}>{item.rsvpStatus}</span></div>
              <div style={{fontFamily:FD,color:LIGHT,fontSize:17,letterSpacing:1,marginTop:6,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{item.title}</div>
              <div style={{fontFamily:FB,color:T.SUB,fontSize:12,marginTop:5,lineHeight:1.45}}><span style={{color:CYAN,fontWeight:700}}>{item.date}</span> · {item.time}<br/>{item.location}</div>
              <button type="button" onClick={()=>switchTab(item.target)} style={{marginTop:8,minHeight:38,border:0,background:"transparent",color:VOLT,fontFamily:FB,fontSize:11,fontWeight:800,padding:0,cursor:"pointer"}}>{item.cta} →</button>
            </div>)}
          </div>}
        </ProgressiveDisclosure>
        '''
replace_span(
    '<section className="player-dashboard-card player-dashboard-cardCompact" aria-label="Upcoming Schedule"',
    '<CompactLeaderboardPreviewCard',
    player_schedule,
    "player schedule disclosure",
)

player_leaderboard = '''<ProgressiveDisclosure title="Team standings" summary="Home-shot rankings and your position" testId="player-team-standings">
          <CompactLeaderboardPreviewCard
            title="Team Leaders"
            areaTitle="Leaderboards"
            categoryLabel="Home Shots"
            mode="player"
            userEmail={u?.email||""}
            status={playerDashboardLeaderboardStatus}
            rows={playerDashboardLeaderboardRows}
            emptyMessage="No leaderboard data yet. Log shots to enter the rankings."
            maxRows={3}
            onViewAll={()=>switchTab("leaderboards")}
          />
        </ProgressiveDisclosure>
        '''
replace_span(
    '''<CompactLeaderboardPreviewCard
          title="Team Leaders"''',
    '<section aria-label="Coach guidance summary"',
    player_leaderboard,
    "player leaderboard disclosure",
)

player_secondary = '''<ProgressiveDisclosure
          title="Coach guidance"
          summary={`${coachName} · ${coachPriorityDrill}`}
          testId="player-coach-guidance"
        >
          <div style={{fontFamily:FB,color:LIGHT,fontSize:14,lineHeight:1.5}}>Coach focus: {coachTodayFocus}</div>
          <div style={{display:"grid",gridTemplateColumns:isNarrow?"1fr":"repeat(2,minmax(0,1fr))",gap:8,marginTop:10}}>
            {[{k:"Priority drill",v:coachPriorityDrill},{k:"Coach challenge",v:coachChallengeText},{k:"Weekly goal",v:weeklyGoalLabel},{k:"Consistency",v:consistencyExpectation}].map(item=><div key={item.k} style={{borderTop:"1px solid var(--stroke-1)",padding:"9px 2px"}}><div style={{fontFamily:FB,fontSize:10,color:"var(--text-3)",letterSpacing:"0.05em"}}>{item.k.toUpperCase()}</div><div style={{fontFamily:FB,fontSize:12,color:LIGHT,fontWeight:700,marginTop:4,lineHeight:1.45}}>{item.v}</div></div>)}
          </div>
          <button type="button" onClick={()=>switchTab("duels")} style={{marginTop:9,minHeight:40,border:0,background:"transparent",color:VOLT,fontFamily:FB,fontSize:11,fontWeight:800,padding:0,cursor:"pointer"}}>Open Program →</button>
        </ProgressiveDisclosure>
        <ProgressiveDisclosure
          title="More progress"
          summary="Rank, attendance, season progress, and shortcuts"
          testId="player-secondary-intelligence"
        >
          <MetricStrip items={[
            {label:"Team Rank",value:leaderboardRank>0?`#${leaderboardRank}`:"—",detail:"Home shots"},
            {label:"Events",value:eventsAttended,detail:"Attended"},
            {label:"Season",value:`${seasonProgressPct}%`,detail:trainingIdentity},
          ]}/>
          <QuietSection title="Next step" eyebrow="Recommended">
            <div style={{fontFamily:FD,color:LIGHT,fontSize:20}}>{nextEvent?nextEvent.title:"Build your next session plan"}</div>
            <div style={{fontFamily:FB,color:MUTED,fontSize:12,marginTop:4,lineHeight:1.45}}>{nextEvent?`${nextEvent.date} · ${nextEvent.time} · ${nextEvent.location}`:"No event locked yet — open Program and set the next rep target for your week."}</div>
          </QuietSection>
          <div style={{display:"grid",gridTemplateColumns:isNarrow?"1fr":"repeat(3,minmax(0,1fr))",gap:8,marginTop:12}}>
            {[{label:"View Program",onClick:()=>switchTab("duels")},{label:"Events",onClick:()=>switchTab("program")},{label:"Progress",onClick:()=>switchTab("profile")}].map(action=><button key={action.label} onClick={action.onClick} style={{minHeight:44,borderRadius:10,border:"1px solid var(--stroke-1)",background:"transparent",color:LIGHT,fontFamily:FB,fontWeight:800,fontSize:11,cursor:"pointer"}}>{action.label}</button>)}
          </div>
        </ProgressiveDisclosure>
        '''
start = text.find('<section aria-label="Coach guidance summary"')
if start < 0:
    if 'testId="player-secondary-intelligence"' not in text:
        raise SystemExit("player secondary hierarchy: start marker missing")
else:
    secondary_marker = '<section aria-label="Secondary navigation actions"'
    secondary_start = text.find(secondary_marker, start)
    if secondary_start < 0:
        raise SystemExit("player secondary hierarchy: secondary actions missing")
    secondary_end = text.find("</section>", secondary_start)
    if secondary_end < 0:
        raise SystemExit("player secondary hierarchy: closing section missing")
    secondary_end += len("</section>")
    text = text[:start] + player_secondary + text[secondary_end:]
    print("player secondary hierarchy: applied")

coach_page_header = '  {tab==="feed"&&<div className="page pageShell page-feed fade-up" data-accent="feed" style={shellVars("feed")}><PageHeader title="COACH HOME" subtitle="Today-first command surface for your program" accent="lime" icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></svg>} actionLabel="Coach Mode" />\n'
replace_once(coach_page_header, '  {tab==="feed"&&<div className="page pageShell page-feed fade-up" data-accent="feed" style={shellVars("feed")}>\n', "remove redundant coach page header")

replace_once(
    '''    <div style={{marginBottom:10}}>
      <CompactLeaderboardPreviewCard
        title="Home Shot Leaders"
        areaTitle="Leaderboards"
        categoryLabel="Home Shots"
        mode="coach"
        status={coachDashboardLeaderboardStatus}
        rows={coachDashboardLeaderboardRows}
        emptyMessage="No team leaderboard data yet. Players will appear here after they log shots."
        maxRows={5}
        onViewAll={openCoachLeaderboards}
      />
    </div>''',
    '''    <ProgressiveDisclosure title="Team standings" summary="Home-shot leaders and roster position" testId="coach-team-standings">
      <CompactLeaderboardPreviewCard
        title="Home Shot Leaders"
        areaTitle="Leaderboards"
        categoryLabel="Home Shots"
        mode="coach"
        status={coachDashboardLeaderboardStatus}
        rows={coachDashboardLeaderboardRows}
        emptyMessage="No team leaderboard data yet. Players will appear here after they log shots."
        maxRows={5}
        onViewAll={openCoachLeaderboards}
      />
    </ProgressiveDisclosure>''',
    "coach standings disclosure",
)

setup_start = text.find('return <section style={{...CHECKLIST_CARD_STYLE,padding:"10px 11px",marginBottom:10}} aria-label="Coach setup checklist">')
if setup_start >= 0:
    setup_end = text.find("</section>;})()}", setup_start)
    if setup_end < 0:
        raise SystemExit("coach setup disclosure: closing marker missing")
    setup_end += len("</section>")
    old_open_end = text.find(">", setup_start)
    new_open = 'return <ProgressiveDisclosure title="Coach setup" summary={`${coachChecklist.filter(item=>item.done).length}/${coachChecklist.length} complete`} testId="coach-setup-checklist">'
    text = text[:setup_start] + new_open + text[old_open_end + 1:setup_end - len("</section>")] + "</ProgressiveDisclosure>" + text[setup_end:]
    print("coach setup disclosure: applied")
elif 'testId="coach-setup-checklist"' not in text:
    raise SystemExit("coach setup disclosure: start marker missing")

coach_session = '''<QuietSection
          eyebrow="Today’s practice"
          title={session?.title||"No session scheduled"}
          actionLabel={session?"Open session":"Add session"}
          onAction={()=>setTab("events")}
          testId="coach-today-practice"
        >
          <div style={{fontFamily:FB,color:"var(--text-2)",fontSize:13,lineHeight:1.45}}>{session?`Focus area: ${session.desc||"Team development"}`:"Set the team agenda and publish today’s focus."}</div>
          <MetricStrip items={[
            {label:"Readiness",value:readinessCopy,detail:"Athletes active"},
            {label:"Time",value:session?.time||"TBD",detail:"Session start"},
            {label:"RSVP",value:session?`${rsvpPct}%`:"—",detail:"Participation"},
          ]}/>
        </QuietSection>
        '''
replace_span(
    '<section className="accent-card" style={{background:"linear-gradient(155deg, color-mix(in srgb,var(--accent) 13%, transparent), rgba(11,13,16,0.96) 68%)"',
    '<section className="accent-card" style={{borderRadius:18,padding:isDesktop?"14px 14px":"12px 12px",marginBottom:12,background:"linear-gradient(152deg, rgba(200,255,0,0.12)',
    coach_session,
    "coach today practice hierarchy",
)

wrap_section(
    '<section className="accent-card" style={{borderRadius:18,padding:isDesktop?"14px 14px":"12px 12px",marginBottom:12,background:"linear-gradient(152deg, rgba(200,255,0,0.12)',
    '<section className="accent-card" style={{borderRadius:14,padding:"12px 14px",marginBottom:12,background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.12)"}}>',
    '<ProgressiveDisclosure title="Next 7 days" summary={`${next7Events.length} sessions · ${unresolvedNext7Count} unresolved`} testId="coach-next-seven-days">',
    "</ProgressiveDisclosure>",
    "coach next seven days disclosure",
)

wrap_section(
    '<section className="accent-card" style={{borderRadius:14,padding:"12px 14px",marginBottom:12,background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.12)"}}>',
    '<section className="accent-card" style={{borderRadius:16,padding:isDesktop?"14px":"12px",marginBottom:12,background:"linear-gradient(152deg, rgba(255,255,255,0.05)',
    '<ProgressiveDisclosure title="Operational alerts" summary={`${coachAlerts.filter(alert=>alert.priority!=="passive").length} items need review`} testId="coach-operational-alerts">',
    "</ProgressiveDisclosure>",
    "coach alerts disclosure",
)

wrap_section(
    '<section className="accent-card" style={{borderRadius:16,padding:isDesktop?"14px":"12px",marginBottom:12,background:"linear-gradient(152deg, rgba(255,255,255,0.05)',
    '<section style={{display:"grid",gridTemplateColumns:isDesktop?"repeat(4,minmax(0,1fr))":"repeat(2,minmax(0,1fr))",gap:8,marginBottom:8}}>',
    '<ProgressiveDisclosure title="Coach priority editor" summary={coachPrioritiesDirty?"Unsaved changes":"Player-facing focus and weekly targets"} testId="coach-priority-editor">',
    "</ProgressiveDisclosure>",
    "coach priority editor disclosure",
)

replace_span(
    '<section style={{display:"grid",gridTemplateColumns:isDesktop?"repeat(4,minmax(0,1fr))":"repeat(2,minmax(0,1fr))",gap:8,marginBottom:8}}>',
    '<section style={{display:"grid",gridTemplateColumns:isDesktop?"repeat(3,minmax(0,1fr))":"1fr",gap:8,marginBottom:12}}>',
    '''<MetricStrip testId="coach-primary-metrics-feed" items={[
          {label:"Active Today",value:activeTodaySet.size,detail:`${safeRoster.length?Math.round((activeTodaySet.size/safeRoster.length)*100):0}% of roster`},
          {label:"Attendance",value:`${attendance}%`,detail:"7-day participation"},
          {label:"Weekly Activity",value:weekScores.length,detail:"Workouts logged"},
        ]}/>
        ''',
    "coach feed metric strip",
)

intelligence_start_marker = '<section style={{display:"grid",gridTemplateColumns:isDesktop?"repeat(3,minmax(0,1fr))":"1fr",gap:8,marginBottom:12}}>'
intelligence_start = text.find(intelligence_start_marker)
if intelligence_start >= 0:
    text = text[:intelligence_start] + '<ProgressiveDisclosure title="Program intelligence" summary="Trends, athlete attention, engagement, and activity" testId="coach-program-intelligence">\n        ' + text[intelligence_start:]
    intelligence_end_marker = "\n      </>;\n    })()}\n  </div>}"
    intelligence_end = text.find(intelligence_end_marker, intelligence_start)
    if intelligence_end < 0:
        raise SystemExit("coach program intelligence: end marker missing")
    text = text[:intelligence_end] + "\n        </ProgressiveDisclosure>" + text[intelligence_end:]
    print("coach program intelligence disclosure: applied")
elif 'testId="coach-program-intelligence"' not in text:
    raise SystemExit("coach program intelligence: start marker missing")

path.write_text(text)
