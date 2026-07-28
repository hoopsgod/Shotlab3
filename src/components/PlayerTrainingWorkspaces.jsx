import { useMemo, useState } from "react";
import {
  PlayerInsightPanel,
  PlayerMetricStrip,
  PlayerOperationalList,
  PlayerWorkspaceHeader,
} from "./PlayerWorkspacePrimitives.jsx";
import styles from "./PlayerTrainingWorkspaces.module.css";

const normalizeId = (value) => String(value ?? "");
const getScoreDrillId = (score) => score?.drillId ?? score?.drill_id;
const formatNumber = (value) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Number(value) || 0);

function completionModel(drills = [], scores = [], priorityId) {
  const completedIds = new Set(scores.map(getScoreDrillId).map(normalizeId));
  const remaining = drills.filter((drill) => !completedIds.has(normalizeId(drill?.id)));
  const priority = remaining.find((drill) => normalizeId(drill?.id) === normalizeId(priorityId));
  return {
    completedIds,
    completeCount: Math.min(drills.length, completedIds.size),
    remaining,
    nextDrill: priority || remaining[0] || null,
  };
}

function TrainingProgress({ completeCount, total }) {
  const percent = total > 0 ? Math.min(100, Math.round((completeCount / total) * 100)) : 0;
  return (
    <div className={styles.progress} aria-label={`${completeCount} of ${total} drills complete`}>
      <div className={styles.progressCopy}>
        <span>Daily completion</span>
        <strong>{percent}%</strong>
      </div>
      <div className={styles.progressTrack}><span style={{ width: `${percent}%` }} /></div>
    </div>
  );
}

function DrillQueue({ drills, completedIds, onOpen }) {
  return (
    <PlayerOperationalList
      rows={drills}
      emptyTitle="Daily block complete"
      emptyDetail="Your assigned work is finished. Review your results or recover for the next session."
      renderRow={(drill, index) => {
        const complete = completedIds.has(normalizeId(drill?.id));
        return (
          <button
            type="button"
            key={drill?.id || drill?.name || index}
            className={styles.drillRow}
            onClick={() => !complete && onOpen?.(drill)}
            disabled={complete}
          >
            <span className={styles.drillIndex}>{String(index + 1).padStart(2, "0")}</span>
            <span className={styles.drillCopy}>
              <strong>{drill?.name || "Training drill"}</strong>
              <small>{complete ? "Completed today" : drill?.description || "Ready to start"}</small>
            </span>
            <span className={complete ? styles.done : styles.open}>{complete ? "Done" : "Open"}</span>
          </button>
        );
      }}
    />
  );
}

export function PlayerAtHomeWorkspace({ today, userEmail, shotLogs = [], drills = [], todayScores = [], onOpenDrill, onViewStats }) {
  const [activeMetric, setActiveMetric] = useState("remaining");
  const model = useMemo(() => completionModel(drills, todayScores), [drills, todayScores]);
  const email = String(userEmail || "").trim().toLowerCase();
  const makesToday = shotLogs
    .filter((log) => String(log?.email || log?.playerEmail || log?.player_email || "").trim().toLowerCase() === email && String(log?.date || "") === String(today || ""))
    .reduce((sum, log) => sum + (Number(log?.made) || 0), 0);

  const metrics = [
    { key: "makes", label: "Makes today", value: formatNumber(makesToday), detail: "Logged volume" },
    { key: "complete", label: "Drills done", value: `${model.completeCount}/${drills.length}`, detail: "Daily sequence" },
    { key: "remaining", label: "Remaining", value: model.remaining.length, detail: "Actions left" },
  ];

  return (
    <section className={styles.workspace} data-testid="player-at-home-workspace">
      <PlayerWorkspaceHeader
        eyebrow="Independent training"
        title="At Home Command Deck"
        subtitle="One clear next action, live progress, and fast access to the work that matters."
        status={model.nextDrill ? `Next · ${model.nextDrill.name}` : "Daily block complete"}
        actionLabel={model.nextDrill ? `Start ${model.nextDrill.name}` : undefined}
        onAction={() => model.nextDrill && onOpenDrill?.(model.nextDrill)}
      />
      <TrainingProgress completeCount={model.completeCount} total={drills.length} />
      <PlayerMetricStrip items={metrics} activeKey={activeMetric} onSelect={setActiveMetric} />
      <PlayerInsightPanel
        title={model.nextDrill ? `Best next move: ${model.nextDrill.name}` : "Training target cleared"}
        detail={model.nextDrill ? "Finish the next uncompleted drill before adding optional volume." : "Review shot intelligence and protect recovery quality."}
        actionLabel="View shot intelligence"
        onAction={onViewStats}
        tone={model.nextDrill ? "default" : "success"}
      />
      <DrillQueue drills={drills} completedIds={model.completedIds} onOpen={onOpenDrill} />
    </section>
  );
}

export function PlayerProgramWorkspace({ programDrills = [], todayProgramScores = [], nextPriorityId, onOpenDrill }) {
  const [activeMetric, setActiveMetric] = useState("priority");
  const model = useMemo(() => completionModel(programDrills, todayProgramScores, nextPriorityId), [programDrills, todayProgramScores, nextPriorityId]);
  const metrics = [
    { key: "complete", label: "Completed", value: `${model.completeCount}/${programDrills.length}`, detail: "Assigned drills" },
    { key: "priority", label: "Priority", value: model.nextDrill ? "Active" : "Clear", detail: model.nextDrill?.name || "No drill waiting" },
    { key: "impact", label: "Team impact", value: model.completeCount ? "Live" : "Pending", detail: "Leaderboard status" },
  ];

  return (
    <section className={`${styles.workspace} ${styles.program}`} data-testid="player-program-workspace">
      <PlayerWorkspaceHeader
        eyebrow="Coach-assigned work"
        title="Program Execution Board"
        subtitle="Follow the assigned sequence, protect score integrity, and move the team standard."
        status={model.nextDrill ? `Priority · ${model.nextDrill.name}` : "Program block complete"}
        actionLabel={model.nextDrill ? `Open ${model.nextDrill.name}` : undefined}
        onAction={() => model.nextDrill && onOpenDrill?.(model.nextDrill)}
      />
      <TrainingProgress completeCount={model.completeCount} total={programDrills.length} />
      <PlayerMetricStrip items={metrics} activeKey={activeMetric} onSelect={setActiveMetric} ariaLabel="Program training metrics" />
      <PlayerInsightPanel
        title={model.nextDrill ? "Coach priority is ready" : "Assigned block complete"}
        detail={model.nextDrill ? `${model.nextDrill.name} is the highest-value next action.` : "Your assigned work is current. Review results before adding extra volume."}
        tone="info"
      />
      <DrillQueue drills={programDrills} completedIds={model.completedIds} onOpen={onOpenDrill} />
    </section>
  );
}
