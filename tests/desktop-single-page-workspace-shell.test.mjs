import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const source = await readFile("src/App.jsx", "utf8");

test("Coach workspace history is desktop-only", () => {
  assert.match(source, /const desktopCoachRoute=typeof window!=="undefined"&&window\.innerWidth>=1024/);
  assert.match(source, /readCoachRoute\(desktopCoachRoute\?window\.location\.pathname:"\/"\)/);
  assert.match(source, /if\(!isDesktop\)return;const onPopState=/);
  assert.match(source, /if\(isDesktop&&window\.location\.pathname!==nextPath\)window\.history\.pushState/);
});

test("player intelligence marks in-app history and direct deep links close safely", () => {
  assert.match(source, /buildCoachRoute\("players",key\)/);
  assert.match(source, /pushState\(\{slp:1\}/);
  assert.match(source, /history\.state\?\.slp===1/);
  assert.match(source, /history\.back\(\);return/);
  assert.match(source, /history\.replaceState\(null,"","\/coach\/players"\)/);
});

test("desktop navigation clears contextual player state while mobile keeps its existing navigation path", () => {
  assert.match(source, /setPlayerDrawerKey\(""\);setEditD\(null\);setSelP\(null\)/);
  assert.match(source, /!isDesktop&&<MobileNavigation[\s\S]*onChange=\{handleNavChange\}/);
});
