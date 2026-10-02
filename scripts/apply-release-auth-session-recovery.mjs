import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const appPath = path.resolve(process.cwd(), 'src/App.jsx')
const marker = 'const supabaseSessionRequest=SUPABASE_AUTH_ENABLED?supabase.auth.getSession():null;'

const timeoutSource = 'const authEmail=normalizeEmail(SUPABASE_AUTH_ENABLED?(await Promise.race([supabase.auth.getSession(),new Promise(r=>setTimeout(r,3e3))]))?.data?.session?.user?.email:sess?.email);'
const timeoutReplacement = `const supabaseSessionRequest=SUPABASE_AUTH_ENABLED?supabase.auth.getSession():null;
const initialSupabaseSession=SUPABASE_AUTH_ENABLED?await Promise.race([supabaseSessionRequest,new Promise(r=>setTimeout(()=>r(null),3e3))]):null;
const authEmail=normalizeEmail(SUPABASE_AUTH_ENABLED?initialSupabaseSession?.data?.session?.user?.email:sess?.email);`

const insertionAnchor = 'setPendingJoinContext(normalizeStoredInviteContext(pendingCtx)||readInviteContextFromStorage()||null);'
const lateRecovery = `if(SUPABASE_AUTH_ENABLED&&!authEmail&&supabaseSessionRequest){
void supabaseSessionRequest.then(async(result)=>{
const lateEmail=normalizeEmail(result?.data?.session?.user?.email);
if(!lateEmail)return;
const currentSessionResult=await supabase.auth.getSession().catch(()=>null);
const currentEmail=normalizeEmail(currentSessionResult?.data?.session?.user?.email);
if(currentEmail!==lateEmail)return;
const found=m.playersMigrated.find(pl=>normalizeEmail(pl.email)===lateEmail);
if(!found)return;
setUser({email:found.email,role:found.role||"player",isCoach:(found.role||"player")==="coach",name:found.name,teamId:found.teamId,hideFromLeaderboards:found.hideFromLeaderboards===true});
setDataDebug(prev=>({...prev,auth:{...prev.auth,sessionPresent:"yes",profileLoad:"success",restoredRoleTeamId:(found.role&&found.teamId)?"yes":"no",lateSessionRestore:"success"}}));
if(found.role==="coach"&&!found.teamId)setView("create-team");
else if(found.role==="player"&&!found.teamId)setView("join-team");
else{if((found.role||"player")==="player")navigateToPlayerHome({preserveCurrentRoute:true});setView(found.role||"player");}
}).catch(error=>emitReleaseDiagnostic("late_auth_session_restore_failed",{message:String(error?.message||"unknown")}));
}
${insertionAnchor}`

const playerHomeSource = `const navigateToPlayerHome=useCallback(()=>{
if(typeof window==="undefined")return;
const homePath=PLAYER_TAB_PATHS.home||"/";
if(window.location.pathname!==homePath)window.history.replaceState({},"",homePath);
},[]);`

const playerHomeReplacement = `const navigateToPlayerHome=useCallback(({preserveCurrentRoute=false}={})=>{
if(typeof window==="undefined")return;
const normalizePlayerPath=(value)=>String(value||"/").replace(/\\/+$/g,"")||"/";
const homePath=normalizePlayerPath(PLAYER_TAB_PATHS.home||"/");
const currentPath=normalizePlayerPath(window.location.pathname);
if(preserveCurrentRoute&&Object.prototype.hasOwnProperty.call(PLAYER_PATH_TABS,currentPath))return;
if(currentPath!==homePath)window.history.replaceState({},"",homePath);
},[]);`

const demoAuthSource = 'const supabaseEmail=normalizeEmail(initialSupabaseSession?.data?.session?.user?.email);const explicitDemo=new URLSearchParams(window.location.search).get("demo")==="1";const authEmail=normalizeEmail(supabaseEmail||((!SUPABASE_AUTH_ENABLED||explicitDemo&&isDemoAccount(sess?.email))?sess?.email:""));'
const demoAuthReplacement = 'const supabaseEmail=normalizeEmail(initialSupabaseSession?.data?.session?.user?.email);const demoPersistenceSession=isDemoPersistenceSession();const authEmail=normalizeEmail(supabaseEmail||((!SUPABASE_AUTH_ENABLED||demoPersistenceSession&&isDemoAccount(sess?.email))?sess?.email:""));'

const legacyDemoRestoreSource = 'if(authEmail&&!SUPABASE_AUTH_ENABLED){const restore=await legacyAuthFetch("/v1/legacy-auth/restore",{email:authEmail});'
const legacyDemoRestoreReplacement = 'if(authEmail&&!SUPABASE_AUTH_ENABLED&&!demoPersistenceSession){const restore=await legacyAuthFetch("/v1/legacy-auth/restore",{email:authEmail});'
const legacyHydrationSource = 'if(rp.role==="player")navigateToPlayerHome();setView(rp.role||"player");'
const legacyHydrationReplacement = 'if(rp.role==="player")navigateToPlayerHome({preserveCurrentRoute:true});setView(rp.role||"player");'
const signedHydrationSource = 'if((found.role||"player")==="player")navigateToPlayerHome();setView(found.role||"player")'
const signedHydrationReplacement = 'if((found.role||"player")==="player")navigateToPlayerHome({preserveCurrentRoute:true});setView(found.role||"player")'

function replaceRequired(source, before, after, alreadyAppliedMarker, label, { all = false } = {}) {
  if (source.includes(before)) return { source: all ? source.replaceAll(before, after) : source.replace(before, after), changed: true }
  if (source.includes(alreadyAppliedMarker)) return { source, changed: false }
  throw new Error(`Could not find the ${label} contract in src/App.jsx.`)
}

function applyExplicitDemoIdentity(source) {
  const appliedMarker = 'setDemoMode(true,{email:kind==="coach"?DEMO_COACH.email:DEMO_PLAYER.email})'
  const obsoleteMarker = 'setDemoMode(true,{email:acct.email})'
  if (source.includes(appliedMarker)) return { source, changed: false }
  const start = source.indexOf('const demoSignIn=')
  const end = source.indexOf('const cleanupDemoPlayerSessionData=', start)
  if (start < 0 || end <= start) throw new Error('Could not find the Demo sign-in contract in src/App.jsx.')
  const demoSignInSource = source.slice(start, end)
  let nextDemoSignInSource = demoSignInSource
  if (demoSignInSource.includes(obsoleteMarker)) {
    nextDemoSignInSource = demoSignInSource.replace(obsoleteMarker, appliedMarker)
  } else if (demoSignInSource.includes('setDemoMode(true)')) {
    nextDemoSignInSource = demoSignInSource.replace('setDemoMode(true)', appliedMarker)
  } else {
    throw new Error('Could not find the Demo mode activation inside Demo sign-in.')
  }
  return { source: `${source.slice(0, start)}${nextDemoSignInSource}${source.slice(end)}`, changed: true }
}

async function main() {
  let source = await readFile(appPath, 'utf8')
  let changed = false

  if (!source.includes(marker)) {
    if (!source.includes(timeoutSource)) {
      throw new Error('Could not find the bounded Supabase session bootstrap contract in src/App.jsx.')
    }
    if (!source.includes(insertionAnchor)) {
      throw new Error('Could not find the pending join-context anchor in src/App.jsx.')
    }
    source = source.replace(timeoutSource, timeoutReplacement)
    source = source.replace(insertionAnchor, lateRecovery)
    changed = true
  }

  let result = replaceRequired(source, playerHomeSource, playerHomeReplacement, 'preserveCurrentRoute=false', 'Player home navigation')
  source = result.source
  changed ||= result.changed

  result = replaceRequired(source, demoAuthSource, demoAuthReplacement, 'const demoPersistenceSession=isDemoPersistenceSession()', 'same-tab Demo restoration')
  source = result.source
  changed ||= result.changed

  result = replaceRequired(source, legacyDemoRestoreSource, legacyDemoRestoreReplacement, 'if(authEmail&&!SUPABASE_AUTH_ENABLED&&!demoPersistenceSession){', 'Demo legacy-auth bypass')
  source = result.source
  changed ||= result.changed

  result = applyExplicitDemoIdentity(source)
  source = result.source
  changed ||= result.changed

  result = replaceRequired(source, legacyHydrationSource, legacyHydrationReplacement, 'navigateToPlayerHome({preserveCurrentRoute:true});setView(rp.role||"player");', 'legacy Player route restoration')
  source = result.source
  changed ||= result.changed

  result = replaceRequired(source, signedHydrationSource, signedHydrationReplacement, 'navigateToPlayerHome({preserveCurrentRoute:true});setView(found.role||"player")', 'signed Player route restoration', { all: true })
  source = result.source
  changed ||= result.changed

  if (changed) {
    await writeFile(appPath, source)
    console.log('Applied release auth recovery, same-tab Demo restoration, Demo legacy-auth bypass, and Player deep-route preservation.')
  } else {
    console.log('Release auth recovery, same-tab Demo restoration, Demo legacy-auth bypass, and Player deep-route preservation already applied.')
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
