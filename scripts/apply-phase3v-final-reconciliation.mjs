import { readFileSync, writeFileSync } from 'node:fs';

const fail = (message) => { throw new Error(`[phase3v-final-reconciliation] ${message}`); };

function reconcilePlayerProfile() {
  const path = 'src/App.jsx';
  let source = readFileSync(path, 'utf8');

  // 1) Restore the verified compact Drill Development index if the current lineage does not contain it.
  if (!source.includes('data-testid="player-profile-drill-index"')) {
    const drillBoundary = '{/* Per-drill breakdown with PBs and trends */}\n<div style={{fontFamily:FB,color:T.SUB,fontSize:10,letterSpacing:3,fontWeight:700,marginBottom:12}}>DRILL BREAKDOWN</div>';
    const count = source.split(drillBoundary).length - 1;
    if (count !== 1) fail(`drill breakdown boundary: expected one anchor, found ${count}`);

    const drillIndex = `<div data-testid="player-profile-drill-index" data-drill-count={drillStats.length}>
  <div data-drill-index-heading>
    <div>
      <div data-drill-index-eyebrow>DEVELOPMENT INDEX</div>
      <div data-drill-index-title>Your drills at a glance</div>
    </div>
    <div data-drill-index-count>{drillStats.length} tracked</div>
  </div>
  <div data-drill-index-list>
    {drillStats.map(d=>{
      const sourceColor=d.src==="program"?CYAN:VOLT;
      const trendLabel=d.trend==="up"?"Rising":d.trend==="down"?"Needs work":"Steady";
      return <div key={\`index-\${d.src}-\${d.id}\`} data-drill-index-row data-source={d.src}>
        <div data-drill-index-main>
          <div data-drill-index-name>{d.name}</div>
          <div data-drill-index-meta>
            <span style={{color:sourceColor}}>{d.src==="program"?"PROGRAM":"AT HOME"}</span>
            <span>{d.count} logs</span>
            <span>{trendLabel}</span>
          </div>
        </div>
        <div data-drill-index-metrics>
          <span><strong>{d.pb}</strong><small>PB</small></span>
          <span><strong>{d.avg}</strong><small>AVG</small></span>
        </div>
      </div>;
    })}
  </div>
</div>

<ProgressiveDisclosure title="Full drill details" summary="Personal bests, averages, trends, and score history" testId="player-profile-full-drill-details">
${drillBoundary}`;
    source = source.replace(drillBoundary, drillIndex);

    const privacyBoundary = '</div>})}\n</ProgressiveDisclosure>\n\n<div style={{background:CARD_BG,borderRadius:16,padding:"14px 16px",border:`1px solid ${BORDER_CLR}`,marginBottom:24}}>\n  <div style={{fontFamily:FB,color:T.SUB,fontSize:10,letterSpacing:3,fontWeight:700,marginBottom:10}}>PRIVACY</div>';
    const privacyCount = source.split(privacyBoundary).length - 1;
    if (privacyCount !== 1) fail(`full drill details close boundary: expected one anchor, found ${privacyCount}`);
    source = source.replace(
      privacyBoundary,
      '</div>})}\n</ProgressiveDisclosure>\n</ProgressiveDisclosure>\n\n<div style={{background:CARD_BG,borderRadius:16,padding:"14px 16px",border:`1px solid ${BORDER_CLR}`,marginBottom:24}}>\n  <div style={{fontFamily:FB,color:T.SUB,fontSize:10,letterSpacing:3,fontWeight:700,marginBottom:10}}>PRIVACY</div>',
    );
  }

  // 2) Restore the verified Profile account hierarchy after the compact development transform.
  if (!source.includes('testId="player-profile-account-data"')) {
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
  }

  const profileStart = source.indexOf('function ProfilePage(');
  const profileEnd = source.indexOf('\nfunction CoachRoster(', profileStart);
  const profile = source.slice(profileStart, profileEnd);
  if (!profile.includes('data-testid="player-profile-drill-index"')) fail('compact drill-development index missing');
  if (!profile.includes('testId="player-profile-full-drill-details"')) fail('nested full drill details disclosure missing');
  if (!profile.includes('data-testid="player-profile-privacy"')) fail('privacy semantic owner missing');
  if (!profile.includes('testId="player-profile-account-data"')) fail('Account & data disclosure missing');
  if (!profile.includes('Hide me from leaderboards')) fail('leaderboard privacy control removed');
  if (!profile.includes('<LegalSupportLinks compact/>')) fail('legal/support links removed');
  if (!profile.includes('<AccountTrustActions deleteAccount={deleteAccount}/>')) fail('account trust actions removed');
  if (!profile.includes('DRILL BREAKDOWN')) fail('full drill detail cards removed');
  if (!profile.includes('<Sparkline data={d.last10}')) fail('drill history sparkline removed');

  writeFileSync(path, source);
  console.log('Applied Phase 3V final Player reconciliation.');
}

function reconcileStylesheet() {
  const path = 'index.html';
  let source = readFileSync(path, 'utf8');
  const link = '  <link id="shotlab-phase3v-final-closure" rel="stylesheet" href="/shotlab-phase3v-final-closure.css" />';
  if (!source.includes('shotlab-phase3v-final-closure')) {
    const anchor = '  <link id="shotlab-phase3r-player-progress-story" rel="stylesheet" href="/shotlab-phase3r-player-progress-story.css" />';
    const count = source.split(anchor).length - 1;
    if (count !== 1) fail(`Phase 3R stylesheet anchor: expected one, found ${count}`);
    source = source.replace(anchor, `${anchor}\n${link}`);
    writeFileSync(path, source);
  }
  console.log('Phase 3V final closure stylesheet linked.');
}

reconcilePlayerProfile();
reconcileStylesheet();
