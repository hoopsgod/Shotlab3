import fs from "node:fs";

function replaceExact(source, from, to, label, expected = 1) {
  const count = source.split(from).length - 1;
  if (count !== expected) throw new Error(`${label}: expected ${expected} occurrence(s), found ${count}`);
  return source.split(from).join(to);
}

const appPath = "src/App.jsx";
let app = fs.readFileSync(appPath, "utf8");

app = replaceExact(
  app,
  'import { isDemoAccount, isDemoMode, isDemoPersistenceSession, isDemoPlayerSessionShotLog, setDemoMode } from "./lib/demoMode.js";',
  'import { isDemoAccount, isDemoPersistenceSession, isDemoPlayerSessionShotLog, setDemoMode } from "./lib/demoMode.js";\nimport { buildAccountCapabilities, requireAccountCapability } from "./lib/accountCapabilities.js";',
  "central capability import",
);

app = replaceExact(
  app,
  'const[demoSettingsBusy,setDemoSettingsBusy]=useState(false);',
  'const[demoSettingsBusy,setDemoSettingsBusy]=useState(false);\nconst accountCapabilities=useMemo(()=>buildAccountCapabilities(user),[user]);',
  "capability boundary",
);

app = replaceExact(app, 'if(isDemoAccount(user)||isDemoMode()){', 'if(accountCapabilities.isSandbox){', "leaderboard sandbox branch");
app = replaceExact(app, 'if(!isDemoMode()&&!isDemoAccount(activeUser))return;', 'if(!buildAccountCapabilities(activeUser).isSandbox)return;', "demo cleanup gate");
app = replaceExact(app, 'if(isDemoMode()||isDemoAccount(exitingUser))await cleanupDemoPlayerSessionData(exitingUser);', 'if(buildAccountCapabilities(exitingUser).isSandbox)await cleanupDemoPlayerSessionData(exitingUser);', "logout cleanup gate");
app = replaceExact(
  app,
  'if(!user)return{ok:false,error:"No active account."};\nconst e=String(user.email||"").trim().toLowerCase();',
  'if(!user)return{ok:false,error:"No active account."};\nconst deletePermission=requireAccountCapability(accountCapabilities,"canDeleteAccount");\nif(!deletePermission.ok)return deletePermission;\nconst e=String(user.email||"").trim().toLowerCase();',
  "account deletion capability",
);
app = replaceExact(app, 'if(isDemoMode()||isDemoAccount(user))await cleanupDemoPlayerSessionData(user);\nsetDemoMode(false);', 'setDemoMode(false);', "remove unreachable demo deletion cleanup");
app = replaceExact(app, 'isExplicitDemoOrLocal:isDemoMode()||isDemoAccount(user),', 'isExplicitDemoOrLocal:accountCapabilities.isSandbox,', "home-shot quiet capability");
app = replaceExact(app, 'if(isDemoMode()||isDemoAccount(user)){', 'if(accountCapabilities.isSandbox){', "demo local write branches", 3);
app = replaceExact(app, 'if(isDemoMode()||isDemoAccount(user)||isDemoAccount(log)){', 'if(accountCapabilities.isSandbox||isDemoAccount(log)){', "demo retry branch");

app = replaceExact(
  app,
  'const isDemoHomeShotSession=isDemoMode()||isDemoAccount(u);\nconst syncIssueShots=useMemo(()=>isDemoHomeShotSession?[]:shotLogs.filter(s=>s.email===u.email&&!isDemoAccount(s)&&(s.syncState==="failed_sync")),[isDemoHomeShotSession,shotLogs,u.email]);',
  'const syncIssueShots=useMemo(()=>shotLogs.filter(s=>s.email===u.email&&s.syncState==="failed_sync"),[shotLogs,u.email]);',
  "player sync presentation branch",
);
app = replaceExact(
  app,
  'const isDemoHomeShotSession=isDemoMode()||isDemoAccount(u);\nconst syncIssueShots=useMemo(()=>isDemoHomeShotSession?[]:my.filter(s=>!isDemoAccount(s)&&s.syncState==="failed_sync"),[isDemoHomeShotSession,my]);',
  'const syncIssueShots=useMemo(()=>my.filter(s=>s.syncState==="failed_sync"),[my]);',
  "shot tracker sync presentation branch",
);
app = replaceExact(app, ' isDemoSession={isDemoHomeShotSession}', '', "remove sync-panel demo prop", 2);
app = replaceExact(
  app,
  'function HomeShotSyncRetryPanel({syncIssueShots=[],retryHomeShotLog,setShotSaveNotice,isDemoSession=false}){',
  'function HomeShotSyncRetryPanel({syncIssueShots=[],retryHomeShotLog,setShotSaveNotice}){',
  "shared sync panel signature",
);
app = replaceExact(app, 'const visibleSyncIssueShots=syncIssueShots.filter(log=>!isDemoAccount(log));', 'const visibleSyncIssueShots=syncIssueShots;', "shared sync issue data");
app = replaceExact(app, 'if(isDemoSession||!visibleSyncIssueShots.length)return null;', 'if(!visibleSyncIssueShots.length)return null;', "shared sync panel visibility");

if (/\bisDemoMode\s*\(/.test(app)) throw new Error("App.jsx still contains direct isDemoMode presentation/behavior branching");
if (/\bisDemoHomeShotSession\b/.test(app)) throw new Error("App.jsx still contains demo-specific sync presentation state");
fs.writeFileSync(appPath, app);

const demoDataPath = "src/lib/demoData.js";
let demoData = fs.readFileSync(demoDataPath, "utf8");
const clearPattern = /export async function clearDemoData\(\) \{[\s\S]*\}\s*$/;
if (!clearPattern.test(demoData)) throw new Error("clearDemoData implementation was not found at end of demoData.js");
const safeClear = `export async function clearDemoData(bundle) {
  const payload = bundle || buildDemoDataBundle({ coachEmail: "coach.demo@shotlab.app" });
  const storedMeta = await readStored(STORAGE_KEYS.demoMeta, {});
  const teamId = String(storedMeta?.teamId || payload.demoMeta?.teamId || payload.teams?.[0]?.id || DEMO_TEAM_ID);
  const managedIdentities = demoIdentitySet(payload);
  const storedCoachEmail = normalizeIdentity(storedMeta?.coachEmail);
  if (storedCoachEmail) managedIdentities.add(storedCoachEmail);
  managedIdentities.add("coach.demo@shotlab.app");
  managedIdentities.add("demo@shotlab.app");

  const collections = [
    [STORAGE_KEYS.teams, { teamsOnly: true }],
    [STORAGE_KEYS.players],
    [STORAGE_KEYS.playerProfiles],
    [STORAGE_KEYS.events],
    [STORAGE_KEYS.rsvps],
    [STORAGE_KEYS.scores],
    [STORAGE_KEYS.shotLogs],
    [STORAGE_KEYS.progressSnapshots],
  ];

  for (const [key, options = {}] of collections) {
    const existing = await readStored(key, []);
    const preserved = (Array.isArray(existing) ? existing : []).filter((row) => {
      if (options.teamsOnly) return String(row?.id || "") !== teamId;
      if (rowTeamId(row) === teamId) return false;
      if (rowUsesManagedDemoIdentity(row, managedIdentities)) return false;
      if (key === STORAGE_KEYS.shotLogs && isDemoPlayerSessionShotLog(row, { teamId })) return false;
      return true;
    });
    await writeStored(key, preserved);
  }

  await writeStored(STORAGE_KEYS.demoMeta, {});
}
`;
demoData = demoData.replace(clearPattern, safeClear);
fs.writeFileSync(demoDataPath, demoData);

console.log("Demo/registered unification transform applied.");
