import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabase.js";
import {
  RUNTIME_STORAGE_KEYS,
  clearPersistedAuthSession,
  clearStaleDemoSession,
  isDemoRuntimeEnabled,
  isSessionAuthError,
  isSupabaseAuthEnabled,
  readRuntimeJson,
  syncPendingHomeShotLogs,
} from "../lib/runtimeReleaseReadiness.js";

const SESSION_NOTICE_KEY = "sl:release-session-notice";
const SESSION_NOTICE = "Your secure session expired. Sign in again to continue. Training data saved on this device has been preserved.";
const DEMO_BUTTON_LABELS = new Set(["DEMO PLAYER", "DEMO COACH", "LOAD DEMO DATA", "CLEAR DEMO DATA"]);

const bannerStyle = {
  position: "fixed",
  left: 12,
  right: 12,
  top: "max(10px, env(safe-area-inset-top, 0px))",
  zIndex: 2147483000,
  maxWidth: 560,
  margin: "0 auto",
  borderRadius: 14,
  padding: "11px 13px",
  boxSizing: "border-box",
  backdropFilter: "blur(18px)",
  WebkitBackdropFilter: "blur(18px)",
  boxShadow: "0 14px 36px rgba(0,0,0,.38)",
  font: "600 12px/1.4 -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif",
};

function readStoredNotice() {
  if (typeof window === "undefined") return "";
  try {
    return window.sessionStorage?.getItem(SESSION_NOTICE_KEY) || "";
  } catch {
    return "";
  }
}

function ProductionDemoGuard({ enabled }) {
  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    document.documentElement.dataset.shotlabDemoEnabled = enabled ? "true" : "false";
    if (enabled) return undefined;

    const style = document.createElement("style");
    style.dataset.shotlabProductionDemoGuard = "true";
    style.textContent = `html[data-shotlab-demo-enabled="false"] .auth-demo-enter{display:none!important}`;
    document.head.appendChild(style);

    const suppressDemoButtons = (root = document) => {
      root.querySelectorAll?.("button").forEach((button) => {
        const label = String(button.textContent || "").trim().toUpperCase();
        if (!DEMO_BUTTON_LABELS.has(label)) return;
        button.hidden = true;
        button.setAttribute("aria-hidden", "true");
        button.tabIndex = -1;
      });
    };
    suppressDemoButtons();
    const observer = new MutationObserver(() => suppressDemoButtons());
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      style.remove();
    };
  }, [enabled]);
  return null;
}

export default function ReleaseReadinessBoundary({ children }) {
  const demoEnabled = useMemo(() => isDemoRuntimeEnabled(), []);
  const supabaseAuthEnabled = useMemo(() => isSupabaseAuthEnabled(), []);
  const [isOnline, setIsOnline] = useState(() => typeof navigator === "undefined" || navigator.onLine !== false);
  const [syncState, setSyncState] = useState("idle");
  const [syncSummary, setSyncSummary] = useState({ synced: 0, failed: 0, pending: 0 });
  const [sessionNotice, setSessionNotice] = useState(readStoredNotice);
  const [appMountVersion, setAppMountVersion] = useState(0);
  const syncInFlightRef = useRef(false);
  const sessionRecoveryRef = useRef(false);
  const clearStatusTimerRef = useRef(null);

  const dismissSessionNotice = useCallback(() => {
    setSessionNotice("");
    try { window.sessionStorage?.removeItem(SESSION_NOTICE_KEY); } catch {}
  }, []);

  const expireSession = useCallback(async (reason = "session_expired") => {
    if (sessionRecoveryRef.current) return;
    sessionRecoveryRef.current = true;
    await clearPersistedAuthSession();
    try {
      window.sessionStorage?.setItem(SESSION_NOTICE_KEY, SESSION_NOTICE);
      window.history?.replaceState?.({}, "", "/?session=expired");
      window.dispatchEvent(new CustomEvent("shotlab:session-recovery", { detail: { reason } }));
    } catch {}
    setSessionNotice(SESSION_NOTICE);
    setAppMountVersion((value) => value + 1);
    window.setTimeout(() => { sessionRecoveryRef.current = false; }, 1200);
  }, []);

  const validateSession = useCallback(async () => {
    if (!supabaseAuthEnabled || !isOnline) return { ok: true, skipped: true };
    const persisted = await readRuntimeJson(RUNTIME_STORAGE_KEYS.appSession);
    if (!persisted?.email) return { ok: true, skipped: true };
    const result = await supabase.auth.getSession();
    if (isSessionAuthError(result?.error) || !result?.data?.session?.user?.email) {
      await expireSession(result?.error?.code || "session_missing");
      return { ok: false };
    }
    return { ok: true, email: result.data.session.user.email };
  }, [expireSession, isOnline, supabaseAuthEnabled]);

  const runPendingSync = useCallback(async (reason = "online") => {
    if (!isOnline || syncInFlightRef.current) return;
    syncInFlightRef.current = true;
    if (clearStatusTimerRef.current) window.clearTimeout(clearStatusTimerRef.current);
    setSyncState("syncing");

    try {
      const persisted = await readRuntimeJson(RUNTIME_STORAGE_KEYS.appSession);
      let authEmail = String(persisted?.email || "").trim().toLowerCase();
      if (supabaseAuthEnabled && authEmail) {
        const sessionResult = await supabase.auth.getSession();
        if (isSessionAuthError(sessionResult?.error) || !sessionResult?.data?.session?.user?.email) {
          await expireSession(sessionResult?.error?.code || "session_missing_during_sync");
          setSyncState("idle");
          return;
        }
        authEmail = String(sessionResult.data.session.user.email || "").trim().toLowerCase();
      }

      const result = await syncPendingHomeShotLogs({ authEmail, maxAttempts: 20 });
      setSyncSummary({ synced: result.synced || 0, failed: result.failed || 0, pending: result.pending || 0 });
      if (result.requiresAuth && authEmail) {
        await expireSession("sync_auth_required");
        setSyncState("idle");
        return;
      }
      if (result.synced > 0) {
        setSyncState(result.failed || result.pending ? "attention" : "synced");
        setAppMountVersion((value) => value + 1);
        try {
          window.dispatchEvent(new CustomEvent("shotlab:pending-home-shots-synced", { detail: { ...result, reason } }));
        } catch {}
      } else if (result.failed || result.pending) {
        setSyncState("attention");
      } else {
        setSyncState("idle");
      }
      if (result.synced > 0 && !result.failed && !result.pending) {
        clearStatusTimerRef.current = window.setTimeout(() => setSyncState("idle"), 4200);
      }
    } finally {
      syncInFlightRef.current = false;
    }
  }, [expireSession, isOnline, supabaseAuthEnabled]);

  useEffect(() => {
    clearStaleDemoSession().then((cleared) => {
      if (cleared) setAppMountVersion((value) => value + 1);
    });
  }, []);

  useEffect(() => {
    const onOffline = () => {
      setIsOnline(false);
      setSyncState("offline");
    };
    const onOnline = () => setIsOnline(true);
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    return () => {
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  useEffect(() => {
    if (!isOnline) return;
    runPendingSync("network_available");
  }, [isOnline, runPendingSync]);

  useEffect(() => {
    if (!supabaseAuthEnabled) return undefined;
    const validate = () => validateSession();
    const onVisibility = () => {
      if (document.visibilityState === "visible") validate();
    };
    const intervalId = window.setInterval(validate, 5 * 60 * 1000);
    window.addEventListener("focus", validate);
    document.addEventListener("visibilitychange", onVisibility);
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_OUT") return;
      window.setTimeout(async () => {
        const persisted = await readRuntimeJson(RUNTIME_STORAGE_KEYS.appSession);
        if (persisted?.email) await expireSession("unexpected_signed_out");
      }, 1000);
    });
    validate();
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", validate);
      document.removeEventListener("visibilitychange", onVisibility);
      data?.subscription?.unsubscribe?.();
    };
  }, [expireSession, supabaseAuthEnabled, validateSession]);

  useEffect(() => () => {
    if (clearStatusTimerRef.current) window.clearTimeout(clearStatusTimerRef.current);
  }, []);

  const status = !isOnline ? "offline" : syncState;
  const statusCopy = status === "offline"
    ? "Offline — local training data remains available. Team updates will resume when your connection returns."
    : status === "syncing"
      ? "Connection restored — checking locally saved training updates."
      : status === "synced"
        ? `${syncSummary.synced} locally saved update${syncSummary.synced === 1 ? "" : "s"} synced to your team.`
        : status === "attention"
          ? `${syncSummary.pending || syncSummary.failed} update${(syncSummary.pending || syncSummary.failed) === 1 ? "" : "s"} still need attention. Open At Home training to retry.`
          : "";

  return <>
    <ProductionDemoGuard enabled={demoEnabled} />
    <Fragment key={appMountVersion}>{children}</Fragment>
    {statusCopy && <aside role="status" aria-live="polite" data-testid="release-connectivity-status" style={{...bannerStyle,background:status === "attention" ? "rgba(51,35,10,.94)" : "rgba(7,10,12,.94)",border:`1px solid ${status === "attention" ? "rgba(255,181,71,.48)" : "rgba(200,255,26,.34)"}`,color:"#F3F6F7"}}>
      <div style={{display:"flex",alignItems:"center",gap:9}}><span aria-hidden="true" style={{width:8,height:8,borderRadius:99,background:status === "attention" ? "#FFB547" : status === "offline" ? "#AAB2BA" : "#C8FF1A",boxShadow:status === "syncing" ? "0 0 14px rgba(200,255,26,.65)" : "none",flexShrink:0}}/><span>{statusCopy}</span></div>
    </aside>}
    {sessionNotice && <aside role="alert" data-testid="release-session-notice" style={{...bannerStyle,top:"auto",bottom:"max(12px, env(safe-area-inset-bottom, 0px))",background:"rgba(18,21,23,.97)",border:"1px solid rgba(200,255,26,.42)",color:"#F3F6F7"}}>
      <div style={{display:"flex",alignItems:"flex-start",gap:12}}><div style={{flex:1}}><div style={{fontWeight:800,color:"#C8FF1A",marginBottom:3}}>Sign-in required</div><div>{sessionNotice}</div></div><button type="button" aria-label="Dismiss session notice" onClick={dismissSessionNotice} style={{width:36,height:36,borderRadius:10,border:"1px solid rgba(255,255,255,.16)",background:"transparent",color:"#F3F6F7",fontSize:18,cursor:"pointer",flexShrink:0}}>×</button></div>
    </aside>}
  </>;
}
