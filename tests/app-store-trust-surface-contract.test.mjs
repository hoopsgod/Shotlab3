import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { isDemoPlayerSessionShotLog } from '../src/lib/demoMode.js'
import { calculateLeaderboardFromShotLogs } from '../src/lib/leaderboardService.js'

const appSource = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8')


const extractAccountTrustActionsSource = () => {
  const start = appSource.indexOf('function AccountTrustActions({deleteAccount,preserveTeamData=false}){')
  assert.notEqual(start, -1, 'AccountTrustActions should be present')
  const end = appSource.indexOf('\nfunction StaticLegalPage', start)
  assert.notEqual(end, -1, 'AccountTrustActions should end before StaticLegalPage')
  return appSource.slice(start, end)
}

const extractDeleteAccountSource = () => {
  const start = appSource.indexOf('const deleteAccount=async()=>{')
  assert.notEqual(start, -1, 'deleteAccount handler should be present')
  const end = appSource.indexOf('\n};\nconst createTeam=', start)
  assert.notEqual(end, -1, 'deleteAccount handler should end before createTeam')
  return appSource.slice(start, end)
}

test('delete account and data request entries are first-class account surface actions', () => {
  const accountTrustSource = extractAccountTrustActionsSource()
  assert.match(accountTrustSource, /data-testid="account-data-request-entry"/)
  assert.match(accountTrustSource, />Data Request</)
  assert.match(accountTrustSource, />REQUEST DATA</)
  assert.match(accountTrustSource, />Delete Account & Data</)
  assert.match(accountTrustSource, /CONFIRM ACCOUNT REQUEST/)
  assert.match(accountTrustSource, />CONFIRM DELETE ACCOUNT<\/button>/)
  assert.match(accountTrustSource, /role="status"/)
  assert.match(appSource, /<AccountTrustActions deleteAccount=\{deleteAccount\}\/>/)
  assert.match(appSource, /<AccountTrustActions deleteAccount=\{deleteAccount\} preserveTeamData\/>/)
  assert.match(accountTrustSource, /const requestHref=buildLegalContactHref\("ShotLab account data request"\)/)
})


test('delete account primary path is in-app and support email is secondary', () => {
  const accountTrustSource = extractAccountTrustActionsSource()
  const deleteButtonIndex = accountTrustSource.indexOf('>Delete Account & Data</button>')
  const confirmPanelIndex = accountTrustSource.indexOf('CONFIRM ACCOUNT REQUEST')
  const primaryConfirmIndex = accountTrustSource.indexOf('CONFIRM DELETE ACCOUNT')
  const directDeleteCallIndex = accountTrustSource.indexOf('const result=await deleteAccount()')
  const supportLinkIndex = accountTrustSource.indexOf('Need help? Email support')
  assert.ok(deleteButtonIndex >= 0, 'main delete action should be a button, not a mailto link')
  assert.ok(confirmPanelIndex > deleteButtonIndex, 'main delete action should open an in-app confirmation panel')
  assert.ok(directDeleteCallIndex >= 0 && directDeleteCallIndex < primaryConfirmIndex, 'primary confirmation button should call deleteAccount directly')
  assert.ok(supportLinkIndex > primaryConfirmIndex, 'support email fallback should appear below the primary in-app confirm button')
  assert.match(accountTrustSource, /const deleteHref=buildLegalContactHref\("Delete my ShotLab account"\)/)
  assert.match(accountTrustSource, />Need help\? Email support<\/a>/)
  assert.doesNotMatch(accountTrustSource, /Email support instead|>CONFIRM<\/button>/)
  assert.doesNotMatch(accountTrustSource.slice(deleteButtonIndex, deleteButtonIndex + 260), /href=\{deleteHref\}|mailto:/)
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
  assert.match(appSource, /Signed-in users should go to Profile → Account & Data → Delete Account & Data/)
  assert.match(appSource, /Email support is only for help or special requests/)
})


test('signed-in delete-account route renders in-app account deletion flow instead of static email-only page', () => {
  assert.match(appSource, /if\(legalRouteKey&&legalRouteKey!=="delete-account"\)return <StaticLegalPage pageKey=\{legalRouteKey\}\/>;/)
  assert.match(appSource, /const isDeleteAccountRoute=typeof window!=="undefined"&&getLegalRouteKey\(window\.location\.pathname\)==="delete-account";/)
  assert.match(appSource, /const\[restoredSessionEmail,setRestoredSessionEmail\]=useState\(""\);/)
  assert.match(appSource, /setRestoredSessionEmail\(authEmail\)/)
  assert.match(appSource, /if\(isDeleteAccountRoute\)\{\s*if\(!user&&!restoredSessionEmail\)return <StaticLegalPage pageKey="delete-account"\/>;/)
  assert.match(appSource, /data-testid="signed-in-delete-account-route"/)
  assert.match(appSource, /You are signed in\. Delete your account in-app below instead of using the static support fallback\./)
  assert.match(appSource, /<AccountTrustActions deleteAccount=\{deleteAccount\} preserveTeamData=\{user\?\.role==="coach"\|\|user\?\.isCoach\}\/>/)
})

test('signed-out delete-account route can still show static support fallback', () => {
  assert.match(appSource, /if\(!user&&!restoredSessionEmail\)return <StaticLegalPage pageKey="delete-account"\/>;/)
  assert.match(appSource, /Support fallback/)
  assert.match(appSource, /Email support is only for help or special requests/)
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
  assert.match(deleteAccountSource, /const activeUser=user\|\|\{email:restoredSessionEmail,role:"player",isCoach:false,teamId:""\};/)
  assert.match(deleteAccountSource, /if\(isDemoMode\(\)\|\|isDemoAccount\(activeUser\)\)await cleanupDemoPlayerSessionData\(activeUser\)/)
  assert.match(deleteAccountSource, /const e=String\(activeUser\.email\|\|""\)\.trim\(\)\.toLowerCase\(\)/)
  assert.match(deleteAccountSource, /players\.filter\(p=>String\(p\?\.email\|\|""\)\.trim\(\)\.toLowerCase\(\)!==e\)/)
  assert.match(deleteAccountSource, /scores\.filter\(s=>!isSelf\(s\)\)/)
  assert.match(deleteAccountSource, /rsvps\.filter\(r=>!isSelf\(r\)\)/)
  assert.match(deleteAccountSource, /shotLogs\.filter\(s=>!isSelf\(s\)\)/)
  assert.doesNotMatch(deleteAccountSource, /P\("sl:teams"/)
  assert.doesNotMatch(deleteAccountSource, /setTeams/)
})


test('coach deletion preserves team player and program data by default', () => {
  const deleteAccountSource = extractDeleteAccountSource()
  assert.doesNotMatch(deleteAccountSource, /P\("sl:teams"|setTeams\(/)
  assert.doesNotMatch(deleteAccountSource, /P\("sl:drills"|P\("sl:programDrills"|setDrills\(|setProgramDrills\(/)
  assert.match(appSource, /preserveTeamData=\{user\?\.role==="coach"\|\|user\?\.isCoach\}/)
  assert.match(appSource, /<AccountTrustActions deleteAccount=\{deleteAccount\} preserveTeamData\/>/)
})

test('player deletion removes only that player personal data', () => {
  const deleteAccountSource = extractDeleteAccountSource()
  assert.match(deleteAccountSource, /const isSelf=\(row=\{\}\)=>String\(row\?\.playerId\|\|row\?\.player_id\|\|row\?\.email\|\|row\?\.userId\|\|row\?\.user_id\|\|""\)\.trim\(\)\.toLowerCase\(\)===e;/)
  assert.match(deleteAccountSource, /scores\.filter\(s=>!isSelf\(s\)\)/)
  assert.match(deleteAccountSource, /rsvps\.filter\(r=>!isSelf\(r\)\)/)
  assert.match(deleteAccountSource, /shotLogs\.filter\(s=>!isSelf\(s\)\)/)
  assert.match(deleteAccountSource, /scRsvps\.filter\(r=>!isSelf\(r\)\)/)
  assert.match(deleteAccountSource, /scLogs\.filter\(l=>!isSelf\(l\)\)/)
})

test('shot logging handler remains present and demo safe', () => {
  assert.match(appSource, /const addShotLog=async\(made,date\)=>/)
  assert.match(appSource, /buildLocalHomeShotLog\(\{id:genId\("shotlog"\),user,made:validation\.made,date:validation\.date\}\)/)
  assert.match(appSource, /saveHomeShotLogRemote\(localLog\)/)
  assert.match(appSource, /return\{ok:true,mode:"demo_saved",syncState:"local_pending",demo:true\}/)
})
