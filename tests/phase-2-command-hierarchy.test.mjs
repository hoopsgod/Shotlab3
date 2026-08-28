import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const read=p=>fs.readFileSync(new URL(p,import.meta.url),"utf8");
const main=read("../src/main.jsx"),authenticatedAuthority=read("../src/styles/AuthenticatedVisualAuthority2026.css"),player=read("../src/components/PlayerDailyCommandCenter.jsx"),playerCss=read("../src/components/PlayerDailyCommandCenter.module.css"),narrative=read("../src/lib/playerPerformanceNarrative.js"),hierarchy=read("../src/styles/CommandHierarchy2026.css"),rail=read("../src/components/OperationalInsightRail.jsx"),railCss=read("../src/components/OperationalInsightRail.module.css"),railModel=read("../src/lib/operationalInsightRails.js"),coach=read("../src/components/CoachCommandCenter.jsx"),activation=read("../src/components/CoachActivationPath.css"),session=read("../public/shotlab-v15-session-integrity.css");

test("Phase 2 hierarchy contracts remain intact beneath the Dashboard Showstopper successor",()=>{
 const app=main.indexOf("await import('./App.jsx')"),authority=main.indexOf("await import('./styles/AuthenticatedVisualAuthority2026.css')"),foundation=authenticatedAuthority.indexOf("./VisualFoundation2026.css"),command=authenticatedAuthority.indexOf("./CommandHierarchy2026.css");
 assert.ok(app>=0&&authority>app);
 assert.ok(foundation>=0&&command>foundation);
 const order=['data-command-role="primary"','data-testid="player-command-evidence"','data-command-role="coach-priority"','data-command-role="next-actions"','data-command-role="progress-details"'].map(v=>player.indexOf(v));
 assert.ok(order.every((v,i)=>v>=0&&(i===0||v>order[i-1])));
 for(const value of ['data-testid="player-progress-disclosure"','className="playerProgressDisclosure"','Progress snapshot','View details','data-layout-role="primary-decision"','data-layout-role="supporting-evidence"','data-layout-role="quiet-secondary"','aria-label="Weekly progress and momentum"']) assert.ok(player.includes(value));
 assert.ok(player.includes('data-phase="dashboard-showstopper-phase-2"'));
 assert.ok(player.includes('player-daily-performance-court'));
 assert.ok(hierarchy.includes('[data-testid="player-daily-command-center"][data-phase="phase-2-command-hierarchy"] [data-testid="player-command-evidence"]'));
 assert.ok(hierarchy.includes('grid-template-columns: repeat(3, minmax(0, 1fr))'));
 assert.ok(hierarchy.includes('[data-command-role="primary"]'));
 assert.ok(hierarchy.includes('.playerProgressDisclosure > summary:focus-visible'));
 assert.ok(hierarchy.includes('@media (prefers-reduced-motion: reduce)'));
});

test("Phase 2 control and insight hierarchy survives Phase 4 identity",()=>{
 assert.ok(session.includes(':is(p,small){color:#b8c0ba!important;-webkit-text-fill-color:currentColor!important}'));
 assert.ok(!session.includes(':is(p,small,span){color:#b8c0ba!important'));
 assert.match(playerCss,/\.primaryButton[\s\S]*-webkit-text-fill-color:\s*currentColor;/);
 assert.match(playerCss,/\.primaryButton > \*[\s\S]*color:\s*inherit;[\s\S]*-webkit-text-fill-color:\s*currentColor;/);
 assert.ok(rail.includes('data-density="decision-first"'));
 assert.ok(rail.includes('data-rail-role={index === 0 ? "primary" : "supporting"}'));
 assert.match(railCss,/\.card\s*\{[\s\S]*background:\s*#fffefd[\s\S]*box-shadow:\s*0 5px 15px/);
 assert.match(railCss,/\.card h3\s*\{[\s\S]*color: #172019/);
 assert.match(railCss,/\.card p\s*\{[\s\S]*color: #5f6962/);
 assert.match(railCss,/\.primaryCard\s*\{[\s\S]*linear-gradient\(145deg,\s*var\(--team-brand-surface-elevated,\s*#0b2633\),\s*var\(--team-brand-surface-deep,\s*#071820\)\s*72%\)/);
 assert.doesNotMatch(railCss,/linear-gradient\(145deg,\s*#0b2633,\s*#071820\)/);
 assert.match(railCss,/\.primaryCard h3\s*\{[\s\S]*#f6f8f9/);
});

test("Phase 2 copy and coach-primary contracts remain intact",()=>{
 assert.ok(narrative.includes('Daily work banked.'));
 for(const value of ['title: "Daily brief"','"1 RSVP needs a response"','at-home makes logged']) assert.ok(railModel.includes(value));
 assert.ok(!railModel.includes('verified At Home makes'));
 for(const value of ['data-home-hierarchy="decision-first"','data-testid="coach-primary-objective" data-home-role="primary"','data-testid="coach-onboarding-state" data-home-role="supporting"']) assert.ok(coach.includes(value));
 assert.ok(!session.includes('[data-testid="coach-onboarding-state"]'));
 assert.match(activation,/\.mcActivationPlan\s*\{[\s\S]*linear-gradient/);
 assert.match(activation,/\.mcActivationPlan \.mcTodayPlanCopy strong\s*\{[\s\S]*color:#fff/);
});