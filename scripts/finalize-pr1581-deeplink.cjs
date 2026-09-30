const fs=require("node:fs");

function replace(path,from,to,label){
  let source=fs.readFileSync(path,"utf8");
  if(!source.includes(from))throw new Error(`missing ${label}`);
  source=source.replace(from,to);
  fs.writeFileSync(path,source);
}

replace(
  "src/App.jsx",
  'const supabaseEmail=normalizeEmail(initialSupabaseSession?.data?.session?.user?.email);const authEmail=normalizeEmail(supabaseEmail||((!SUPABASE_AUTH_ENABLED||isDemoAccount(sess?.email))?sess?.email:""));',
  'const supabaseEmail=normalizeEmail(initialSupabaseSession?.data?.session?.user?.email);const explicitDemo=new URLSearchParams(window.location.search).get("demo")==="1";const authEmail=normalizeEmail(supabaseEmail||((!SUPABASE_AUTH_ENABLED||explicitDemo&&isDemoAccount(sess?.email))?sess?.email:""));',
  "explicit demo-only refresh restore",
);

replace(
  "src/App.jsx",
  'const nextPath=buildCoachRoute("players",key);if(window.location.pathname!==nextPath)window.history.pushState({slp:1},"",nextPath);',
  'const nextPath=buildCoachRoute("players",key),routeHref=nextPath+(isDemoAccount(u)?"?demo=1":"");if(window.location.pathname!==nextPath)window.history.pushState({slp:1},"",routeHref);',
  "coach player demo route marker",
);
replace(
  "src/App.jsx",
  'const nextPath=buildCoachRoute(k);\n  if(window.location.pathname!==nextPath)window.history.pushState({shotlabWorkspace:"coach",tab:k},"",nextPath);',
  'const nextPath=buildCoachRoute(k),routeHref=nextPath+(isDemoAccount(u)?"?demo=1":"");\n  if(window.location.pathname!==nextPath)window.history.pushState({shotlabWorkspace:"coach",tab:k},"",routeHref);',
  "coach navigation demo route marker",
);
replace(
  "src/App.jsx",
  '  const desired=buildCoachRoute(tab,tab==="players"?playerDrawerKey:"");\n  if(window.location.pathname!==desired)window.history.replaceState({shotlabWorkspace:"coach",tab,playerKey:playerDrawerKey||""},"",desired);',
  '  const desired=buildCoachRoute(tab,tab==="players"?playerDrawerKey:""),routeHref=desired+(isDemoAccount(u)?"?demo=1":"");\n  if(window.location.pathname!==desired||window.location.search!==(isDemoAccount(u)?"?demo=1":""))window.history.replaceState({shotlabWorkspace:"coach",tab,playerKey:playerDrawerKey||""},"",routeHref);',
  "coach route canonical demo marker",
);
replace(
  "src/App.jsx",
  '  const nextPath=PLAYER_TAB_PATHS[nextTab]||"/";\n  const currentPath=window.location.pathname==="/"?"/":(window.location.pathname.replace(/\\/+$/,"" )||"/");\n  if(currentPath!==nextPath)window.history.pushState({},"",nextPath);',
  '  const nextPath=PLAYER_TAB_PATHS[nextTab]||"/",routeHref=nextPath+(isDemoAccount(u)?"?demo=1":"");\n  const currentPath=window.location.pathname==="/"?"/":(window.location.pathname.replace(/\\/+$/,"" )||"/");\n  if(currentPath!==nextPath)window.history.pushState({},"",routeHref);',
  "player navigation demo route marker",
);

replace(
  "tests/desktop-single-page-workspace-shell.test.mjs",
  'test("sandbox demo identity can restore a deep route without overriding a real Supabase session", () => {\n  assert.match(source, /const supabaseEmail=normalizeEmail\\(initialSupabaseSession\\?\\.data\\?\\.session\\?\\.user\\?\\.email\\)/);\n  assert.match(source, /supabaseEmail\\|\\|\\(\\(!SUPABASE_AUTH_ENABLED\\|\\|isDemoAccount\\(sess\\?\\.email\\)\\)\\?sess\\?\\.email:""\\)/);\n});',
  'test("sandbox demo deep routes restore only with an explicit demo marker and never override a real Supabase session", () => {\n  assert.match(source, /const explicitDemo=new URLSearchParams\\(window\\.location\\.search\\)\\.get\\("demo"\\)==="1"/);\n  assert.match(source, /supabaseEmail\\|\\|\\(\\(!SUPABASE_AUTH_ENABLED\\|\\|explicitDemo&&isDemoAccount\\(sess\\?\\.email\\)\\)\\?sess\\?\\.email:""\\)/);\n  assert.match(source, /isDemoAccount\\(u\\)\\?"\\?demo=1":""/);\n});',
  "explicit demo restore source contract",
);

replace(
  "tests/e2e/desktop-workspace-routing.spec.mjs",
  '  const playerPath = new URL(page.url()).pathname;',
  '  const playerUrl=new URL(page.url());\n  const playerPath=playerUrl.pathname;\n  const playerHref=playerUrl.pathname+playerUrl.search;\n  expect(playerUrl.searchParams.get("demo")).toBe("1");',
  "coach player shareable demo href",
);
replace(
  "tests/e2e/desktop-workspace-routing.spec.mjs",
  '  await page.goto("/coach/settings");',
  '  await page.goto("/coach/settings?demo=1");',
  "coach settings explicit demo deep link",
);
replace(
  "tests/e2e/desktop-workspace-routing.spec.mjs",
  '  await direct.goto(playerPath);',
  '  await direct.goto(playerHref);',
  "coach player direct demo deep link",
);
replace(
  "tests/e2e/desktop-workspace-routing.spec.mjs",
  '  await direct.goto("/coach/not-a-real-route");',
  '  await direct.goto("/coach/not-a-real-route?demo=1");',
  "invalid coach explicit demo route",
);
replace(
  "tests/e2e/desktop-workspace-routing.spec.mjs",
  '  await expect.poll(() => new URL(page.url()).pathname).toBe("/events");\n\n  await page.reload();',
  '  await expect.poll(() => new URL(page.url()).pathname).toBe("/events");\n  expect(new URL(page.url()).searchParams.get("demo")).toBe("1");\n\n  await page.reload();',
  "player explicit demo refresh marker",
);

console.log("PR 1581 explicit demo deep-link closure applied");
