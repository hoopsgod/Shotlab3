import fs from "node:fs";

const path = "src/App.jsx";
let source = fs.readFileSync(path, "utf8");
const before = `const demoSignIn=async(kind="player")=>{\nsetDemoMode(true);\nconst acct=kind==="coach"?DEMO_COACH:DEMO_PLAYER;`;
const after = `const demoSignIn=async(kind="player")=>{\n// Demo identity must never inherit a subscribed user's authentication credentials.\nawait supabase.auth.signOut();\nlegacyAuthSecretRef.current={email:"",password:""};\nsetDemoMode(true);\nconst acct=kind==="coach"?DEMO_COACH:DEMO_PLAYER;`;
const count = source.split(before).length - 1;
if (count !== 1) throw new Error(`demo sign-in boundary: expected 1 occurrence, found ${count}`);
source = source.replace(before, after);
const start = source.indexOf('const demoSignIn=async(kind="player")=>{');
const end = source.indexOf('const cleanupDemoPlayerSessionData=', start);
const block = source.slice(start, end);
const signOut = block.indexOf('await supabase.auth.signOut()');
const demoMode = block.indexOf('setDemoMode(true)');
const session = block.indexOf('await DB.set("sl:session",{email:acct.email})');
if (!(signOut >= 0 && signOut < demoMode && demoMode < session)) throw new Error("demo auth credentials are not cleared before demo persistence begins");
fs.writeFileSync(path, source);
console.log("Demo auth session isolation applied.");
