const fs=require("node:fs");

function edit(path,pattern,replacement,label){
  let source=fs.readFileSync(path,"utf8");
  const matches=typeof pattern==="string"?(source.includes(pattern)?1:0):(source.match(pattern)||[]).length;
  if(matches!==1)throw new Error(`${label}: expected 1 match, found ${matches}`);
  source=source.replace(pattern,replacement);
  fs.writeFileSync(path,source);
}

edit(
  "src/App.jsx",
  'const supabaseEmail=normalizeEmail(initialSupabaseSession?.data?.session?.user?.email);const authEmail=normalizeEmail(supabaseEmail||((!SUPABASE_AUTH_ENABLED||isDemoAccount(sess?.email))?sess?.email:""));',
  'const supabaseEmail=normalizeEmail(initialSupabaseSession?.data?.session?.user?.email);const explicitDemo=new URLSearchParams(window.location.search).get("demo")==="1";const authEmail=normalizeEmail(supabaseEmail||((!SUPABASE_AUTH_ENABLED||explicitDemo&&isDemoAccount(sess?.email))?sess?.email:""));',
  "explicit demo-only refresh restore",
);
edit("src/App.jsx",/window\.history\.pushState\(\{slp:1\},"",nextPath\)/g,'window.history.pushState({slp:1},"",nextPath+(isDemoAccount(u)?"?demo=1":""))',"coach player demo route marker");
edit("src/App.jsx",/window\.history\.pushState\(\{\s*shotlabWorkspace:"coach",\s*tab:k\s*\},"",nextPath\)/g,'window.history.pushState({shotlabWorkspace:"coach",tab:k},"",nextPath+(isDemoAccount(u)?"?demo=1":""))',"coach navigation demo route marker");
edit("src/App.jsx",/window\.history\.replaceState\(\{\s*shotlabWorkspace:"coach",\s*tab,\s*playerKey:playerDrawerKey\|\|""\s*\},"",desired\)/g,'window.history.replaceState({shotlabWorkspace:"coach",tab,playerKey:playerDrawerKey||""},"",desired+(isDemoAccount(u)?"?demo=1":""))',"coach canonical demo route marker");
edit("src/App.jsx",/window\.history\.pushState\(\{\},"",nextPath\)/g,'window.history.pushState({},"",nextPath+(isDemoAccount(u)?"?demo=1":""))',"player navigation demo route marker");

edit(
  "tests/desktop-single-page-workspace-shell.test.mjs",
  /test\("sandbox demo identity can restore a deep route without overriding a real Supabase session", \(\) => \{[\s\S]*?\n\}\);/g,
  'test("sandbox demo deep routes restore only with an explicit demo marker and never override a real Supabase session", () => {\n  assert.match(source, /const explicitDemo=new URLSearchParams\\(window\\.location\\.search\\)\\.get\\("demo"\\)==="1"/);\n  assert.match(source, /supabaseEmail\\|\\|\\(\\(!SUPABASE_AUTH_ENABLED\\|\\|explicitDemo&&isDemoAccount\\(sess\\?\\.email\\)\\)\\?sess\\?\\.email:""\\)/);\n  assert.match(source, /isDemoAccount\\(u\\)\\?"\\?demo=1":""/);\n});',
  "explicit demo restore source contract",
);

edit("tests/e2e/desktop-workspace-routing.spec.mjs",/  const playerPath\s*=\s*new URL\(page\.url\(\)\)\.pathname;/g,'  const playerUrl=new URL(page.url());\n  const playerPath=playerUrl.pathname;\n  const playerHref=playerUrl.pathname+playerUrl.search;\n  expect(playerUrl.searchParams.get("demo")).toBe("1");',"coach player shareable demo href");
edit("tests/e2e/desktop-workspace-routing.spec.mjs",'  await page.goto("/coach/settings");','  await page.goto("/coach/settings?demo=1");',"coach settings explicit demo deep link");
edit("tests/e2e/desktop-workspace-routing.spec.mjs",'  await direct.goto(playerPath);','  await direct.goto(playerHref);',"coach player direct demo deep link");
edit("tests/e2e/desktop-workspace-routing.spec.mjs",'  await direct.goto("/coach/not-a-real-route");','  await direct.goto("/coach/not-a-real-route?demo=1");',"invalid coach explicit demo route");
edit("tests/e2e/desktop-workspace-routing.spec.mjs",/  await expect\.poll\(\(\) => new URL\(page\.url\(\)\)\.pathname\)\.toBe\("\/events"\);\n\n  await page\.reload\(\);/g,'  await expect.poll(() => new URL(page.url()).pathname).toBe("/events");\n  expect(new URL(page.url()).searchParams.get("demo")).toBe("1");\n\n  await page.reload();',"player explicit demo refresh marker");

console.log("PR 1581 explicit demo deep-link closure applied");
