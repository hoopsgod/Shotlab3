import fs from 'node:fs'
import path from 'node:path'

const appPath = path.resolve(process.cwd(), 'src/App.jsx')
const authPath = path.resolve(process.cwd(), 'src/components/AuthWorkspace.jsx')
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

let authSource = fs.readFileSync(authPath, 'utf8')
const authImport = 'import { hydrateAuthenticatedCollectionsToStorage } from "../lib/legacySignedCollectionPersistence.js";'
if (!authSource.includes(authImport)) {
  throw new Error('AuthWorkspace must retain the authenticated collection hydration fallback.')
}

const authHydrationNeedle = 'await hydrateAuthenticatedCollectionsToStorage().catch(()=>null);'
const authHydrationReplacement = 'await hydrateAuthenticatedCollectionsToStorage({expectedIdentity:id}).catch(()=>null);'
if (authSource.includes(authHydrationNeedle)) {
  authSource = authSource.replace(authHydrationNeedle, authHydrationReplacement)
}

if (!authSource.includes(authHydrationReplacement)) {
  throw new Error('Could not bind post-login storage hydration to the newly signed-in identity.')
}
if (!authSource.includes('window.location.reload()')) {
  throw new Error('Registered login must reload once after authenticated storage hydration so startup reads the signed-in collections.')
}

fs.writeFileSync(authPath, authSource)
console.log('Applied registered post-auth hydration with identity-verified storage fallback and one clean startup reload.')
