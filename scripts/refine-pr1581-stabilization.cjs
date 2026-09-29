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
  const start=app.indexOf('const playerNavItems=[');
  const end=app.indexOf('];\nconst getPlayerNavItem',start)+2;
  if(start<0||end<2)throw new Error('missing player nav items');
  const compact='const playerNavItems=[["home","Home","home"],[u.isCoach?"players":"duels",u.isCoach?"Players":"Program Log",u.isCoach?"team":"program"],["log-drill","AT Home Log","target"],["sc","Lifting","strength",soonSC>0?VOLT:null],["program","Events","calendar",unrsvpEvents>0?VOLT:null],["team-store","Team Store","store"],["in-season","In Season","momentum"],["profile","Profile","profile"]].map(([k,l,icon,dot])=>({k,l,icon,mobileIcon:icon,dot}));';
  app=app.slice(0,start)+compact+app.slice(end);
  const desktopIcon='{item.svg}<span>{item.l}</span>';
  if(!app.includes(desktopIcon))throw new Error('missing player desktop icon render');
  app=app.replace(desktopIcon,'<ShotLabIcon name={item.icon} size={22}/><span>{item.l}</span>');
  fs.writeFileSync("src/App.jsx",app);
}

console.log("PR 1581 focus/performance refinement applied");
