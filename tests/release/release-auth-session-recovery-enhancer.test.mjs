import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const scriptPath = fileURLToPath(new URL('../../scripts/apply-release-auth-session-recovery.mjs', import.meta.url))

const currentHydratedSource = `
const navigateToPlayerHome=useCallback(()=>{
if(typeof window==="undefined")return;
const homePath=PLAYER_TAB_PATHS.home||"/";
if(window.location.pathname!==homePath)window.history.replaceState({},"",homePath);
},[]);
const supabaseSessionRequest=SUPABASE_AUTH_ENABLED?supabase.auth.getSession():null;
const initialSupabaseSession=SUPABASE_AUTH_ENABLED?await Promise.race([supabaseSessionRequest,new Promise(r=>setTimeout(()=>r(null),3e3))]):null;
const supabaseEmail=normalizeEmail(initialSupabaseSession?.data?.session?.user?.email);const explicitDemo=new URLSearchParams(window.location.search).get("demo")==="1";const authEmail=normalizeEmail(supabaseEmail||((!SUPABASE_AUTH_ENABLED||explicitDemo&&isDemoAccount(sess?.email))?sess?.email:""));
if(rp.role==="player")navigateToPlayerHome();setView(rp.role||"player");
if((found.role||"player")==="player")navigateToPlayerHome();setView(found.role||"player")
const directLogin=()=>navigateToPlayerHome();
setPendingJoinContext(normalizeStoredInviteContext(pendingCtx)||readInviteContextFromStorage()||null);
`

test('enhancer upgrades an already slow-recovery-patched App for demo reload and Player deep-route restoration', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'shotlab-auth-recovery-'))
  await mkdir(path.join(root, 'src'))
  const appPath = path.join(root, 'src', 'App.jsx')
  await writeFile(appPath, currentHydratedSource)

  const result = spawnSync(process.execPath, [scriptPath], { cwd: root, encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr || result.stdout)

  const transformed = await readFile(appPath, 'utf8')
  assert.match(transformed, /const demoPersistenceSession=isDemoPersistenceSession\(\)/)
  assert.match(transformed, /preserveCurrentRoute=false/)
  assert.match(transformed, /hasOwnProperty\.call\(PLAYER_PATH_TABS,currentPath\)/)
  assert.match(transformed, /navigateToPlayerHome\(\{preserveCurrentRoute:true\}\)/)
  assert.match(transformed, /const directLogin=\(\)=>navigateToPlayerHome\(\);/)

  const once = transformed
  const second = spawnSync(process.execPath, [scriptPath], { cwd: root, encoding: 'utf8' })
  assert.equal(second.status, 0, second.stderr || second.stdout)
  assert.equal(await readFile(appPath, 'utf8'), once)
})
