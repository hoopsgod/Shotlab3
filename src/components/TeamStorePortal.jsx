import { useEffect, useMemo, useState } from "react";
import {
  AFFILIATE_DISCLOSURE,
  TEAM_STORE_CLICKS_KEY,
  TEAM_STORE_PROVIDERS,
  TEAM_STORE_STORAGE_KEY,
  appendTeamStoreClick,
  buildTeamStoreClick,
  getStoreVisitMetrics,
  getTeamStoreForTeam,
  normalizeTeamStore,
  upsertTeamStore,
  validateTeamStoreInput,
} from "../lib/teamStore.js";

const STORAGE_SESSION = "sl:session";
const STORAGE_PLAYERS = "sl:players";
const STORAGE_TEAMS = "sl:teams";

function parseStored(value, fallback) {
  if (value == null) return fallback;
  if (typeof value !== "string") return value;
  try { return JSON.parse(value); } catch { return fallback; }
}

async function storageGet(key, fallback) {
  try {
    if (window.storage?.get) {
      const result = await window.storage.get(key);
      return parseStored(result?.value ?? result, fallback);
    }
    return parseStored(window.localStorage?.getItem(key), fallback);
  } catch {
    return fallback;
  }
}

async function storageSet(key, value) {
  const serialized = JSON.stringify(value);
  if (window.storage?.set) return window.storage.set(key, serialized);
  window.localStorage?.setItem(key, serialized);
  return { value: serialized };
}

function resolveIdentity(session, players, teams) {
  const email = String(session?.email || "").trim().toLowerCase();
  if (!email) return null;
  const player = (Array.isArray(players) ? players : []).find(
    (row) => String(row?.email || "").trim().toLowerCase() === email,
  );
  if (!player?.teamId) return null;
  const team = (Array.isArray(teams) ? teams : []).find((row) => String(row?.id || "") === String(player.teamId));
  return {
    email,
    role: player.role || (player.isCoach ? "coach" : "player"),
    isCoach: player.role === "coach" || player.isCoach === true,
    teamId: String(player.teamId),
    teamName: String(team?.name || team?.teamName || "Your Team"),
  };
}

function StoreIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 10h16l-1-5H5l-1 5Z"/><path d="M6 10v9h12v-9"/><path d="M9 19v-5h6v5"/><path d="M4 10c0 1.2.8 2 2 2s2-.8 2-2c0 1.2.8 2 2 2s2-.8 2-2c0 1.2.8 2 2 2s2-.8 2-2c0 1.2.8 2 2 2s2-.8 2-2"/></svg>;
}

export default function TeamStorePortal() {
  const [identity, setIdentity] = useState(null);
  const [stores, setStores] = useState([]);
  const [clicks, setClicks] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [draft, setDraft] = useState({ provider: "squadlocker", storeName: "Official Team Store", storeUrl: "" });

  useEffect(() => {
    let cancelled = false;
    const hydrate = async () => {
      const [session, players, teams, storedStores, storedClicks] = await Promise.all([
        storageGet(STORAGE_SESSION, null),
        storageGet(STORAGE_PLAYERS, []),
        storageGet(STORAGE_TEAMS, []),
        storageGet(TEAM_STORE_STORAGE_KEY, []),
        storageGet(TEAM_STORE_CLICKS_KEY, []),
      ]);
      if (cancelled) return;
      const nextIdentity = resolveIdentity(session, players, teams);
      setIdentity(nextIdentity);
      setStores(Array.isArray(storedStores) ? storedStores.map(normalizeTeamStore) : []);
      setClicks(Array.isArray(storedClicks) ? storedClicks : []);
    };
    hydrate();
    const interval = window.setInterval(hydrate, 2500);
    return () => { cancelled = true; window.clearInterval(interval); };
  }, []);

  const store = useMemo(() => getTeamStoreForTeam(stores, identity?.teamId), [stores, identity?.teamId]);
  const metrics = useMemo(() => getStoreVisitMetrics(clicks, identity?.teamId), [clicks, identity?.teamId]);

  useEffect(() => {
    if (!store || editing) return;
    setDraft({ provider: store.provider, storeName: store.storeName, storeUrl: store.storeUrl });
  }, [store, editing]);

  if (!identity) return null;

  const saveStore = async () => {
    setError("");
    setNotice("");
    const validation = validateTeamStoreInput({ ...draft, id: store?.id, teamId: identity.teamId, createdAt: store?.createdAt });
    if (!validation.ok) { setError(validation.error); return; }
    setSaving(true);
    try {
      const next = upsertTeamStore(stores, validation.store);
      await storageSet(TEAM_STORE_STORAGE_KEY, next);
      setStores(next);
      setEditing(false);
      setNotice("Team store is live for players and families.");
    } catch {
      setError("Could not save the team store. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const openStore = async (source) => {
    if (!store?.storeUrl) return;
    const click = buildTeamStoreClick({ store, userRole: identity.role, source });
    const next = appendTeamStoreClick(clicks, click);
    setClicks(next);
    await storageSet(TEAM_STORE_CLICKS_KEY, next).catch(() => null);
    window.open(store.storeUrl, "_blank", "noopener,noreferrer");
  };

  const shell = {
    position: "fixed", inset: 0, zIndex: 120, background: "rgba(4,5,7,.86)", backdropFilter: "blur(14px)",
    display: "flex", alignItems: "flex-end", justifyContent: "center", padding: "20px max(14px,env(safe-area-inset-right)) max(24px,env(safe-area-inset-bottom)) max(14px,env(safe-area-inset-left))",
  };
  const panel = { width: "min(620px,100%)", maxHeight: "84vh", overflow: "auto", borderRadius: 24, padding: 20, background: "linear-gradient(155deg,#17191e,#0d0f13)", border: "1px solid rgba(255,255,255,.14)", boxShadow: "0 30px 80px rgba(0,0,0,.55)", color: "#f7f8fa" };
  const input = { width: "100%", boxSizing: "border-box", minHeight: 46, borderRadius: 12, border: "1px solid rgba(255,255,255,.16)", background: "#090b0e", color: "#fff", padding: "0 12px", fontSize: 14 };
  const primary = { minHeight: 46, border: 0, borderRadius: 12, background: "#c8ff1a", color: "#0b0d10", fontWeight: 900, letterSpacing: ".04em", padding: "0 16px", cursor: "pointer" };
  const secondary = { minHeight: 44, borderRadius: 12, border: "1px solid rgba(255,255,255,.17)", background: "rgba(255,255,255,.04)", color: "#fff", fontWeight: 800, padding: "0 14px", cursor: "pointer" };

  return <>
    <button type="button" aria-label="Open team store" onClick={() => setOpen(true)} style={{ position: "fixed", right: "max(16px,env(safe-area-inset-right))", bottom: "calc(108px + env(safe-area-inset-bottom,0px))", zIndex: 70, minWidth: 54, height: 54, borderRadius: 18, border: "1px solid rgba(200,255,26,.45)", background: "linear-gradient(145deg,#1b2112,#10130d)", color: "#c8ff1a", display: "grid", placeItems: "center", boxShadow: "0 14px 30px rgba(0,0,0,.4)", cursor: "pointer" }}><StoreIcon /></button>
    {open && <div role="dialog" aria-modal="true" aria-label="Team Store" style={shell} onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
      <section style={panel}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
          <div><div style={{ color: "#c8ff1a", fontSize: 12, fontWeight: 900, letterSpacing: ".14em" }}>SHOTLAB COMMERCE</div><h2 style={{ margin: "5px 0 0", fontSize: 30, lineHeight: 1 }}>TEAM STORE</h2><p style={{ margin: "8px 0 0", color: "#aeb5c0", lineHeight: 1.45 }}>{identity.teamName}</p></div>
          <button type="button" onClick={() => setOpen(false)} style={{ ...secondary, minWidth: 44, padding: 0 }} aria-label="Close team store">×</button>
        </div>

        {identity.isCoach ? <>
          {!store || editing ? <div style={{ marginTop: 20, display: "grid", gap: 12 }}>
            <div style={{ padding: 14, borderRadius: 14, background: "rgba(200,255,26,.07)", border: "1px solid rgba(200,255,26,.2)", color: "#dce6bd", lineHeight: 1.45 }}>Connect an existing apparel store. ShotLab does not process orders, payments, shipping, returns, or sales tax.</div>
            <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>Provider<select value={draft.provider} onChange={(event) => setDraft((current) => ({ ...current, provider: event.target.value }))} style={input}>{TEAM_STORE_PROVIDERS.map((provider) => <option key={provider.key} value={provider.key}>{provider.label}</option>)}</select></label>
            <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>Store name<input value={draft.storeName} onChange={(event) => setDraft((current) => ({ ...current, storeName: event.target.value }))} style={input} /></label>
            <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>Secure store URL<input type="url" inputMode="url" placeholder="https://..." value={draft.storeUrl} onChange={(event) => setDraft((current) => ({ ...current, storeUrl: event.target.value }))} style={input} /></label>
            <div style={{ fontSize: 12, color: "#9ca5b2", lineHeight: 1.45 }}>By publishing, you confirm that your program is authorized to use its team name, marks, and logos and that required school or club approvals have been obtained.</div>
            {error && <div role="alert" style={{ color: "#ff9a9a", fontWeight: 800 }}>{error}</div>}
            <div style={{ display: "flex", gap: 10 }}><button type="button" disabled={saving} onClick={saveStore} style={{ ...primary, flex: 1, opacity: saving ? .6 : 1 }}>{saving ? "SAVING…" : "PUBLISH STORE"}</button>{store && <button type="button" onClick={() => setEditing(false)} style={secondary}>CANCEL</button>}</div>
          </div> : <div style={{ marginTop: 20 }}>
            <div style={{ padding: 18, borderRadius: 18, background: "linear-gradient(145deg,rgba(200,255,26,.12),rgba(255,255,255,.025))", border: "1px solid rgba(200,255,26,.25)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}><div><div style={{ color: "#c8ff1a", fontWeight: 900 }}>LIVE</div><div style={{ fontSize: 22, fontWeight: 900, marginTop: 4 }}>{store.storeName}</div><div style={{ color: "#aeb5c0", marginTop: 4 }}>{TEAM_STORE_PROVIDERS.find((item) => item.key === store.provider)?.label || "Apparel partner"}</div></div><StoreIcon /></div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginTop: 16 }}>{[["TODAY",metrics.today],["7 DAYS",metrics.week],["30 DAYS",metrics.month],["TOTAL",metrics.total]].map(([label,value]) => <div key={label} style={{ padding: "10px 6px", borderRadius: 12, background: "rgba(0,0,0,.24)", textAlign: "center" }}><div style={{ fontSize: 20, fontWeight: 900 }}>{value}</div><div style={{ color: "#8f98a6", fontSize: 9, fontWeight: 900, letterSpacing: ".08em" }}>{label}</div></div>)}</div>
            </div>
            {notice && <div style={{ marginTop: 12, color: "#c8ff1a", fontWeight: 800 }}>{notice}</div>}
            <div style={{ display: "flex", gap: 10, marginTop: 14 }}><button type="button" onClick={() => openStore("coach_portal")} style={{ ...primary, flex: 1 }}>OPEN STORE</button><button type="button" onClick={() => setEditing(true)} style={secondary}>EDIT</button></div>
          </div>}
        </> : <div style={{ marginTop: 20 }}>
          {store ? <><div style={{ padding: 20, borderRadius: 20, background: "linear-gradient(145deg,rgba(200,255,26,.13),rgba(255,255,255,.02))", border: "1px solid rgba(200,255,26,.25)" }}><div style={{ color: "#c8ff1a", fontWeight: 900, letterSpacing: ".1em", fontSize: 11 }}>REP YOUR PROGRAM</div><div style={{ fontSize: 28, fontWeight: 900, marginTop: 7 }}>{store.storeName}</div><p style={{ color: "#b8c0ca", lineHeight: 1.5, marginBottom: 0 }}>Official team apparel and fan gear from your program’s selected apparel partner.</p></div><button type="button" onClick={() => openStore("player_portal")} style={{ ...primary, width: "100%", marginTop: 14 }}>SHOP TEAM STORE</button><p style={{ color: "#8f98a6", fontSize: 11, lineHeight: 1.5, marginBottom: 0 }}>{AFFILIATE_DISCLOSURE}</p></> : <div style={{ padding: 20, borderRadius: 18, border: "1px solid rgba(255,255,255,.12)", background: "rgba(255,255,255,.03)", color: "#aeb5c0", lineHeight: 1.5 }}>Your coach has not published a team store yet.</div>}
        </div>}
      </section>
    </div>}
  </>;
}
