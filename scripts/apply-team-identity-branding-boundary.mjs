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
    'const FALLBACK_LOGO = "";\nconst DEFAULT_MARK = "";',
    "neutral Coach Mission Control logo fallback"
  );
  source = replaceOnce(
    source,
    'const teamName = branding?.teamName || branding?.name || "Thomas Titans";',
    'const teamName = branding?.teamName || branding?.name || "Your Team";',
    "neutral Coach Mission Control team-name fallback"
  );
  source = replaceOnce(source, 'function CourtArtwork({ logoUrl }) {', 'function CourtArtwork({ logoUrl, teamName }) {', "Coach court artwork identity signature");
  source = replaceOnce(
    source,
    '<div className="mcCourtFloor"><span className="mcSideline" /><span className="mcCenterLine" /><span className="mcKey" /><span className="mcThreePoint" /><img src={logoUrl || FALLBACK_LOGO} alt="" /></div>',
    '<div className="mcCourtFloor"><span className="mcSideline" /><span className="mcCenterLine" /><span className="mcKey" /><span className="mcThreePoint" />{logoUrl ? <img src={logoUrl} alt="" /> : <span className="mcCourtFallback">{initials(teamName)}</span>}</div>',
    "Coach court artwork initials fallback"
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
    '<button type="button" className="mcHeroTeamMark" onClick={openBrandingSettings} aria-label={`Customize ${teamName} team identity`}>{cleanMarkLogoUrl ? <img src={cleanMarkLogoUrl} alt={`${teamName} logo`} /> : <span className="mcTeamFallback">{initials(teamName)}</span>}</button>',
    "Coach Hero initials fallback"
  );
  source = replaceOnce(
    source,
    '<span className="mcEyebrow">{primaryCommand.eyebrow}</span>',
    '<span className="mcProgramIdentity">{teamName} · Coach</span><span className="mcEyebrow">{primaryCommand.eyebrow}</span>',
    "Coach Hero team-first identity line"
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

console.log("Applied team-owned branding boundary, Demo identity seed, Coach Hero identity, and final rendered title authority.");