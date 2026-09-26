import { readFileSync, writeFileSync } from "node:fs";

const appPath="src/App.jsx";
let source=readFileSync(appPath,"utf8");
const before=source;
const importLine='import PlayerCareerHistory from "./components/PlayerCareerHistory.jsx";',photoImport='import PlayerProfilePhotoCard from "./components/PlayerProfilePhotoCard.jsx";';
if(!source.includes(photoImport)){if(!source.includes(importLine))throw Error("Phase 7E import anchor missing");source=source.replace(importLine,`${importLine}\n${photoImport}`)}
if(!source.includes('personalization:"/personalization"')){const a='profile:"/profile",players:"/players"',b='"/profile":"profile","/players":"players"';if(!source.includes(a)||!source.includes(b))throw Error("Phase 7E personalization path anchor missing");source=source.replace(a,'profile:"/profile",personalization:"/personalization",players:"/players"').replace(b,'"/profile":"profile","/personalization":"personalization","/players":"players"')}
const mobileAnchor='  getPlayerNavItem("team-store",{mobileLabel:"Team Store",description:"Official team apparel and fan gear"}),',mobileItem='  getPlayerNavItem("profile",{k:"personalization",l:"Personalization",group:"team",description:"Profile photo and player identity"}),';
if(!source.includes('k:"personalization"')){if(!source.includes(mobileAnchor))throw Error("Phase 7E personalization mobile anchor missing");source=source.replace(mobileAnchor,`${mobileAnchor}\n${mobileItem}`)}
const photoSurface='<PlayerProfilePhotoCard player={players.find(rowMatchesPlayerIdentity)||u}/>',legacy=`  ${photoSurface}\n`;
if(source.includes(legacy))source=source.replace(legacy,"");
const profileComment='  {/* ═════════════ PROFILE — Offseason Resume ═════════════ */}',route=`{tab==="personalization"&&<SecondaryPageShell testId="player-personalization-workspace"><SecondaryPageIntro eyebrow="Player identity" title="Personalization" summary="Manage how coaches and teammates see you." status="Profile photo" testId="player-personalization-header" icon="profile"/>${photoSurface}</SecondaryPageShell>}\n\n`;
if(!source.includes('testId="player-personalization-workspace"')){if(!source.includes(profileComment))throw Error("Phase 7E personalization route anchor missing");source=source.replace(profileComment,route+profileComment)}
const avatarAnchor='<div className="coachRosterCard__initials" aria-hidden="true">{(p.name||"?").trim().slice(0,1).toUpperCase()}</div>',avatarReplacement='<div className="coachRosterCard__initials" aria-hidden="true">{p.photoUrl||p.photo_url?<img className="coachRosterCard__photo" src={p.photoUrl||p.photo_url} width="38" height="38" style={{objectFit:"cover"}}/>:(p.name||"?")[0].toUpperCase()}</div>';
if(!source.includes('className="coachRosterCard__photo"')){if(!source.includes(avatarAnchor))throw Error("Phase 7E roster avatar anchor missing");source=source.replace(avatarAnchor,avatarReplacement)}
const coachAnchor='<Av n={profile.identity.name} sz={64} email={profile.identity.email}/>',coachPhoto='{player?.photoUrl||player?.photo_url?<img data-testid="coach-player-profile-photo" src={player.photoUrl||player.photo_url} alt={profile.identity.name} style={{width:64,height:64,borderRadius:"50%",objectFit:"cover",flexShrink:0}}/>:<Av n={profile.identity.name} sz={64} email={profile.identity.email}/>}';
if(!source.includes('data-testid="coach-player-profile-photo"')){if(!source.includes(coachAnchor))throw Error("Phase 7E coach player profile avatar anchor missing");source=source.replace(coachAnchor,coachPhoto)}
for(const marker of[photoImport,'personalization:"/personalization"','k:"personalization"','testId="player-personalization-workspace"','player-personalization-header',photoSurface,'className="coachRosterCard__photo"','data-testid="coach-player-profile-photo"'])if(!source.includes(marker))throw Error(`Phase 7E marker missing after transform: ${marker}`);
const pi=source.indexOf('tab==="personalization"'),fi=source.indexOf(photoSurface),gi=source.indexOf('data-testid="player-profile-workspace"');
if(!(pi>=0&&fi>pi&&gi>fi))throw Error("Phase 7E photo must live in Personalization before Progress");
if(source.split(photoSurface).length!==2)throw Error("Phase 7E player photo surface duplicated");
if((source.match(/className="coachRosterCard__photo"/g)||[]).length!==1)throw Error("Phase 7E roster photo rendering duplicated");
if((source.match(/data-testid="coach-player-profile-photo"/g)||[]).length!==1)throw Error("Phase 7E coach player profile photo rendering duplicated");
if(source!==before)writeFileSync(appPath,source);

const remotePath="src/lib/remotePersistence.js";
let remoteSource=readFileSync(remotePath,"utf8");
const remoteBefore=remoteSource,normalizer=`    name: cleanText(row.name),\n    role: cleanText(row.role),\n    createdAt: toFiniteNumber(row.createdAt ?? row.created_at),`,normalized=`    name: cleanText(row.name),\n    role: cleanText(row.role),\n    photoUrl: cleanText(row.photoUrl || row.photo_url) || null,\n    createdAt: toFiniteNumber(row.createdAt ?? row.created_at),`;
if(!remoteSource.includes('photoUrl: cleanText(row.photoUrl || row.photo_url) || null')){if(!remoteSource.includes(normalizer))throw Error("Phase 7E player app-normalizer anchor missing");remoteSource=remoteSource.replace(normalizer,normalized)}
const debugBefore=`  const payload = Array.isArray(error?.remoteRows)\n    ? JSON.stringify(error.remoteRows)\n    : error?.remoteRows && typeof error.remoteRows === "object"\n      ? JSON.stringify(error.remoteRows)\n      : "";`,debugAfter=`  const payload = error?.remoteRows && typeof error.remoteRows === "object"\n    ? JSON.stringify(error.remoteRows)\n    : "";`;
if(remoteSource.includes(debugBefore))remoteSource=remoteSource.replace(debugBefore,debugAfter);
if(!remoteSource.includes('photoUrl: cleanText(row.photoUrl || row.photo_url) || null'))throw Error("Phase 7E player normalization marker missing");
if(!remoteSource.includes('const payload = error?.remoteRows && typeof error.remoteRows === "object"'))throw Error("Phase 7E remote debug compaction marker missing");
if(remoteSource!==remoteBefore)writeFileSync(remotePath,remoteSource);
console.log("Phase 7E player photo Personalization route, coach profile photo, roster image wiring, and player photo normalization verified.");
