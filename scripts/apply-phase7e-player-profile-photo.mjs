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
const profileReplacement = 'data-testid="player-profile-workspace">\n  <div data-phase7e-player-photo="true"><PlayerProfilePhotoCard player={u}/></div>\n  <PlayerProgressStory';
if (!source.includes('data-phase7e-player-photo="true"')) {
  if (!source.includes(profileAnchor)) throw new Error("Phase 7E player profile anchor missing");
  source = source.replace(profileAnchor, profileReplacement);
}

const rowAnchor = '<article key={rosterIdentity} className="phase1RosterRow coachRosterCard" data-status={p.statusMeta.tone}>';
const rowReplacement = '<article key={rosterIdentity} className="phase1RosterRow coachRosterCard" data-status={p.statusMeta.tone} data-player-roster-identity={rosterIdentity}>';
if (!source.includes('data-player-roster-identity={rosterIdentity}')) {
  if (!source.includes(rowAnchor)) throw new Error("Phase 7E roster row anchor missing");
  source = source.replace(rowAnchor, rowReplacement);
}

const avatarAnchor = '<div className="coachRosterCard__initials" aria-hidden="true">{(p.name||"?").trim().slice(0,1).toUpperCase()}</div>';
const avatarReplacement = '{p.photoUrl||p.photo_url?<img className="coachRosterCard__photo" src={p.photoUrl||p.photo_url} alt="" aria-hidden="true"/>:<div className="coachRosterCard__initials" aria-hidden="true">{(p.name||"?").trim().slice(0,1).toUpperCase()}</div>}';
if (!source.includes('className="coachRosterCard__photo"')) {
  if (!source.includes(avatarAnchor)) throw new Error("Phase 7E roster avatar anchor missing");
  source = source.replace(avatarAnchor, avatarReplacement);
}

const required = [
  photoImport,
  'data-phase7e-player-photo="true"',
  'data-player-roster-identity={rosterIdentity}',
  'className="coachRosterCard__photo"',
  'p.photoUrl||p.photo_url',
];
for (const marker of required) {
  if (!source.includes(marker)) throw new Error(`Phase 7E marker missing after transform: ${marker}`);
}
if ((source.match(/data-phase7e-player-photo="true"/g) || []).length !== 1) throw new Error("Phase 7E player photo surface duplicated");
if ((source.match(/className="coachRosterCard__photo"/g) || []).length !== 1) throw new Error("Phase 7E roster photo rendering duplicated");

if (source !== before) writeFileSync(appPath, source);
console.log("Phase 7E player profile photo and roster image wiring verified.");
