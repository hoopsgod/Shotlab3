import { readFileSync, writeFileSync } from 'node:fs';

const appPath = 'src/components/CoachInteractiveDashboards.jsx';
let source = readFileSync(appPath, 'utf8');

const marker = 'data-testid="coach-events-supporting-intelligence"';
if (source.includes(marker)) {
  console.log('Phase 3J Coach Events hierarchy already applied.');
  process.exit(0);
}

const oldBlock = `      <SecondaryPageEvidence testId="coach-events-insight-grid">
        {briefing.insights.map((insight) => (
          <DashboardInsightCard key={insight.key} eyebrow={insight.eyebrow} title={insight.title} body={insight.body} tone={insight.tone} action={resolveEventAction(insight.action, { onStatusChange, onCreateEvent, onOpenEvent })}>
            {insight.progress ? <DashboardProgress value={insight.progress.value} max={insight.progress.max} label={insight.progress.label} detail={insight.progress.detail} /> : null}
          </DashboardInsightCard>
        ))}
      </SecondaryPageEvidence>`;

const occurrences = source.split(oldBlock).length - 1;
if (occurrences !== 1) {
  throw new Error(`Phase 3J expected exactly one Coach Events insight-grid anchor, found ${occurrences}.`);
}

const newBlock = `      <details
        className="coachEventsSupportingIntelligence"
        data-testid="coach-events-supporting-intelligence"
        open={typeof window !== "undefined" && window.innerWidth > 760}
      >
        <summary className="coachEventsSupportingSummary">
          <span className="coachEventsSupportingSummaryCopy">
            <span>Schedule insights</span>
            <strong>RSVP & calendar context</strong>
            <small>{briefing.missing} missing responses · {briefing.responseRate}% response</small>
          </span>
          <span className="coachEventsSupportingChevron" aria-hidden="true">›</span>
        </summary>
        <div className="coachEventsSupportingBody">
          <SecondaryPageEvidence testId="coach-events-insight-grid">
            {briefing.insights.map((insight) => (
              <DashboardInsightCard key={insight.key} eyebrow={insight.eyebrow} title={insight.title} body={insight.body} tone={insight.tone} action={resolveEventAction(insight.action, { onStatusChange, onCreateEvent, onOpenEvent })}>
                {insight.progress ? <DashboardProgress value={insight.progress.value} max={insight.progress.max} label={insight.progress.label} detail={insight.progress.detail} /> : null}
              </DashboardInsightCard>
            ))}
          </SecondaryPageEvidence>
        </div>
      </details>`;

source = source.replace(oldBlock, newBlock);
writeFileSync(appPath, source);
console.log('Applied Phase 3J Coach Events decision-to-agenda hierarchy.');
