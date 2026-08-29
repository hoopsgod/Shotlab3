import fs from 'node:fs'
import path from 'node:path'

const appPath = path.resolve(process.cwd(), 'src/App.jsx')
const rawSource = fs.readFileSync(appPath, 'utf8')
const lineEnding = rawSource.includes('\r\n') ? '\r\n' : '\n'
let source = rawSource.replace(/\r\n/g, '\n')

function replaceRequired(needle, replacement, label) {
  if (source.includes(replacement)) return
  if (!source.includes(needle)) throw new Error(`Could not locate ${label} parity boundary in src/App.jsx.`)
  source = source.replace(needle, replacement)
}

function withSurface(marker, callback) {
  if (!source.includes(marker)) return
  callback()
}

const duelEmptyCard = (title, detail) => `<div data-duel-empty-slot="true" style={{background:"rgba(255,255,255,0.66)",border:"1px solid var(--stroke-1)",borderRadius:14,padding:"12px 14px",marginBottom:10,minHeight:86,display:"grid",alignContent:"center",gap:4}}><div style={{fontFamily:FB,color:"var(--text-1)",fontSize:12,fontWeight:800}}>${title}</div><div style={{fontFamily:FB,color:"var(--text-3)",fontSize:10,lineHeight:1.35}}>${detail}</div></div>`
const coachScOpenSlot = `<div className="scSection" data-coach-sc-placeholder="true" style={isDesktop?{display:"flex",alignItems:"center",gap:12,background:CARD_BG,borderRadius:12,padding:"14px 16px",minHeight:313,marginBottom:8,border:"1px dashed var(--stroke-2)",opacity:.68}:{display:"grid",gridTemplateColumns:"40px minmax(0,1fr)",alignItems:"center",gap:12,background:CARD_BG,borderRadius:12,padding:16,minHeight:148,marginBottom:8,border:"1px dashed var(--stroke-2)",opacity:.68}}><div style={{width:40,height:40,borderRadius:10,background:"#A0A0A012",border:"1px solid #A0A0A033",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,color:T.SUB,fontFamily:FD}}>—</div><div style={{flex:1,minWidth:0}}><div style={{fontFamily:FD,color:LIGHT,fontSize:14,letterSpacing:1}}>OPEN SESSION SLOT</div><div style={{fontFamily:FB,color:T.SUB,fontSize:10,marginTop:4,lineHeight:1.4}}>The next scheduled S&C session will appear here.</div></div></div>`
const coachRosterOpenSlot = `<div data-coach-roster-placeholder="true" style={{display:"flex",background:CARD_BG,borderRadius:14,minHeight:165,marginBottom:10,border:"1px dashed var(--stroke-2)",overflow:"hidden",opacity:.66}}><div style={{width:5,background:"var(--stroke-2)",flexShrink:0}}/><div style={{display:"flex",alignItems:"center",gap:12,padding:"14px 12px",flex:1}}><div style={{width:42,height:42,borderRadius:999,border:"1px dashed var(--stroke-2)",display:"grid",placeItems:"center",fontFamily:FD,color:MUTED}}>—</div><div><div style={{fontFamily:FD,color:LIGHT,fontSize:14,letterSpacing:1}}>OPEN ROSTER SLOT</div><div style={{fontFamily:FB,color:MUTED,fontSize:10,marginTop:4}}>A future team member will appear here.</div></div></div></div>`

withSurface('canResetSandbox', () => {
  replaceRequired(
    `{accountCapabilities?.canResetSandbox&&<article className="coachAdministrationCard">`,
    `{accountCapabilities?.canResetSandbox&&<article className="coachAdministrationCard" data-sandbox-utility="true" style={{position:"absolute",width:1,height:1,padding:0,margin:0,border:0,overflow:"hidden",clip:"rect(0 0 0 0)",clipPath:"inset(50%)",whiteSpace:"nowrap",pointerEvents:"none"}}>`,
    'coach settings sandbox utility',
  )
})

withSurface('coach-events-mobile-empty-state', () => {
  replaceRequired(
    `{events.length===0?<section data-testid="coach-events-mobile-empty-state" style={{minHeight:"calc(100dvh - 330px)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",padding:"44px 20px 54px"}}>`,
    `{events.length===0?<section data-testid="coach-events-mobile-empty-state" aria-hidden="true" style={{display:"none"}}>`,
    'legacy Coach Events empty state visibility',
  )
  if (source.includes('data-parity-empty-slot="true"') || source.includes('data-coach-event-placeholder="true"')) {
    throw new Error('Legacy Coach Events parity runway must not be present before the premium Events build.')
  }
})

withSurface('pending.length>0&&<><SH', () => {
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
})

withSurface('filteredCoachStrengthRows', () => {
  replaceRequired(
    `      </div>;
    })}
  </div>}
</div>`,
    `      </div>;
    })}
    {Array.from({length:Math.max(0,3-filteredCoachStrengthRows.length)},(_,index)=><div key={"coach-sc-open-"+index}>${coachScOpenSlot}</div>)}
  </div>}
</div>`,
    'coach strength session runway',
  )

  replaceRequired(
    `return <div key={s.id} className="scSection" style={{display:"flex",alignItems:"center",gap:12,background:CARD_BG,borderRadius:12,padding:"14px 16px",marginBottom:8,border:\`1px solid ${'${BORDER_CLR}'}\`}}>`,
    `return <div key={s.id} className="scSection" style={isDesktop?{display:"flex",alignItems:"center",gap:12,background:CARD_BG,borderRadius:12,padding:"14px 16px",marginBottom:8,border:\`1px solid ${'${BORDER_CLR}'}\`}:{display:"grid",gridTemplateColumns:"40px minmax(0,1fr)",alignItems:"start",gap:12,background:CARD_BG,borderRadius:12,padding:16,marginBottom:8,border:\`1px solid ${'${BORDER_CLR}'}\`}}>`,
    'coach strength responsive row geometry',
  )

  replaceRequired(
    `className="btn-v cta-danger" style={{minHeight:36,height:36,padding:"0 12px",fontSize:10,letterSpacing:1.2,whiteSpace:"nowrap"}}>DELETE S&amp;C SESSION</button>`,
    `className="btn-v cta-danger" style={isDesktop?{minHeight:36,height:36,padding:"0 12px",fontSize:10,letterSpacing:1.2,whiteSpace:"nowrap"}:{gridColumn:"1 / -1",width:"100%",maxWidth:"100%",minHeight:44,height:"auto",margin:0,padding:"0 12px",fontSize:11,letterSpacing:1,whiteSpace:"normal"}}>DELETE S&amp;C SESSION</button>`,
    'coach strength responsive destructive action',
  )
})

withSurface('No players registered yet', () => {
  const rosterLegacyEmpty = `{roster.length===0&&<Empty t="No players registered yet" action="Players need to create an account and log their first score to appear here."/>}`
  if (source.includes(rosterLegacyEmpty)) source = source.replace(rosterLegacyEmpty, '')
  replaceRequired(
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
})

fs.writeFileSync(appPath, source.replace(/\n/g, lineEnding))
console.log('Applied stable mobile app-level secondary-page composition for available Demo and registered surfaces.')
