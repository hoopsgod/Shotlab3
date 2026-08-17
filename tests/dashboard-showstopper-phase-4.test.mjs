import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read=(path)=>readFileSync(new URL(`../${path}`,import.meta.url),"utf8");
const header=read("src/components/PlayerTrainingSessionHeader.jsx");
const headerCss=read("src/components/PlayerTrainingSessionHeader.module.css");
const completion=read("src/components/PlayerTrainingCompletion.jsx");
const completionCss=read("src/components/PlayerTrainingCompletion.module.css");
const closeout=read("src/components/PlayerSessionCloseout.jsx");
const closeoutCss=read("src/components/PlayerSessionCloseout.module.css");
const home=read("src/components/PlayerDailyCommandCenter.jsx");
const progress=read("src/components/PlayerProgressStory.jsx");
const court=read("src/components/PlayerDailyPrimitives.jsx");
const visual=read("src/lib/shotlabPerformanceVisual.js");
const budget=JSON.parse(read("performance-budget.json"));
const pkg=JSON.parse(read("package.json"));

test("Phase 4 keeps the proprietary Target Court as the shared Player performance language",()=>{
  for(const source of [home,progress,header,completion,closeout]) assert.match(source,/ShotLabPerformanceCourt/);
  for(const source of [header,completion,closeout]) assert.match(source,/data-performance-language="shotlab-target-court"/);
  assert.match(court,/data-performance-visual="shotlab-target-court"/);
  assert.match(court,/data-performance-layer="above-target-value"/);
  assert.match(court,/data-performance-layer="target-lock"/);
});

test("Target Court owns contextual accessibility and state derivation",()=>{
  assert.match(court,/getShotLabTargetVisual/);
  assert.match(court,/deriveShotLabPerformanceVisual\(\{ value, target: max \}\)/);
  assert.match(court,/contextualCourtLabel/);
  for(const source of [header,completion,closeout]) assert.match(source,/contextLabel="on this drill"/);
  assert.match(court,/role="img"/);
  assert.match(court,/aria-label=\{visual\.accessibleLabel\}/);
  assert.doesNotMatch(completion,/deriveShotLabPerformanceVisual/);
});

test("live training removes generic progress bars and carries deterministic target state",()=>{
  assert.match(header,/player-training-live-target/);
  assert.match(header,/TARGET LOCKED/);
  assert.match(header,/BANKED/);
  assert.doesNotMatch(header,/styles\.progressTrack|styles\.scoreProgress/);
  assert.doesNotMatch(headerCss,/\.progressTrack|\.scoreProgress/);
  assert.match(headerCss,/\.back\s*\{[\s\S]*?width:\s*4[4-9]px;[\s\S]*?height:\s*4[4-9]px;/);
});

test("completion answers result, meaning, and next action without generic success UI",()=>{
  for(const seam of ["RESULT LOGGED","WHAT CHANGED","DRILL TARGET","TARGET COURT","player-training-target-interpretation","NEXT MOVE","player-training-next-action","player-training-finish-session"]) assert.ok(completion.includes(seam));
  assert.match(completionCss,/\.finishSession\{[\s\S]*?min-height:44px/);
  assert.match(completionCss,/prefers-reduced-motion:reduce/);
});

test("session closeout is editorial performance proof rather than a tile dashboard",()=>{
  for(const seam of ["SESSION COMPLETE","PERFORMANCE PROOF","NEXT COMMITMENT","player-session-closeout-target-visual","proofRail"]) assert.ok(closeout.includes(seam));
  assert.doesNotMatch(closeout,/planProgress/);
  assert.doesNotMatch(closeoutCss,/\.planProgress|\.metrics\s*>\s*div/);
  assert.match(closeoutCss,/\.primary\s*\{[\s\S]*?min-height:\s*50px/);
  assert.match(closeoutCss,/\.actions button\s*\{[\s\S]*?min-height:\s*44px/);
});

test("0 25 85 100 and 125 retain deterministic and distinct target meaning",()=>{
  for(const state of ["zero","partial","near","complete","above"]) assert.match(visual,new RegExp(`state\\s*=\\s*"${state}"`));
  assert.match(visual,/aboveTarget/);
  assert.match(court,/\+\$\{Math\.round\(visual\.aboveTarget\)\} banked/);
});

test("Phase 4 does not raise production bundle budgets or add UI libraries",()=>{
  assert.equal(budget.maxTotalCssGzipBytes,88000);
  assert.equal(budget.maxTotalJavaScriptGzipBytes,365000);
  for(const name of ["framer-motion","chart.js","@fortawesome/react-fontawesome","lucide-react"]) assert.equal(pkg.dependencies[name],undefined);
});
