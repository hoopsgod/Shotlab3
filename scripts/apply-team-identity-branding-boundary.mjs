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

function replaceIfPresent(source, before, after) {
  return source.includes(before) ? source.replace(before, after) : source;
}

{
  const file = "src/App.jsx";
  let source = read(file);
  source = replaceOnce(
    source,
    'const resolvedTeamBranding=resolveTeamBranding(myTeam?.branding||DEFAULT_BRANDING);',
    'const resolvedTeamBranding=resolveTeamBranding({...(myTeam?.branding||{}),teamName:myTeam?.branding?.teamName||myTeam?.name||"Your Team"});',
    "authoritative team-name branding boundary"
  );
  source = replaceOnce(
    source,
    'demoTeam={id:genId("team"),name:"Demo Team",ownerCoachId:DEMO_COACH.email,joinCode:generateJoinCode(nts.map(t=>t.joinCode)),joinCodeUpdatedAt:Date.now(),createdAt:Date.now(),branding:DEFAULT_BRANDING};',
    'demoTeam={id:genId("team"),name:"Demo Titans",ownerCoachId:DEMO_COACH.email,joinCode:generateJoinCode(nts.map(t=>t.joinCode)),joinCodeUpdatedAt:Date.now(),createdAt:Date.now(),branding:{...DEFAULT_BRANDING,teamName:"Demo Titans",logoUrl:"/branding/titans-exact-logo.png.PNG",logoMarkUrl:"/branding/titans-default-mark.svg"}};',
    "explicit Demo Titans team seed"
  );
  source = replaceOnce(
    source,
    'nts=[...nts,demoTeam];\nawait saveTeams();\n}',
    'nts=[...nts,demoTeam];\nawait saveTeams();\n}\nconst demoLegacyFullLogo="/branding/titans-exact-logo.png.PNG";\nconst demoLegacyMarkLogo="/branding/titans-default-mark.svg";\nconst demoRawFullLogo=demoTeam.branding?.logoUrl||"";\nconst demoRawMarkLogo=demoTeam.branding?.logoMarkUrl||"";\nconst demoHasCustomFullLogo=Boolean(demoRawFullLogo&&demoRawFullLogo!==demoLegacyFullLogo);\nconst demoHasCustomMarkLogo=Boolean(demoRawMarkLogo&&demoRawMarkLogo!==demoLegacyMarkLogo);\nconst demoSanitizedBranding={...(demoTeam.branding||{}),...(demoHasCustomFullLogo&&demoRawMarkLogo===demoLegacyMarkLogo?{logoMarkUrl:""}:{}),...(demoHasCustomMarkLogo&&demoRawFullLogo===demoLegacyFullLogo?{logoUrl:""}:{})};\nconst demoHasCustomLogo=demoHasCustomFullLogo||demoHasCustomMarkLogo;\nconst demoIdentityBranding={...DEFAULT_BRANDING,...demoSanitizedBranding,teamName:"Demo Titans",...(demoHasCustomLogo?{}:{logoUrl:demoLegacyFullLogo,logoMarkUrl:demoLegacyMarkLogo})};\nconst demoBrandingNeedsRepair=demoSanitizedBranding.logoUrl!==demoTeam.branding?.logoUrl||demoSanitizedBranding.logoMarkUrl!==demoTeam.branding?.logoMarkUrl;\nif(demoTeam.name!=="Demo Titans"||demoTeam.branding?.teamName!=="Demo Titans"||(!demoTeam.branding?.logoUrl&&!demoTeam.branding?.logoMarkUrl)||demoBrandingNeedsRepair){demoTeam={...demoTeam,name:"Demo Titans",branding:demoIdentityBranding,updatedAt:Date.now()};nts=nts.map(t=>t.id===demoTeam.id?demoTeam:t);await saveTeams();}',
    "stale Demo identity migration"
  );
  source = replaceOnce(
    source,
    `const saveTeamBranding=async(nextBranding)=>{
if(user?.role!=="coach"||!user?.teamId)return{ok:false,err:"Not authorized"};
const team=teams.find(t=>t.id===user.teamId);
if(!team)return{ok:false,err:"Team not found"};
const mergedBranding=resolveTeamBranding({
...(team.branding||{}),
...(nextBranding||{}),`,
    `const saveTeamBranding=async(nextBranding)=>{
if(user?.role!=="coach"||!user?.teamId)return{ok:false,err:"Not authorized"};
const team=teams.find(t=>t.id===user.teamId);
if(!team)return{ok:false,err:"Team not found"};
const incomingBranding={...(nextBranding||{})};
if(isDemoAccount(user)){
const legacyDemoFull="/branding/titans-exact-logo.png.PNG";
const legacyDemoMark="/branding/titans-default-mark.svg";
const incomingFull=incomingBranding.logoUrl||"";
const incomingMark=incomingBranding.logoMarkUrl||"";
const effectiveFull=incomingFull||team.branding?.logoUrl||"";
const effectiveMark=incomingMark||team.branding?.logoMarkUrl||"";
const hasCustomFull=Boolean(incomingFull&&incomingFull!==legacyDemoFull);
const hasCustomMark=Boolean(incomingMark&&incomingMark!==legacyDemoMark);
if(hasCustomFull&&effectiveMark===legacyDemoMark)incomingBranding.logoMarkUrl="";
if(hasCustomMark&&effectiveFull===legacyDemoFull)incomingBranding.logoUrl="";
}
const mergedBranding=resolveTeamBranding({
...(team.branding||{}),
...incomingBranding,`,
    "Demo Coach branding save normalization"
  );
  write(file, source);
}

{
  const file = "src/lib/demoData.js";
  let source = read(file);
  const before = `  return {
    id: teamId || DEMO_TEAM_ID,
    name: "Demo Titans",
    ownerCoachId: coachEmail || null,
    createdAt: DEMO_TIMESTAMP,
    joinCode: "DEMO26",
    updatedAt: Date.now(),
  };`;
  const after = `  return {
    id: teamId || DEMO_TEAM_ID,
    name: "Demo Titans",
    ownerCoachId: coachEmail || null,
    createdAt: DEMO_TIMESTAMP,
    joinCode: "DEMO26",
    branding: {
      teamName: "Demo Titans",
      primaryColor: "#C8FF1A",
      secondaryColor: "#9CA3AF",
      accentColor: "#C8FF1A",
      textOnPrimary: "#0B0D10",
      logoUrl: "/branding/titans-exact-logo.png.PNG",
      logoMarkUrl: "/branding/titans-default-mark.svg",
      textScale: "standard",
    },
    updatedAt: Date.now(),
  };`;
  source = replaceOnce(source, before, after, "standalone Demo team branding fixture");
  write(file, source);
}

{
  const file = "src/components/CoachCommandCenter.jsx";
  let source = read(file);
  source = replaceOnce(
    source,
    'const FALLBACK_LOGO = "/branding/titans-exact-logo.png.PNG";\nconst DEFAULT_MARK = "/branding/titans-default-mark.svg";',
    'const FALLBACK_LOGO = "";\nconst DEFAULT_MARK = "";\nconst LEGACY_DEMO_FULL = "/branding/titans-exact-logo.png.PNG";\nconst LEGACY_DEMO_MARK = "/branding/titans-default-mark.svg";',
    "neutral Coach Mission Control logo fallback"
  );
  source = replaceOnce(
    source,
    'const teamName = branding?.teamName || branding?.name || "Thomas Titans";',
    'const teamName = branding?.teamName || branding?.name || "Your Team";',
    "neutral Coach Mission Control team-name fallback"
  );
  source = replaceOnce(
    source,
    `  const fullLogoSource = branding?.logoUrl || FALLBACK_LOGO;
  const markSource = branding?.logoMarkUrl && branding.logoMarkUrl !== DEFAULT_MARK ? branding.logoMarkUrl : fullLogoSource;
  const cleanFullLogoUrl = useCleanTeamLogo(fullLogoSource);
  const cleanMarkLogoUrl = useCleanTeamLogo(markSource);
  const teamName = branding?.teamName || branding?.name || "Your Team";`,
    `  const teamName = branding?.teamName || branding?.name || "Your Team";
  const rawFullLogoSource = branding?.logoUrl || "";
  const rawMarkLogoSource = branding?.logoMarkUrl || "";
  const customFullLogoSource = rawFullLogoSource && rawFullLogoSource !== LEGACY_DEMO_FULL ? rawFullLogoSource : "";
  const customMarkLogoSource = rawMarkLogoSource && rawMarkLogoSource !== LEGACY_DEMO_MARK ? rawMarkLogoSource : "";
  const useDemoArtwork = teamName === "Demo Titans" && !customFullLogoSource && !customMarkLogoSource;
  const fullLogoSource = customFullLogoSource || customMarkLogoSource || (useDemoArtwork ? (rawFullLogoSource || LEGACY_DEMO_FULL) : FALLBACK_LOGO);
  const markSource = customMarkLogoSource || customFullLogoSource || (useDemoArtwork ? (rawMarkLogoSource || rawFullLogoSource || LEGACY_DEMO_MARK) : DEFAULT_MARK);
  const cleanFullLogoUrl = useCleanTeamLogo(fullLogoSource);
  const cleanMarkLogoUrl = useCleanTeamLogo(markSource);`,
    "Coach custom logo precedence"
  );
  source = replaceOnce(
    source,
    `function CourtArtwork({ logoUrl }) {
  const mark = logoUrl || FALLBACK_LOGO;`,
    `function CourtArtwork({ logoUrl, teamName }) {
  const mark = logoUrl || "";`,
    "Coach tactical court identity signature"
  );
  source = replaceOnce(
    source,
    '        <image href={mark} x="214" y="127" width="76" height="76" preserveAspectRatio="xMidYMid meet" opacity=".16" />',
    '        {mark ? <image href={mark} x="214" y="127" width="76" height="76" preserveAspectRatio="xMidYMid meet" opacity=".16" /> : <text x="252" y="169" textAnchor="middle" fill="rgba(245,248,249,.11)" fontSize="28" fontWeight="900">{initials(teamName)}</text>}',
    "Coach tactical court initials fallback"
  );
  source = replaceOnce(source, '<CourtArtwork logoUrl={cleanMarkLogoUrl} />', '<CourtArtwork logoUrl={cleanMarkLogoUrl} teamName={teamName} />', "Coach Hero court identity input");
  source = replaceOnce(
    source,
    '<img className="mcRailLogo" src={cleanFullLogoUrl} alt={`${teamName} logo`} />',
    '{cleanFullLogoUrl ? <img className="mcRailLogo" src={cleanFullLogoUrl} alt={`${teamName} logo`} /> : <span className="mcTeamFallback">{initials(teamName)}</span>}',
    "Coach rail initials fallback"
  );
  source = replaceOnce(
    source,
    '<img style={{width:48,height:48,display:"block",objectFit:"contain",filter:"drop-shadow(0 8px 16px rgba(7,28,40,.13))"}} src={cleanMarkLogoUrl} alt="" />',
    '{cleanMarkLogoUrl ? <img style={{width:48,height:48,display:"block",objectFit:"contain",filter:"drop-shadow(0 8px 16px rgba(7,28,40,.13))"}} src={cleanMarkLogoUrl} alt="" /> : <span className="mcTeamFallback">{initials(teamName)}</span>}',
    "Coach header initials fallback"
  );
  source = replaceOnce(
    source,
    '<button type="button" className="mcHeroTeamMark" onClick={openBrandingSettings} aria-label={`Customize ${teamName} team identity`}><img src={cleanMarkLogoUrl} alt={`${teamName} logo`} /></button>',
    '{/* Foreground team identity is owned by the Coach header; court artwork remains branding-driven. */}',
    "Coach Home duplicate Hero logo removal"
  );
  source = replaceIfPresent(
    source,
    '<span className="mcProgramIdentity">{teamName} · Coach</span><span className="mcEyebrow">{primaryCommand.eyebrow}</span>',
    '<span className="mcEyebrow">{primaryCommand.eyebrow}</span>'
  );
  write(file, source);
}

{
  const file = "index.html";
  let source = read(file);
  source = replaceOnce(
    source,
    '  <link id="shotlab-mobile-centering-reconciliation" rel="stylesheet" href="/shotlab-mobile-centering-reconciliation.css" />',
    '  <link id="shotlab-mobile-centering-reconciliation" rel="stylesheet" href="/shotlab-mobile-centering-reconciliation.css" />\n  <link id="shotlab-team-identity-title-authority" rel="stylesheet" href="/shotlab-team-identity-title-authority.css?v=20260818" />',
    "final team identity stylesheet mount"
  );
  write(file, source);
}

console.log("Applied team-owned branding boundary, Demo custom-logo ownership, custom-logo precedence, Demo identity preservation, and structural Coach Home identity reconciliation.");