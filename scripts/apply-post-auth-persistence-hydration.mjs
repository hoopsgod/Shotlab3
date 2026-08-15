import fs from 'node:fs'
import path from 'node:path'

const appPath = path.resolve(process.cwd(), 'src/App.jsx')
let source = fs.readFileSync(appPath, 'utf8')

const sessionNeedle = 'DB.set("sl:session",{email:normalizeEmail(p.email)});\ntrackEvent("auth_login",{method:"password"},{email:normalizeEmail(p.email),role:p.role||"player",teamId:p.teamId||null});'
const sessionReplacement = 'await DB.set("sl:session",{email:normalizeEmail(p.email)});\ntrackEvent("auth_login",{method:"password"},{email:normalizeEmail(p.email),role:p.role||"player",teamId:p.teamId||null});'

if (source.includes(sessionNeedle)) {
  source = source.replace(sessionNeedle, sessionReplacement)
}

const marker = 'trackEvent("auth_login",{method:"password"},{email:normalizeEmail(p.email),role:p.role||"player",teamId:p.teamId||null});\nawait hydratePersistedData();\nreturn{ok:true};'
const needle = 'trackEvent("auth_login",{method:"password"},{email:normalizeEmail(p.email),role:p.role||"player",teamId:p.teamId||null});\nreturn{ok:true};'

if (!source.includes(marker)) {
  if (!source.includes(needle)) {
    throw new Error('Could not locate the registered login completion boundary in src/App.jsx.')
  }

  source = source.replace(
    needle,
    'trackEvent("auth_login",{method:"password"},{email:normalizeEmail(p.email),role:p.role||"player",teamId:p.teamId||null});\nawait hydratePersistedData();\nreturn{ok:true};',
  )
}

if (!source.includes(sessionReplacement)) {
  throw new Error('Could not guarantee the registered session write completes before persistence hydration.')
}

fs.writeFileSync(appPath, source)
console.log('Applied registered post-auth persistence hydration after a committed session marker.')
