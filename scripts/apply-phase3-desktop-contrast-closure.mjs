import { readFileSync, writeFileSync } from "node:fs";

const replaceOnce = (source, before, after, label) => {
  const first = source.indexOf(before);
  if (first < 0 || source.indexOf(before, first + before.length) >= 0) throw new Error(`${label}: expected exactly one seam`);
  return source.replace(before, after);
};

const cssPath = "src/components/CoachMissionControlV2.css";
let css = readFileSync(cssPath, "utf8");
css = replaceOnce(
  css,
  ".mcHero h1{max-width:610px;margin:12px 0 0;font-family:'Bebas Neue','Impact',sans-serif;font-size:50px;line-height:.96;letter-spacing:.012em;text-transform:uppercase}",
  ".mcHero h1{margin:12px 0 0;color:#f4f7f8;font-family:'Bebas Neue','Impact',sans-serif;font-size:50px;line-height:.96;text-transform:uppercase}",
  "desktop Coach hero title contrast",
);
css = replaceOnce(
  css,
  ".mcEyebrow{display:inline-flex;",
  ".mcHero .mcProgramIdentity{color:#f4f7f8}\n.mcEyebrow{display:inline-flex;",
  "desktop Coach program identity contrast",
);
writeFileSync(cssPath, css);

const testPath = "tests/coach-command-center-10x.test.mjs";
let tests = readFileSync(testPath, "utf8");
tests = replaceOnce(
  tests,
  "  assert.match(css,/grid-template-columns:112px minmax\\(0,1fr\\)/);",
  "  assert.match(css,/grid-template-columns:112px minmax\\(0,1fr\\)/);\n  assert.match(css,/\\.mcHero h1\\{[^}]*color:#f4f7f8/);\n  assert.match(css,/\\.mcHero \\.mcProgramIdentity\\{color:#f4f7f8\\}/);",
  "desktop Coach contrast contract",
);
writeFileSync(testPath, tests);
