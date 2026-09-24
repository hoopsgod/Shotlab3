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
const photoSurface = '<PlayerProfilePhotoCard player={u}/>';
if (!source.includes(photoSurface)) {
  if (!source.includes(profileAnchor)) throw new Error("Phase 7E player profile anchor missing");
  source = source.replace(profileAnchor, `data-testid="player-profile-workspace">\n  ${photoSurface}\n  <PlayerProgressStory`);
}

const avatarAnchor = '<div className="coachRosterCard__initials" aria-hidden="true">{(p.name||"?").trim().slice(0,1).toUpperCase()}</div>';
const avatarReplacement = '<div className="coachRosterCard__initials" aria-hidden="true">{p.photoUrl||p.photo_url?<img className="coachRosterCard__photo" src={p.photoUrl||p.photo_url} alt="" width="38" height="38" style={{objectFit:"cover"}}/>:(p.name||"?").trim()[0]?.toUpperCase()}</div>';
if (!source.includes('className="coachRosterCard__photo"')) {
  if (!source.includes(avatarAnchor)) throw new Error("Phase 7E roster avatar anchor missing");
  source = source.replace(avatarAnchor, avatarReplacement);
}

for (const marker of [photoImport, photoSurface, 'className="coachRosterCard__photo"', 'p.photoUrl||p.photo_url']) {
  if (!source.includes(marker)) throw new Error(`Phase 7E marker missing after transform: ${marker}`);
}
if ((source.match(/<PlayerProfilePhotoCard player=\{u\}\/ >/g) || []).length > 1) throw new Error("Phase 7E player photo surface duplicated");
if ((source.match(/className="coachRosterCard__photo"/g) || []).length !== 1) throw new Error("Phase 7E roster photo rendering duplicated");

if (source !== before) writeFileSync(appPath, source);
console.log("Phase 7E player profile photo and roster image wiring verified.");
