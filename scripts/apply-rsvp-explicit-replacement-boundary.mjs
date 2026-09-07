import fs from 'node:fs'
import path from 'node:path'

const appPath = path.resolve(process.cwd(), 'src/App.jsx')
const rawApp = fs.readFileSync(appPath, 'utf8')
const lineEnding = rawApp.includes('\r\n') ? '\r\n' : '\n'
let app = rawApp.replace(/\r\n/g, '\n')

const priorAuthority = 'const scReplacement=k.startsWith("sl:sc-"),signedReplacementCollection=k==="sl:rsvps"||k==="sl:events"&&options?.replace===true||scReplacement&&options?.strictRemote===true;'
const explicitAuthority = 'const scReplacement=k.startsWith("sl:sc-"),signedReplacementCollection=(k==="sl:rsvps"||k==="sl:events")&&options?.replace===true||scReplacement&&options?.strictRemote===true;'
if (!app.includes(explicitAuthority)) {
  const occurrences = app.split(priorAuthority).length - 1
  if (occurrences !== 1) throw new Error(`Expected final schedule/S&C replacement authority exactly once, found ${occurrences}.`)
  app = app.replace(priorAuthority, explicitAuthority)
}
if ((app.split(explicitAuthority).length - 1) !== 1) throw new Error('Explicit RSVP replacement authority must exist exactly once.')

const priorPersistAction = 'const P=useCallback(async(k,v,set,options)=>{set(v);await DB.set(k,v,options)},[]);'
const explicitPersistAction = 'const P=useCallback(async(k,v,set,o)=>{set(v);await DB.set(k,v,k==="sl:rsvps"?{...o,replace:true}:o)},[]);'
if (!app.includes(explicitPersistAction)) {
  const occurrences = app.split(priorPersistAction).length - 1
  if (occurrences !== 1) throw new Error(`Expected mutation persistence helper exactly once, found ${occurrences}.`)
  app = app.replace(priorPersistAction, explicitPersistAction)
}
if ((app.split(explicitPersistAction).length - 1) !== 1) throw new Error('RSVP mutations must request explicit replacement exactly once.')

fs.writeFileSync(appPath, app.replace(/\n/g, lineEnding))
console.log('Applied explicit RSVP mutation replacement boundary; startup cache rewrites remain local-only when empty.')
