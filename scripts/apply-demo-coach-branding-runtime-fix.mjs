import fs from "node:fs";
import path from "node:path";

const cwd = process.cwd();
const read = (file) => fs.readFileSync(path.resolve(cwd, file), "utf8");
const write = (file, content) => fs.writeFileSync(path.resolve(cwd, file), content);

function replaceOnce(source, before, after, label) {
  if (source.includes(after)) return source;
  const count = source.split(before).length - 1;
  if (count !== 1) throw new Error(`${label}: expected exactly one source anchor, found ${count}`);
  return source.replace(before, after);
}

{
  const file = "src/App.jsx";
  let source = read(file);

  source = replaceOnce(
    source,
    'const resolvedTeamBranding=resolveTeamBranding({...(myTeam?.branding||{}),teamName:myTeam?.branding?.teamName||myTeam?.name||"Your Team"});',
    'let demoCoachBrandingOverride=null;if(isDemoAccount(user)&&typeof window!=="undefined"){try{const raw=window.localStorage.getItem("sl:demo-team-branding")||window.sessionStorage.getItem("sl:demo-team-branding");const parsed=raw?JSON.parse(raw):null;if(parsed&&typeof parsed==="object"&&!Array.isArray(parsed))demoCoachBrandingOverride=parsed}catch{}}const resolvedTeamBranding=resolveTeamBranding({...(myTeam?.branding||{}),...(demoCoachBrandingOverride||{}),teamName:demoCoachBrandingOverride?.teamName||myTeam?.branding?.teamName||myTeam?.name||"Your Team"});',
    "Demo Coach branding override read boundary",
  );

  source = replaceOnce(
    source,
    'const nextTeams=teams.map(t=>t.id===team.id?{...t,branding:mergedBranding}:t);\nawait P("sl:teams",nextTeams,setTeams);',
    'if(isDemoAccount(user)&&typeof window!=="undefined"){const serialized=JSON.stringify(mergedBranding);try{window.localStorage.setItem("sl:demo-team-branding",serialized)}catch{try{window.sessionStorage.setItem("sl:demo-team-branding",serialized)}catch{}}}\nconst nextTeams=teams.map(t=>t.id===team.id?{...t,branding:mergedBranding}:t);\nawait P("sl:teams",nextTeams,setTeams);',
    "Demo Coach branding override write boundary",
  );

  write(file, source);
}

console.log("Applied durable Coach Demo branding override so saved custom logos remain authoritative on Coach Home.");
