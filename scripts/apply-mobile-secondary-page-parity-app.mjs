import fs from 'node:fs'
import path from 'node:path'

const appPath = path.resolve(process.cwd(), 'src/App.jsx')
let source = fs.readFileSync(appPath, 'utf8')

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
const coachScOpenSlot = `<div className="scSection" data-coach-sc-placeholder="true" style={{display:"flex",alignItems:"center",gap:12,background:CARD_BG,borderRadius:12,padding:"14px 16px",minHeight:313,marginBottom:8,border:"1px dashed var(--stroke-2)",opacity:.68}}><div style={{width:40,height:40,borderRadius:10,background:"#A0A0A012",border:"1px solid #A0A0A033",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,color:T.SUB,fontFamily:FD}}>—</div><div style={{flex:1,minWidth:0}}><div style={{fontFamily:FD,color:LIGHT,fontSize:14,letterSpacing:1}}>OPEN SESSION SLOT</div><div style={{fontFamily:FB,color:T.SUB,fontSize:10,marginTop:4,lineHeight:1.4}}>The next scheduled S&C session will appear here.</div></div></div>`
const coachRosterOpenSlot = `<div data-coach-roster-placeholder="true" style={{display:"flex",background:CARD_BG,borderRadius:14,minHeight:165,marginBottom:10,border:"1px dashed var(--stroke-2)",overflow:"hidden",opacity:.66}}><div style={{width:5,background:"var(--stroke-2)",flexShrink:0}}/><div style={{display:"flex",alignItems:"center",gap:12,padding:"14px 12px",flex:1}}><div style={{width:42,height:42,borderRadius:999,border:"1px dashed var(--stroke-2)",display:"grid",placeItems:"center",fontFamily:FD,color:MUTED}}>—</div><div><div style={{fontFamily:FD,color:LIGHT,fontSize:14,letterSpacing:1}}>OPEN ROSTER SLOT</div><div style={{fontFamily:FB,color:MUTED,fontSize:10,marginTop:4}}>A future team member will appear here.</div></div></div></div>`

// The Phase 5 orchestration fixture intentionally omits many secondary routes. Skip a
// parity mutation when that whole surface is absent, but remain strict when the surface
// exists so source drift still fails loudly in the real application.
withSurface('canResetSandbox', () => {
  replaceRequired(
    `{accountCapabilities?.canResetSandbox&&<article className="coachAdministrationCard">`,
    `{accountCapabilities?.canResetSandbox&&<article className="coachAdministrationCard" data-sandbox-utility="true" style={{position:"absolute",width:1,height:1,padding:0,margin:0,border:0,overflow:"hidden",clip:"rect(0 0 0 0)",clipPath:"inset(50%)",whiteSpace:"nowrap",pointerEvents:"none"}}>`,
    'coach settings sandbox utility',
  )
})

// Coach Events now owns a deliberate short empty state and natural schedule length.
// Demo and registered coaches share the same component/data path, so padding either
// state with fabricated runway cards is no longer necessary for parity and actively
// harms the premium mobile hierarchy.
withSurface('coach-events-mobile-empty-state', () => {
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

fs.writeFileSync(appPath, source)
console.log('Applied stable mobile app-level secondary-page composition for available Demo and registered surfaces.')
