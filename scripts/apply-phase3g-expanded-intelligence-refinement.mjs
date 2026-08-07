import { readFileSync, writeFileSync } from 'node:fs';

const fail = (message) => { throw new Error(`[phase3g-expanded-intelligence] ${message}`); };
const path = 'src/App.jsx';
let source = readFileSync(path, 'utf8');

if (source.includes('data-testid="player-profile-drill-index"')) {
  if (!source.includes('testId="player-profile-full-drill-details"')) fail('nested full drill details disclosure missing');
  console.log('Phase 3G expanded intelligence refinement already applied.');
  process.exit(0);
}

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

if ((source.match(/testId="player-profile-drill-development"/g) || []).length !== 1) fail('outer drill development disclosure changed unexpectedly');
if ((source.match(/testId="player-profile-full-drill-details"/g) || []).length !== 1) fail('nested full drill details disclosure missing or duplicated');
if (!source.includes('DRILL BREAKDOWN')) fail('legacy drill detail cards were removed');
if (!source.includes('<Sparkline data={d.last10}')) fail('drill score-history sparkline was removed');
if (!source.includes('>PRIVACY</div>')) fail('privacy boundary was removed');

writeFileSync(path, source);
console.log('Applied Phase 3G compact drill index and nested full-detail disclosure.');
