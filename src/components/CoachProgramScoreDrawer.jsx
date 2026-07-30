import { useEffect, useMemo, useState } from "react";
import {
  coachProgramScoreDrillOptions,
  coachProgramScorePlayerOptions,
  validateCoachProgramScoreEntry,
} from "../lib/coachProgramScoreEntry.js";
import styles from "./CoachProgramScoreDrawer.module.css";

const today = () => new Date().toISOString().slice(0, 10);

export default function CoachProgramScoreDrawer({
  open = false,
  players = [],
  drills = [],
  onClose,
  onSubmit,
}) {
  const playerOptions = useMemo(() => coachProgramScorePlayerOptions(players), [players]);
  const drillOptions = useMemo(() => coachProgramScoreDrillOptions(drills), [drills]);
  const [playerId, setPlayerId] = useState("");
  const [drillId, setDrillId] = useState("");
  const [score, setScore] = useState("");
  const [date, setDate] = useState(today);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPlayerId(playerOptions[0]?.id || "");
    setDrillId(drillOptions[0]?.id || "");
    setScore("");
    setDate(today());
    setError("");
    setSaving(false);
  }, [open, playerOptions, drillOptions]);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape" && !saving) onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, saving]);

  if (!open) return null;
  const selectedPlayer = playerOptions.find((option) => option.id === playerId)?.player;
  const selectedDrill = drillOptions.find((option) => option.id === drillId)?.drill;
  const selectedDrillHasMax = selectedDrill?.max !== null
    && selectedDrill?.max !== undefined
    && selectedDrill?.max !== ""
    && Number.isFinite(Number(selectedDrill.max));

  const submit = async (event) => {
    event.preventDefault();
    const validation = validateCoachProgramScoreEntry({
      player: selectedPlayer,
      drill: selectedDrill,
      score,
      date,
    });
    if (!validation.ok) {
      setError(validation.error);
      return;
    }
    setSaving(true);
    setError("");
    const result = await onSubmit?.({
      player: selectedPlayer,
      drillId,
      score: validation.score,
      date,
    });
    if (result?.ok) {
      onClose?.();
      return;
    }
    setSaving(false);
    setError(result?.error || result?.err?.message || "Could not save the Program result. Try again.");
  };

  const unavailable = playerOptions.length === 0 || drillOptions.length === 0;

  return (
    <div className={styles.backdrop} onMouseDown={(event) => event.target === event.currentTarget && !saving && onClose?.()}>
      <section className={styles.drawer} role="dialog" aria-modal="true" aria-labelledby="coach-program-score-title" data-testid="coach-program-score-drawer">
        <div className={styles.header}>
          <div>
            <div className={styles.eyebrow}>Coach-verified result</div>
            <h2 id="coach-program-score-title">Record Program Score</h2>
          </div>
          <button type="button" className={styles.close} onClick={onClose} disabled={saving} aria-label="Close score entry">×</button>
        </div>

        <p className={styles.guardrail}>
          Record supervised Program work only. At Home makes remain player-entered so leaderboard integrity stays intact.
        </p>

        {unavailable ? (
          <div className={styles.empty} role="status">
            {playerOptions.length === 0
              ? "Add an active roster player before recording a result."
              : "Create a Program drill before recording a result."}
          </div>
        ) : (
          <form onSubmit={submit} className={styles.form}>
            <label>
              <span>Player</span>
              <select value={playerId} onChange={(event) => { setPlayerId(event.target.value); setError(""); }} disabled={saving}>
                {playerOptions.map((option) => <option key={option.id} value={option.id}>{option.name || option.email}</option>)}
              </select>
            </label>
            <label>
              <span>Program drill</span>
              <select value={drillId} onChange={(event) => { setDrillId(event.target.value); setError(""); }} disabled={saving}>
                {drillOptions.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
              </select>
            </label>
            <div className={styles.row}>
              <label>
                <span>Score</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min={selectedDrill?.allowZeroScore === true || selectedDrill?.minScore === 0 ? "0" : "1"}
                  max={selectedDrillHasMax ? selectedDrill.max : undefined}
                  value={score}
                  onChange={(event) => { setScore(event.target.value); setError(""); }}
                  placeholder="0"
                  disabled={saving}
                  autoFocus
                />
              </label>
              <label>
                <span>Session date</span>
                <input type="date" value={date} max={today()} onChange={(event) => { setDate(event.target.value); setError(""); }} disabled={saving} />
              </label>
            </div>
            {selectedDrillHasMax ? (
              <div className={styles.limit}>Accepted range: {selectedDrill?.allowZeroScore === true || selectedDrill?.minScore === 0 ? 0 : 1}–{selectedDrill.max}</div>
            ) : null}
            {error ? <div className={styles.error} role="alert">{error}</div> : null}
            <button className={styles.submit} type="submit" disabled={saving}>
              {saving ? "Saving verified result…" : "Save verified result"}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
