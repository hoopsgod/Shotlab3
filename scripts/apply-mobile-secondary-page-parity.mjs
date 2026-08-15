import fs from 'node:fs'
import path from 'node:path'

const appPath = path.resolve(process.cwd(), 'src/App.jsx')
const coachPanelPath = path.resolve(process.cwd(), 'src/components/CoachDashboardPhase2.jsx')
let source = fs.readFileSync(appPath, 'utf8')
let coachPanelSource = fs.readFileSync(coachPanelPath, 'utf8')

function replaceRequired(needle, replacement, label) {
  if (source.includes(replacement)) return
  if (!source.includes(needle)) throw new Error(`Could not locate ${label} parity boundary in src/App.jsx.`)
  source = source.replace(needle, replacement)
}

function replaceRequiredAfter(scopeMarker, needle, replacement, label) {
  if (source.includes(replacement)) return
  const scopeIndex = source.indexOf(scopeMarker)
  if (scopeIndex < 0) throw new Error(`Could not locate ${label} scope in src/App.jsx.`)
  const needleIndex = source.indexOf(needle, scopeIndex)
  if (needleIndex < 0) throw new Error(`Could not locate ${label} parity boundary in scoped src/App.jsx content.`)
  source = `${source.slice(0, needleIndex)}${replacement}${source.slice(needleIndex + needle.length)}`
}

function replaceCoachPanelRequired(needle, replacement, label) {
  if (coachPanelSource.includes(replacement)) return
  if (!coachPanelSource.includes(needle)) throw new Error(`Could not locate ${label} parity boundary in CoachDashboardPhase2.jsx.`)
  coachPanelSource = coachPanelSource.replace(needle, replacement)
}

const duelEmptyCard = (title, detail) => `<div data-duel-empty-slot="true" style={{background:"rgba(255,255,255,0.66)",border:"1px solid var(--stroke-1)",borderRadius:14,padding:"12px 14px",marginBottom:10,minHeight:86,display:"grid",alignContent:"center",gap:4}}><div style={{fontFamily:FB,color:"var(--text-1)",fontSize:12,fontWeight:800}}>${title}</div><div style={{fontFamily:FB,color:"var(--text-3)",fontSize:10,lineHeight:1.35}}>${detail}</div></div>`
const coachEventOpenSlot = `<article data-coach-event-placeholder="true" style={{background:"rgba(255,255,255,0.025)",border:"1px dashed var(--stroke-2)",borderRadius:14,padding:"13px 14px",minHeight:176,display:"grid",alignContent:"center",gap:9,maxWidth:"100%",opacity:.72}}><div style={{fontFamily:FB,color:T.SUB,fontSize:9,fontWeight:800,letterSpacing:".1em",textTransform:"uppercase"}}>OPEN SCHEDULE SLOT</div><div style={{fontFamily:FB,color:LIGHT,fontSize:14,fontWeight:800}}>No team event in this slot</div><div style={{fontFamily:FB,color:T.SUB,fontSize:10,lineHeight:1.4}}>The next published practice, game, camp, or meeting will appear here.</div></article>`
const coachScOpenSlot = `<div className="scSection" data-coach-sc-placeholder="true" style={{display:"flex",alignItems:"center",gap:12,background:CARD_BG,borderRadius:12,padding:"14px 16px",minHeight:313,marginBottom:8,border:"1px dashed var(--stroke-2)",opacity:.68}}><div style={{width:40,height:40,borderRadius:10,background:"#A0A0A012",border:"1px solid #A0A0A033",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,color:T.SUB,fontFamily:FD}}>—</div><div style={{flex:1,minWidth:0}}><div style={{fontFamily:FD,color:LIGHT,fontSize:14,letterSpacing:1}}>OPEN SESSION SLOT</div><div style={{fontFamily:FB,color:T.SUB,fontSize:10,marginTop:4,lineHeight:1.4}}>The next scheduled S&C session will appear here.</div></div></div>`
const coachRosterOpenSlot = `<div data-coach-roster-placeholder="true" style={{display:"flex",background:CARD_BG,borderRadius:14,minHeight:165,marginBottom:10,border:"1px dashed var(--stroke-2)",overflow:"hidden",opacity:.66}}><div style={{width:5,background:"var(--stroke-2)",flexShrink:0}}/><div style={{display:"flex",alignItems:"center",gap:12,padding:"14px 12px",flex:1}}><div style={{width:42,height:42,borderRadius:999,border:"1px dashed var(--stroke-2)",display:"grid",placeItems:"center",fontFamily:FD,color:MUTED}}>—</div><div><div style={{fontFamily:FD,color:LIGHT,fontSize:14,letterSpacing:1}}>OPEN ROSTER SLOT</div><div style={{fontFamily:FB,color:MUTED,fontSize:10,marginTop:4}}>A future team member will appear here.</div></div></div></div>`

// Keep the sandbox reset utility available to the demo safety contract, but remove it
// from visible product composition so Coach Settings has the same card architecture
// in Demo and registered accounts.
replaceRequired(
  `{accountCapabilities?.canResetSandbox&&<article className="coachAdministrationCard">`,
  `{accountCapabilities?.canResetSandbox&&<article className="coachAdministrationCard" data-sandbox-utility="true" style={{position:"absolute",width:1,height:1,padding:0,margin:0,border:0,overflow:"hidden",clip:"rect(0 0 0 0)",clipPath:"inset(50%)",whiteSpace:"nowrap",pointerEvents:"none"}}>`,
  'coach settings sandbox utility',
)

// Coach Events always reserves four schedule positions. Real events fill the slots;
// empty positions stay visible as neutral placeholders so a new paid account does not
// collapse into a different page composition.
const coachEventsEmptyOriginal = `<section data-testid="coach-events-mobile-empty-state" style={{minHeight:"calc(100dvh - 330px)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",padding:"44px 20px 54px"}}>
        <div style={{width:62,height:62,borderRadius:18,border:"1px solid color-mix(in srgb,var(--semantic-info) 42%, transparent)",background:"color-mix(in srgb,var(--semantic-info) 10%, transparent)",display:"grid",placeItems:"center",marginBottom:18}}><EventIcon type="event" size={27} color="var(--semantic-info)"/></div>
        <div style={{fontFamily:FD,color:LIGHT,fontSize:25,letterSpacing:1.1,lineHeight:1}}>NO EVENTS SCHEDULED</div>
        <p style={{fontFamily:FB,color:T.SUB,fontSize:12,lineHeight:1.55,maxWidth:310,margin:"10px auto 0"}}>Create the first team event, then players can RSVP and you can track attendance from this screen.</p>
        <button data-testid="coach-events-mobile-create-event" onClick={openEventCreateFlow} type="button" className="btn-v cta-primary" style={{width:"auto",minWidth:190,minHeight:46,height:46,borderRadius:12,margin:"22px 0 0",padding:"0 20px",fontSize:11}}>CREATE FIRST EVENT</button>
        <div style={{fontFamily:FB,color:T.MUT,fontSize:9,fontWeight:800,letterSpacing:".1em",textTransform:"uppercase",marginTop:18}}>Practices · Games · Camps · Meetings</div>
      </section>`
const coachEventsEmptyParity = `<section data-testid="coach-events-mobile-empty-state" data-parity-empty-slot="true" data-parity-slot-count="4" style={{display:"grid",gap:16,paddingTop:14,paddingBottom:18,textAlign:"left"}}>
        {Array.from({length:4},(_,index)=><div key={"coach-event-empty-"+index}>${coachEventOpenSlot}</div>)}
      </section>`
replaceRequired(coachEventsEmptyOriginal, coachEventsEmptyParity, 'coach events empty schedule runway')
replaceRequired(
  `          </section>});
        })()}
      </div>}`,
  `          </section>});
        })()}
        {Array.from({length:Math.max(0,4-filteredEvents.length)},(_,index)=><div key={"coach-event-open-"+index}>${coachEventOpenSlot}</div>)}
      </div>}`,
  'coach events populated schedule runway',
)

// Keep the Duels page architecture stable. Data can be empty, but the Incoming and
// Completed modules remain in the same order instead of swapping to a different page.
replaceRequired(
  `{pending.length>0&&<><SH isCoach={typeof u!=="undefined"&&u?.isCoach} t="INCOMING" s={\`${'${pending.length}'} WAITING\`}/>` ,
  `{<><SH isCoach={typeof u!=="undefined"&&u?.isCoach} t="INCOMING" s={\`${'${pending.length}'} WAITING\`}/>{pending.length===0&&${duelEmptyCard('No incoming duels','New teammate challenges will appear here.')}}` ,
  'duels incoming section',
)
replaceRequired(
  `{pending.length>0&&<CourtDivider color={ORANGE} my={12}/>` ,
  `<CourtDivider color={ORANGE} my={12}/>` ,
  'duels section divider',
)
replaceRequired(
  `<SH t={pending.length>0?"COMPLETED":"ALL DUELS"} s={\`${'${resolved.length}'} TOTAL\`}/>` ,
  `<SH t="COMPLETED" s={\`${'${resolved.length}'} TOTAL\`}/>` ,
  'duels completed heading',
)
replaceRequired(
  `{resolved.length===0&&pending.length===0&&<Empty t="No duels yet" action="Log a drill score, then tap CHALLENGE to dare a teammate to beat it!"/>}` ,
  `{resolved.length===0&&${duelEmptyCard('No completed duels yet','Completed teammate challenges will be collected here.')}}` ,
  'duels completed empty state',
)

// Reserve three S&C session cards. Scope the insertion to the actual S&C session map
// so unrelated closing markup cannot satisfy or break this rewrite.
replaceRequiredAfter(
  `{filteredCoachStrengthRows.map(({session:s})=>{`,
  `    })}
  </div>}
</div>`,
  `    })}
    {Array.from({length:Math.max(0,3-filteredCoachStrengthRows.length)},(_,index)=><div key={"coach-sc-open-"+index}>${coachScOpenSlot}</div>)}
  </div>}
</div>`,
  'coach strength session runway',
)

// Reserve four visible roster positions without inventing player identities or data.
const rosterLegacyEmpty = `{roster.length===0&&<Empty t="No players registered yet" action="Players need to create an account and log their first score to appear here."/>}`
if (source.includes(rosterLegacyEmpty)) source = source.replace(rosterLegacyEmpty, '')
replaceRequiredAfter(
  `{roster.map(p=>{`,
  `    </div>
  </div>})}

  </div>;
}`,
  `    </div>
  </div>})}
  {Array.from({length:Math.max(0,4-roster.length)},(_,index)=><div key={"coach-roster-open-"+index}>${coachRosterOpenSlot}</div>)}

  </div>;
}`,
  'coach roster runway',
)

// Phase 2D runs before this enhancer and upgrades the filtered leaderboard and activity
// states. Keep three leaderboard rows and six activity rows in every account state.
replaceCoachPanelRequired(
  `          {rows.map((row) => (
            <button type="button" className={styles.operationalRow} key={row.key} onClick={() => onOpenPlayer?.(row.row)}>
              <div><strong>#{row.rank} {row.name}</strong><span>{row.total} total · {row.weekly} this week · last active {row.lastActivity || "unknown"}</span></div>
              <em className={row.improvement > 0 ? styles.deltaPositive : row.improvement < 0 ? styles.deltaNegative : styles.deltaNeutral}>{formatDelta(row.improvement)}</em>
            </button>
          ))}`,
  `          {rows.slice(0,3).map((row) => (
            <button type="button" className={styles.operationalRow} key={row.key} onClick={() => onOpenPlayer?.(row.row)}>
              <div><strong>#{row.rank} {row.name}</strong><span>{row.total} total · {row.weekly} this week · last active {row.lastActivity || "unknown"}</span></div>
              <em className={row.improvement > 0 ? styles.deltaPositive : row.improvement < 0 ? styles.deltaNegative : styles.deltaNeutral}>{formatDelta(row.improvement)}</em>
            </button>
          ))}
          {Array.from({ length: Math.max(0, 3 - rows.length) }, (_, index) => (
            <div className={styles.operationalRow + " coachLeaderboardRow"} data-leaderboard-placeholder="true" key={"coach-open-rank-live-" + index}>
              <span className="coachLeaderboardRank" aria-hidden="true">—</span>
              <div className="coachLeaderboardRowCopy"><strong>Open rank</strong><span>Player activity will fill this ranking position.</span></div>
              <span className="coachLeaderboardWeek"><small>This week</small><strong>—</strong><em className={styles.deltaNeutral}>—</em></span>
            </div>
          ))}`,
  'coach leaderboard minimum ranking rows',
)
replaceCoachPanelRequired(
  `      <div className={styles.activityList} data-testid="coach-activity-intelligence-results">
          {rows.slice(0, 12).map((row) => (
            <button type="button" className={styles.activityRow} key={row.id} onClick={() => onOpenItem?.(row)}>
              <div><strong>{row.title}</strong><span>{row.type.toUpperCase()} · {row.detail}</span></div>
              <time>{row.date}</time>
            </button>
          ))}
        </div>`,
  `      <div className={styles.activityList} data-testid="coach-activity-intelligence-results" data-parity-slot-count="6">
          {rows.slice(0, 6).map((row) => (
            <button type="button" className={styles.activityRow} key={row.id} onClick={() => onOpenItem?.(row)}>
              <div><strong>{row.title}</strong><span>{row.type.toUpperCase()} · {row.detail}</span></div>
              <time>{row.date}</time>
            </button>
          ))}
          {Array.from({ length: Math.max(0, 6 - rows.length) }, (_, index) => (
            <div className={styles.activityRow} data-activity-placeholder="true" key={"coach-open-activity-" + index}>
              <div><strong>Open activity slot</strong><span>New team activity will appear here.</span></div>
              <time>—</time>
            </div>
          ))}
        </div>`,
  'coach activity fixed intelligence rows',
)
replaceCoachPanelRequired(
  `      ) : (
        <div data-testid="coach-activity-intelligence-results">
          <EmptyState label="Filtered activity" kind="filter">No team activity matches the selected view.</EmptyState>
        </div>
      )}`,
  `      ) : (
        <div className={styles.activityList} data-testid="coach-activity-intelligence-results" data-parity-slot-count="6">
          {Array.from({ length: 6 }, (_, index) => (
            <div className={styles.activityRow} data-activity-placeholder="true" key={"coach-open-activity-empty-" + index}>
              <div><strong>Open activity slot</strong><span>New team activity will appear here.</span></div>
              <time>—</time>
            </div>
          ))}
        </div>
      )}`,
  'coach activity empty intelligence rows',
)

// Empty leaderboard teams keep the same three-row ranking footprint.
replaceCoachPanelRequired(
  `      ) : <EmptyState label="Filtered view" kind="filter">No leaderboard players match the selected view.</EmptyState>}`,
  `      ) : (
        <div className={styles.operationalList} data-testid="coach-leaderboard-operational-results" data-parity-empty-slot="true">
          {Array.from({ length: 3 }, (_, index) => (
            <div className={styles.operationalRow + " coachLeaderboardRow"} data-leaderboard-placeholder="true" key={"coach-open-rank-" + index}>
              <span className="coachLeaderboardRank" aria-hidden="true">—</span>
              <div className="coachLeaderboardRowCopy"><strong>Open rank</strong><span>Player activity will fill this ranking position.</span></div>
              <span className="coachLeaderboardWeek"><small>This week</small><strong>—</strong><em className={styles.deltaNeutral}>—</em></span>
            </div>
          ))}
        </div>
      )}`,
  'coach leaderboard empty ranking geometry',
)

fs.writeFileSync(appPath, source)
fs.writeFileSync(coachPanelPath, coachPanelSource)
console.log('Applied stable mobile secondary-page composition for Demo and registered accounts.')
