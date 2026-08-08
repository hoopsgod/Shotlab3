import { readFileSync, writeFileSync } from "node:fs";

const fail = (message) => { throw new Error(`[phase4b-premium-performance-marks] ${message}`); };
const requireOne = (source, anchor, label) => {
  const count = source.split(anchor).length - 1;
  if (count !== 1) fail(`${label}: expected one anchor, found ${count}`);
};
const replaceRange = (source, start, end, replacement, label) => {
  const startIndex = source.indexOf(start);
  if (startIndex < 0) fail(`${label}: start anchor missing`);
  const endIndex = source.indexOf(end, startIndex + start.length);
  if (endIndex < 0) fail(`${label}: end anchor missing`);
  return `${source.slice(0, startIndex)}${replacement}${source.slice(endIndex)}`;
};

const appPath = "src/App.jsx";
let source = readFileSync(appPath, "utf8");

if (!source.includes('import ShotLabPerformanceMark from "./components/ShotLabPerformanceMark.jsx";')) {
  const importAnchor = 'import PlayerDailyCommandCenter from "./components/PlayerDailyCommandCenter.jsx";\n';
  requireOne(source, importAnchor, "PlayerDailyCommandCenter import");
  source = source.replace(importAnchor, `${importAnchor}import ShotLabPerformanceMark from "./components/ShotLabPerformanceMark.jsx";\n`);
}

if (!source.includes('data-testid="player-streak-achievement-reveal"')) {
  const start = '{/* Badge Reveal Overlay */}';
  const end = '{/* Personal Best Reveal */}';
  const replacement = `{/* Badge Reveal Overlay */}
{badgeReveal&&<div className="performanceRevealOverlay" data-testid="player-streak-achievement-reveal" onClick={()=>setBadgeReveal(null)}>
  <div className="performanceRevealCard" role="dialog" aria-modal="true" aria-label={\`Streak milestone: \${badgeReveal.name}\`} onClick={event=>event.stopPropagation()}>
    <div className="performanceRevealEyebrow">STREAK MILESTONE</div>
    <ShotLabPerformanceMark kind="streak" value={\`\${badgeReveal.days}D\`} label={badgeReveal.name} detail="Training streak achieved" testId="player-streak-achievement-mark" />
    <div className="performanceRevealSummary">Consistency banked. Your {badgeReveal.days}-day training streak is now part of your ShotLab record.</div>
    <button type="button" className="performanceRevealDismiss" onClick={()=>setBadgeReveal(null)}>Continue</button>
  </div>
</div>}

`;
  source = replaceRange(source, start, end, replacement, "streak reveal");
}

if (!source.includes('data-testid="player-pb-achievement-reveal"')) {
  const start = '{/* Personal Best Reveal */}';
  const end = '{/* Header — Premium dashboard heading */}';
  const replacement = `{/* Personal Best Reveal */}
{pbReveal&&<div className="performanceRevealOverlay" data-testid="player-pb-achievement-reveal" onClick={()=>setPbReveal(null)}>
  <div className="performanceRevealCard performanceRevealCard--pb" role="dialog" aria-modal="true" aria-label={\`New personal best in \${pbReveal.drill}\`} onClick={event=>event.stopPropagation()}>
    <div className="performanceRevealEyebrow">PERSONAL BEST</div>
    <ShotLabPerformanceMark kind="pb" value={pbReveal.score} label="New high mark" detail={pbReveal.drill} tone="warning" testId="player-pb-achievement-mark" />
    <div className="performanceRevealDelta"><span>Previous</span><strong>{pbReveal.prev}</strong><span>Improvement</span><strong>+{Math.max(0,Number(pbReveal.score)-Number(pbReveal.prev))}</strong></div>
    <div className="performanceRevealSummary">That result moved your benchmark. The next comparable session now measures against this score.</div>
    <button type="button" className="performanceRevealDismiss" onClick={()=>setPbReveal(null)}>Bank this result</button>
  </div>
</div>}

`;
  source = replaceRange(source, start, end, replacement, "PB reveal");
}

source = source
  .replace('className="performanceRevealCard badge-pop"', 'className="performanceRevealCard"')
  .replace('className="performanceRevealCard performanceRevealCard--pb badge-pop"', 'className="performanceRevealCard performanceRevealCard--pb"');

if (!source.includes('data-testid="player-achievement-shelf"')) {
  const oldBadges = `{/* Badges */}
{earnedBadges.length>0&&<div style={{marginBottom:24}}>
  <div style={{fontFamily:FB,color:T.SUB,fontSize:10,letterSpacing:3,fontWeight:700,marginBottom:10}}>BADGES EARNED</div>
  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{earnedBadges.map(b=>
    <div key={b.days} style={{display:"flex",alignItems:"center",gap:5,background:\`\${b.color}10\`,border:\`1px solid \${b.color}33\`,borderRadius:10,padding:"6px 12px"}}>
      <span style={{fontFamily:FD,fontSize:14,color:b.color}}>{b.icon}</span>
      <span style={{fontFamily:FB,fontSize:10,color:b.color,fontWeight:700,letterSpacing:1}}>{b.name}</span>
    </div>)}
  </div>
</div>}`;
  requireOne(source, oldBadges, "legacy profile badges");
  const newBadges = `{/* Badges */}
{(()=>{const nextBadge=STREAK_BADGES.find(b=>b.days>streak);return <section className="performanceBadgeShelf" data-testid="player-achievement-shelf" aria-label="Streak achievement milestones">
  <div className="performanceBadgeShelfHeader"><span>ACHIEVEMENT CABINET</span><strong>{earnedBadges.length} earned · {streak}D current</strong></div>
  {earnedBadges.length>0&&<div className="performanceBadgeShelfGrid performanceBadgeShelfGrid--earned">{earnedBadges.map(b=><ShotLabPerformanceMark key={b.days} kind="streak" value={\`\${b.days}D\`} label={b.name} detail="Streak milestone" compact surface="light" testId={\`player-achievement-\${b.days}\`}/>)}</div>}
  {nextBadge&&<div className="performanceBadgeNext" data-testid="player-achievement-next"><div className="performanceBadgeNextLabel">NEXT MILESTONE</div><ShotLabPerformanceMark kind="milestone" value={\`\${nextBadge.days}D\`} label={nextBadge.name} detail={\`\${Math.max(0,nextBadge.days-streak)} days to unlock\`} compact surface="light" tone="neutral" testId="player-achievement-next-mark" /></div>}
  {!nextBadge&&earnedBadges.length>0&&<div className="performanceBadgeComplete">All streak milestones earned. Keep protecting the standard.</div>}
</section>})()}`;
  source = source.replace(oldBadges, newBadges);
}

for (const retained of [
  'const STREAK_BADGES=',
  'const getEarnedBadges=',
  'const isPB=v>prevBest&&prevBest>0;',
  'setPbReveal({drill:active.name,score:v,prev:prevBest})',
  'STREAK_BADGES.find(b=>oldStreak<b.days&&ns>=b.days)',
  'STREAK_BADGES.find(b=>b.days>streak)',
  'data-testid="player-pb-achievement-reveal"',
  'data-testid="player-streak-achievement-reveal"',
  'data-testid="player-achievement-shelf"',
  'data-testid="player-achievement-next"',
]) if (!source.includes(retained)) fail(`performance capability removed: ${retained}`);

if (/className="performanceRevealCard[^\"]*badge-pop/.test(source)) fail("legacy badge-pop class still controls a Phase 4B achievement card");

writeFileSync(appPath, source);

const indexPath = "index.html";
let index = readFileSync(indexPath, "utf8");
if (!index.includes('shotlab-phase4b-performance-marks')) {
  const anchor = '  <link id="shotlab-phase4a-signature-identity" rel="stylesheet" href="/shotlab-phase4a-signature-identity.css" />';
  requireOne(index, anchor, "Phase 4A stylesheet link");
  index = index.replace(anchor, `${anchor}\n  <link id="shotlab-phase4b-performance-marks" rel="stylesheet" href="/shotlab-phase4b-performance-marks.css" />`);
  writeFileSync(indexPath, index);
}

console.log("Applied Phase 4B premium performance marks.");
