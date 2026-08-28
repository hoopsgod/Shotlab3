import { useEffect, useMemo, useState } from "react";
import {
  buildAllTimeProgramLeaderboardRows,
  buildCurrentOffseasonProgramLeaderboardRows,
} from "../lib/seasonLeaderboardAnalytics.js";
import { createGameStatPersistenceService } from "../lib/gameStatPersistenceService.js";
import { formatStatValue } from "../lib/gameStatAnalytics.js";
import "./InSeasonPerformanceHub.css";

const MAX_CUSTOM_IN_SEASON_DRILLS = 30;
const TODAY = () => new Date().toISOString().slice(0, 10);
const clean = (value) => String(value ?? "").trim();
const lower = (value) => clean(value).toLowerCase();
const finite = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};
const drillId = (drill = {}) => String(drill?.id ?? drill?.drill_id ?? drill?.drillId ?? "");
const drillMax = (drill = {}) => finite(drill?.max ?? drill?.maxScore ?? drill?.max_score);
const isDefaultDrill = (drill = {}) => drill?.isDefaultDemo === true;
const scoreUnit = (drill = {}) => clean(drill?.scoreUnit ?? drill?.score_unit) || "points";
const drillScope = (drill = {}) => clean(drill?.drillScope ?? drill?.drill_scope).toLowerCase() === "team" ? "team" : "individual";
const playerIdentity = (row = {}) => lower(row?.email ?? row?.player_email) || lower(row?.playerId ?? row?.player_id ?? row?.id);

function humanizeError(error) {
  const code = String(error?.code || error?.message || "").toLowerCase();
  if (code.includes("rate_limited")) return "Too many requests. Try again in a moment.";
  if (code.includes("coach_write_required") || code.includes("forbidden")) return "Coach authorization is required for this action.";
  if (code.includes("csv_roster_resolution_required")) return "Resolve every unmatched or ambiguous player before importing.";
  if (code.includes("player_identity_column_required")) return "The CSV needs a player name, email, or jersey-number column.";
  if (code.includes("game_date_column_required")) return "Game-by-game imports need a game-date column.";
  if (code.includes("numeric_stat_columns_required")) return "No usable numeric stat columns were detected.";
  if (code.includes("csv_too_large")) return "This CSV is too large. Split it into smaller exports and try again.";
  if (code.includes("game_stat_load_failed")) return "Game stats could not be loaded. Check the connection and try again.";
  return "That action could not be completed. Check the data and try again.";
}

function RankList({ title, eyebrow, rows = [], empty, unit = "points", currentUser = "", valueFormatter }) {
  const formatter = valueFormatter || ((value) => `${value} ${unit}`);
  return <section className="inSeasonBoard" aria-label={title}>
    <header className="inSeasonSectionHeader">
      <div><span>{eyebrow}</span><h3>{title}</h3></div>
      <small>{rows.length ? `${rows.length} ranked` : "No results"}</small>
    </header>
    {rows.length === 0 ? <p className="inSeasonEmpty">{empty}</p> : <ol className="inSeasonRankList">
      {rows.map((row, index) => {
        const key = row?.playerId || row?.player_id || row?.email || `${row?.name}-${index}`;
        const isMe = currentUser && playerIdentity(row) === lower(currentUser);
        const value = row?.value ?? row?.score ?? row?.best ?? row?.total ?? 0;
        return <li key={key} className={isMe ? "is-me" : ""}>
          <span className="inSeasonRank">{row?.rank || index + 1}</span>
          <span className="inSeasonRankIdentity"><strong>{row?.name || row?.displayName || row?.email || "Player"}</strong>{isMe && <em>You</em>}</span>
          <span className="inSeasonRankValue">{formatter(value)}</span>
        </li>;
      })}
    </ol>}
  </section>;
}

function MetricSelector({ metrics = [], value, onChange }) {
  if (!metrics.length) return null;
  return <label className="inSeasonMetricSelect">
    <span>Stat leaderboard</span>
    <select value={value} onChange={(event) => onChange(event.target.value)}>
      {metrics.map((metric) => <option value={metric.key} key={metric.key}>{metric.label}</option>)}
    </select>
  </label>;
}

function DrillEditor({ drill = null, onCancel, onSave, busy = false }) {
  const [draft, setDraft] = useState(() => ({
    name: clean(drill?.name),
    desc: clean(drill?.desc ?? drill?.description),
    instructions: clean(drill?.instructions),
    max: drillMax(drill) ?? "",
    scope: drillScope(drill),
    unit: scoreUnit(drill),
  }));
  const [error, setError] = useState("");
  const set = (key) => (event) => setDraft((value) => ({ ...value, [key]: event.target.value }));
  const submit = async (event) => {
    event.preventDefault();
    const max = finite(draft.max);
    if (!clean(draft.name)) return setError("Enter a drill name.");
    if (max !== null && max < 0) return setError("Max score must be zero or higher.");
    setError("");
    const result = await onSave({
      name: clean(draft.name),
      desc: clean(draft.desc),
      instructions: clean(draft.instructions),
      max: max === null ? null : max,
      icon: drill?.icon || "ft",
      drillScope: draft.scope === "team" ? "team" : "individual",
      scoreUnit: clean(draft.unit) || "points",
      scoreDirection: "higher",
      inSeason: true,
    });
    if (result?.ok === false) setError(result?.err || result?.error || "Could not save this drill.");
  };
  return <form className="inSeasonEditor" onSubmit={submit}>
    <div className="inSeasonEditorGrid">
      <label><span>Drill name</span><input value={draft.name} onChange={set("name")} maxLength={120} autoFocus /></label>
      <label><span>Drill type</span><select value={draft.scope} onChange={set("scope")}><option value="individual">Individual</option><option value="team">Team</option></select></label>
      <label><span>Score unit</span><input value={draft.unit} onChange={set("unit")} maxLength={30} placeholder="points, makes, seconds" /></label>
      <label><span>Max score (optional)</span><input value={draft.max} onChange={set("max")} inputMode="decimal" placeholder="No cap" /></label>
      <label className="is-wide"><span>Short description</span><textarea value={draft.desc} onChange={set("desc")} rows={2} maxLength={500} placeholder="What this drill measures and why it matters." /></label>
      <label className="is-wide"><span>Coach instructions</span><textarea value={draft.instructions} onChange={set("instructions")} rows={4} maxLength={3000} placeholder="Setup, reps, scoring rules, and coaching cues." /></label>
    </div>
    {error && <div className="inSeasonInlineError" role="alert">{error}</div>}
    <div className="inSeasonEditorActions"><button type="button" className="inSeasonButton is-quiet" onClick={onCancel} disabled={busy}>Cancel</button><button type="submit" className="inSeasonButton is-primary" disabled={busy}>{busy ? "Saving…" : drill ? "Save drill" : "Add drill"}</button></div>
  </form>;
}

function CsvImportPanel({ teamId, currentSeason, onImported }) {
  const service = useMemo(() => createGameStatPersistenceService(), []);
  const [csvText, setCsvText] = useState("");
  const [filename, setFilename] = useState("");
  const [provider, setProvider] = useState("Hudl");
  const [importKind, setImportKind] = useState("season_total");
  const [seasonLabel, setSeasonLabel] = useState(currentSeason?.name || "");
  const [asOfDate, setAsOfDate] = useState(TODAY());
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => { if (!seasonLabel && currentSeason?.name) setSeasonLabel(currentSeason.name); }, [currentSeason?.name, seasonLabel]);

  const onFile = async (event) => {
    const file = event.target.files?.[0];
    setPreview(null); setError(""); setSuccess("");
    if (!file) { setCsvText(""); setFilename(""); return; }
    if (!/\.csv$/i.test(file.name) && file.type && !file.type.includes("csv")) {
      setError("Choose a CSV export."); return;
    }
    if (file.size > 2_000_000) { setError("CSV files must be 2 MB or smaller."); return; }
    setFilename(file.name);
    setCsvText(await file.text());
  };

  const requestInput = { teamId, csvText, filename: filename || "stats.csv", importKind, seasonLabel, asOfDate, sourceProvider: provider };
  const runPreview = async () => {
    if (!csvText.trim()) return setError("Choose a CSV file first.");
    setBusy("preview"); setError(""); setSuccess("");
    try { const result = await service.previewCsv(requestInput); setPreview(result.data); }
    catch (err) { setPreview(err?.body?.can_commit !== undefined ? err.body : null); setError(humanizeError(err)); }
    finally { setBusy(""); }
  };
  const commit = async () => {
    if (!preview?.can_commit) return;
    setBusy("commit"); setError(""); setSuccess("");
    try {
      const result = await service.commitCsv(requestInput);
      setSuccess(`${result.data?.imported_players || 0} players imported · ${result.data?.imported_values || 0} stat values saved.`);
      setPreview(null); setCsvText(""); setFilename("");
      await onImported?.();
    } catch (err) { setError(humanizeError(err)); }
    finally { setBusy(""); }
  };

  const issueCount = (preview?.unmatched_rows?.length || 0) + (preview?.ambiguous_rows?.length || 0) + (preview?.invalid_date_rows?.length || 0);
  return <section className="inSeasonImport" data-testid="in-season-csv-import">
    <div className="inSeasonSectionHeader"><div><span>Secure stat intake</span><h3>Import game stats</h3></div><small>Coach only</small></div>
    <p className="inSeasonBodyCopy">Upload a Hudl-style CSV, preview the roster match, then commit only after every player resolves cleanly. ShotLab stores normalized stat values and a file fingerprint — not the raw CSV.</p>
    <div className="inSeasonImportGrid">
      <label className="is-wide"><span>CSV file</span><input type="file" accept=".csv,text/csv" onChange={onFile} /></label>
      <label><span>Source</span><select value={provider} onChange={(e) => setProvider(e.target.value)}><option>Hudl</option><option>MaxPreps</option><option>Team export</option><option>Other CSV</option></select></label>
      <label><span>Import format</span><select value={importKind} onChange={(e) => { setImportKind(e.target.value); setPreview(null); }}><option value="season_total">Season totals</option><option value="game">Game by game</option></select></label>
      <label><span>Season</span><input value={seasonLabel} onChange={(e) => setSeasonLabel(e.target.value)} placeholder="2026-27" /></label>
      {importKind === "season_total" && <label><span>Stats through</span><input type="date" value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)} /></label>}
    </div>
    <div className="inSeasonImportActions"><button type="button" className="inSeasonButton is-secondary" onClick={runPreview} disabled={!csvText || Boolean(busy)}>{busy === "preview" ? "Checking…" : "Preview CSV"}</button><span>{filename || "No file selected"}</span></div>
    {error && <div className="inSeasonInlineError" role="alert">{error}</div>}
    {success && <div className="inSeasonInlineSuccess" role="status">{success}</div>}
    {preview && <div className="inSeasonPreview" data-testid="in-season-csv-preview">
      <div className="inSeasonPreviewMetrics"><div><strong>{preview.matched_rows || 0}</strong><span>Matched rows</span></div><div><strong>{preview.stat_definitions?.length || 0}</strong><span>Stats found</span></div><div><strong>{issueCount}</strong><span>Rows to resolve</span></div></div>
      {preview.stat_definitions?.length > 0 && <div className="inSeasonDetectedStats"><span>Detected</span>{preview.stat_definitions.map((stat) => <em key={stat.key}>{stat.label}</em>)}</div>}
      {preview.unmatched_rows?.length > 0 && <div className="inSeasonImportIssue"><strong>Unmatched players</strong><p>Rows {preview.unmatched_rows.map((row) => row.rowNumber).join(", ")} did not match the current roster. Add/correct email, player name, or jersey number in the CSV or roster.</p></div>}
      {preview.ambiguous_rows?.length > 0 && <div className="inSeasonImportIssue"><strong>Ambiguous players</strong><p>Rows {preview.ambiguous_rows.map((row) => row.rowNumber).join(", ")} match more than one roster identity. Use email or another unique identifier.</p></div>}
      {preview.invalid_date_rows?.length > 0 && <div className="inSeasonImportIssue"><strong>Invalid game dates</strong><p>Rows {preview.invalid_date_rows.join(", ")} need a valid game date.</p></div>}
      <button type="button" className="inSeasonButton is-primary is-full" onClick={commit} disabled={!preview.can_commit || Boolean(busy)}>{busy === "commit" ? "Saving to ShotLab…" : preview.can_commit ? "Commit verified import" : "Resolve CSV issues first"}</button>
    </div>}
  </section>;
}

function GameStatsWorkspace({ role, user, teamId }) {
  const service = useMemo(() => createGameStatPersistenceService(), []);
  const [status, setStatus] = useState("loading");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [metricKey, setMetricKey] = useState("");

  const load = async () => {
    if (!teamId) { setStatus("error"); setError("Join a team to use in-season game stats."); return; }
    setStatus("loading"); setError("");
    try { const result = await service.loadGameStats({ teamId }); setData(result.data); setStatus("ready"); }
    catch (err) { setStatus("error"); setError(humanizeError(err)); }
  };
  useEffect(() => { void load(); }, [teamId]);

  const currentBoards = data?.current_leaderboards || [];
  const programBoards = data?.program_leaderboards || [];
  useEffect(() => {
    if (!metricKey && currentBoards.length) setMetricKey(currentBoards[0].key);
    else if (metricKey && !currentBoards.some((metric) => metric.key === metricKey) && currentBoards.length) setMetricKey(currentBoards[0].key);
  }, [currentBoards, metricKey]);

  if (status === "loading") return <section className="inSeasonState" aria-live="polite"><div className="inSeasonStatePulse"/><strong>Loading protected game stats…</strong><span>Building current and program leaderboards.</span></section>;
  if (status === "error") return <section className="inSeasonState is-error"><strong>Game stats are unavailable</strong><span>{error}</span><button className="inSeasonButton is-secondary" type="button" onClick={load}>Try again</button></section>;

  const currentMetric = currentBoards.find((metric) => metric.key === metricKey) || currentBoards[0];
  const programMetric = programBoards.find((metric) => metric.key === currentMetric?.key) || programBoards[0];
  const myCurrent = data?.my_current_stats || [];
  const myProgram = data?.my_program_stats || [];
  return <div className="inSeasonStatsWorkspace">
    <section className="inSeasonMetricHero">
      <div><span>{data?.current_season?.name || "Current season"}</span><h2>{role === "coach" ? "Team game intelligence" : "Your season, in one place"}</h2><p>{role === "coach" ? "Current production and program standards update from verified CSV imports." : "Your current game production sits beside the program standards you are chasing."}</p></div>
      <div className="inSeasonMetricHeroStat"><strong>{currentBoards.length}</strong><span>Tracked stats</span></div>
    </section>

    {role !== "coach" && <section className="inSeasonPersonalStats">
      <div className="inSeasonSectionHeader"><div><span>My season</span><h3>Current production</h3></div><small>{myCurrent.length} tracked</small></div>
      {myCurrent.length ? <div className="inSeasonStatTiles">{myCurrent.slice(0, 8).map((stat) => {
        const career = myProgram.find((row) => row.statKey === stat.statKey);
        return <article key={stat.statKey}><span>{stat.statLabel}</span><strong>{formatStatValue(stat.value, stat.unit)}</strong>{career && <small>Program: {formatStatValue(career.value, career.unit)}</small>}</article>;
      })}</div> : <p className="inSeasonEmpty">Your game stats will appear here after a coach imports the first verified team CSV.</p>}
    </section>}

    {currentBoards.length ? <>
      <MetricSelector metrics={currentBoards} value={currentMetric?.key || ""} onChange={setMetricKey}/>
      <div className="inSeasonBoardsGrid">
        <RankList title={currentMetric?.label || "Current leaderboard"} eyebrow={data?.current_season?.name || "Current team"} rows={currentMetric?.rows || []} empty="No current-season values yet." currentUser={user?.email || user?.id} valueFormatter={(value) => formatStatValue(value, currentMetric?.unit)} />
        <RankList title={programMetric?.label || "Program leaderboard"} eyebrow="Program history" rows={programMetric?.rows || []} empty="Program history builds as seasons are imported." currentUser={user?.email || user?.id} valueFormatter={(value) => formatStatValue(value, programMetric?.unit)} />
      </div>
    </> : <section className="inSeasonState is-empty"><strong>No game-stat import yet</strong><span>{role === "coach" ? "Import a verified team CSV below to establish the first current and program benchmarks." : "Your coach has not imported game stats for this team yet."}</span></section>}

    {role === "coach" && <>
      <CsvImportPanel teamId={teamId} currentSeason={data?.current_season} onImported={load}/>
      {data?.recent_imports?.length > 0 && <section className="inSeasonRecentImports"><div className="inSeasonSectionHeader"><div><span>Audit trail</span><h3>Recent imports</h3></div><small>{data.recent_imports.length} shown</small></div>{data.recent_imports.map((item) => <article key={item.import_id}><div><strong>{item.filename || "CSV import"}</strong><span>{item.provider || "CSV"} · {item.season_label || "Season"}</span></div><div><strong>{item.players}</strong><span>players</span></div><time>{item.imported_at ? new Date(item.imported_at).toLocaleDateString() : ""}</time></article>)}</section>}
    </>}
  </div>;
}

export default function InSeasonPerformanceHub({
  role = "player",
  user = {},
  team = null,
  programDrills = [],
  programScores = [],
  players = [],
  seasonArchives = [],
  addScore,
  addProgramDrill,
  updateProgramDrill,
  removeProgramDrill,
  onOpenCoachScoreEntry,
}) {
  const isCoach = role === "coach";
  const [mode, setMode] = useState("drills");
  const visibleDrills = useMemo(() => (Array.isArray(programDrills) ? programDrills : []).filter((drill) => isDefaultDrill(drill) || drill?.inSeason === true || drill?.in_season === true), [programDrills]);
  const [selectedId, setSelectedId] = useState(() => drillId(visibleDrills[0]));
  const [score, setScore] = useState("");
  const [scoreBusy, setScoreBusy] = useState(false);
  const [scoreMessage, setScoreMessage] = useState("");
  const [editor, setEditor] = useState(null);
  const [editorBusy, setEditorBusy] = useState(false);
  const [drillMessage, setDrillMessage] = useState("");

  useEffect(() => {
    if (!visibleDrills.length) { setSelectedId(""); return; }
    if (!visibleDrills.some((drill) => drillId(drill) === selectedId)) setSelectedId(drillId(visibleDrills[0]));
  }, [visibleDrills, selectedId]);

  const selectedDrill = visibleDrills.find((drill) => drillId(drill) === selectedId) || visibleDrills[0] || null;
  const currentDrillRows = useMemo(() => selectedDrill ? buildCurrentOffseasonProgramLeaderboardRows({ seasonArchives, teamId: user?.teamId, programScores, drill: selectedDrill, players, limit: 10 }) : [], [seasonArchives, user?.teamId, programScores, selectedDrill, players]);
  const allTimeDrillRows = useMemo(() => selectedDrill ? buildAllTimeProgramLeaderboardRows({ seasonArchives, teamId: user?.teamId, programScores, drill: selectedDrill, players, limit: 10 }) : [], [seasonArchives, user?.teamId, programScores, selectedDrill, players]);
  const personalRecord = allTimeDrillRows.find((row) => playerIdentity(row) === lower(user?.email) || clean(row?.playerId ?? row?.player_id) === clean(user?.id));
  const customCount = visibleDrills.filter((drill) => !isDefaultDrill(drill) && (drill?.inSeason === true || drill?.in_season === true)).length;

  const submitPlayerScore = async (event) => {
    event.preventDefault();
    if (!selectedDrill || typeof addScore !== "function") return;
    const value = finite(score);
    const max = drillMax(selectedDrill);
    if (value === null || value < 0 || (max !== null && value > max)) {
      setScoreMessage(max !== null ? `Enter a score from 0 to ${max}.` : "Enter a valid score of zero or higher.");
      return;
    }
    setScoreBusy(true); setScoreMessage("");
    try { await addScore(drillId(selectedDrill), value, "program"); setScore(""); setScoreMessage("Score saved. Your current and program targets will update from the protected score record."); }
    catch { setScoreMessage("The score could not be saved. Check the connection and try again."); }
    finally { setScoreBusy(false); }
  };

  const saveDrill = async (payload) => {
    setEditorBusy(true); setDrillMessage("");
    try {
      let result;
      if (editor?.drill) result = await updateProgramDrill?.(drillId(editor.drill), payload);
      else result = await addProgramDrill?.(payload);
      if (result?.ok === false) return result;
      setEditor(null); setDrillMessage(editor?.drill ? "Drill updated for the team." : "In-season drill added for the team.");
      return { ok: true };
    } catch (error) { return { ok: false, error: error?.message || "Could not save drill." }; }
    finally { setEditorBusy(false); }
  };

  const deleteDrill = async (drill) => {
    if (isDefaultDrill(drill) || typeof removeProgramDrill !== "function") return;
    if (!window.confirm(`Remove ${drill.name} from the in-season drill library? Saved scores and program history will be kept.`)) return;
    try { await removeProgramDrill(drillId(drill)); setDrillMessage("Drill removed. Historical scores remain protected."); }
    catch { setDrillMessage("The drill could not be removed."); }
  };

  return <section className="inSeasonHub" data-testid="in-season-performance-hub" data-role={role}>
    <header className="inSeasonHero">
      <div className="inSeasonHeroCopy"><span className="inSeasonEyebrow">Season performance</span><h1>In Season</h1><p>{isCoach ? "Run repeatable team standards, capture verified results, and turn game data into a living program record." : "Compete against today’s team standards and the best marks your program has produced."}</p></div>
      <div className="inSeasonHeroPulse"><span>Program standard</span><strong>{visibleDrills.length}</strong><small>active drills</small></div>
    </header>

    <nav className="inSeasonModeTabs" aria-label="In-season workspace">
      <button type="button" className={mode === "drills" ? "is-active" : ""} aria-current={mode === "drills" ? "page" : undefined} onClick={() => setMode("drills")}><span>01</span>Drills & records</button>
      <button type="button" className={mode === "stats" ? "is-active" : ""} aria-current={mode === "stats" ? "page" : undefined} onClick={() => setMode("stats")}><span>02</span>Game stats</button>
    </nav>

    {mode === "drills" && <div className="inSeasonDrillWorkspace">
      <section className="inSeasonDrillRail">
        <div className="inSeasonSectionHeader"><div><span>Training standards</span><h2>Team drill library</h2></div>{isCoach && <button type="button" className="inSeasonTextAction" onClick={() => setEditor({ drill: null })} disabled={customCount >= MAX_CUSTOM_IN_SEASON_DRILLS}>+ Add custom</button>}</div>
        {drillMessage && <div className="inSeasonInlineSuccess" role="status">{drillMessage}</div>}
        {visibleDrills.length ? <div className="inSeasonDrillCards">{visibleDrills.map((drill) => {
          const selected = drillId(drill) === drillId(selectedDrill);
          const max = drillMax(drill);
          return <article key={drillId(drill)} className={selected ? "is-selected" : ""}>
            <button type="button" className="inSeasonDrillSelect" onClick={() => { setSelectedId(drillId(drill)); setScoreMessage(""); }} aria-pressed={selected}>
              <span className="inSeasonDrillScope">{drillScope(drill)}</span><strong>{drill.name}</strong><p>{drill.desc || drill.description || "Coach-defined in-season standard."}</p><small>{max !== null ? `Max ${max} ${scoreUnit(drill)}` : scoreUnit(drill)} · {isDefaultDrill(drill) ? "ShotLab standard" : "Coach custom"}</small>
            </button>
            {isCoach && !isDefaultDrill(drill) && <div className="inSeasonDrillAdmin"><button type="button" onClick={() => setEditor({ drill })}>Edit</button><button type="button" onClick={() => deleteDrill(drill)}>Remove</button></div>}
          </article>;
        })}</div> : <div className="inSeasonState is-empty"><strong>No in-season drills yet</strong><span>{isCoach ? "Create the first repeatable standard for this team." : "Your coach has not added an in-season drill yet."}</span></div>}
        {isCoach && customCount >= MAX_CUSTOM_IN_SEASON_DRILLS && <p className="inSeasonLimitNote">Custom in-season library is at the {MAX_CUSTOM_IN_SEASON_DRILLS}-drill limit. Remove an unused custom drill before adding another.</p>}
      </section>

      {editor && isCoach && <DrillEditor drill={editor.drill} busy={editorBusy} onCancel={() => setEditor(null)} onSave={saveDrill}/>}

      {selectedDrill && <>
        <section className="inSeasonSelectedDrill">
          <div><span>{drillScope(selectedDrill)} standard</span><h2>{selectedDrill.name}</h2><p>{selectedDrill.instructions || selectedDrill.desc || selectedDrill.description || "Complete the drill exactly as your coaching staff defines it and record the verified result."}</p></div>
          <div className="inSeasonSelectedTarget"><span>{isCoach ? "Program record" : "Your program best"}</span><strong>{isCoach ? (allTimeDrillRows[0]?.score ?? "—") : (personalRecord?.score ?? "—")}</strong><small>{scoreUnit(selectedDrill)}</small></div>
        </section>

        {!isCoach && <form className="inSeasonScoreEntry" onSubmit={submitPlayerScore}>
          <div><span>Log result</span><h3>Enter your score</h3><p>Scores save through ShotLab’s protected Program Score service and remain available for program history.</p></div>
          <label><span>{scoreUnit(selectedDrill)}</span><input value={score} onChange={(e) => setScore(e.target.value)} inputMode="decimal" placeholder={drillMax(selectedDrill) !== null ? `0–${drillMax(selectedDrill)}` : "Score"} aria-label={`Score for ${selectedDrill.name}`} /></label>
          <button type="submit" className="inSeasonButton is-primary" disabled={scoreBusy}>{scoreBusy ? "Saving…" : "Save score"}</button>
          {scoreMessage && <p className="inSeasonScoreMessage" role="status">{scoreMessage}</p>}
        </form>}

        {isCoach && <div className="inSeasonCoachScoreAction"><div><span>Verified results</span><strong>Log a player’s in-practice result</strong><p>Coach-entered scores use the same protected history as player-entered results, with recorder audit data preserved.</p></div><button type="button" className="inSeasonButton is-primary" onClick={onOpenCoachScoreEntry}>Log verified result</button></div>}

        <div className="inSeasonBoardsGrid">
          <RankList title="Current standard" eyebrow="Active season" rows={currentDrillRows} empty="No current-season results for this drill yet." unit={scoreUnit(selectedDrill)} currentUser={user?.email || user?.id} />
          <RankList title="Program record" eyebrow="All seasons" rows={allTimeDrillRows} empty="This program record board builds as seasons are archived." unit={scoreUnit(selectedDrill)} currentUser={user?.email || user?.id} />
        </div>
      </>}
    </div>}

    {mode === "stats" && <GameStatsWorkspace role={role} user={user} teamId={clean(user?.teamId || user?.team_id || team?.id)} />}
  </section>;
}
