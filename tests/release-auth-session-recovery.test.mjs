import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const enhancer = path.join(repoRoot, 'scripts/apply-release-auth-session-recovery.mjs')
const oldBootstrap = 'const authEmail=normalizeEmail(SUPABASE_AUTH_ENABLED?(await Promise.race([supabase.auth.getSession(),new Promise(r=>setTimeout(r,3e3))]))?.data?.session?.user?.email:sess?.email);'
const joinAnchor = 'setPendingJoinContext(normalizeStoredInviteContext(pendingCtx)||readInviteContextFromStorage()||null);'

test('slow Supabase sessions recover only after current-session revalidation', async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'shotlab-auth-recovery-'))
  try {
    await mkdir(path.join(tempRoot, 'src'))
    await writeFile(path.join(tempRoot, 'src/App.jsx'), `${oldBootstrap}\nif(authEmail){/* immediate restore */}\n${joinAnchor}\n`)

    const result = spawnSync(process.execPath, [enhancer], {
      cwd: tempRoot,
      encoding: 'utf8',
    })
    assert.equal(result.status, 0, result.stderr)

    const transformed = await readFile(path.join(tempRoot, 'src/App.jsx'), 'utf8')
    assert.match(transformed, /const supabaseSessionRequest=SUPABASE_AUTH_ENABLED\?supabase\.auth\.getSession\(\):null;/)
    assert.match(transformed, /Promise\.race\(\[supabaseSessionRequest,new Promise\(r=>setTimeout\(\(\)=>r\(null\),3e3\)\)\]\)/)
    assert.match(transformed, /const lateEmail=normalizeEmail\(result\?\.data\?\.session\?\.user\?\.email\);/)
    assert.match(transformed, /const currentSessionResult=await supabase\.auth\.getSession\(\)\.catch\(\(\)=>null\);/)
    assert.match(transformed, /if\(currentEmail!==lateEmail\)return;/)
    assert.ok(transformed.indexOf('if(currentEmail!==lateEmail)return;') < transformed.indexOf('setUser({email:found.email'), 'current-session validation must happen before late user restoration')

    const second = spawnSync(process.execPath, [enhancer], {
      cwd: tempRoot,
      encoding: 'utf8',
    })
    assert.equal(second.status, 0, second.stderr)
    assert.match(second.stdout, /already applied/)
  } finally {
    await rm(tempRoot, { recursive: true, force: true })
  }
})

test('route enhancer orchestration includes auth recovery for dev and build', async () => {
  const runner = await readFile(path.join(repoRoot, 'scripts/run-route-enhancers.mjs'), 'utf8')
  const occurrences = runner.match(/scripts\/apply-release-auth-session-recovery\.mjs/g) || []
  assert.equal(occurrences.length, 1)
  assert.ok(runner.indexOf('scripts/apply-release-auth-session-recovery.mjs') < runner.indexOf('export const DEV_ROUTE_ENHANCERS'))
})
