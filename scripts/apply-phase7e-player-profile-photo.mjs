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

const profileAnchor = 'data-testid="player-profile-workspace">\n  <PlayerProgressStory';
const photoSurface = '<PlayerProfilePhotoCard player={players.find(rowMatchesPlayerIdentity)||u}/>';
if (!source.includes(photoSurface)) {
  if (!source.includes(profileAnchor)) throw new Error("Phase 7E player profile anchor missing");
  source = source.replace(profileAnchor, `data-testid="player-profile-workspace">\n  ${photoSurface}\n  <PlayerProgressStory`);
}

const avatarAnchor = '<div className="coachRosterCard__initials" aria-hidden="true">{(p.name||"?").trim().slice(0,1).toUpperCase()}</div>';
const avatarReplacement = '<div className="coachRosterCard__initials" aria-hidden="true">{p.photoUrl||p.photo_url?<img className="coachRosterCard__photo" src={p.photoUrl||p.photo_url} width="38" height="38" style={{objectFit:"cover"}}/>:(p.name||"?")[0].toUpperCase()}</div>';
if (!source.includes('className="coachRosterCard__photo"')) {
  if (!source.includes(avatarAnchor)) throw new Error("Phase 7E roster avatar anchor missing");
  source = source.replace(avatarAnchor, avatarReplacement);
}

for (const marker of [photoImport, photoSurface, 'className="coachRosterCard__photo"', 'p.photoUrl||p.photo_url']) {
  if (!source.includes(marker)) throw new Error(`Phase 7E marker missing after transform: ${marker}`);
}
if (source.split(photoSurface).length !== 2) throw new Error("Phase 7E player photo surface duplicated");
if ((source.match(/className="coachRosterCard__photo"/g) || []).length !== 1) throw new Error("Phase 7E roster photo rendering duplicated");

if (source !== before) writeFileSync(appPath, source);

const remotePath = "src/lib/remotePersistence.js";
let remoteSource = readFileSync(remotePath, "utf8");
const remoteBefore = remoteSource;
const appNormalizerAnchor = `    name: cleanText(row.name),\n    role: cleanText(row.role),\n    createdAt: toFiniteNumber(row.createdAt ?? row.created_at),`;
const appNormalizerReplacement = `    name: cleanText(row.name),\n    role: cleanText(row.role),\n    photoUrl: cleanText(row.photoUrl ?? row.photo_url) || null,\n    createdAt: toFiniteNumber(row.createdAt ?? row.created_at),`;
if (!remoteSource.includes('photoUrl: cleanText(row.photoUrl ?? row.photo_url) || null')) {
  if (!remoteSource.includes(appNormalizerAnchor)) throw new Error("Phase 7E player app-normalizer anchor missing");
  remoteSource = remoteSource.replace(appNormalizerAnchor, appNormalizerReplacement);
}
const dbNormalizerAnchor = `    name: app.name,\n    role: app.role,\n    created_at: app.createdAt,`;
const dbNormalizerReplacement = `    name: app.name,\n    role: app.role,\n    photo_url: app.photoUrl || null,\n    created_at: app.createdAt,`;
if (!remoteSource.includes('photo_url: app.photoUrl || null')) {
  if (!remoteSource.includes(dbNormalizerAnchor)) throw new Error("Phase 7E player DB-normalizer anchor missing");
  remoteSource = remoteSource.replace(dbNormalizerAnchor, dbNormalizerReplacement);
}
for (const marker of ['photoUrl: cleanText(row.photoUrl ?? row.photo_url) || null', 'photo_url: app.photoUrl || null']) {
  if (!remoteSource.includes(marker)) throw new Error(`Phase 7E player normalization marker missing: ${marker}`);
}
if (remoteSource !== remoteBefore) writeFileSync(remotePath, remoteSource);

console.log("Phase 7E player profile photo, roster image wiring, and player photo normalization verified.");
