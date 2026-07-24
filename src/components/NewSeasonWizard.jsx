import { useMemo, useState } from "react";
import { ROLLOVER_PLAYER_STATUSES, stablePlayerIdentity } from "../lib/seasonRollover.js";
import { createNewSeason } from "../lib/seasonRolloverService.js";

const toArray = (value) => (Array.isArray(value) ? value : []);
const archiveRoster = (archive = {}) => toArray(archive.rosterSnapshot || archive.roster_snapshot || archive.snapshot?.roster);
const archiveDrills = (archive = {}) => toArray(archive.programDrillSnapshot || archive.program_drill_snapshot || archive.snapshot?.programDrills);
const archiveEvents = (archive = {}) => toArray(archive.eventSnapshot || archive.event_snapshot || archive.snapshot?.events);
const archiveStrength = (archive = {}) => toArray(archive.scSessionSnapshot || archive.sc_session_snapshot || archive.snapshot?.scSessions);
const rowId = (row = {}) => String(row.id || row.drillId || row.drill_id || row.templateId || row.template_id || "").trim();
const rowLabel = (row = {}, fallback = "Item") => row.name || row.title || row.drillName || row.sessionType || fallback;
const makeTransitionId = () => globalThis.crypto?.randomUUID?.() || `rollover-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const styles = {
  shell: { border: "1px solid var(--stroke-1, #333)", borderRadius: 18, padding: 16, background: "var(--surface-1, #151515)", color: "var(--text-1, #fff)" },
  eyebrow: { fontSize: 10, fontWeight: 800, letterSpacing: ".12em", color: "var(--accent, #c8ff00)", textTransform: "uppercase" },
  title: { fontSize: 24, lineHeight: 1.05, margin: "6px 0" },
  copy: { fontSize: 12, lineHeight: 1.5, color: "var(--text-3, #aaa)" },
  grid: { display: "grid", gap: 10, marginTop: 14 },
  input: { width: "100%", minHeight: 44, borderRadius: 10, border: "1px solid var(--stroke-1, #333)", background: "var(--surface-0, #0b0b0b)", color: "inherit", padding: "10px 12px", boxSizing: "border-box" },
  row: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, border: "1px solid var(--stroke-1, #333)", borderRadius: 12, padding: 11 },
  button: { minHeight: 44, borderRadius: 11, border: 0, padding: "0 14px", fontWeight: 800, cursor: "pointer" },
};

function CheckList({ rows, selected, onToggle, empty }) {
  if (!rows.length) return <div style={styles.copy}>{empty}</div>;
  return <div style={styles.grid}>{rows.map((row, index) => {
    const id = rowId(row) || `row-${index}`;
    return <label key={id} style={styles.row}>
      <span>{rowLabel(row)}</span>
      <input type="checkbox" checked={selected.includes(id)} onChange={() => onToggle(id)} />
    </label>;
  })}</div>;
}

export default function NewSeasonWizard({
  coach,
  teamId,
  seasonArchives = [],
  existingActiveSeasons = [],
  onCreated,
  persistPlan,
  fetchImpl,
}) {
  const [step, setStep] = useState(0);
  const [archiveId, setArchiveId] = useState("");
  const [seasonName, setSeasonName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [playerSelections, setPlayerSelections] = useState({});
  const [drills, setDrills] = useState([]);
  const [events, setEvents] = useState([]);
  const [strength, setStrength] = useState([]);
  const [transitionId, setTransitionId] = useState(makeTransitionId);
  const [status, setStatus] = useState({ state: "idle", message: "" });

  const archives = useMemo(() => toArray(seasonArchives).filter((row) => String(row.teamId || row.team_id) === String(teamId || "")), [seasonArchives, teamId]);
  const sourceArchive = archives.find((row) => String(row.id) === archiveId) || null;
  const players = useMemo(() => archiveRoster(sourceArchive).map((player) => ({ ...player, identity: stablePlayerIdentity(player) })).filter((player) => player.identity), [sourceArchive]);

  const toggle = (setter) => (id) => setter((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  const selectArchive = (id) => {
    setArchiveId(id);
    setPlayerSelections({});
    setDrills([]);
    setEvents([]);
    setStrength([]);
  };
  const setPlayer = (identity, value) => setPlayerSelections((current) => ({ ...current, [identity]: value }));
  const returningCount = Object.values(playerSelections).filter((value) => value === ROLLOVER_PLAYER_STATUSES.RETURNING).length;

  const submit = async () => {
    if (status.state === "saving") return;
    setStatus({ state: "saving", message: "Creating new season…" });
    const result = await createNewSeason({
      coach,
      teamId,
      sourceArchive,
      seasonName,
      seasonStartDate: startDate,
      projectedEndDate: endDate,
      playerSelections,
      selectedProgramDrillIds: drills,
      selectedEventTemplateIds: events,
      selectedStrengthTemplateIds: strength,
      existingActiveSeasons,
      transitionId,
      persistPlan,
      fetchImpl,
    });
    if (!result?.ok) {
      setStatus({ state: "error", message: result?.error || "The season could not be created." });
      return;
    }
    setStatus({ state: "success", message: result.idempotent ? "This season was already created safely." : "New season created. Historical results were not copied." });
    onCreated?.(result);
  };

  const canContinue = [Boolean(sourceArchive), Boolean(seasonName.trim() && startDate), true, true][step];
  const headings = ["Choose archive", "Season details", "Returning players", "Reusable setup"];

  return <section style={styles.shell} data-testid="new-season-wizard" aria-labelledby="new-season-wizard-title">
    <div style={styles.eyebrow}>Season management · Step {step + 1} of 4</div>
    <h2 id="new-season-wizard-title" style={styles.title}>Start a New Season</h2>
    <p style={styles.copy}>Build the next active season from a frozen archive. Scores, attendance, RSVPs, streaks, and completed sessions always start at zero.</p>
    <div role="status" aria-live="polite" style={{ ...styles.copy, marginTop: 8 }}>{status.message}</div>

    <div style={{ marginTop: 16 }}>
      <h3 style={{ margin: 0, fontSize: 17 }}>{headings[step]}</h3>
      {step === 0 && <div style={styles.grid}>
        {archives.length === 0 ? <div style={styles.copy}>Archive a completed season before starting the next one.</div> : archives.map((archive) => <label key={archive.id} style={{ ...styles.row, borderColor: archiveId === archive.id ? "var(--accent, #c8ff00)" : "var(--stroke-1, #333)" }}>
          <span><strong>{archive.seasonName || "Archived season"}</strong><br/><small style={styles.copy}>{archive.seasonStartDate} — {archive.seasonEndDate}</small></span>
          <input type="radio" name="source-archive" value={archive.id} checked={archiveId === archive.id} onChange={() => selectArchive(String(archive.id))} />
        </label>)}
      </div>}

      {step === 1 && <div style={styles.grid}>
        <label>Season name<input data-testid="new-season-name" style={styles.input} value={seasonName} onChange={(event) => setSeasonName(event.target.value)} placeholder="Summer 2027" /></label>
        <label>Start date<input data-testid="new-season-start" style={styles.input} type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label>
        <label>Projected end date <span style={styles.copy}>(optional)</span><input style={styles.input} type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} /></label>
      </div>}

      {step === 2 && <div style={styles.grid}>
        <div style={styles.copy}>Every player defaults to Not Returning. Choose Returning only for players who should enter the new active roster.</div>
        {players.map((player) => <div key={player.identity} style={styles.row}>
          <div><strong>{player.name || player.email || "Player"}</strong><div style={styles.copy}>{player.email || player.identity}</div></div>
          <select aria-label={`Status for ${player.name || player.email || player.identity}`} style={{ ...styles.input, width: "auto" }} value={playerSelections[player.identity] || ROLLOVER_PLAYER_STATUSES.NOT_RETURNING} onChange={(event) => setPlayer(player.identity, event.target.value)}>
            <option value={ROLLOVER_PLAYER_STATUSES.NOT_RETURNING}>Not Returning</option>
            <option value={ROLLOVER_PLAYER_STATUSES.RETURNING}>Returning</option>
            <option value={ROLLOVER_PLAYER_STATUSES.GRADUATED}>Graduated</option>
          </select>
        </div>)}
      </div>}

      {step === 3 && <div style={styles.grid}>
        <div><strong>Program drills</strong><CheckList rows={archiveDrills(sourceArchive)} selected={drills} onToggle={toggle(setDrills)} empty="No archived program drills." /></div>
        <div><strong>Event templates</strong><CheckList rows={archiveEvents(sourceArchive)} selected={events} onToggle={toggle(setEvents)} empty="No archived events to use as templates." /></div>
        <div><strong>S&C templates</strong><CheckList rows={archiveStrength(sourceArchive)} selected={strength} onToggle={toggle(setStrength)} empty="No archived S&C sessions to use as templates." /></div>
        <div style={{ ...styles.row, display: "block" }}>
          <strong>Review</strong>
          <div style={{ ...styles.copy, marginTop: 6 }}>{seasonName || "Unnamed season"} · {startDate || "No start date"} · {returningCount} returning player{returningCount === 1 ? "" : "s"}</div>
          <div style={{ ...styles.copy, marginTop: 4 }}>Historical results copied: No</div>
        </div>
      </div>}
    </div>

    <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
      {step > 0 && <button type="button" style={{ ...styles.button, flex: 1, background: "transparent", color: "inherit", border: "1px solid var(--stroke-1, #333)" }} onClick={() => setStep((value) => value - 1)}>Back</button>}
      {step < 3 ? <button type="button" style={{ ...styles.button, flex: 1, background: "var(--accent, #c8ff00)", color: "#0b0b0b", opacity: canContinue ? 1 : .5 }} disabled={!canContinue} onClick={() => setStep((value) => value + 1)}>Continue</button>
        : <button data-testid="create-new-season" type="button" style={{ ...styles.button, flex: 1, background: "var(--accent, #c8ff00)", color: "#0b0b0b" }} disabled={status.state === "saving"} onClick={submit}>{status.state === "saving" ? "Creating…" : "Create Season"}</button>}
    </div>
    {status.state === "error" && <button type="button" style={{ ...styles.button, marginTop: 10, width: "100%", background: "transparent", color: "inherit", border: "1px solid var(--stroke-1, #333)" }} onClick={() => { setTransitionId(makeTransitionId()); setStatus({ state: "idle", message: "" }); }}>Reset attempt</button>}
  </section>;
}
