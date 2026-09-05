import fs from 'node:fs'
import path from 'node:path'

const appPath = path.resolve(process.cwd(), 'src/App.jsx')
const rawSource = fs.readFileSync(appPath, 'utf8')
const lineEnding = rawSource.includes('\r\n') ? '\r\n' : '\n'
let source = rawSource.replace(/\r\n/g, '\n')

const previousAuthority = 'const signedReplacementCollection = k === "sl:sc-sessions" || k === "sl:sc-rsvps" || k === "sl:sc-logs";'
const phase3dAuthority = 'const signedReplacementCollection = k === "sl:rsvps" || k === "sl:sc-sessions" || k === "sl:sc-rsvps" || k === "sl:sc-logs";'

if (!source.includes(phase3dAuthority)) {
  const occurrences = source.split(previousAuthority).length - 1
  if (occurrences !== 1) {
    throw new Error(`Expected exactly one signed replacement collection authority before Phase 3D, found ${occurrences}.`)
  }
  source = source.replace(previousAuthority, phase3dAuthority)
}

if ((source.split(phase3dAuthority).length - 1) !== 1) {
  throw new Error('Phase 3D RSVP replacement authority must exist exactly once after enhancement.')
}

fs.writeFileSync(appPath, source.replace(/\n/g, lineEnding))

const supabasePath = path.resolve(process.cwd(), 'src/lib/supabase.js')
const rawSupabaseSource = fs.readFileSync(supabasePath, 'utf8')
const supabaseLineEnding = rawSupabaseSource.includes('\r\n') ? '\r\n' : '\n'
let supabaseSource = rawSupabaseSource.replace(/\r\n/g, '\n')
const previousEmptyWriteGuard = 'if (method !== "GET" && body && Array.isArray(normalizedBody) && normalizedBody.length === 0) {'
const phase3dEmptyWriteGuard = 'if (method !== "GET" && body && Array.isArray(normalizedBody) && normalizedBody.length === 0 && table !== "rsvps") {'

if (!supabaseSource.includes(phase3dEmptyWriteGuard)) {
  const occurrences = supabaseSource.split(previousEmptyWriteGuard).length - 1
  if (occurrences !== 1) {
    throw new Error(`Expected exactly one empty-write short-circuit before Phase 3D, found ${occurrences}.`)
  }
  supabaseSource = supabaseSource.replace(previousEmptyWriteGuard, phase3dEmptyWriteGuard)
}

if ((supabaseSource.split(phase3dEmptyWriteGuard).length - 1) !== 1) {
  throw new Error('Phase 3D must allow exactly one RSVP empty replacement write through the Supabase adapter.')
}

fs.writeFileSync(supabasePath, supabaseSource.replace(/\n/g, supabaseLineEnding))

const bridgePath = path.resolve(process.cwd(), 'src/lib/apiFetchBridge.js')
const rawBridgeSource = fs.readFileSync(bridgePath, 'utf8')
const bridgeLineEnding = rawBridgeSource.includes('\r\n') ? '\r\n' : '\n'
let bridgeSource = rawBridgeSource.replace(/\r\n/g, '\n')
const scheduleSet = 'const SIGNED_SCHEDULE_RESOURCES = new Set(["events", "rsvps"]);\n'
const scheduleSetLookup = 'return SIGNED_SCHEDULE_RESOURCES.has(resource) ? resource : "";'
const compactScheduleLookup = 'return resource === "events" || resource === "rsvps" ? resource : "";'

if (bridgeSource.includes(scheduleSetLookup)) {
  if (!bridgeSource.includes(scheduleSet)) throw new Error('Schedule resource set declaration is missing before Phase 3D compaction.')
  bridgeSource = bridgeSource.replace(scheduleSet, '').replace(scheduleSetLookup, compactScheduleLookup)
}
if (!bridgeSource.includes(compactScheduleLookup) || bridgeSource.includes('SIGNED_SCHEDULE_RESOURCES')) {
  throw new Error('Phase 3D schedule bridge compaction did not converge to the expected behavior-equivalent lookup.')
}
fs.writeFileSync(bridgePath, bridgeSource.replace(/\n/g, bridgeLineEnding))

console.log('Applied Phase 3D RSVP replacement ownership with compact signed-schedule routing and empty authoritative syncs.')
