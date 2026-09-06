import fs from 'node:fs'
import path from 'node:path'

const appPath = path.resolve(process.cwd(), 'src/App.jsx')
const rawApp = fs.readFileSync(appPath, 'utf8')
const appLineEnding = rawApp.includes('\r\n') ? '\r\n' : '\n'
let app = rawApp.replace(/\r\n/g, '\n')

const priorAuthority = 'const signedReplacementCollection = k === "sl:rsvps" || k === "sl:sc-sessions" || k === "sl:sc-rsvps" || k === "sl:sc-logs";'
const oldEventAuthority = 'const signedReplacementCollection = k === "sl:events" || k === "sl:rsvps" || k === "sl:sc-sessions" || k === "sl:sc-rsvps" || k === "sl:sc-logs";'
const eventAuthority = 'const signedReplacementCollection = (k==="sl:events"&&options?.replace===true) || k === "sl:rsvps" || k === "sl:sc-sessions" || k === "sl:sc-rsvps" || k === "sl:sc-logs";'
if (app.includes(oldEventAuthority)) app = app.replace(oldEventAuthority, eventAuthority)
if (!app.includes(eventAuthority)) {
  const occurrences = app.split(priorAuthority).length - 1
  if (occurrences !== 1) throw new Error(`Expected Phase 3D replacement authority exactly once before Events ownership, found ${occurrences}.`)
  app = app.replace(priorAuthority, eventAuthority)
}
if ((app.split(eventAuthority).length - 1) !== 1) throw new Error('Conditional Events replacement authority must exist exactly once.')

const priorDelete = 'await P("sl:events",deletion.events,setEvents);await P("sl:rsvps",deletion.rsvps,setRsvps);return deletion'
const explicitDelete = 'await P("sl:events",deletion.events,setEvents,{replace:true});await P("sl:rsvps",deletion.rsvps,setRsvps);return deletion'
if (!app.includes(explicitDelete)) {
  const occurrences = app.split(priorDelete).length - 1
  if (occurrences !== 1) throw new Error(`Expected coach event deletion persistence boundary exactly once, found ${occurrences}.`)
  app = app.replace(priorDelete, explicitDelete)
}
if ((app.split(explicitDelete).length - 1) !== 1) throw new Error('Explicit coach event deletion replacement must exist exactly once.')

const readBoundary = '        }\n        const localRows = hasData(local) ? buildAppRows(k, local, { source: "local" }) : [];'
const eventReadAuthority = '        }\n        if(k==="sl:events"&&!isDemoPersistenceSession()&&Array.isArray(data)&&signedRead?.storageMode!=="local_pending")return buildAppRows(k,data,{source:"remote"});\n        const localRows = hasData(local) ? buildAppRows(k, local, { source: "local" }) : [];'
if (!app.includes(eventReadAuthority)) {
  const occurrences = app.split(readBoundary).length - 1
  if (occurrences !== 1) throw new Error(`Expected DB.get remote/local boundary exactly once before Events ownership, found ${occurrences}.`)
  app = app.replace(readBoundary, eventReadAuthority)
}
if ((app.split(eventReadAuthority).length - 1) !== 1) throw new Error('Events startup read authority must exist exactly once.')

fs.writeFileSync(appPath, app.replace(/\n/g, appLineEnding))

const supabasePath = path.resolve(process.cwd(), 'src/lib/supabase.js')
const rawSupabase = fs.readFileSync(supabasePath, 'utf8')
const supabaseLineEnding = rawSupabase.includes('\r\n') ? '\r\n' : '\n'
let supabase = rawSupabase.replace(/\r\n/g, '\n')
const priorEmptyGuard = 'if (method !== "GET" && body && Array.isArray(normalizedBody) && normalizedBody.length === 0 && table !== "rsvps") {'
const eventEmptyGuard = 'if (method !== "GET" && body && Array.isArray(normalizedBody) && normalizedBody.length === 0 && table !== "rsvps" && table !== "events") {'
if (!supabase.includes(eventEmptyGuard)) {
  const occurrences = supabase.split(priorEmptyGuard).length - 1
  if (occurrences !== 1) throw new Error(`Expected Phase 3D empty-write guard exactly once before Events ownership, found ${occurrences}.`)
  supabase = supabase.replace(priorEmptyGuard, eventEmptyGuard)
}
if ((supabase.split(eventEmptyGuard).length - 1) !== 1) throw new Error('Events adapter must allow an explicitly authorized empty replacement write exactly once.')
fs.writeFileSync(supabasePath, supabase.replace(/\n/g, supabaseLineEnding))

console.log('Applied pending-aware Events ownership with empty replacement restricted to explicit coach deletion.')
