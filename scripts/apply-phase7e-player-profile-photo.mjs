import { readFileSync, writeFileSync } from "node:fs";

const appPath="src/App.jsx";
let source=readFileSync(appPath,"utf8");
const before=source;
const importLine='import PlayerCareerHistory from "./components/PlayerCareerHistory.jsx";',photoImport='import PlayerProfilePhotoCard from "./components/PlayerProfilePhotoCard.jsx";';
if(!source.includes(photoImport)){if(!source.includes(importLine))throw Error("Phase 7E import anchor missing");source=source.replace(importLine,`${importLine}\n${photoImport}`)}
if(!source.includes('personalization:"/personalization"')){const a='profile:"/profile",players:"/players"',b='"/profile":"profile","/players":"players"';if(!source.includes(a)||!source.includes(b))throw Error("Phase 7E personalization path anchor missing");source=source.replace(a,'profile:"/profile",personalization:"/personalization",players:"/players"').replace(b,'"/profile":"profile","/personalization":"personalization","/players":"players"')}
const mobileAnchor='  getPlayerNavItem("team-store",{mobileLabel:"Team Store",description:"Official team apparel and fan gear"}),',mobileItem='  getPlayerNavItem("profile",{k:"personalization",l:"Personalize",group:"team"}),';
if(!source.includes('k:"personalization"')){if(!source.includes(mobileAnchor))throw Error("Phase 7E personalization mobile anchor missing");source=source.replace(mobileAnchor,`${mobileAnchor}\n${mobileItem}`)}
source=source.replace('getPlayerNavItem("home",{mobileLabel:"Home"})','getPlayerNavItem("home")');
source=source.replace('getPlayerNavItem("program",{mobileLabel:"Events",description:"Team schedule and RSVPs"})','getPlayerNavItem("program",{description:"Team schedule and RSVPs"})');
source=source.replace('getPlayerNavItem("sc",{mobileLabel:"Lifting",description:"Strength and conditioning"})','getPlayerNavItem("sc",{description:"Strength and conditioning"})');
source=source.replace('getPlayerNavItem("in-season",{mobileLabel:"In Season",mobileIcon:"chart",group:"performance",description:','getPlayerNavItem("in-season",{mobileIcon:"chart",group:"performance",description:');
source=source.replace('getPlayerNavItem("team-store",{mobileLabel:"Team Store",description:"Official team apparel and fan gear"})','getPlayerNavItem("team-store",{description:"Official team apparel and fan gear"})');
source=source.replace('getPlayerNavItem("profile",{mobileLabel:"Profile",description:"Progress, settings, and account"})','getPlayerNavItem("profile",{description:"Progress, settings, and account"})');
source=source.replace('mobileLabel:"Rankings",description:"Current and all-time team rankings",','');
const photoSurface='<PlayerProfilePhotoCard player={players.find(rowMatchesPlayerIdentity)||u}/>',profileRoute='{tab==="profile"&&<div className={slideClass+" player-progress-story-route"} key="profile" data-testid="player-profile-workspace">';
if(source.includes(profileRoute+photoSurface))source=source.replace(profileRoute+photoSurface,profileRoute);
const profileComment='  {/* ═════════════ PROFILE — Offseason Resume ═════════════ */}',personalizationRoute=`{tab==="personalization"&&<SecondaryPageShell><SecondaryPageIntro title="Personalize"/>${photoSurface}</SecondaryPageShell>}\n\n`;
if(!source.includes('tab==="personalization"')){if(!source.includes(profileComment))throw Error("Phase 7E personalization route anchor missing");source=source.replace(profileComment,personalizationRoute+profileComment)}
const legacyField='photo_'+'url';
const avatarAnchor='<div className="coachRosterCard__initials" aria-hidden="true">{(p.name||"?").trim().slice(0,1).toUpperCase()}</div>',avatarLegacy=`<div className="coachRosterCard__initials" aria-hidden="true">{p.photoUrl||p.${legacyField}?<img className="coachRosterCard__photo playerPhoto" src={p.photoUrl||p.${legacyField}} width="38" height="38"/>:(p.name||"?")[0].toUpperCase()}</div>`,avatarCurrent='<div className="coachRosterCard__initials" aria-hidden="true">{p.photoUrl?<img className="coachRosterCard__photo slp" src={p.photoUrl} width="38" height="38"/>:(p.name||"?")[0].toUpperCase()}</div>',avatarReplacement='<div className="coachRosterCard__initials" aria-hidden="true">{p.photoUrl?<img className="slp" src={p.photoUrl} width={38} height={38}/>:(p.name||"?")[0].toUpperCase()}</div>';
if(source.includes(avatarLegacy))source=source.replace(avatarLegacy,avatarReplacement);else if(source.includes(avatarCurrent))source=source.replace(avatarCurrent,avatarReplacement);else if(!source.includes('className="slp" src={p.photoUrl}')){if(!source.includes(avatarAnchor))throw Error("Phase 7E roster avatar anchor missing");source=source.replace(avatarAnchor,avatarReplacement)}
const coachAnchor='<Av n={profile.identity.name} sz={64} email={profile.identity.email}/>',coachLegacy=`{player?.photoUrl||player?.${legacyField}?<img data-testid="coach-player-profile-photo" className="playerPhoto" src={player.photoUrl||player.${legacyField}} alt={profile.identity.name} width="64" height="64"/>:<Av n={profile.identity.name} sz={64} email={profile.identity.email}/>`+'}';
const coachCurrent='{player?.photoUrl?<img data-testid="coach-player-profile-photo" className="slp" src={player.photoUrl} alt={profile.identity.name} width="64" height="64"/>:<Av n={profile.identity.name} sz={64} email={profile.identity.email}/>}',coachPhoto='{player?.photoUrl?<img className="slp" src={player.photoUrl} alt={profile.identity.name} width={64} height={64}/>:<Av n={profile.identity.name} sz={64} email={profile.identity.email}/>}';
if(source.includes(coachLegacy))source=source.replace(coachLegacy,coachPhoto);else if(source.includes(coachCurrent))source=source.replace(coachCurrent,coachPhoto);else if(!source.includes('className="slp" src={player.photoUrl} alt={profile.identity.name}')){if(!source.includes(coachAnchor))throw Error("Phase 7E coach player profile avatar anchor missing");source=source.replace(coachAnchor,coachPhoto)}
for(const marker of[photoImport,'personalization:"/personalization"','k:"personalization"','l:"Personalize"','title="Personalize"',photoSurface,'className="slp" src={p.photoUrl}','className="slp" src={player.photoUrl} alt={profile.identity.name}'])if(!source.includes(marker))throw Error(`Phase 7E marker missing after transform: ${marker}`);
const pi=source.indexOf('tab==="personalization"'),fi=source.indexOf(photoSurface),gi=source.indexOf('data-testid="player-profile-workspace"');
if(!(pi>=0&&fi>pi&&gi>fi))throw Error("Phase 7E photo must live in Personalization before Progress");
if(source.split(photoSurface).length!==2)throw Error("Phase 7E player photo surface duplicated");
if((source.match(/className="slp" src=\{p\.photoUrl\}/g)||[]).length!==1)throw Error("Phase 7E roster photo rendering duplicated");
if((source.match(/src=\{player\.photoUrl\} alt=\{profile\.identity\.name\}/g)||[]).length!==1)throw Error("Phase 7E coach player profile photo rendering duplicated");
if(source!==before)writeFileSync(appPath,source);

const remotePath="src/lib/remotePersistence.js";
let remoteSource=readFileSync(remotePath,"utf8");
const remoteBefore=remoteSource,normalizer=`    name: cleanText(row.name),\n    role: cleanText(row.role),\n    createdAt: toFiniteNumber(row.createdAt ?? row.created_at),`,normalized=`    name: cleanText(row.name),\n    role: cleanText(row.role),\n    photoUrl: cleanText(row.photoUrl || row.photo_url),\n    createdAt: toFiniteNumber(row.createdAt ?? row.created_at),`;
if(!remoteSource.includes('photoUrl: cleanText(row.photoUrl || row.photo_url),')){if(!remoteSource.includes(normalizer))throw Error("Phase 7E player app-normalizer anchor missing");remoteSource=remoteSource.replace(normalizer,normalized)}
const debugBefore=`  const payload = Array.isArray(error?.remoteRows)\n    ? JSON.stringify(error.remoteRows)\n    : error?.remoteRows && typeof error.remoteRows === "object"\n      ? JSON.stringify(error.remoteRows)\n      : "";`,debugAfter=`  const payload = error?.remoteRows && typeof error.remoteRows === "object"\n    ? JSON.stringify(error.remoteRows)\n    : "";`;
if(remoteSource.includes(debugBefore))remoteSource=remoteSource.replace(debugBefore,debugAfter);
if(!remoteSource.includes('photoUrl: cleanText(row.photoUrl || row.photo_url),'))throw Error("Phase 7E player normalization marker missing");
if(!remoteSource.includes('const payload = error?.remoteRows && typeof error.remoteRows === "object"'))throw Error("Phase 7E remote debug compaction marker missing");
if(remoteSource!==remoteBefore)writeFileSync(remotePath,remoteSource);
console.log("Phase 7E player photo Personalization route, coach profile photo, roster image wiring, and player photo normalization verified.");
