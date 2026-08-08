const safeArray = (value) => (Array.isArray(value) ? value : []);
const safeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const normalizeEmail = (value = "") => String(value || "").trim().toLowerCase();
const clean = (value = "") => String(value || "").trim();
const asDay = (value) => {
  if (!value) return "";
  const raw = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`;
};
const offsetDay = (day, amount) => {
  const parsed = new Date(`${day}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return day;
  parsed.setDate(parsed.getDate() + amount);
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`;
};
const rowTime = (row = {}) => {
  const raw = row?.ts ?? row?.createdAt ?? row?.created_at ?? row?.date;
  const parsed = typeof raw === "number" ? raw : Date.parse(String(raw || ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

function playerRow(row, email, teamId) {
  const rowEmail = normalizeEmail(row?.email || row?.player_email || row?.playerEmail || row?.playerId || row?.player_id || "");
  if (email && rowEmail !== email) return false;
  const rowTeam = clean(row?.teamId || row?.team_id);
  if (teamId && rowTeam && rowTeam !== String(teamId)) return false;
  return true;
}

function drillKey(row = {}) {
  return clean(row?.drillId || row?.drill_id || row?.drillName || row?.drill || row?.name) || "Training drill";
}

function drillLabel(row = {}, catalog = new Map()) {
  const key = drillKey(row);
  const catalogEntry = catalog.get(key);
  return clean(row?.drillName || row?.drill || catalogEntry?.name || catalogEntry?.title || key) || "Training drill";
}

function buildCatalog(drills = []) {
  const map = new Map();
  safeArray(drills).forEach((drill) => {
    const keys = [drill?.id, drill?.drillId, drill?.drill_id, drill?.name, drill?.title].map(clean).filter(Boolean);
    keys.forEach((key) => map.set(key, drill));
  });
  return map;
}

function knownMaximum(row = {}, catalog = new Map()) {
  const entry = catalog.get(drillKey(row));
  const raw = row?.max ?? row?.maxScore ?? row?.max_score ?? entry?.max ?? entry?.maxScore ?? entry?.max_score;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function derivePbStory(rows = [], catalog = new Map(), today = "") {
  const start30 = offsetDay(today, -29);
  const bestByDrill = new Map();
  const pbMoments = [];
  [...rows].sort((a, b) => rowTime(a) - rowTime(b)).forEach((row) => {
    const score = Number(row?.score);
    if (!Number.isFinite(score)) return;
    const key = drillKey(row);
    const previous = bestByDrill.get(key);
    if (previous === undefined || score > previous) {
      bestByDrill.set(key, score);
      if (previous !== undefined) pbMoments.push({
        drill: drillLabel(row, catalog),
        score,
        previous,
        date: asDay(row?.date || row?.ts || row?.createdAt || row?.created_at),
      });
    }
  });
  const recentPbs = pbMoments.filter((moment) => moment.date && moment.date >= start30 && moment.date <= today);
  return {
    count30: recentPbs.length,
    latest: recentPbs.sort((a, b) => String(b.date).localeCompare(String(a.date)))[0] || null,
  };
}

function deriveStrongestSignal(rows = [], catalog = new Map()) {
  const normalized = new Map();
  rows.forEach((row) => {
    const score = Number(row?.score);
    const max = knownMaximum(row, catalog);
    if (!Number.isFinite(score) || !max) return;
    const key = drillKey(row);
    const current = normalized.get(key) || { label: drillLabel(row, catalog), values: [] };
    current.values.push(Math.max(0, Math.min(1, score / max)));
    normalized.set(key, current);
  });
  const comparable = [...normalized.values()]
    .filter((entry) => entry.values.length > 0)
    .map((entry) => ({ ...entry, avg: entry.values.reduce((sum, value) => sum + value, 0) / entry.values.length }))
    .sort((a, b) => b.avg - a.avg)[0];
  if (comparable) return {
    eyebrow: "STRONGEST SIGNAL",
    title: comparable.label,
    detail: `${Math.round(comparable.avg * 100)}% average against this drill’s defined max.`,
    kind: "quality",
  };

  const repeated = new Map();
  rows.forEach((row) => {
    const key = drillKey(row);
    const current = repeated.get(key) || { label: drillLabel(row, catalog), count: 0 };
    current.count += 1;
    repeated.set(key, current);
  });
  const mostRepeated = [...repeated.values()].sort((a, b) => b.count - a.count)[0];
  if (mostRepeated) return {
    eyebrow: "MOST REPEATED",
    title: mostRepeated.label,
    detail: `${mostRepeated.count} logged result${mostRepeated.count === 1 ? "" : "s"}; no comparable max is available, so this is practice frequency—not a strength claim.`,
    kind: "frequency",
  };
  return {
    eyebrow: "STRONGEST SIGNAL",
    title: "Not enough drill data yet",
    detail: "Log repeatable drill results to identify a real performance signal.",
    kind: "empty",
  };
}

export function derivePlayerProgressStory({
  userEmail = "",
  teamId = "",
  shotLogs = [],
  scores = [],
  programScores = [],
  drills = [],
  programDrills = [],
  streak = 0,
  coachPriorities = {},
  today = new Date().toISOString().slice(0, 10),
} = {}) {
  const email = normalizeEmail(userEmail);
  const catalog = buildCatalog([...safeArray(drills), ...safeArray(programDrills)]);
  const playerShots = safeArray(shotLogs).filter((row) => playerRow(row, email, teamId));
  const playerScores = [...safeArray(scores), ...safeArray(programScores)].filter((row) => playerRow(row, email, teamId));
  const dailyMakes = Array.from({ length: 14 }, (_, index) => {
    const date = offsetDay(today, index - 13);
    const made = playerShots
      .filter((row) => asDay(row?.date || row?.ts || row?.createdAt || row?.created_at) === date)
      .reduce((sum, row) => sum + safeNumber(row?.made), 0);
    return { date, made };
  });
  const prior7Makes = dailyMakes.slice(0, 7).reduce((sum, day) => sum + day.made, 0);
  const recent7Makes = dailyMakes.slice(7).reduce((sum, day) => sum + day.made, 0);
  const hasPriorVolume = prior7Makes > 0;
  const deltaPct = hasPriorVolume
    ? Math.round(((recent7Makes - prior7Makes) / prior7Makes) * 100)
    : null;
  const trend = !hasPriorVolume
    ? (recent7Makes > 0 ? "rising" : "steady")
    : deltaPct >= 10 ? "rising" : deltaPct <= -10 ? "cooling" : "steady";

  const start7 = offsetDay(today, -6);
  const activityDays = new Set();
  [...playerShots, ...playerScores].forEach((row) => {
    const day = asDay(row?.date || row?.ts || row?.createdAt || row?.created_at);
    if (day && day >= start7 && day <= today) activityDays.add(day);
  });
  const allActivityDays = new Set();
  [...playerShots, ...playerScores].forEach((row) => {
    const day = asDay(row?.date || row?.ts || row?.createdAt || row?.created_at);
    if (day) allActivityDays.add(day);
  });

  const pb = derivePbStory(playerScores, catalog, today);
  const strongest = deriveStrongestSignal(playerScores, catalog);
  const liveStreak = Math.max(0, safeNumber(streak));
  const coachFocus = clean(coachPriorities?.todayFocusText || coachPriorities?.priorityDrillText);
  let opportunity = {
    eyebrow: "BIGGEST OPPORTUNITY",
    title: "Keep building repeatable evidence",
    detail: "More consistent logs will make the next development readout sharper.",
  };
  if (trend === "cooling") opportunity = {
    eyebrow: "BIGGEST OPPORTUNITY",
    title: "Restore recent volume",
    detail: `At-home makes are ${Math.abs(deltaPct)}% below the prior 7-day window. Rebuild the base before adding complexity.`,
  };
  else if (activityDays.size < 3) opportunity = {
    eyebrow: "BIGGEST OPPORTUNITY",
    title: "Build training consistency",
    detail: `${activityDays.size} active day${activityDays.size === 1 ? "" : "s"} in the last 7. Add one clean training day before chasing more volume.`,
  };
  else if (coachFocus) opportunity = {
    eyebrow: "BIGGEST OPPORTUNITY",
    title: clean(coachPriorities?.priorityDrillText) || "Stay aligned with coach focus",
    detail: `Team focus: ${coachFocus}. Use the next session to turn that priority into logged evidence.`,
  };

  const headline = trend === "rising"
    ? "Your work is rising."
    : trend === "cooling"
      ? "Your base needs a reset."
      : recent7Makes > 0 || playerScores.length > 0
        ? "Your development base is holding."
        : "Your progress story starts with the next rep.";
  const trendDetail = trend === "rising"
    ? !hasPriorVolume
      ? `${recent7Makes} at-home makes in the last 7 days · new volume after a quiet prior window.`
      : `${recent7Makes} at-home makes in the last 7 days · ${deltaPct}% above the prior window.`
    : trend === "cooling"
      ? `${recent7Makes} at-home makes in the last 7 days · ${Math.abs(deltaPct)}% below the prior window.`
      : !hasPriorVolume
        ? "No at-home makes in either 7-day window yet."
        : `${recent7Makes} at-home makes in the last 7 days · volume is within 10% of the prior window.`;

  const nextFocus = coachFocus
    ? { label: "COACH FOCUS", title: coachFocus, detail: clean(coachPriorities?.challengeText) || "Carry the team priority into the next logged session." }
    : opportunity.title === "Build training consistency"
      ? { label: "NEXT FOCUS", title: "Add one clean training day", detail: "Consistency creates a stronger signal than one oversized session." }
      : { label: "NEXT FOCUS", title: opportunity.title, detail: opportunity.detail };

  return {
    headline,
    trend,
    trendDetail,
    deltaPct,
    dailyMakes,
    recent7Makes,
    activeDays7: activityDays.size,
    totalActiveDays: allActivityDays.size,
    currentStreak: liveStreak,
    pbCount30: pb.count30,
    latestPb: pb.latest,
    strongest,
    opportunity,
    nextFocus,
    loggedResults: playerScores.length,
    isSparse: playerScores.length < 2 && playerShots.length < 2,
    evidenceLabel: `Based on ${playerScores.length} logged drill result${playerScores.length === 1 ? "" : "s"} and ${allActivityDays.size} active training day${allActivityDays.size === 1 ? "" : "s"}.`,
  };
}
