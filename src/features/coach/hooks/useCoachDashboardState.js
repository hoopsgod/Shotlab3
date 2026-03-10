import { useState, useMemo, useEffect } from "react";
import { todayStr } from "../../../shared/utils/coreUtils";

export default function useCoachDashboardState({ scores, players, events, drills, updateDrill, addDrill, addProgramDrill, removeDrill, addEvent, addRsvp, addScSession, sanitize }) {
  const [tab, setTab] = useState("feed");
  const [editD, setEditD] = useState(null);
  const [eName, setEName] = useState("");
  const [eDesc, setEDesc] = useState("");
  const [eInstr, setEInstr] = useState("");
  const [eMax, setEMax] = useState("");
  const [eIcon, setEIcon] = useState("ft");
  const [selP, setSelP] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [expEv, setExpEv] = useState(null);
  const [ne, setNe] = useState({ title: "", date: "", time: "", location: "", desc: "", type: "run" });
  const [addEmail, setAddEmail] = useState("");
  const [showAddSC, setShowAddSC] = useState(false);
  const [nsc, setNsc] = useState({ sport: "", date: "", time: "", location: "" });
  const [showNewDrill, setShowNewDrill] = useState(false);
  const [nd, setNd] = useState({ name: "", desc: "", max: "10", icon: "ft", instructions: "" });
  const [programErr, setProgramErr] = useState("");
  const [newProgramDrill, setNewProgramDrill] = useState({ name: "", desc: "", max: "10", icon: "ft" });
  const [nudged, setNudged] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [codeErr, setCodeErr] = useState("");
  const [newProfile, setNewProfile] = useState({ firstName: "", lastName: "", jerseyNumber: "" });
  const [profileErr, setProfileErr] = useState("");
  const [isDesktop, setIsDesktop] = useState(() => (typeof window !== "undefined" ? window.innerWidth >= 1024 : false));
  const [isNarrow, setIsNarrow] = useState(() => (typeof window !== "undefined" ? window.innerWidth < 768 : false));

  const ups = useMemo(() => {
    const emails = [...new Set(scores.map((s) => s.email))];
    return emails.map((email) => {
      const player = players.find((p) => p.email === email);
      return { email, name: player?.name || email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) };
    });
  }, [scores, players]);

  const allKnown = useMemo(() => {
    const known = {};
    players.forEach((p) => { known[p.email] = p.name; });
    scores.forEach((s) => { if (!known[s.email]) known[s.email] = s.name || s.email; });
    return Object.entries(known).map(([email, name]) => ({ email, name }));
  }, [players, scores]);

  const today = todayStr();
  const todayS = scores.filter((s) => s.date === today);

  const saveDrill = () => {
    const max = parseInt(eMax);
    updateDrill(editD.id, { name: sanitize(eName), desc: sanitize(eDesc), instructions: sanitize(eInstr), max: max > 0 ? max : editD.max, icon: eIcon });
    setEditD(null);
  };

  const handleAddDrill = () => {
    if (!nd.name) return;
    const max = parseInt(nd.max);
    addDrill({ name: sanitize(nd.name).toUpperCase(), desc: sanitize(nd.desc), max: max > 0 ? max : 10, icon: nd.icon, instructions: sanitize(nd.instructions) });
    setNd({ name: "", desc: "", max: "10", icon: "ft", instructions: "" });
    setShowNewDrill(false);
  };

  const handleAddProgramDrill = async () => {
    if (!newProgramDrill.name) return;
    const max = parseInt(newProgramDrill.max);
    const result = await addProgramDrill({ name: sanitize(newProgramDrill.name).toUpperCase(), desc: sanitize(newProgramDrill.desc), max: max > 0 ? max : 10, icon: newProgramDrill.icon, instructions: "" });
    if (!result.ok) { setProgramErr(result.err || "Could not add drill"); return; }
    setProgramErr("");
    setNewProgramDrill({ name: "", desc: "", max: "10", icon: "ft" });
  };

  const handleRemoveDrill = (id) => setConfirmDelete(id);
  const confirmDrillDelete = () => { if (confirmDelete) removeDrill(confirmDelete); setConfirmDelete(null); };

  const handleAddEvent = () => {
    if (!ne.title || !ne.date) return;
    addEvent({ ...ne, title: sanitize(ne.title), desc: sanitize(ne.desc), location: sanitize(ne.location) });
    setNe({ title: "", date: "", time: "", location: "", desc: "", type: "run" });
    setShowAdd(false);
  };

  const handleAddWalkin = (evId) => {
    const email = addEmail.trim().toLowerCase();
    if (!email) return;
    const known = allKnown.find((p) => p.email === email);
    const name = known?.name || email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    addRsvp(evId, email, name);
    setAddEmail("");
  };

  const handleAddSC = () => {
    if (!nsc.sport || !nsc.date) return;
    addScSession({ ...nsc, sport: sanitize(nsc.sport), location: sanitize(nsc.location) });
    setNsc({ sport: "", date: "", time: "", location: "" });
    setShowAddSC(false);
  };

  const totalPlayers = ups.length;
  const activeTodayCount = new Set(todayS.map((s) => s.email)).size;
  const sortedEvents = [...events].sort((a, b) => a.date.localeCompare(b.date));
  const nextEvent = sortedEvents.find((event) => event.date >= today);
  const nextEventDateFormatted = nextEvent ? new Date(`${nextEvent.date}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "None";
  const highlightAddPlayer = totalPlayers === 0;
  const highlightAddDrill = drills.length === 0;
  const highlightScheduleEvent = events.length === 0 || !nextEvent;
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekStr = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, "0")}-${String(weekStart.getDate()).padStart(2, "0")}`;
  const activeThisWeek = new Set(scores.filter((s) => s.date >= weekStr).map((s) => s.email));
  const inactivePlayersCount = ups.filter((p) => !activeThisWeek.has(p.email)).length;
  const highlightPlayersAttention = inactivePlayersCount > 0;
  const primaryQuickAction = highlightAddPlayer ? "addPlayer" : highlightAddDrill ? "addDrill" : highlightScheduleEvent ? "scheduleEvent" : null;

  const jumpToSection = (targetTab, sectionId) => {
    setTab(targetTab);
    setSelP(null);
    setTimeout(() => document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
  };

  const handleLogScoreAction = () => setTab("feed");

  const handleNavChange = (nextTab) => {
    setTab(nextTab);
    setEditD(null);
    setSelP(null);
    setShowAdd(false);
    setExpEv(null);
    setShowAddSC(false);
  };

  useEffect(() => {
    const onResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
      setIsNarrow(window.innerWidth < 768);
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return { tab, setTab, editD, setEditD, eName, setEName, eDesc, setEDesc, eInstr, setEInstr, eMax, setEMax, eIcon, setEIcon, selP, setSelP, showAdd, setShowAdd, expEv, setExpEv, ne, setNe, addEmail, setAddEmail, showAddSC, setShowAddSC, nsc, setNsc, showNewDrill, setShowNewDrill, nd, setNd, programErr, setProgramErr, newProgramDrill, setNewProgramDrill, nudged, setNudged, confirmDelete, setConfirmDelete, codeErr, setCodeErr, newProfile, setNewProfile, profileErr, setProfileErr, ups, allKnown, today, todayS, saveDrill, handleAddDrill, handleAddProgramDrill, handleRemoveDrill, confirmDrillDelete, handleAddEvent, handleAddWalkin, handleAddSC, totalPlayers, activeTodayCount, sortedEvents, nextEvent, nextEventDateFormatted, highlightAddPlayer, highlightAddDrill, highlightScheduleEvent, inactivePlayersCount, highlightPlayersAttention, primaryQuickAction, jumpToSection, handleLogScoreAction, handleNavChange, isDesktop, isNarrow };
}
