import { readFileSync, writeFileSync } from 'node:fs';

const fail = (message) => { throw new Error(`[phase3f-profile-intelligence] ${message}`); };
const requireOne = (source, anchor, label) => {
  const count = source.split(anchor).length - 1;
  if (count !== 1) fail(`${label}: expected exactly one anchor, found ${count}`);
};
const replaceOne = (source, before, after, label) => {
  requireOne(source, before, label);
  return source.replace(before, after);
};

function transformProfile() {
  const path = 'src/App.jsx';
  let source = readFileSync(path, 'utf8');
  if (source.includes('data-testid="player-profile-readout"')) {
    if (!source.includes('testId="player-profile-performance-intelligence"')) fail('performance intelligence disclosure missing from transformed Profile');
    if (!source.includes('testId="player-profile-drill-development"')) fail('drill development disclosure missing from transformed Profile');
    console.log('Phase 3F Profile disclosure already applied.');
    return;
  }

  source = replaceOne(
    source,
    '<div style={{background:CARD_BG,borderRadius:16,padding:"14px 16px",border:`1px solid ${BORDER_CLR}`,marginBottom:24}}><div style={{fontFamily:FB,color:T.SUB,fontSize:10,letterSpacing:3,fontWeight:700,marginBottom:10}}>PLAYER PROGRESS PROFILE</div>',
    '<div data-testid="player-profile-current-progress" style={{background:CARD_BG,borderRadius:16,padding:"14px 16px",border:`1px solid ${BORDER_CLR}`,marginBottom:24}}><div style={{fontFamily:FB,color:T.SUB,fontSize:10,letterSpacing:3,fontWeight:700,marginBottom:10}}>PLAYER PROGRESS PROFILE</div>',
    'current progress semantic owner',
  );

  const trendStart = '<div style={{background:CARD_BG,borderRadius:16,padding:"14px 16px",border:`1px solid ${BORDER_CLR}`,marginBottom:20}}>\n  <div style={{fontFamily:FB,color:T.SUB,fontSize:10,letterSpacing:3,fontWeight:700,marginBottom:10}}>INTERPRETED PERFORMANCE TRENDS</div>';
  requireOne(source, trendStart, 'interpreted performance trends block');
  const readoutAndDisclosure = `<div data-testid="player-profile-readout" style={{background:CARD_BG,borderRadius:16,padding:"15px 16px",border:\`1px solid \${BORDER_CLR}\`,marginBottom:14}}>
  <div data-profile-readout-eyebrow style={{fontFamily:FB,color:VOLT,fontSize:9,fontWeight:800,letterSpacing:"0.10em"}}>PLAYER READOUT</div>
  <div data-profile-readout-primary style={{fontFamily:FB,color:LIGHT,fontSize:17,fontWeight:800,marginTop:5}}>Momentum is {interpretedTrends.momentum}.</div>
  <div data-profile-readout-support style={{fontFamily:FB,color:MUTED,fontSize:11,lineHeight:1.45,marginTop:7}}>
    <span>Focus: {interpretedTrends.weakArea}</span>
    <span>Strength: {interpretedTrends.strongestDrill}</span>
  </div>
</div>

<ProgressiveDisclosure title="Performance intelligence" summary="Trends, totals, charts, and recent logs" testId="player-profile-performance-intelligence">
${trendStart}`;
  source = source.replace(trendStart, readoutAndDisclosure);

  source = replaceOne(
    source,
    '<ShotLabCharts scores={scores} drills={drills} programDrills={programDrills} user={u} />\n\n{/* Per-drill breakdown with PBs and trends */}',
    '<div data-testid="player-profile-analytics"><ShotLabCharts scores={scores} drills={drills} programDrills={programDrills} user={u} /></div>\n</ProgressiveDisclosure>\n\n<ProgressiveDisclosure title="Drill development" summary={`${drillStats.length} drills tracked · personal bests and trends`} testId="player-profile-drill-development">\n{/* Per-drill breakdown with PBs and trends */}',
    'analytics-to-drill disclosure boundary',
  );

  const privacyBoundary = '</div>})}\n\n<div style={{background:CARD_BG,borderRadius:16,padding:"14px 16px",border:`1px solid ${BORDER_CLR}`,marginBottom:24}}>\n  <div style={{fontFamily:FB,color:T.SUB,fontSize:10,letterSpacing:3,fontWeight:700,marginBottom:10}}>PRIVACY</div>';
  requireOne(source, privacyBoundary, 'drill-to-privacy disclosure boundary');
  source = source.replace(
    privacyBoundary,
    '</div>})}\n</ProgressiveDisclosure>\n\n<div style={{background:CARD_BG,borderRadius:16,padding:"14px 16px",border:`1px solid ${BORDER_CLR}`,marginBottom:24}}>\n  <div style={{fontFamily:FB,color:T.SUB,fontSize:10,letterSpacing:3,fontWeight:700,marginBottom:10}}>PRIVACY</div>',
  );

  if ((source.match(/<ShotLabCharts scores=\{scores\}/g) || []).length !== 1) fail('ShotLabCharts must remain exactly once');
  if (!source.includes('INTERPRETED PERFORMANCE TRENDS')) fail('interpreted trends were removed');
  if (!source.includes('DRILL BREAKDOWN')) fail('drill breakdown was removed');
  if (!source.includes('>PRIVACY</div>')) fail('privacy controls were removed');
  if (!source.includes('<AccountTrustActions deleteAccount={deleteAccount}/>')) fail('account trust actions were removed');
  writeFileSync(path, source);
  console.log('Applied Phase 3F Profile progressive disclosure.');
}

function transformAnalytics() {
  const path = 'src/components/ShotLabCharts.jsx';
  let source = readFileSync(path, 'utf8');
  if (source.includes('data-testid="player-analytics-workspace"')) {
    if (!source.includes('aria-pressed={tab === t.id}')) fail('analytics selected state missing from transformed source');
    if (!source.includes('import ShotLabIcon from "./ShotLabIcon";')) fail('ShotLabIcon import missing from transformed source');
    console.log('Phase 3F analytics controls already applied.');
    return;
  }

  source = replaceOne(source, '} from "recharts";\n', '} from "recharts";\nimport ShotLabIcon from "./ShotLabIcon";\n', 'ShotLabIcon import');
  source = replaceOne(
    source,
    'const TABS = [\n  { id: "progress", label: "PROGRESS", icon: "📈" },\n  { id: "skills", label: "SKILLS", icon: "🕸️" },\n  { id: "streaks", label: "STREAKS", icon: "🔥" },\n  { id: "goals", label: "GOALS", icon: "🎯" },\n];',
    'const TABS = [\n  { id: "progress", label: "Progress", icon: "chart" },\n  { id: "skills", label: "Skills", icon: "target" },\n  { id: "streaks", label: "Streaks", icon: "streak" },\n  { id: "goals", label: "Goals", icon: "trophy" },\n];',
    'analytics tab definitions',
  );
  source = replaceOne(
    source,
    '    <div\n      style={{\n        minHeight: "100vh",',
    '    <div\n      data-testid="player-analytics-workspace"\n      data-analytics-tab={tab}\n      data-analytics-context={context}\n      style={{\n        minHeight: "100vh",',
    'analytics workspace root',
  );

  const oldHeading = `        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: 9, letterSpacing: 3, color: T.muted }}>
              {(user?.name || "PLAYER").toUpperCase()} · MY DATA
            </div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 900,
                letterSpacing: 2,
                color: T.white,
                lineHeight: 1.1,
              }}
            >
              MY <span style={{ color: T.lime }}>PROGRESS</span>
            </div>
          </div>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "#2a3a1a",
              border: \`2px solid \${T.lime}\`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              fontWeight: 900,
              color: T.lime,
            }}
          >
            {(user?.name || "P")[0].toUpperCase()}
          </div>
        </div>`;
  const newHeading = `        <div
          data-testid="player-analytics-heading"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div>
            <div style={{ fontSize: 9, letterSpacing: 2.2, color: T.muted, fontWeight: 800 }}>TRAINING ANALYTICS</div>
            <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: 1.2, color: T.white, lineHeight: 1.1 }}>
              PERFORMANCE <span style={{ color: T.lime }}>INTELLIGENCE</span>
            </div>
          </div>
          <div aria-hidden="true" style={{ width: 40, height: 40, borderRadius: 12, background: "#2a3a1a", border: \`1px solid \${T.lime}66\`, display: "grid", placeItems: "center", color: T.lime }}>
            <ShotLabIcon name="chart" size={19} />
          </div>
        </div>`;
  source = replaceOne(source, oldHeading, newHeading, 'analytics identity masthead');

  source = replaceOne(
    source,
    '        <div\n          style={{\n            display: "flex",\n            gap: 0,\n            marginTop: 14,',
    '        <div\n          data-testid="player-analytics-sections"\n          role="group"\n          aria-label="Analytics category"\n          style={{\n            display: "flex",\n            gap: 0,\n            marginTop: 14,',
    'analytics category group',
  );
  source = replaceOne(
    source,
    '            <button\n              key={t.id}\n              onClick={() => setTab(t.id)}\n              style={{',
    '            <button\n              key={t.id}\n              type="button"\n              aria-pressed={tab === t.id}\n              data-analytics-section={t.id}\n              onClick={() => setTab(t.id)}\n              style={{',
    'analytics category buttons',
  );
  source = replaceOne(source, '                flexDirection: "column",\n                alignItems: "center",\n                gap: 2,', '                flexDirection: "row",\n                alignItems: "center",\n                justifyContent: "center",\n                gap: 5,', 'analytics category layout');
  source = replaceOne(source, '              <span>{t.icon}</span>\n              <span>{t.label}</span>', '              <ShotLabIcon name={t.icon} size={15} />\n              <span>{t.label}</span>', 'analytics line icons');
  source = replaceOne(source, '            <Card style={{ padding: 12 }}>\n              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>', '            <Card style={{ padding: 12 }}>\n              <div data-testid="player-analytics-contexts" role="group" aria-label="Training source" style={{ display: "flex", gap: 8, marginBottom: 12 }}>', 'training source group');
  source = replaceOne(source, '                    <button\n                      key={option.id}\n                      onClick={() => setContext(option.id)}\n                      style={{', '                    <button\n                      key={option.id}\n                      type="button"\n                      aria-pressed={activeOption}\n                      data-analytics-context-option={option.id}\n                      onClick={() => setContext(option.id)}\n                      style={{', 'training source buttons');
  source = replaceOne(source, '                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>', '                <div data-testid="player-analytics-drills" role="group" aria-label="Drill filter" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>', 'drill filter group');
  source = replaceOne(source, '                      <button\n                        key={`${context}-${drill.id}`}\n                        onClick={() => setSelectedDrillId(drill.id)}\n                        style={{', '                      <button\n                        key={`${context}-${drill.id}`}\n                        type="button"\n                        aria-pressed={active}\n                        data-analytics-drill={drill.id}\n                        onClick={() => setSelectedDrillId(drill.id)}\n                        style={{', 'drill filter buttons');
  source = replaceOne(source, '        <div style={{ fontSize: 28 }}>🎯</div>', '        <div aria-hidden="true" style={{ color: T.lime, display: "grid", placeItems: "center" }}><ShotLabIcon name="target" size={26} /></div>', 'season goal icon');

  if (source.includes('· MY DATA')) fail('duplicate analytics player identity remains');
  if (/[📈🕸️🔥🎯]/u.test(source)) fail('emoji analytics controls remain');
  if (!source.includes('const myScores = useMemo(')) fail('score filtering calculation changed unexpectedly');
  if (!source.includes('<MakesOverTime') || !source.includes('<WeeklyVolume') || !source.includes('<SkillRadar />') || !source.includes('<StreakCalendar />') || !source.includes('<SeasonGoal />')) fail('an analytics destination was removed');
  writeFileSync(path, source);
  console.log('Applied Phase 3F native analytics controls.');
}

transformProfile();
transformAnalytics();
