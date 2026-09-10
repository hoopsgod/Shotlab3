import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const coachCss = fs.readFileSync('src/styles/CoachInteractiveDashboard.css', 'utf8');
const secondaryMobileCss = fs.readFileSync('src/components/SecondaryPagePremiumMobile.css', 'utf8');
const eventsCss = fs.readFileSync('src/components/CoachEventsPremium.css', 'utf8');
const evidenceClosure = fs.readFileSync('src/lib/phase1EvidenceClosure.js', 'utf8');
const routeCss = fs.readFileSync('src/components/CoachRoutePerformanceStage.module.css', 'utf8');
const authCss = fs.readFileSync('public/shotlab-v12-auth-demo-entry.css', 'utf8');
const assignment = fs.readFileSync('src/lib/coachAssignmentAccountabilityEnhancer.js', 'utf8');
const reboot = fs.readFileSync('src/lib/visualSystemReboot.js', 'utf8');

function channel(value) {
  const v = value / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}
function luminance(hex) {
  const values = hex.match(/[a-f0-9]{2}/gi).map((part) => parseInt(part, 16));
  return 0.2126 * channel(values[0]) + 0.7152 * channel(values[1]) + 0.0722 * channel(values[2]);
}
function contrast(a, b) {
  const left = luminance(a); const right = luminance(b);
  return (Math.max(left, right) + 0.05) / (Math.min(left, right) + 0.05);
}

test('mobile sign-in controls share a bounded full-width geometry', () => {
  assert.match(authCss, /auth-card-enter input\{width:100%!important;max-width:100%!important;box-sizing:border-box!important\}/);
  assert.match(authCss, /auth-card-enter>\.cta-primary\{width:100%!important;max-width:100%!important;margin-inline:0!important;box-sizing:border-box!important\}/);
});

test('Players keeps search full-width and wraps filters instead of scrolling the page-level rail', () => {
  assert.match(coachCss, /coach-players-filter-rail"\]\{overflow:visible\}/);
  assert.match(coachCss, /coach-players-filter-rail"\]>div\[role="group"\]\{width:100%;flex-wrap:wrap;overflow-x:visible/);
  assert.doesNotMatch(coachCss, /coach-players-filter-rail"\]\{overflow-x:auto/);
  assert.match(secondaryMobileCss, /filter-rail"\]:not\(\[data-testid="coach-players-filter-rail"\]\):not\(\[data-testid="coach-events-filter-rail"\]\)\s*\{\s*display:\s*flex !important/);
  assert.doesNotMatch(secondaryMobileCss, /filter-rail"\]:not\(\[data-testid="coach-events-filter-rail"\]\)\s*\{\s*display:\s*flex !important/);
  assert.match(secondaryMobileCss, /\[data-testid="coach-players-filter-rail"\] > label\s*\{[\s\S]*?width:\s*100% !important;[\s\S]*?max-width:\s*100% !important;[\s\S]*?box-sizing:\s*border-box !important/);
  assert.match(secondaryMobileCss, /\[data-testid="coach-players-filter-rail"\] input\[type="search"\]\s*\{[\s\S]*?padding-inline:\s*0 !important;[\s\S]*?box-sizing:\s*border-box !important/);
});

test('Schedule retains its one-column mobile filter composition and AA placeholder contrast', () => {
  assert.match(eventsCss, /coach-events-filter-rail"\]\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\) !important/);
  assert.match(eventsCss, /input::placeholder\s*\{[\s\S]*?color:\s*#59636a !important/);
  assert.match(evidenceClosure, /coach-events-filter-rail[^\n]*input::placeholder\{color:#59636a!important;-webkit-text-fill-color:#59636a!important;opacity:1!important\}/);
  assert.match(evidenceClosure, /getElementById\(STYLE_ID\) \|\| Object\.assign\(document\.createElement\("style"\), \{ id: STYLE_ID \}\)/);
  assert.doesNotMatch(evidenceClosure, /if \(!style\) return false/);
  assert.match(evidenceClosure, /if \(!style\.textContent\.includes\(SCHEDULE_PLACEHOLDER_MARKER\)\) style\.textContent \+= `\\n\$\{SCHEDULE_PLACEHOLDER_CSS\}\\n`/);
  assert.ok(contrast('#59636a', '#ffffff') >= 4.5);
});

test('Coach cream-surface supporting copy meets WCAG AA normal-text contrast', () => {
  assert.ok(contrast('#636d67', '#f4f0e7') >= 4.5);
  assert.match(coachCss, /summary"\]\{max-width:60ch;color:#636d67\}/);
  assert.match(coachCss, /coachDashboardNoResults[^}]*color:#636d67/);
});

test('Drill performance evidence wraps instead of ellipsizing at tiny text sizes', () => {
  assert.match(routeCss, /\.metricLabel\s*\{[\s\S]*?font:\s*700 10px\/1\.2[\s\S]*?white-space:\s*normal[\s\S]*?overflow:\s*visible/);
  assert.match(routeCss, /\.metricDetail\s*\{[\s\S]*?font:\s*510 11px\/1\.3[\s\S]*?white-space:\s*normal[\s\S]*?overflow:\s*visible/);
});

test('assignment status uses one five-column authority and a balanced 2+3 phone grid', () => {
  assert.match(assignment, /mcAssignmentStateFacts\{display:grid;grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/);
  assert.match(assignment, /@media\(max-width:420px\)[\s\S]*?grid-template-columns:repeat\(6,minmax\(0,1fr\)\)[\s\S]*?mcAssignmentStateFact\{grid-column:span 3\}[\s\S]*?nth-child\(n\+3\)\{grid-column:span 2\}/);
  assert.match(assignment, /mcAssignmentStateFact small[^}]*font-size:9px/);
  assert.doesNotMatch(reboot, /mcAssignmentStateFacts\s*\{[^}]*grid-template-columns:\s*repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(reboot, /@media \(max-width: 760px\)[\s\S]*?mcAssignmentStateFacts\s*\{[\s\S]*?repeat\(5,minmax\(0,1fr\)\)/);
  assert.match(reboot, /@media \(max-width: 420px\)[\s\S]*?mcAssignmentStateFacts\s*\{[\s\S]*?repeat\(6,minmax\(0,1fr\)\)[\s\S]*?mcAssignmentStateFact\s*\{[\s\S]*?grid-column:\s*span 3 !important[\s\S]*?nth-child\(n\+3\)[\s\S]*?grid-column:\s*span 2 !important/);
});
