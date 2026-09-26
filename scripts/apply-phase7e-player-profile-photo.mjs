import { readFileSync, writeFileSync } from "node:fs";

const appPath = "src/App.jsx";
let source = readFileSync(appPath, "utf8");
const before = source;

const importLine = 'import PlayerCareerHistory from "./components/PlayerCareerHistory.jsx";';
const photoImport = 'import PlayerProfilePhotoCard from "./components/PlayerProfilePhotoCard.jsx";';
if (!source.includes(photoImport)) {
  if (!source.includes(importLine)) throw new Error("Phase 7E import anchor missing");
  source = source.replace(importLine, `${importLine}\n${photoImport}`);
}

if (!source.includes('personalization:"/personalization"')) {
  const pathAnchor = 'profile:"/profile",players:"/players"';
  const reverseAnchor = '"/profile":"profile","/players":"players"';
  if (!source.includes(pathAnchor) || !source.includes(reverseAnchor)) throw new Error("Phase 7E personalization path anchor missing");
  source = source.replace(pathAnchor, 'profile:"/profile",personalization:"/personalization",players:"/players"');
  source = source.replace(reverseAnchor, '"/profile":"profile","/personalization":"personalization","/players":"players"');
}

const navAnchor = 'const getPlayerNavItem=(key,overrides={})=>{const item=playerNavItems.find(candidate=>candidate.k===key);return item?{...item,...overrides}:null;};';
const personalizationNav = 'playerNavItems.push({...playerNavItems.find(i=>i.k==="profile"),k:"personalization",l:"Personalization"});';
if (!source.includes(personalizationNav)) {
  if (!source.includes(navAnchor)) throw new Error("Phase 7E personalization nav anchor missing");
  source = source.replace(navAnchor, `${personalizationNav}\n${navAnchor}`);
}

const mobileAnchor = '  getPlayerNavItem("team-store",{mobileLabel:"Team Store",description:"Official team apparel and fan gear"}),';
const mobileItem = '  getPlayerNavItem("personalization",{description:"Profile photo and player identity",group:"team"}),';
if (!source.includes('getPlayerNavItem("personalization"')) {
  if (!source.includes(mobileAnchor)) throw new Error("Phase 7E personalization mobile anchor missing");
  source = source.replace(mobileAnchor, `${mobileAnchor}\n${mobileItem}`);
}

const photoSurface = '<PlayerProfilePhotoCard player={players.find(rowMatchesPlayerIdentity)||u}/>';
const legacyProfilePhoto = `  ${photoSurface}\n`;
if (source.includes(legacyProfilePhoto)) source = source.replace(legacyProfilePhoto, "");
const profileComment = '  {/* ═════════════ PROFILE — Offseason Resume ═════════════ */}';
const personalizationRoute = `{tab==="personalization"&&<SecondaryPageShell testId="player-personalization-workspace"><SecondaryPageIntro eyebrow="Player identity" title="Personalization" summary="Manage how you appear across ShotLab." testId="player-personalization-header" icon="profile"/><SecondaryPageDecision eyebrow="Profile" title="Profile photo" detail="Shown on your player profile and in your coach's roster." testId="player-personalization-photo" icon="profile">${photoSurface}</SecondaryPageDecision></SecondaryPageShell>}\n\n`;
if (!source.includes('testId="player-personalization-workspace"')) {
  if (!source.includes(profileComment)) throw new Error("Phase 7E personalization route anchor missing");
  source = source.replace(profileComment, personalizationRoute + profileComment);
}

const avatarAnchor = '<div className="coachRosterCard__initials" aria-hidden="true">{(p.name||"?").trim().slice(0,1).toUpperCase()}</div>';
const avatarReplacement = '<div className="coachRosterCard__initials" aria-hidden="true">{p.photoUrl||p.photo_url?<img className="coachRosterCard__photo" src={p.photoUrl||p.photo_url} width="38" height="38" style={{objectFit:"cover"}}/>:(p.name||"?")[0].toUpperCase()}</div>';
if (!source.includes('className="coachRosterCard__photo"')) {
  if (!source.includes(avatarAnchor)) throw new Error("Phase 7E roster avatar anchor missing");
  source = source.replace(avatarAnchor, avatarReplacement);
}

const coachProfileAvatarAnchor = '<Av n={profile.identity.name} sz={64} email={profile.identity.email}/>';
const coachProfilePhoto = '{player?.photoUrl||player?.photo_url?<img data-testid="coach-player-profile-photo" src={player.photoUrl||player.photo_url} alt={`${profile.identity.name} profile`} width="64" height="64" style={{width:64,height:64,borderRadius:"50%",objectFit:"cover",flexShrink:0}}/>:<Av n={profile.identity.name} sz={64} email={profile.identity.email}/>}';
if (!source.includes('data-testid="coach-player-profile-photo"')) {
  if (!source.includes(coachProfileAvatarAnchor)) throw new Error("Phase 7E coach player profile avatar anchor missing");
  source = source.replace(coachProfileAvatarAnchor, coachProfilePhoto);
}

for (const marker of [photoImport, 'personalization:"/personalization"', personalizationNav, 'getPlayerNavItem("personalization"', 'testId="player-personalization-workspace"', photoSurface, 'className="coachRosterCard__photo"', 'p.photoUrl||p.photo_url', 'data-testid="coach-player-profile-photo"', 'player?.photoUrl||player?.photo_url']) {
  if (!source.includes(marker)) throw new Error(`Phase 7E marker missing after transform: ${marker}`);
}
const personalizationIndex = source.indexOf('tab==="personalization"');
const photoIndex = source.indexOf(photoSurface);
const progressIndex = source.indexOf('data-testid="player-profile-workspace"');
if (!(personalizationIndex >= 0 && photoIndex > personalizationIndex && progressIndex > photoIndex)) throw new Error("Phase 7E photo must live in Personalization before Progress");
if (source.split(photoSurface).length !== 2) throw new Error("Phase 7E player photo surface duplicated");
if ((source.match(/className="coachRosterCard__photo"/g) || []).length !== 1) throw new Error("Phase 7E roster photo rendering duplicated");
if ((source.match(/data-testid="coach-player-profile-photo"/g) || []).length !== 1) throw new Error("Phase 7E coach player profile photo rendering duplicated");

if (source !== before) writeFileSync(appPath, source);

const remotePath = "src/lib/remotePersistence.js";
let remoteSource = readFileSync(remotePath, "utf8");
const remoteBefore = remoteSource;
const appNormalizerAnchor = `    name: cleanText(row.name),\n    role: cleanText(row.role),\n    createdAt: toFiniteNumber(row.createdAt ?? row.created_at),`;
const appNormalizerReplacement = `    name: cleanText(row.name),\n    role: cleanText(row.role),\n    photoUrl: cleanText(row.photoUrl || row.photo_url) || null,\n    createdAt: toFiniteNumber(row.createdAt ?? row.created_at),`;
if (!remoteSource.includes('photoUrl: cleanText(row.photoUrl || row.photo_url) || null')) {
  if (!remoteSource.includes(appNormalizerAnchor)) throw new Error("Phase 7E player app-normalizer anchor missing");
  remoteSource = remoteSource.replace(appNormalizerAnchor, appNormalizerReplacement);
}

const debugPayloadBefore = `  const payload = Array.isArray(error?.remoteRows)\n    ? JSON.stringify(error.remoteRows)\n    : error?.remoteRows && typeof error.remoteRows === "object"\n      ? JSON.stringify(error.remoteRows)\n      : "";`;
const debugPayloadAfter = `  const payload = error?.remoteRows && typeof error.remoteRows === "object"\n    ? JSON.stringify(error.remoteRows)\n    : "";`;
if (remoteSource.includes(debugPayloadBefore)) remoteSource = remoteSource.replace(debugPayloadBefore, debugPayloadAfter);
if (!remoteSource.includes('photoUrl: cleanText(row.photoUrl || row.photo_url) || null')) throw new Error("Phase 7E player normalization marker missing");
if (!remoteSource.includes('const payload = error?.remoteRows && typeof error.remoteRows === "object"')) throw new Error("Phase 7E remote debug compaction marker missing");
if (remoteSource !== remoteBefore) writeFileSync(remotePath, remoteSource);

console.log("Phase 7E player photo Personalization route, coach profile photo, roster image wiring, and player photo normalization verified.");
