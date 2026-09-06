import fs from 'node:fs'
import path from 'node:path'

const appPath = path.resolve(process.cwd(), 'src/App.jsx')
const rawApp = fs.readFileSync(appPath, 'utf8')
const appLineEnding = rawApp.includes('\r\n') ? '\r\n' : '\n'
let app = rawApp.replace(/\r\n/g, '\n')

const eventAuthority = 'const signedReplacementCollection = (k==="sl:events"&&options?.replace===true) || k === "sl:rsvps" || k === "sl:sc-sessions" || k === "sl:sc-rsvps" || k === "sl:sc-logs";'
const strengthAuthority = 'const scReplacement=k.startsWith("sl:sc-"),signedReplacementCollection=k==="sl:rsvps"||k==="sl:events"&&options?.replace===true||scReplacement&&options?.strictRemote===true;'
if (!app.includes(strengthAuthority)) {
  const occurrences = app.split(eventAuthority).length - 1
  if (occurrences !== 1) throw new Error(`Expected Events replacement authority exactly once before S&C ownership, found ${occurrences}.`)
  app = app.replace(eventAuthority, strengthAuthority)
}
if ((app.split(strengthAuthority).length - 1) !== 1) throw new Error('S&C replacement authority must exist exactly once.')

const writeBoundary = 'if (table && (remoteRows.length > 0 || signedReplacementCollection)) {'
const strengthWriteBoundary = 'if(table&&(remoteRows.length||signedReplacementCollection)&&(!scReplacement||signedReplacementCollection)) {'
if (!app.includes(strengthWriteBoundary)) {
  const occurrences = app.split(writeBoundary).length - 1
  if (occurrences !== 1) throw new Error(`Expected generic remote write boundary exactly once before S&C ownership, found ${occurrences}.`)
  app = app.replace(writeBoundary, strengthWriteBoundary)
}
if ((app.split(strengthWriteBoundary).length - 1) !== 1) throw new Error('S&C strict mutation write boundary must exist exactly once.')

const eventReadAuthority = '        }\n        if(k==="sl:events"&&!isDemoPersistenceSession()&&Array.isArray(data)&&signedRead?.storageMode!=="local_pending")return buildAppRows(k,data,{source:"remote"});\n        const localRows = hasData(local) ? buildAppRows(k, local, { source: "local" }) : [];'
const strengthReadAuthority = '        }\n        if((k==="sl:events"||k.startsWith("sl:sc-"))&&!isDemoPersistenceSession()&&Array.isArray(data)){const pending=signedRead?.storageMode==="local_pending";if(!pending||k!=="sl:events")return buildAppRows(k,data,{source:pending?"local":"remote"});}\n        const localRows = hasData(local) ? buildAppRows(k, local, { source: "local" }) : [];'
if (!app.includes(strengthReadAuthority)) {
  const occurrences = app.split(eventReadAuthority).length - 1
  if (occurrences !== 1) throw new Error(`Expected Events startup read authority exactly once before S&C ownership, found ${occurrences}.`)
  app = app.replace(eventReadAuthority, strengthReadAuthority)
}
if ((app.split(strengthReadAuthority).length - 1) !== 1) throw new Error('S&C startup read authority must exist exactly once.')

fs.writeFileSync(appPath, app.replace(/\n/g, appLineEnding))

const supabasePath = path.resolve(process.cwd(), 'src/lib/supabase.js')
const rawSupabase = fs.readFileSync(supabasePath, 'utf8')
const supabaseLineEnding = rawSupabase.includes('\r\n') ? '\r\n' : '\n'
let supabase = rawSupabase.replace(/\r\n/g, '\n')
const eventEmptyGuard = 'if (method !== "GET" && body && Array.isArray(normalizedBody) && normalizedBody.length === 0 && table !== "rsvps" && table !== "events") {'
const strengthEmptyGuard = 'if (method !== "GET" && body && Array.isArray(normalizedBody) && normalizedBody.length === 0 && table !== "rsvps" && table !== "events" && !/^sc_(sessions|rsvps|logs)$/.test(table)) {'
if (!supabase.includes(strengthEmptyGuard)) {
  const occurrences = supabase.split(eventEmptyGuard).length - 1
  if (occurrences !== 1) throw new Error(`Expected Events empty-write guard exactly once before S&C ownership, found ${occurrences}.`)
  supabase = supabase.replace(eventEmptyGuard, strengthEmptyGuard)
}
if ((supabase.split(strengthEmptyGuard).length - 1) !== 1) throw new Error('S&C adapter must allow explicit empty replacement writes exactly once.')
fs.writeFileSync(supabasePath, supabase.replace(/\n/g, supabaseLineEnding))

console.log('Applied pending-aware S&C replacement ownership with strict mutation-only remote writes.')