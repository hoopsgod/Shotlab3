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
console.log('Applied Phase 3D RSVP replacement collection authority, including empty authoritative syncs.')
