import { readFileSync, writeFileSync } from "node:fs";

const appPath="src/App.jsx";
let source=readFileSync(appPath,"utf8");
const before=source;
const importLine='import PlayerCareerHistory from "./components/PlayerCareerHistory.jsx";',photoImport='import PlayerProfilePhotoCard from "./components/PlayerProfilePhotoCard.jsx";';
if(!source.includes(photoImport)){if(!source.includes(importLine))throw Error("Phase 7E import anchor missing");source=source.replace(importLine,`${importLine}\n${photoImport}`)}
const photoSurface='<PlayerProfilePhotoCard player={players.find(rowMatchesPlayerIdentity)||u}/>',profileRoute='{tab==="profile"&&<div className={slideClass+" player-progress-story-route"} key="profile" data-testid="player-profile-workspace">';
if(!source.includes(photoSurface)){if(!source.includes(profileRoute))throw Error("Phase 7E profile route anchor missing");source=source.replace(profileRoute,profileRoute+photoSurface)}
const avatarAnchor='<div className="coachRosterCard__initials" aria-hidden="true">{(p.name||"?").trim().slice(0,1).toUpperCase()}</div>',avatarReplacement='<div className="coachRosterCard__initials" aria-hidden="true">{p.photoUrl?<img className="coachRosterCard__photo slp" src={p.photoUrl} width="38" height="38"/>:(p.name||"?")[0].toUpperCase()}</div>';
if(!source.includes('coachRosterCard__photo')){if(!source.includes(avatarAnchor))throw Error("Phase 7E roster avatar anchor missing");source=source.replace(avatarAnchor,avatarReplacement)}
const coachAnchor='<Av n={profile.identity.name} sz={64} email={profile.identity.email}/>',coachPhoto='{player?.photoUrl?<img data-testid="coach-player-profile-photo" className="slp" src={player.photoUrl} alt={profile.identity.name} width="64" height="64"/>:<Av n={profile.identity.name} sz={64} email={profile.identity.email}/>}';
if(!source.includes('data-testid="coach-player-profile-photo"')){if(!source.includes(coachAnchor))throw Error("Phase 7E coach player profile avatar anchor missing");source=source.replace(coachAnchor,coachPhoto)}
for(const marker of[photoImport,'data-testid="player-profile-workspace"',photoSurface,'coachRosterCard__photo','data-testid="coach-player-profile-photo"'])if(!source.includes(marker))throw Error(`Phase 7E marker missing after transform: ${marker}`);
const pi=source.indexOf(profileRoute),fi=source.indexOf(photoSurface);
if(!(pi>=0&&fi>pi))throw Error("Phase 7E photo must live in Player Profile");
if(source.split(photoSurface).length!==2)throw Error("Phase 7E player photo surface duplicated");
if((source.match(/coachRosterCard__photo/g)||[]).length!==1)throw Error("Phase 7E roster photo rendering duplicated");
if((source.match(/data-testid="coach-player-profile-photo"/g)||[]).length!==1)throw Error("Phase 7E coach player profile photo rendering duplicated");
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
console.log("Phase 7E player Profile photo, coach profile photo, roster image wiring, and player photo normalization verified.");
