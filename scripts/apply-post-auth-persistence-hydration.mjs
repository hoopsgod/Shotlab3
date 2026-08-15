import fs from 'node:fs'
import path from 'node:path'

const appPath = path.resolve(process.cwd(), 'src/App.jsx')
const authPath = path.resolve(process.cwd(), 'src/components/AuthWorkspace.jsx')
let source = fs.readFileSync(appPath, 'utf8')

const signedImport = 'import { requestLegacySignedCollection } from "./lib/legacySignedCollectionPersistence.js";'
const combinedImport = 'import { hydrateAuthenticatedCollectionsToStorage, requestLegacySignedCollection } from "./lib/legacySignedCollectionPersistence.js";'
if (source.includes(signedImport)) source = source.replace(signedImport, combinedImport)
if (!source.includes(combinedImport)) {
  throw new Error('Could not expose authenticated collection hydration inside App login.')
}

const earlyMarker = 'const postAuthHydration=await hydrateAuthenticatedCollectionsToStorage({expectedIdentity:normalizeEmail(p.email)});'
const restoreBoundary = 'if(!SUPABASE_AUTH_ENABLED&&p.teamId)await restoreLegacyTeamContext(p).catch(()=>null);\nsetUser({email:normalizeEmail(p.email),role:p.role||"player",isCoach:(p.role||"player")==="coach",name:p.name,teamId:p.teamId||null,hideFromLeaderboards:p.hideFromLeaderboards===true});'
const earlyReplacement = `if(!SUPABASE_AUTH_ENABLED&&p.teamId)await restoreLegacyTeamContext(p).catch(()=>null);
await DB.set("sl:session",{email:normalizeEmail(p.email)});
const postAuthHydration=await hydrateAuthenticatedCollectionsToStorage({expectedIdentity:normalizeEmail(p.email)});
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

fs.writeFileSync(appPath, source)

let authSource = fs.readFileSync(authPath, 'utf8')
authSource = authSource.replace('import { hydrateAuthenticatedCollectionsToStorage } from "../lib/legacySignedCollectionPersistence.js";\n', '')
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

fs.writeFileSync(authPath, authSource)
console.log('Applied identity-verified registered hydration before the mobile workspace becomes interactive, with no delayed auth reload.')
