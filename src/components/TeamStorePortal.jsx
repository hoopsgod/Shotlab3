import { useEffect, useMemo, useState } from "react";
import {
  AFFILIATE_DISCLOSURE,
  TEAM_STORE_CLICKS_KEY,
  TEAM_STORE_PROVIDERS,
  TEAM_STORE_REFERRALS_KEY,
  TEAM_STORE_STORAGE_KEY,
  appendTeamStoreClick,
  buildTeamStoreClick,
  buildTeamStoreReferralStart,
  getSquadLockerPartnerReadiness,
  getTeamStoreReferralStart,
  getStoreVisitMetrics,
  getTeamStoreForTeam,
  normalizeTeamStore,
  upsertTeamStoreReferralStart,
  upsertTeamStore,
  validateTeamStoreInput,
} from "../lib/teamStore.js";
import {
  TEAM_STORE_OPEN_EVENT,
  normalizeTeamStorePortalIdentity,
} from "../lib/teamStorePortalBridge.js";
import { isDemoAccount } from "../lib/demoMode.js";
import "./TeamStorePortal.css";

const STORAGE_SESSION = "sl:session";
const STORAGE_PLAYERS = "sl:players";
const STORAGE_TEAMS = "sl:teams";
const DEFAULT_TEAM_STORE_DRAFT = { provider: "squadlocker", storeName: "Official Team Store", storeUrl: "" };

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
  return normalizeTeamStorePortalIdentity({
    email,
    role: player.role || (player.isCoach ? "coach" : "player"),
    isCoach: player.role === "coach" || player.isCoach === true,
    teamId: String(player.teamId),
    teamName: String(team?.name || team?.teamName || "Your Team"),
  });
}

function StoreIcon({ size = 22 } = {}) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 10h16l-1-5H5l-1 5Z"/><path d="M6 10v9h12v-9"/><path d="M9 19v-5h6v5"/><path d="M4 10c0 1.2.8 2 2 2s2-.8 2-2c0 1.2.8 2 2 2s2-.8 2-2c0 1.2.8 2 2 2s2-.8 2-2c0 1.2.8 2 2 2s2-.8 2-2"/></svg>;
}

function ArrowIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>;
}

function CheckIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>;
}

function SetupProgress({ published = false }) {
  const steps = [
    ["1", "Create or connect", "Start or add your store"],
    ["2", "Preview", "Check the player view"],
    ["3", "Publish", "Make it available"],
  ];
  return <div className="ts-progress-wrap">
    <div className="ts-progress-intro">
      <span>QUICK SETUP</span>
      <strong>Connect. Preview. Publish.</strong>
    </div>
    <ol className="ts-progress" aria-label="Team store setup progress">
      {steps.map(([number, title, detail], index) => {
        const complete = published;
        const current = !published && index === 0;
        return <li key={title} className={`${complete ? "is-complete" : ""} ${current ? "is-current" : ""}`} aria-current={current ? "step" : undefined}>
          <span className="ts-step-number">{complete && published ? <CheckIcon /> : number}</span>
          <span><strong>{title}</strong><small>{detail}</small></span>
        </li>;
      })}
    </ol>
  </div>;
}

function SquadLockerPartnerStart({ opened = false, onStart, ready = false }) {
  if (!ready) {
    return <section className="ts-partner-start is-pending" aria-labelledby="squadlocker-partner-title">
      <div className="ts-partner-start-copy">
        <div className="ts-partner-badge"><span aria-hidden="true" /> SHOTLAB PARTNER SETUP</div>
        <h4 id="squadlocker-partner-title">Store creation is temporarily unavailable</h4>
        <p>ShotLab is waiting for its official SquadLocker partner link. To protect referral credit, we will not send you through an unverified signup link.</p>
      </div>
      <button type="button" disabled className="ts-button ts-button-partner">PARTNER SETUP PENDING</button>
      <div className="ts-partner-footnote">
        <small>Already have a SquadLocker store? Paste its public storefront link below to make it available to your team.</small>
      </div>
    </section>;
  }

  return <section className={`ts-partner-start ${opened ? "is-opened" : ""}`} aria-labelledby="squadlocker-partner-title">
    <div className="ts-partner-start-copy">
      <div className="ts-partner-badge"><span aria-hidden="true" /> VERIFIED SHOTLAB PARTNER PATH</div>
      <h4 id="squadlocker-partner-title">{opened ? "Continue your SquadLocker setup" : "Need a SquadLocker store?"}</h4>
      <p>{opened
        ? "Your SquadLocker setup was opened from ShotLab. Finish there, then return here with the public link for your completed store."
        : "Start here so SquadLocker can record ShotLab as the source of the introduction. Keep ShotLab open, then return with your finished store link."}</p>
    </div>
    <button type="button" onClick={onStart} className="ts-button ts-button-partner">
      {opened ? "RETURN TO SQUADLOCKER SETUP" : "CREATE SQUADLOCKER STORE"} <ArrowIcon />
    </button>
    <div className="ts-partner-footnote">
      {opened && <span className="ts-partner-recorded"><CheckIcon /> Partner path opened</span>}
      <small>Your official partner link is applied automatically—nothing to copy. SquadLocker determines qualification and referral compensation under its partner terms.</small>
    </div>
  </section>;
}

function PlayerStorePreview({ teamName, storeName, providerLabel, onOpen, live = false }) {
  return <div className="ts-preview-panel">
    <div className="ts-preview-label"><span>{live ? "PLAYER VIEW" : "LIVE PREVIEW"}</span><span className="ts-preview-dot" /></div>
    <div className="ts-storefront-art" aria-hidden="true">
      <span className="ts-art-line" />
      <StoreIcon size={30} />
    </div>
    <div className="ts-preview-team">{teamName}</div>
    <h4>{storeName || "Official Team Store"}</h4>
    <p>Official apparel and fan gear selected by your program.</p>
    {live && onOpen ? <button type="button" className="ts-button ts-button-primary ts-preview-button" onClick={onOpen}>SHOP TEAM STORE <ArrowIcon /></button> : <div className="ts-preview-button ts-preview-button-disabled" aria-hidden="true">SHOP TEAM STORE <ArrowIcon /></div>}
    <div className="ts-preview-partner">Opens securely with {providerLabel}</div>
  </div>;
}

function getProviderLabel(providerKey) {
  return TEAM_STORE_PROVIDERS.find((item) => item.key === providerKey)?.label || "Apparel partner";
}

function getStoreHost(storeUrl) {
  try { return new URL(storeUrl).hostname.replace(/^www\./, ""); } catch { return "Secure external store"; }
}

export default function TeamStorePortal() {
  const [identity, setIdentity] = useState(null);
  const [navigationIdentity, setNavigationIdentity] = useState(null);
  const [stores, setStores] = useState([]);
  const [clicks, setClicks] = useState([]);
  const [referralStarts, setReferralStarts] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [draft, setDraft] = useState(DEFAULT_TEAM_STORE_DRAFT);

  useEffect(() => {
    let cancelled = false;
    const hydrate = async () => {
      const [session, players, teams, storedStores, storedClicks, storedReferralStarts] = await Promise.all([
        storageGet(STORAGE_SESSION, null),
        storageGet(STORAGE_PLAYERS, []),
        storageGet(STORAGE_TEAMS, []),
        storageGet(TEAM_STORE_STORAGE_KEY, []),
        storageGet(TEAM_STORE_CLICKS_KEY, []),
        storageGet(TEAM_STORE_REFERRALS_KEY, []),
      ]);
      if (cancelled) return;
      const nextIdentity = resolveIdentity(session, players, teams);
      setIdentity(nextIdentity);
      setStores(Array.isArray(storedStores) ? storedStores.map(normalizeTeamStore) : []);
      setClicks(Array.isArray(storedClicks) ? storedClicks : []);
      setReferralStarts(Array.isArray(storedReferralStarts) ? storedReferralStarts : []);
    };
    hydrate();
    const interval = window.setInterval(hydrate, 2500);
    return () => { cancelled = true; window.clearInterval(interval); };
  }, []);

  useEffect(() => {
    const handleNavigationOpen = (event) => {
      const nextIdentity = normalizeTeamStorePortalIdentity(event?.detail);
      if (!nextIdentity) return;
      setNavigationIdentity(nextIdentity);
      setError("");
      setNotice("");
      setEditing(false);
      setOpen(true);
    };
    window.addEventListener(TEAM_STORE_OPEN_EVENT, handleNavigationOpen);
    return () => window.removeEventListener(TEAM_STORE_OPEN_EVENT, handleNavigationOpen);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      setNavigationIdentity(null);
      setEditing(false);
      setError("");
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const activeIdentity = navigationIdentity || identity;
  const store = useMemo(() => getTeamStoreForTeam(stores, activeIdentity?.teamId), [stores, activeIdentity?.teamId]);
  const metrics = useMemo(() => getStoreVisitMetrics(clicks, activeIdentity?.teamId), [clicks, activeIdentity?.teamId]);
  const referralStart = useMemo(
    () => getTeamStoreReferralStart(referralStarts, activeIdentity?.teamId),
    [referralStarts, activeIdentity?.teamId],
  );
  const partnerReadiness = useMemo(() => getSquadLockerPartnerReadiness(), []);
  const verifiedReferralStart = referralStart?.attribution === "official_partner_url";
  const isDemoPlayerPreview = !activeIdentity?.isCoach && isDemoAccount(activeIdentity?.email) && !store;

  useEffect(() => {
    if (editing) return;
    setDraft(store
      ? { provider: store.provider, storeName: store.storeName, storeUrl: store.storeUrl }
      : DEFAULT_TEAM_STORE_DRAFT);
  }, [store, editing, activeIdentity?.teamId]);

  if (!activeIdentity) return null;

  const closePortal = () => {
    setOpen(false);
    setNavigationIdentity(null);
    setEditing(false);
    setError("");
  };

  const saveStore = async () => {
    setError("");
    setNotice("");
    const validation = validateTeamStoreInput({ ...draft, id: store?.id, teamId: activeIdentity.teamId, createdAt: store?.createdAt });
    if (!validation.ok) { setError(validation.error); return; }
    setSaving(true);
    try {
      const next = upsertTeamStore(stores, validation.store);
      await storageSet(TEAM_STORE_STORAGE_KEY, next);
      setStores(next);
      setEditing(false);
      setNotice(store ? "Team store changes saved." : "Team store is live for players and families.");
    } catch {
      setError("Could not save the team store. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const openStore = async (source) => {
    if (!store?.storeUrl) return;
    const click = buildTeamStoreClick({ store, userRole: activeIdentity.role, source });
    const next = appendTeamStoreClick(clicks, click);
    setClicks(next);
    await storageSet(TEAM_STORE_CLICKS_KEY, next).catch(() => null);
    window.open(store.storeUrl, "_blank", "noopener,noreferrer");
  };

  const openSquadLockerCreation = () => {
    const partnerUrl = partnerReadiness.url;
    if (!partnerUrl) {
      setError("SquadLocker store creation is unavailable until ShotLab's official partner link is configured.");
      return;
    }
    const start = buildTeamStoreReferralStart({
      teamId: activeIdentity.teamId,
      attribution: "official_partner_url",
    });
    const next = upsertTeamStoreReferralStart(referralStarts, start);
    setReferralStarts(next);
    setNotice("SquadLocker setup opened. Return here when your public store link is ready.");
    storageSet(TEAM_STORE_REFERRALS_KEY, next).catch(() => null);
    window.open(partnerUrl, "_blank", "noopener,noreferrer");
  };

  const providerLabel = getProviderLabel((!store || editing) ? draft.provider : store.provider);
  const previewName = String(draft.storeName || "").trim() || "Official Team Store";
  const isSetup = activeIdentity.isCoach && (!store || editing);
  const submitLabel = saving ? "SAVING…" : store ? "SAVE CHANGES" : "PUBLISH STORE";
  const hasUrlError = /https|url|link/i.test(error);
  const updateDraft = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }));
    if (error) setError("");
  };
  const visitMetrics = [
    ["Today", metrics.today],
    ["Last 7 days", metrics.week],
    ["Last 30 days", metrics.month],
    ["All time", metrics.total],
  ];

  return <>
    <button type="button" aria-label="Open team store" onClick={() => setOpen(true)} className="ts-launcher"><StoreIcon /></button>
    {open && <div role="dialog" aria-modal="true" aria-label="Team Store" className="ts-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) closePortal(); }}>
      <section className="ts-panel">
        <header className="ts-header">
          <div className="ts-header-copy">
            <div className="ts-eyebrow">{activeIdentity.isCoach ? "COACH WORKSPACE" : "TEAM GEAR"}</div>
            <h2>Team Store</h2>
            <p>{activeIdentity.isCoach ? `Connect and manage ${activeIdentity.teamName}'s apparel store.` : activeIdentity.teamName}</p>
          </div>
          <button type="button" onClick={closePortal} className="ts-close" aria-label="Close team store"><span aria-hidden="true">×</span></button>
        </header>

        {activeIdentity.isCoach ? <div className="ts-coach-content">
          {isSetup ? <>
            <SetupProgress />
            <div className="ts-setup-grid">
              <div className="ts-form-card">
                <div className="ts-section-kicker">{store ? "STORE SETTINGS" : "STEP 1 · CREATE OR CONNECT"}</div>
                <h3>{store ? "Update your store details" : "Create or connect your apparel store"}</h3>
                <p className="ts-section-copy">New to SquadLocker? Use the ShotLab partner path below. Already have a team shop? Add its public storefront link.</p>

                <div className="ts-fulfillment-note">
                  <div className="ts-note-icon"><StoreIcon /></div>
                  <div><strong>Your apparel partner handles products, payments, shipping, returns, and support.</strong><span>ShotLab provides one easy place for your team to find the link.</span></div>
                </div>

                <div className="ts-fields">
                  <label className="ts-field">
                    <span>Apparel partner</span>
                    <select value={draft.provider} onChange={(event) => updateDraft("provider", event.target.value)}>
                      {TEAM_STORE_PROVIDERS.map((provider) => <option key={provider.key} value={provider.key}>{provider.label}</option>)}
                    </select>
                    <small>Choose the company that runs your online store.</small>
                  </label>
                  {draft.provider === "squadlocker" && !store && <SquadLockerPartnerStart opened={verifiedReferralStart} onStart={openSquadLockerCreation} ready={partnerReadiness.ready} />}
                  <label className="ts-field">
                    <span>Name players will see</span>
                    <input value={draft.storeName} placeholder={`${activeIdentity.teamName} Team Store`} onChange={(event) => updateDraft("storeName", event.target.value)} />
                    <small>Keep it familiar, such as “Thomas Titans Team Store.”</small>
                  </label>
                  <label className="ts-field">
                    <span>Public store link</span>
                    <input type="url" inputMode="url" autoCapitalize="none" autoCorrect="off" spellCheck="false" placeholder="https://teamlocker.squadlocker.com/..." value={draft.storeUrl} onChange={(event) => updateDraft("storeUrl", event.target.value)} aria-invalid={hasUrlError} aria-describedby={hasUrlError ? "team-store-url-help team-store-error" : "team-store-url-help"} />
                    <small id="team-store-url-help">Paste the finished customer-facing storefront link—not the ShotLab partner link.</small>
                  </label>
                </div>

                <div className="ts-mobile-preview">
                  <div className="ts-preview-heading"><span>STEP 2 · PREVIEW</span><h3>What players will see</h3><p>Check the store name and partner before you publish.</p></div>
                  <PlayerStorePreview teamName={activeIdentity.teamName} storeName={previewName} providerLabel={providerLabel} />
                </div>

                <div className="ts-approval-note"><CheckIcon /><span>By publishing, you confirm that your program is authorized to use its team name, marks, and logos and that required school or club approvals have been obtained.</span></div>
                <p className="ts-processing-note">ShotLab does not process orders, payments, shipping, returns, or sales tax.</p>
                {error && <div id="team-store-error" role="alert" className="ts-alert ts-alert-error">{error}</div>}
                <div className="ts-form-actions">
                  <button type="button" disabled={saving} onClick={saveStore} className="ts-button ts-button-primary">{submitLabel} <ArrowIcon /></button>
                  {store && <button type="button" onClick={() => { setEditing(false); setError(""); }} className="ts-button ts-button-secondary">CANCEL</button>}
                </div>
              </div>

              <aside className="ts-preview-column" aria-label="Player store preview">
                <div className="ts-preview-heading"><span>STEP 2 · PREVIEW</span><h3>What players will see</h3><p>This card updates as you type. Review it, then publish when it looks right.</p></div>
                <PlayerStorePreview teamName={activeIdentity.teamName} storeName={previewName} providerLabel={providerLabel} />
              </aside>
            </div>
          </> : <>
            {notice && <div role="status" className="ts-alert ts-alert-success"><CheckIcon />{notice}</div>}
            <div className="ts-live-hero">
              <div className="ts-live-icon"><StoreIcon size={30} /></div>
              <div className="ts-live-copy">
                <div className="ts-live-status"><span className="ts-live-dot" /> <span>LIVE</span> <small>Available to players</small></div>
                <h3>{store.storeName}</h3>
                <p>{providerLabel} · {getStoreHost(store.storeUrl)}</p>
              </div>
              <div className="ts-live-actions">
                <button type="button" onClick={() => openStore("coach_portal")} className="ts-button ts-button-primary">OPEN STORE <ArrowIcon /></button>
                <button type="button" onClick={() => { setNotice(""); setEditing(true); }} className="ts-button ts-button-secondary">EDIT SETUP</button>
              </div>
            </div>

            <SetupProgress published />

            <div className="ts-live-grid">
              <section className="ts-player-view-card">
                <div className="ts-section-kicker">PLAYER EXPERIENCE</div>
                <h3>What players see</h3>
                <p className="ts-section-copy">Use this preview to confirm the store name and shopping destination.</p>
                <PlayerStorePreview teamName={activeIdentity.teamName} storeName={store.storeName} providerLabel={providerLabel} onOpen={() => openStore("coach_preview")} live />
              </section>

              <section className="ts-metrics-card">
                <div className="ts-section-kicker">STORE VISITS</div>
                <h3>Store link opens</h3>
                <p className="ts-section-copy">A simple count of how often your team opens the store from ShotLab. No shopper identity is collected.</p>
                <div className="ts-metrics-grid">
                  {visitMetrics.map(([label, value]) => <div key={label} className="ts-metric"><strong>{value}</strong><span>{label}</span></div>)}
                </div>
                <div className="ts-how-it-works">
                  <strong>How orders work</strong>
                  <p>Players shop and check out with {providerLabel}. That partner handles payment, fulfillment, returns, and customer support.</p>
                </div>
                {store.provider === "squadlocker" && <div className={`ts-referral-status ${verifiedReferralStart ? "is-recorded" : ""}`}>
                  <div>{verifiedReferralStart ? <CheckIcon /> : <span aria-hidden="true">!</span>}</div>
                  <p><strong>{verifiedReferralStart ? "Official ShotLab partner path recorded" : "Referral origin not verified"}</strong><span>{verifiedReferralStart
                    ? "This device opened SquadLocker through ShotLab's configured partner destination. SquadLocker confirms final program eligibility and compensation."
                    : "This store was connected without a ShotLab referral record on this device, so compensation cannot be assumed."}</span></p>
                </div>}
              </section>
            </div>
          </>}
        </div> : <div className="ts-player-content">
          {store ? <>
            <div className="ts-player-intro"><span>OFFICIAL TEAM GEAR</span><h3>Rep your program.</h3><p>Shop apparel and fan gear selected by your coach.</p></div>
            <PlayerStorePreview teamName={activeIdentity.teamName} storeName={store.storeName} providerLabel={getProviderLabel(store.provider)} onOpen={() => openStore("player_portal")} live />
            <p className="ts-disclosure">{AFFILIATE_DISCLOSURE}</p>
          </> : isDemoPlayerPreview ? <>
            <div className="ts-player-intro"><span>DEMO STOREFRONT</span><h3>See the player experience.</h3><p>This preview shows where official team gear will appear for players and families.</p></div>
            <PlayerStorePreview teamName={activeIdentity.teamName} storeName={`${activeIdentity.teamName} Team Store`} providerLabel="SquadLocker" />
            <p className="ts-disclosure">A real team store will open only after the coach publishes a verified storefront link.</p>
          </> : <div className="ts-empty-state"><div className="ts-empty-icon"><StoreIcon size={28} /></div><h3>Your team store is not open yet</h3><p>Your coach has not published a store link. Check back after your program announces it.</p><button type="button" onClick={closePortal} className="ts-button ts-button-secondary">GOT IT</button></div>}
        </div>}
      </section>
    </div>}
  </>;
}
