const fs=require("node:fs");

function replace(path,from,to,label){
  let source=fs.readFileSync(path,"utf8");
  if(!source.includes(from))throw new Error(`missing ${label}`);
  source=source.replace(from,to);
  fs.writeFileSync(path,source);
}

replace(
  "src/App.jsx",
  'window.history.pushState({shotlabWorkspace:"coach-player"},"",nextPath)',
  'window.history.pushState({slp:1},"",nextPath)',
  "compact player history marker",
);
replace(
  "src/App.jsx",
  'history.state?.shotlabWorkspace==="coach-player"',
  'history.state?.slp===1',
  "safe player history marker check",
);

replace(
  "src/components/CoachDashboardPrimitives.jsx",
  '  const previousFocus=useRef(null);\n  useEffect(()=>{if(!open)return;previousFocus.current=document.activeElement;const root=document.getElementById("root");if(root)root.inert=true;return()=>{if(root)root.inert=false;previousFocus.current?.focus?.({preventScroll:true})}},[open]);',
  '  const previousFocus=useRef(null),closeRef=useRef(null);\n  useEffect(()=>{if(!open)return;previousFocus.current=document.activeElement;const root=document.getElementById("root");if(root)root.inert=true;closeRef.current?.focus({preventScroll:true});return()=>{if(root)root.inert=false;requestAnimationFrame(()=>previousFocus.current?.focus?.({preventScroll:true}))}},[open]);',
  "drawer focus lifecycle",
);
replace(
  "src/components/CoachDashboardPrimitives.jsx",
  '<button autoFocus type="button" className={styles.drawerClose} data-action-role="tertiary" aria-label="Close details" onClick={onClose}>×</button>',
  '<button ref={closeRef} type="button" className={styles.drawerClose} data-action-role="tertiary" aria-label="Close details" onClick={onClose}>×</button>',
  "drawer close ref",
);

replace(
  "tests/desktop-single-page-workspace-shell.test.mjs",
  'assert.match(source, /pushState\\(\\{shotlabWorkspace:"coach-player"\\}/);\n  assert.match(source, /history\\.state\\?\\.shotlabWorkspace==="coach-player"/);',
  'assert.match(source, /pushState\\(\\{slp:1\\}/);\n  assert.match(source, /history\\.state\\?\\.slp===1/);',
  "source marker assertions",
);

replace(
  "tests/e2e/desktop-workspace-routing.spec.mjs",
  'expect(await page.evaluate(() => window.history.state?.shotlabWorkspace)).toBe("coach-player");',
  'expect(await page.evaluate(() => window.history.state?.slp)).toBe(1);',
  "browser marker assertion",
);
replace(
  "tests/e2e/desktop-workspace-routing.spec.mjs",
  'expect(await direct.evaluate(() => window.history.state?.shotlabWorkspace || null)).not.toBe("coach-player");',
  'expect(await direct.evaluate(() => window.history.state?.slp || null)).not.toBe(1);',
  "direct-link marker assertion",
);
replace(
  "tests/e2e/desktop-workspace-routing.spec.mjs",
  '  await page.keyboard.press("Escape");\n  await expect(drawer).toHaveCount(0);\n  expect(new URL(page.url()).pathname).toBe("/coach/players");\n  await expect(profile).toBeFocused();',
  '  const originScrollY=await page.evaluate(()=>scrollY);\n  await page.keyboard.press("Escape");\n  await expect(drawer).toHaveCount(0);\n  expect(new URL(page.url()).pathname).toBe("/coach/players");\n  await expect(profile).toBeFocused();\n  await expect.poll(()=>page.evaluate(()=>scrollY)).toBe(originScrollY);',
  "drawer focus and scroll assertion",
);

{
  let app=fs.readFileSync("src/App.jsx","utf8");
  const swaps=[
    ['{k:"home",l:"Home",accentVar:"--accent-feed",svg:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>}', '{k:"home",l:"Home",accentVar:"--accent-feed",icon:"home",mobileIcon:"home"}', 'player home icon'],
    ['{k:"players",l:"Players",accentVar:"--accent-players",svg:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6"/><path d="M23 11h-6"/></svg>}', '{k:"players",l:"Players",accentVar:"--accent-players",icon:"team",mobileIcon:"team"}', 'player coach-mode players icon'],
    ['{k:"duels",l:"Program Log",accentVar:"--accent-drills",svg:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h10"/></svg>}', '{k:"duels",l:"Program Log",accentVar:"--accent-drills",icon:"program",mobileIcon:"program"}', 'player program icon'],
    ['{k:"log-drill",l:"AT Home Log",accentVar:"--accent-drills",svg:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h10"/></svg>}', '{k:"log-drill",l:"AT Home Log",accentVar:"--accent-drills",icon:"target",mobileIcon:"target"}', 'player train icon'],
    ['{k:"sc",l:"Lifting",accentVar:"--accent-lifting",svg:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6.5 6.5h-2a1 1 0 00-1 1v9a1 1 0 001 1h2M17.5 6.5h2a1 1 0 011 1v9a1 1 0 01-1 1h-2M6.5 12h11M1.5 9.5v5M22.5 9.5v5"/></svg>,dot:soonSC>0?VOLT:null}', '{k:"sc",l:"Lifting",accentVar:"--accent-lifting",icon:"strength",mobileIcon:"strength",dot:soonSC>0?VOLT:null}', 'player lifting icon'],
    ['{k:"program",l:"Events",accentVar:"--accent-events",svg:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4M16 2v4"/><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18"/></svg>,dot:unrsvpEvents>0?VOLT:null}', '{k:"program",l:"Events",accentVar:"--accent-events",icon:"calendar",mobileIcon:"calendar",dot:unrsvpEvents>0?VOLT:null}', 'player events icon'],
    ['{k:"team-store",l:"Team Store",accentVar:"--accent",svg:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10h16l-1-5H5l-1 5Z"/><path d="M6 10v9h12v-9"/><path d="M9 19v-5h6v5"/><path d="M4 10c0 1.2.8 2 2 2s2-.8 2-2c0 1.2.8 2 2 2s2-.8 2-2c0 1.2.8 2 2 2s2-.8 2-2c0 1.2.8 2 2 2s2-.8 2-2"/></svg>}', '{k:"team-store",l:"Team Store",accentVar:"--accent",icon:"store",mobileIcon:"store"}', 'player store icon'],
    ['{k:"leaderboards",l:"Leaderboards",mobileLabel:"Rankings",description:"Current and all-time team rankings",accentVar:"--accent-feed",svg:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>}', '{k:"leaderboards",l:"Leaderboards",mobileLabel:"Rankings",description:"Current and all-time team rankings",accentVar:"--accent-feed",icon:"chart",mobileIcon:"chart"}', 'player leaderboard icon'],
    ['{k:"in-season",l:"In Season",accentVar:"--accent-events",svg:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19V5"/><path d="M4 19h16"/><path d="M8 15l3-3 3 2 5-7"/><path d="M15 7h4v4"/></svg>}', '{k:"in-season",l:"In Season",accentVar:"--accent-events",icon:"momentum",mobileIcon:"momentum"}', 'player in-season icon'],
    ['{k:"profile",l:"Profile",accentVar:"--accent-players",svg:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}', '{k:"profile",l:"Profile",accentVar:"--accent-players",icon:"profile",mobileIcon:"profile"}', 'player profile icon'],
  ];
  for(const [from,to,label] of swaps){if(!app.includes(from))throw new Error(`missing ${label}`);app=app.replace(from,to);}
  const direct='<ShotLabIcon name={item.icon} size={22}/><span>{item.l}</span>';
  const legacy='{item.svg}<span>{item.l}</span>';
  const shared='{item.svg||<ShotLabIcon name={item.icon} size={22}/>}<span>{item.l}</span>';
  app=app.split(direct).join(shared).split(legacy).join(shared);
  fs.writeFileSync("src/App.jsx",app);
}

{
  const path="scripts/apply-in-season-player-parity.mjs";
  let source=fs.readFileSync(path,"utf8");
  const from='  source = replaceOnce(source, navBefore, navAfter, "player In Season navigation item");';
  const to='  if (!source.includes(\'{k:"in-season",l:"In Season"\')) source = replaceOnce(source, navBefore, navAfter, "player In Season navigation item");';
  if(!source.includes(from))throw new Error("missing in-season nav enhancer guard");
  source=source.replace(from,to);
  fs.writeFileSync(path,source);
}

console.log("PR 1581 focus/performance refinement applied");
