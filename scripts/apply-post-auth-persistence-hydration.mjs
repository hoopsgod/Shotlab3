import fs from 'node:fs'
import path from 'node:path'

const appPath = path.resolve(process.cwd(), 'src/App.jsx')
const authPath = path.resolve(process.cwd(), 'src/components/AuthWorkspace.jsx')
const rawSource = fs.readFileSync(appPath, 'utf8')
const appLineEnding = rawSource.includes('\r\n') ? '\r\n' : '\n'
let source = rawSource.replace(/\r\n/g, '\n')

const signedImport = 'import { requestLegacySignedCollection } from "./lib/legacySignedCollectionPersistence.js";'
const combinedImport = 'import { hydrateAuthenticatedCollectionsToStorage, requestLegacySignedCollection } from "./lib/legacySignedCollectionPersistence.js";'

if (source.includes(combinedImport)) {
  source = source.split(signedImport).join('')
} else if (source.includes(signedImport)) {
  source = source.replace(signedImport, combinedImport)
}

const combinedOccurrences = source.split(combinedImport).length - 1
if (combinedOccurrences > 1) {
  let kept = false
  source = source
    .split('\n')
    .filter((line) => {
      if (line !== combinedImport) return true
      if (kept) return false
      kept = true
      return true
    })
    .join('\n')
}

if ((source.split(combinedImport).length - 1) !== 1) {
  throw new Error('Authenticated persistence import must exist exactly once after enhancement.')
}

const earlyMarker = 'const postAuthHydration=await hydrateAuthenticatedCollectionsToStorage({expectedIdentity:normalizeEmail(p.email)});'
const phase3dTeamArgumentMarker = 'const postAuthHydration=await hydrateAuthenticatedCollectionsToStorage({expectedIdentity:normalizeEmail(p.email),expectedTeamId:p.teamId||""});'
if (source.includes(phase3dTeamArgumentMarker)) source = source.replace(phase3dTeamArgumentMarker, earlyMarker)

const legacyEarlySession = `await DB.set("sl:session",{email:normalizeEmail(p.email)});
${earlyMarker}`
const teamEarlySession = `await DB.set("sl:session",{email:normalizeEmail(p.email),teamId:p.teamId||""});
${earlyMarker}`
if (source.includes(legacyEarlySession)) source = source.replace(legacyEarlySession, teamEarlySession)

const restoreBoundary = 'if(!SUPABASE_AUTH_ENABLED&&p.teamId)await restoreLegacyTeamContext(p).catch(()=>null);\nsetUser({email:normalizeEmail(p.email),role:p.role||"player",isCoach:(p.role||"player")==="coach",name:p.name,teamId:p.teamId||null,hideFromLeaderboards:p.hideFromLeaderboards===true});'
const earlyReplacement = `if(!SUPABASE_AUTH_ENABLED&&p.teamId)await restoreLegacyTeamContext(p).catch(()=>null);
await DB.set("sl:session",{email:normalizeEmail(p.email),teamId:p.teamId||""});
${earlyMarker}
if(!postAuthHydration.ok)emitReleaseDiagnostic("post_auth_collection_hydration_incomplete",{email:normalizeEmail(p.email),failures:Array.isArray(postAuthHydration.failures)?postAuthHydration.failures.slice(0,8):[]});
await hydratePersistedData();
setUser({email:normalizeEmail(p.email),role:p.role||"player",isCoach:(p.role||"player")==="coach",name:p.name,teamId:p.teamId||null,hideFromLeaderboards:p.hideFromLeaderboards===true});`

if (!source.includes(earlyMarker)) {
  if (!source.includes(restoreBoundary)) {
    throw new Error('Could not locate the registered pre-navigation hydration boundary in src/App.jsx.')
  }
  source = source.replace(restoreBoundary, earlyReplacement)
}

const lateSession = 'DB.set("sl:session",{email:normalizeEmail(p.email)});\ntrackEvent("auth_login",{method:"password"},{email:normalizeEmail(p.email),role:p.role||"player",teamId:p.teamId||null});'
const lateAwaitedSession = 'await DB.set("sl:session",{email:normalizeEmail(p.email)});\ntrackEvent("auth_login",{method:"password"},{email:normalizeEmail(p.email),role:p.role||"player",teamId:p.teamId||null});'
const trackOnly = 'trackEvent("auth_login",{method:"password"},{email:normalizeEmail(p.email),role:p.role||"player",teamId:p.teamId||null});'
if (source.includes(lateAwaitedSession)) source = source.replace(lateAwaitedSession, trackOnly)
if (source.includes(lateSession)) source = source.replace(lateSession, trackOnly)

const legacyLateHydration = `${trackOnly}\nawait hydratePersistedData();\nreturn{ok:true};`
if (source.includes(legacyLateHydration)) source = source.replace(legacyLateHydration, `${trackOnly}\nreturn{ok:true};`)

const markerIndex = source.indexOf(earlyMarker)
const setUserIndex = source.indexOf('setUser({email:normalizeEmail(p.email)', markerIndex)
const hydrateIndex = source.indexOf('await hydratePersistedData();', markerIndex)
if (markerIndex < 0 || hydrateIndex < markerIndex || setUserIndex < hydrateIndex) {
  throw new Error('Registered collection hydration must finish before the authenticated mobile workspace becomes visible.')
}

fs.writeFileSync(appPath, source.replace(/\n/g, appLineEnding))

const rawAuthSource = fs.readFileSync(authPath, 'utf8')
const authLineEnding = rawAuthSource.includes('\r\n') ? '\r\n' : '\n'
let authSource = rawAuthSource.replace(/\r\n/g, '\n')
authSource = authSource.replace('import { hydrateAuthenticatedCollectionsToStorage } from "../lib/legacySignedCollectionPersistence.js";\n', '')

// App owns registered post-login hydration before the authenticated workspace becomes interactive.
// Remove only AuthWorkspace's duplicate hydration/reload sequence so Auth can keep its current
// user-facing error, loading, and accessibility treatment without this enhancer depending on it.
for (const duplicateHydration of [
  'await hydrateAuthenticatedCollectionsToStorage().catch(()=>null);\nif(typeof window!=="undefined"&&typeof window.location?.reload==="function")window.location.reload();',
  'await hydrateAuthenticatedCollectionsToStorage({expectedIdentity:id}).catch(()=>null);\nif(typeof window!=="undefined"&&typeof window.location?.reload==="function")window.location.reload();',
]) {
  authSource = authSource.split(duplicateHydration).join('')
}

// Preserve compatibility with older source shapes if this enhancer is applied to an unpolished checkout.
authSource = authSource.replace(
  'if(!r.ok){setErr(r.err);return}\nawait hydrateAuthenticatedCollectionsToStorage().catch(()=>null);\nif(typeof window!=="undefined"&&typeof window.location?.reload==="function")window.location.reload();',
  'if(!r.ok){setErr(r.err);return}',
)
authSource = authSource.replace(
  'if(!r.ok){setErr(r.err);return}\nawait hydrateAuthenticatedCollectionsToStorage({expectedIdentity:id}).catch(()=>null);\nif(typeof window!=="undefined"&&typeof window.location?.reload==="function")window.location.reload();',
  'if(!r.ok){setErr(r.err);return}',
)

if (authSource.includes('hydrateAuthenticatedCollectionsToStorage') || authSource.includes('window.location.reload()')) {
  throw new Error('AuthWorkspace must not trigger a second post-login hydration/reload after App has exposed the authenticated route.')
}

fs.writeFileSync(authPath, authSource.replace(/\n/g, authLineEnding))
console.log('Applied identity- and team-verified registered hydration before the mobile workspace becomes interactive, with no delayed auth reload.')
