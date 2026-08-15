import { readFileSync, writeFileSync } from 'node:fs';

const appPath = 'src/components/CoachInteractiveDashboards.jsx';
let source = readFileSync(appPath, 'utf8');

const marker = 'data-testid="coach-events-supporting-intelligence"';
if (source.includes(marker)) {
  console.log('Phase 3J Coach Events hierarchy already applied.');
  process.exit(0);
}

const legacyBlock = `      <SecondaryPageEvidence testId="coach-events-insight-grid">
        {briefing.insights.map((insight) => (
          <DashboardInsightCard key={insight.key} eyebrow={insight.eyebrow} title={insight.title} body={insight.body} tone={insight.tone} action={resolveEventAction(insight.action, { onStatusChange, onCreateEvent, onOpenEvent })}>
            {insight.progress ? <DashboardProgress value={insight.progress.value} max={insight.progress.max} label={insight.progress.label} detail={insight.progress.detail} /> : null}
          </DashboardInsightCard>
        ))}
      </SecondaryPageEvidence>`;

const semanticBlock = `      <SecondaryPageEvidence testId="coach-events-insight-grid">
        {briefing.insights.map((insight) => (
          <DashboardInsightCard surface="light" key={insight.key} eyebrow={insight.eyebrow} title={insight.title} body={insight.body} tone={insight.tone} action={resolveEventAction(insight.action, { onStatusChange, onCreateEvent, onOpenEvent })}>
            {insight.progress ? <DashboardProgress value={insight.progress.value} max={insight.progress.max} label={insight.progress.label} detail={insight.progress.detail} /> : null}
          </DashboardInsightCard>
        ))}
      </SecondaryPageEvidence>`;

const candidates = [semanticBlock, legacyBlock];
const matches = candidates.filter((block) => source.includes(block));
if (matches.length !== 1) {
  throw new Error(`Phase 3J expected exactly one Coach Events insight-grid anchor, found ${matches.length}.`);
}

const oldBlock = matches[0];
const insightSurface = oldBlock === semanticBlock ? ' surface="light"' : '';
const newBlock = `      <details
        className="coachEventsSupportingIntelligence"
        data-testid="coach-events-supporting-intelligence"
        open={typeof window !== "undefined" && window.innerWidth > 760}
      >
        <summary className="coachEventsSupportingSummary">
          <span className="coachEventsSupportingSummaryCopy">
            <span>Schedule insights</span>
            <strong>{briefing.responseRate}% response · {briefing.missing} missing</strong>
          </span>
          <span className="coachEventsSupportingChevron" aria-hidden="true">›</span>
        </summary>
        <div className="coachEventsSupportingBody">
          <SecondaryPageEvidence testId="coach-events-insight-grid">
            {briefing.insights.map((insight) => (
              <DashboardInsightCard${insightSurface} key={insight.key} eyebrow={insight.eyebrow} title={insight.title} body={insight.body} tone={insight.tone} action={resolveEventAction(insight.action, { onStatusChange, onCreateEvent, onOpenEvent })}>
                {insight.progress ? <DashboardProgress value={insight.progress.value} max={insight.progress.max} label={insight.progress.label} detail={insight.progress.detail} /> : null}
              </DashboardInsightCard>
            ))}
          </SecondaryPageEvidence>
        </div>
      </details>`;

source = source.replace(oldBlock, newBlock);
writeFileSync(appPath, source);
console.log('Applied Phase 3J Coach Events decision-to-agenda hierarchy.');
