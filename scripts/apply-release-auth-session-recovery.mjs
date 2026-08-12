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
else{if((found.role||"player")==="player")navigateToPlayerHome();setView(found.role||"player");}
}).catch(error=>emitReleaseDiagnostic("late_auth_session_restore_failed",{message:String(error?.message||"unknown")}));
}
${insertionAnchor}`

async function main() {
  let source = await readFile(appPath, 'utf8')
  if (source.includes(marker)) {
    console.log('Slow Supabase session recovery already applied.')
    return
  }
  if (!source.includes(timeoutSource)) {
    throw new Error('Could not find the bounded Supabase session bootstrap contract in src/App.jsx.')
  }
  if (!source.includes(insertionAnchor)) {
    throw new Error('Could not find the pending join-context anchor in src/App.jsx.')
  }

  source = source.replace(timeoutSource, timeoutReplacement)
  source = source.replace(insertionAnchor, lateRecovery)
  await writeFile(appPath, source)
  console.log('Applied bounded late Supabase session recovery with current-session revalidation.')
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
