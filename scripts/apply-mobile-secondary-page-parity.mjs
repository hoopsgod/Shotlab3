import fs from 'node:fs'
import path from 'node:path'

const appPath = path.resolve(process.cwd(), 'src/App.jsx')
let source = fs.readFileSync(appPath, 'utf8')

function replaceRequired(needle, replacement, label) {
  if (source.includes(replacement)) return
  if (!source.includes(needle)) throw new Error(`Could not locate ${label} parity boundary in src/App.jsx.`)
  source = source.replace(needle, replacement)
}

// Demo-only utilities created an extra Settings card that registered coaches never saw.
// Demo is reseeded on entry, so the normal Settings page should keep the exact same
// visible card architecture as the registered product.
const demoSettingsCard = `        {accountCapabilities?.canResetSandbox&&<article className="coachAdministrationCard">
          <span>Demo workspace</span><h3>DEMO SETTINGS</h3><p>Load or clear demo data using the shared demo tools.</p>
          <div className="coachAdministrationActions">
            <button onClick={onLoadDemoData} disabled={demoSettingsBusy} className="btn-v cta-secondary">LOAD DEMO DATA</button>
            <button onClick={onClearDemoData} disabled={demoSettingsBusy} className="btn-v cta-danger">CLEAR DEMO DATA</button>
          </div>
        </article>}
`
if (source.includes(demoSettingsCard)) source = source.replace(demoSettingsCard, '')

// Keep the Duels page architecture stable. Data can be empty, but the Incoming and
// Completed modules remain in the same order instead of swapping to a different page.
replaceRequired(
  `{pending.length>0&&<><SH isCoach={typeof u!=="undefined"&&u?.isCoach} t="INCOMING" s={\`${'${pending.length}'} WAITING\`}/>` ,
  `{<><SH isCoach={typeof u!=="undefined"&&u?.isCoach} t="INCOMING" s={\`${'${pending.length}'} WAITING\`}/>{pending.length===0&&<Empty t="No incoming duels" action="New teammate challenges will appear here."/>}` ,
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
  `{resolved.length===0&&<Empty t="No completed duels yet" action="Completed teammate challenges will be collected here."/>}` ,
  'duels completed empty state',
)

fs.writeFileSync(appPath, source)
console.log('Applied stable mobile secondary-page composition for Demo and registered accounts.')
