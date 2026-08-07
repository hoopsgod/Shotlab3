import { readFileSync, writeFileSync } from 'node:fs';

const panelPath = 'src/components/CoachDashboardPhase2.jsx';
let source = readFileSync(panelPath, 'utf8');

const marker = 'data-testid="coach-strength-supporting-intelligence"';
if (source.includes(marker)) {
  console.log('Phase 3K Coach S&C hierarchy already applied.');
  process.exit(0);
}

const oldBlock = `      <DashboardInsightGrid>
        <DashboardInsightCard eyebrow="Team compliance" title={\`${'${rate}'}% completion\`} body={\`${'${completions}'} completed logs from ${'${commitments}'} committed session responses.\`} tone={rate >= 75 ? "positive" : "attention"}><DashboardProgress value={rate} max={100} label="S&C compliance" /></DashboardInsightCard>
        <DashboardInsightCard eyebrow="Overdue work" title={overdue.length ? \`${'${overdue.length}'} sessions need follow-up\` : "No overdue sessions"} body={overdue.length ? "Open the overdue view to identify committed players without a completion log." : "Current commitments and completion records are aligned."} tone={overdue.length ? "attention" : "positive"} action={overdue.length ? { label: "Show Overdue", onClick: () => onScopeChange("overdue") } : undefined} />
        <DashboardInsightCard eyebrow="Next session" title={rows.find((row) => row.statusKey === "upcoming")?.title || "No upcoming session"} body={rows.find((row) => row.statusKey === "upcoming") ? \`${'${rows.find((row) => row.statusKey === "upcoming").date}'} · ${'${rows.find((row) => row.statusKey === "upcoming").time}'}\` : "Add the next S&C session to restore the compliance cadence."} tone="info" action={rows.find((row) => row.statusKey === "upcoming") && onOpenSession ? { label: "Open Session", onClick: () => onOpenSession(rows.find((row) => row.statusKey === "upcoming").session) } : undefined} />
      </DashboardInsightGrid>`;

const occurrences = source.split(oldBlock).length - 1;
if (occurrences !== 1) {
  throw new Error(`Phase 3K expected exactly one Coach S&C insight-grid anchor, found ${occurrences}.`);
}

const newBlock = `      <details
        className="coachStrengthSupportingIntelligence"
        data-testid="coach-strength-supporting-intelligence"
        open={typeof window !== "undefined" && window.innerWidth > 760}
      >
        <summary className="coachStrengthSupportingSummary">
          <span className="coachStrengthSupportingSummaryCopy">
            <span>Compliance insights</span>
            <strong>Readiness & follow-up</strong>
            <small>{rate}% completion · {overdue.length} overdue</small>
          </span>
          <span className="coachStrengthSupportingChevron" aria-hidden="true">›</span>
        </summary>
        <div className="coachStrengthSupportingBody">
          <DashboardInsightGrid testId="coach-strength-insight-grid">
            <DashboardInsightCard eyebrow="Team compliance" title={\`${'${rate}'}% completion\`} body={\`${'${completions}'} completed logs from ${'${commitments}'} committed session responses.\`} tone={rate >= 75 ? "positive" : "attention"}><DashboardProgress value={rate} max={100} label="S&C compliance" /></DashboardInsightCard>
            <DashboardInsightCard eyebrow="Overdue work" title={overdue.length ? \`${'${overdue.length}'} sessions need follow-up\` : "No overdue sessions"} body={overdue.length ? "Open the overdue view to identify committed players without a completion log." : "Current commitments and completion records are aligned."} tone={overdue.length ? "attention" : "positive"} action={overdue.length ? { label: "Show Overdue", onClick: () => onScopeChange("overdue") } : undefined} />
            <DashboardInsightCard eyebrow="Next session" title={rows.find((row) => row.statusKey === "upcoming")?.title || "No upcoming session"} body={rows.find((row) => row.statusKey === "upcoming") ? \`${'${rows.find((row) => row.statusKey === "upcoming").date}'} · ${'${rows.find((row) => row.statusKey === "upcoming").time}'}\` : "Add the next S&C session to restore the compliance cadence."} tone="info" action={rows.find((row) => row.statusKey === "upcoming") && onOpenSession ? { label: "Open Session", onClick: () => onOpenSession(rows.find((row) => row.statusKey === "upcoming").session) } : undefined} />
          </DashboardInsightGrid>
        </div>
      </details>`;

source = source.replace(oldBlock, newBlock);
writeFileSync(panelPath, source);
console.log('Applied Phase 3K Coach S&C decision-to-session hierarchy.');
