import { readFileSync, writeFileSync } from 'node:fs';

const path = 'src/App.jsx';
const fail = (message) => { throw new Error(`[phase3m-player-profile-account-hierarchy] ${message}`); };

let source = readFileSync(path, 'utf8');

if (source.includes('testId="player-profile-account-data"')) {
  if (!source.includes('data-testid="player-profile-privacy"')) fail('privacy semantic owner missing from transformed Profile');
  if (!source.includes('<LegalSupportLinks compact/>')) fail('legal/support links missing from transformed Profile');
  if (!source.includes('<AccountTrustActions deleteAccount={deleteAccount}/>')) fail('account trust actions missing from transformed Profile');
  console.log('Phase 3M Player Profile account hierarchy already applied.');
  process.exit(0);
}

const profileStart = source.indexOf('function ProfilePage(');
if (profileStart < 0) fail('ProfilePage function not found');
const profileEnd = source.indexOf('\nfunction CoachRoster(', profileStart);
if (profileEnd < 0) fail('ProfilePage end boundary not found');

const privacyStart = '<div style={{background:CARD_BG,borderRadius:16,padding:"14px 16px",border:`1px solid ${BORDER_CLR}`,marginBottom:24}}>\n  <div style={{fontFamily:FB,color:T.SUB,fontSize:10,letterSpacing:3,fontWeight:700,marginBottom:10}}>PRIVACY</div>';
const privacyIndex = source.indexOf(privacyStart, profileStart);
if (privacyIndex < 0 || privacyIndex > profileEnd) fail('Player Profile privacy block not found');
source = source.slice(0, privacyIndex)
  + privacyStart.replace('<div style=', '<div data-testid="player-profile-privacy" style=')
  + source.slice(privacyIndex + privacyStart.length);

const refreshedProfileEnd = source.indexOf('\nfunction CoachRoster(', profileStart);
const legalStartMarker = '<div style={{background:CARD_BG,borderRadius:16,padding:"14px 16px",border:`1px solid ${BORDER_CLR}`,marginBottom:24}}>\n  <div style={{fontFamily:FB,color:T.SUB,fontSize:10,letterSpacing:3,fontWeight:700,marginBottom:8}}>LEGAL & SUPPORT</div>';
const legalStart = source.indexOf(legalStartMarker, profileStart);
if (legalStart < 0 || legalStart > refreshedProfileEnd) fail('Player Profile Legal & Support block not found');

const accountMarker = '<AccountTrustActions deleteAccount={deleteAccount}/>';
const accountStart = source.indexOf(accountMarker, legalStart);
if (accountStart < 0 || accountStart > refreshedProfileEnd) fail('Player Profile AccountTrustActions boundary not found');
const accountEnd = accountStart + accountMarker.length;
const accountContent = source.slice(legalStart, accountEnd);

const disclosure = `<ProgressiveDisclosure title="Account & data" summary="Privacy resources, support, data requests, and account controls" testId="player-profile-account-data">\n${accountContent}\n</ProgressiveDisclosure>`;
source = source.slice(0, legalStart) + disclosure + source.slice(accountEnd);

const transformedProfileEnd = source.indexOf('\nfunction CoachRoster(', profileStart);
const transformedProfile = source.slice(profileStart, transformedProfileEnd);
if (!transformedProfile.includes('data-testid="player-profile-privacy"')) fail('privacy semantic owner was not added');
if (!transformedProfile.includes('testId="player-profile-account-data"')) fail('Account & data disclosure was not added');
if (!transformedProfile.includes('>LEGAL & SUPPORT</div>')) fail('Legal & Support content was removed');
if (!transformedProfile.includes('<LegalSupportLinks compact/>')) fail('legal/support links were removed');
if (!transformedProfile.includes('<AccountTrustActions deleteAccount={deleteAccount}/>')) fail('account trust actions were removed');
if (!transformedProfile.includes('Hide me from leaderboards')) fail('leaderboard privacy control was removed');
if (!transformedProfile.includes('Delete Account & Data')) fail('in-app account deletion was removed');
if (!transformedProfile.includes('REQUEST DATA')) fail('data request action was removed');

writeFileSync(path, source);
console.log('Applied Phase 3M Player Profile account hierarchy.');
