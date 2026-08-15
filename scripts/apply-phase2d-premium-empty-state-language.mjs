import { readFileSync, writeFileSync } from 'node:fs';

const path = 'src/components/CoachDashboardPhase2.jsx';
const source = readFileSync(path, 'utf8');

let next = source;

const replaceOnce = (before, after, label) => {
  if (next.includes(after)) return;
  const matches = next.split(before).length - 1;
  if (matches !== 1) {
    throw new Error(`[phase2d-empty-state-language] ${label} anchor expected once; found ${matches}.`);
  }
  next = next.replace(before, after);
};

const replaceFirstKnown = (pairs, label) => {
  for (const [, after] of pairs) {
    if (next.includes(after)) return;
  }
  for (const [before, after] of pairs) {
    if (next.includes(before)) {
      next = next.replace(before, after);
      return;
    }
  }
  throw new Error(`[phase2d-empty-state-language] ${label} anchor was not found in any supported enhancer state.`);
};

const cssImport = 'import "./Phase2PremiumEmptyStateLanguage.css";';
if (!next.includes(cssImport)) {
  const anchor = 'import styles from "./CoachDashboardPhase2.module.css";';
  const matches = next.split(anchor).length - 1;
  if (matches !== 1) {
    throw new Error(`[phase2d-empty-state-language] CSS import anchor expected once; found ${matches}.`);
  }
  next = next.replace(anchor, `${anchor}\n${cssImport}`);
}

const legacyEmptyState = `function EmptyState({ children }) {
  return <div className={styles.emptyState}>{children}</div>;
}`;
const firstSliceEmptyState = `function EmptyState({ children }) {
  return <div className={styles.emptyState} data-phase2-empty-state>{children}</div>;
}`;
const semanticEmptyState = `function EmptyState({ children, label = "Current state", tone = "neutral", kind = "status" }) {
  return (
    <div className={styles.emptyState} data-phase2-empty-state data-phase2-empty-tone={tone} data-phase2-empty-kind={kind}>
      <span className="phase2-empty-state-label">{label}</span>
      <span className="phase2-empty-state-message">{children}</span>
    </div>
  );
}`;

if (!next.includes(semanticEmptyState)) {
  if (next.includes(firstSliceEmptyState)) {
    next = next.replace(firstSliceEmptyState, semanticEmptyState);
  } else if (next.includes(legacyEmptyState)) {
    next = next.replace(legacyEmptyState, semanticEmptyState);
  } else {
    throw new Error('[phase2d-empty-state-language] EmptyState component anchor was not found.');
  }
}

replaceOnce(
  '      meta={model ? `${model.statusLabel} · ${model.lastActivityDate || "No activity recorded"}` : ""}',
  '      meta={model ? (model.lastActivityDate ? `${model.statusLabel} · ${model.lastActivityDate}` : model.statusLabel === "No activity yet" ? "New roster profile · Awaiting first logged session" : `${model.statusLabel} · Awaiting first logged session`) : ""}',
  'player drawer state summary',
);
replaceOnce(
  '<EmptyState>No player activity has been recorded yet.</EmptyState>',
  '<EmptyState label="Activity status" kind="activity">No player activity recorded yet.</EmptyState>',
  'player activity state',
);
replaceFirstKnown([
  [
    '<EmptyState>No confirmed players yet.</EmptyState>',
    '<EmptyState label="Response status" kind="attendance">No confirmed players yet.</EmptyState>',
  ],
  [
    "<EmptyState>No rostered players have RSVP'd yet.</EmptyState>",
    "<EmptyState label=\"Response status\" kind=\"attendance\">No rostered players have RSVP'd yet.</EmptyState>",
  ],
], 'event response state');
replaceOnce(
  '<EmptyState>Every rostered player has responded.</EmptyState>',
  '<EmptyState label="Follow-up cleared" tone="positive" kind="complete">Every rostered player has responded.</EmptyState>',
  'follow-up cleared state',
);

// The mobile secondary-page parity enhancer may already have replaced the filtered
// leaderboard empty state with a fixed three-row ranking frame during a prior build.
// Treat that normalized state as satisfying this semantic-language pass so repeated
// build -> dev enhancer execution remains idempotent.
const leaderboardParityAlreadyApplied = next.includes('data-parity-empty-slot="true"')
  && next.includes('data-leaderboard-placeholder="true"')
  && next.includes('Player activity will fill this ranking position.');
if (!leaderboardParityAlreadyApplied) {
  replaceOnce(
    '<EmptyState>No leaderboard players match the selected view.</EmptyState>',
    '<EmptyState label="Filtered view" kind="filter">No leaderboard players match the selected view.</EmptyState>',
    'leaderboard filtered state',
  );
}

replaceOnce(
  '<EmptyState>Create the first season archive to unlock current-versus-previous comparisons.</EmptyState>',
  '<EmptyState label="Season history" kind="history">Create the first season archive to unlock current-versus-previous comparisons.</EmptyState>',
  'season history state',
);

const activityBefore = `      <div className={styles.activityList} data-testid="coach-activity-intelligence-results">
        {rows.slice(0, 12).map((row) => (
          <button type="button" className={styles.activityRow} key={row.id} onClick={() => onOpenItem?.(row)}>
            <div><strong>{row.title}</strong><span>{row.type.toUpperCase()} · {row.detail}</span></div>
            <time>{row.date}</time>
          </button>
        ))}
      </div>`;
const activityAfter = `      {rows.length ? (
        <div className={styles.activityList} data-testid="coach-activity-intelligence-results">
          {rows.slice(0, 12).map((row) => (
            <button type="button" className={styles.activityRow} key={row.id} onClick={() => onOpenItem?.(row)}>
              <div><strong>{row.title}</strong><span>{row.type.toUpperCase()} · {row.detail}</span></div>
              <time>{row.date}</time>
            </button>
          ))}
        </div>
      ) : (
        <div data-testid="coach-activity-intelligence-results">
          <EmptyState label="Filtered activity" kind="filter">No team activity matches the selected view.</EmptyState>
        </div>
      )}`;

// Downstream mobile/parity enhancers are allowed to normalize the surrounding
// activity markup after this semantic state is installed. On a later build/dev
// pass, recognize the stable semantic outcome rather than requiring the exact
// pre-normalization JSX block to still be byte-for-byte present.
const activitySemanticAlreadyApplied = next.includes('label="Filtered activity" kind="filter"')
  && next.includes('No team activity matches the selected view.');
if (!activitySemanticAlreadyApplied) {
  replaceOnce(activityBefore, activityAfter, 'activity no-results state');
}

for (const required of [
  cssImport,
  'data-phase2-empty-state',
  'phase2-empty-state-label',
  'phase2-empty-state-message',
  'New roster profile · Awaiting first logged session',
  'label="Activity status" kind="activity">No player activity recorded yet.',
  'label="Response status" kind="attendance"',
  'label="Follow-up cleared" tone="positive" kind="complete"',
  'No team activity matches the selected view.',
]) {
  if (!next.includes(required)) {
    throw new Error(`[phase2d-empty-state-language] premium semantic state contract missing: ${required}`);
  }
}

if (next !== source) writeFileSync(path, next);
console.log('Applied Phase 2D premium semantic operational-state language.');
