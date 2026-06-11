import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { isDemoPlayerSessionShotLog } from '../src/lib/demoMode.js'
import { calculateLeaderboardFromShotLogs } from '../src/lib/leaderboardService.js'

const appSource = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8')

const extractDeleteAccountSource = () => {
  const start = appSource.indexOf('const deleteAccount=async()=>{')
  assert.notEqual(start, -1, 'deleteAccount handler should be present')
  const end = appSource.indexOf('\n};\nconst createTeam=', start)
  assert.notEqual(end, -1, 'deleteAccount handler should end before createTeam')
  return appSource.slice(start, end)
}

test('delete account and data request entries are first-class account surface actions', () => {
  assert.match(appSource, /function AccountTrustActions\(\{deleteAccount,preserveTeamData=false\}\)/)
  assert.match(appSource, /data-testid="account-data-request-entry"/)
  assert.match(appSource, />Data Request</)
  assert.match(appSource, />REQUEST DATA</)
  assert.match(appSource, />Delete Account & Data</)
  assert.match(appSource, /busy\?"WORKING\.\.\.":"CONFIRM"/)
  assert.match(appSource, /role="status"/)
  assert.match(appSource, /<AccountTrustActions deleteAccount=\{deleteAccount\}\/>/)
  assert.match(appSource, /<AccountTrustActions deleteAccount=\{deleteAccount\} preserveTeamData\/>/)
  assert.match(appSource, /const requestHref=buildLegalContactHref\("ShotLab account data request"\)/)
})

test('privacy terms support contact and account links render from legal routes and account surfaces', () => {
  for (const label of ['Privacy', 'Terms', 'Support', 'Delete Account', 'Data Request']) {
    assert.match(appSource, new RegExp(`label:"${label}"`))
  }
  assert.match(appSource, /function StaticLegalPage\(\{pageKey\}\)/)
  assert.match(appSource, /data-testid="static-legal-page"/)
  assert.match(appSource, /EMAIL SUPPORT/)
  assert.match(appSource, /minHeight:44/)
  assert.match(appSource, /touchAction:"manipulation"/)
  assert.match(appSource, /<LegalSupportLinks compact\/>/)
})

test('demo player session data stays isolated from registered player leaderboard data', () => {
  const shotLogs = [
    { id: 'registered', email: 'player@team.com', playerId: 'player@team.com', teamId: 'team-real', made: 100, syncState: 'remote_saved', syncSource: 'remote' },
    { id: 'demo-local', email: 'demo@shotlab.app', playerId: 'demo@shotlab.app', teamId: 'team-demo', made: 999, demo: true, syncState: 'local_pending', syncSource: 'local' },
  ]
  const rows = calculateLeaderboardFromShotLogs({ shotLogs, teamId: 'team-real' })
  assert.deepEqual(rows.map((row) => row.email), ['player@team.com'])
  assert.equal(isDemoPlayerSessionShotLog(shotLogs[1], { teamId: 'team-demo' }), true)
  assert.match(appSource, /const coachVisibleShotLogs=scopedShotLogs\.filter\(l=>l\.syncState==="remote_saved"&&l\.syncSource==="remote"\)/)
})

test('demo logout cleanup behavior remains wired to local demo shot cleanup', () => {
  assert.match(appSource, /const cleanupDemoPlayerSessionData=useCallback/)
  assert.match(appSource, /isDemoPlayerSessionShotLog\(log,\{teamId:demoTeamId\}\)/)
  assert.match(appSource, /if\(isDemoMode\(\)\|\|isDemoAccount\(exitingUser\)\)await cleanupDemoPlayerSessionData\(exitingUser\)/)
  assert.match(appSource, /syncState:"local_pending"/)
  assert.match(appSource, /demo:true/)
})

test('player and coach account profile surfaces use AccountTrustActions', () => {
  assert.match(appSource, /function ProfilePage\(\{u,scores,shotLogs/)
  assert.match(appSource, /tab==="profile"&&<div className=\{slideClass\} key="profile"><ProfilePage/)
  assert.match(appSource, /<AccountTrustActions deleteAccount=\{deleteAccount\}\/>/)
  assert.match(appSource, /function Coach\(\{u,team,regenerateJoinCode/)
  assert.match(appSource, /DEMO SETTINGS/)
  assert.match(appSource, /LEGAL & SUPPORT/)
  assert.match(appSource, /<AccountTrustActions deleteAccount=\{deleteAccount\} preserveTeamData\/>/)
})


test('deleteAccount returns result objects for success and failure', () => {
  const deleteAccountSource = extractDeleteAccountSource()
  assert.match(deleteAccountSource, /return\{ok:true\}/)
  assert.match(deleteAccountSource, /return\{ok:false,error:"No active account\."\}/)
  assert.match(deleteAccountSource, /return\{ok:false,error:"Could not complete that request\. Please try again or contact support\."\}/)
  assert.match(deleteAccountSource, /catch\(error\)/)
})

test('deleteAccount preserves demo cleanup path and does not target unrelated team data', () => {
  const deleteAccountSource = extractDeleteAccountSource()
  assert.match(deleteAccountSource, /if\(isDemoMode\(\)\|\|isDemoAccount\(user\)\)await cleanupDemoPlayerSessionData\(user\)/)
  assert.match(deleteAccountSource, /const e=String\(user\.email\|\|""\)\.trim\(\)\.toLowerCase\(\)/)
  assert.match(deleteAccountSource, /players\.filter\(p=>String\(p\?\.email\|\|""\)\.trim\(\)\.toLowerCase\(\)!==e\)/)
  assert.match(deleteAccountSource, /scores\.filter\(s=>!isSelf\(s\)\)/)
  assert.match(deleteAccountSource, /rsvps\.filter\(r=>!isSelf\(r\)\)/)
  assert.match(deleteAccountSource, /shotLogs\.filter\(s=>!isSelf\(s\)\)/)
  assert.doesNotMatch(deleteAccountSource, /P\("sl:teams"/)
  assert.doesNotMatch(deleteAccountSource, /setTeams/)
})

test('shot logging handler remains present and demo safe', () => {
  assert.match(appSource, /const addShotLog=async\(made,date\)=>/)
  assert.match(appSource, /buildLocalHomeShotLog\(\{id:genId\("shotlog"\),user,made:validation\.made,date:validation\.date\}\)/)
  assert.match(appSource, /saveHomeShotLogRemote\(localLog\)/)
  assert.match(appSource, /return\{ok:true,mode:"demo_saved",syncState:"local_pending",demo:true\}/)
})
