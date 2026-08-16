import { useTeamBranding } from "../context/TeamBrandingContext";
import styles from "./DashboardIdentityHeader.module.css";

const DASHBOARD_SHOWSTOPPER_CSS = `
@media(max-width:700px){
  [data-testid="player-dashboard-identity-header"]{position:relative!important;margin:0!important;overflow:hidden!important;border:0!important;border-bottom:1px solid rgba(200,255,26,.14)!important;border-radius:0!important;background:linear-gradient(126deg,#061923 0%,#082430 60%,#0a2933 100%)!important;box-shadow:none!important;color:#f5f8f9!important}
  [data-testid="player-dashboard-identity-header"]::before{display:none!important}
  [data-testid="player-dashboard-identity-header"] [data-identity-role="inner"]{position:relative!important;z-index:1!important;grid-template-columns:56px minmax(0,1fr)!important;gap:12px!important;align-items:center!important;min-height:82px!important;padding:max(10px,env(safe-area-inset-top)) 16px 11px!important}
  [data-testid="player-dashboard-identity-header"] [data-identity-role="identity"]{grid-column:2;grid-row:1;align-self:center;min-width:0!important}
  [data-testid="player-dashboard-identity-header"] [data-identity-role="brand-panel"]{grid-column:1;grid-row:1;width:56px!important;min-height:56px!important;padding:0!important;place-items:center!important;border:0!important;border-radius:0!important;background:transparent!important}
  [data-testid="player-dashboard-identity-header"] [data-identity-role="brand-mark"]{width:52px!important;height:52px!important;object-fit:contain!important;filter:drop-shadow(0 8px 13px rgba(0,0,0,.25))!important}
  [data-testid="player-dashboard-identity-header"] [data-identity-role="mode-row"]{display:flex!important;align-items:baseline!important;gap:7px 9px!important;flex-wrap:wrap!important;min-width:0!important}
  [data-testid="player-dashboard-identity-header"] [data-identity-role="badge"],[data-testid="player-dashboard-identity-header"] [data-identity-role="team-name"]{font-size:10.5px!important;line-height:1.12!important;letter-spacing:.065em!important}
  [data-testid="player-dashboard-identity-header"] [data-identity-role="badge"]{flex:0 0 auto!important;min-height:auto!important;padding:0!important;border:0!important;border-radius:0!important;background:transparent!important;color:#c8ff1a!important;font-weight:820!important;text-transform:uppercase!important}
  [data-testid="player-dashboard-identity-header"] [data-identity-role="team-name"]{min-width:0!important;max-width:100%!important;color:#aebcc2!important;font-weight:700!important;overflow-wrap:anywhere!important;white-space:normal!important}
  [data-testid="player-dashboard-identity-header"] [data-identity-role="name"]{margin-top:5px!important;max-width:100%!important;overflow:visible!important;color:#f7fafb!important;font-size:23px!important;font-weight:830!important;line-height:.98!important;letter-spacing:-.044em!important;overflow-wrap:anywhere!important;white-space:normal!important}
  [data-testid="player-dashboard-identity-header"] :is([data-identity-role="tagline"],[data-identity-role="mission"]){display:none!important}

  .performance-shell--player.is-mobile:not([data-workspace-tab="home"]) [data-testid="player-dashboard-identity-header"]{margin:2px 16px 8px!important;overflow:visible!important;border:0!important;border-left:3px solid var(--team-brand-primary,var(--accent,#8fae25))!important;border-bottom:0!important;background:transparent!important;box-shadow:none!important;color:#151a16!important}
  .performance-shell--player.is-mobile:not([data-workspace-tab="home"]) [data-testid="player-dashboard-identity-header"] [data-identity-role="inner"]{grid-template-columns:58px minmax(0,1fr)!important;gap:11px!important;min-height:66px!important;padding:5px 0 7px 10px!important}
  .performance-shell--player.is-mobile:not([data-workspace-tab="home"]) [data-testid="player-dashboard-identity-header"] [data-identity-role="brand-panel"]{width:58px!important;min-height:56px!important}
  .performance-shell--player.is-mobile:not([data-workspace-tab="home"]) [data-testid="player-dashboard-identity-header"] [data-identity-role="brand-mark"]{width:54px!important;height:54px!important;filter:drop-shadow(0 7px 12px rgba(7,28,40,.12))!important}
  .performance-shell--player.is-mobile:not([data-workspace-tab="home"]) [data-testid="player-dashboard-identity-header"] [data-identity-role="badge"]{color:#617900!important}
  .performance-shell--player.is-mobile:not([data-workspace-tab="home"]) [data-testid="player-dashboard-identity-header"] [data-identity-role="team-name"]{color:#68716a!important}
  .performance-shell--player.is-mobile:not([data-workspace-tab="home"]) [data-testid="player-dashboard-identity-header"] [data-identity-role="name"]{margin-top:4px!important;color:#151a16!important;font-size:25px!important;line-height:.97!important}
}
`;

export default function PlayerDashboardHeader({
  userName,
  subtitle = "Train. Track. Improve.",
  mission = "Today's mission awaits",
}) {
  const { branding } = useTeamBranding();
  const logoSrc = branding?.logoUrl || branding?.logoMarkUrl || "/branding/titans-exact-logo.png.PNG";
  const teamName = branding?.teamName || branding?.name || "ShotLab Team";
  const displayName = String(userName || "Demo Player").trim();

  return <>
    <style>{DASHBOARD_SHOWSTOPPER_CSS}</style>
    <section className={`${styles.header} ${styles.player}`} data-dashboard-header="player-premium" data-testid="player-dashboard-identity-header" data-layout-role="compact-athlete-credential" data-mobile-product-reset="phase-1" data-mobile-chrome="native-identity">
      <div className={styles.inner} data-identity-role="inner">
        <div className={styles.identity} data-identity-role="identity">
          <div className={styles.modeRow} data-identity-role="mode-row">
            <span className={styles.badge} data-identity-role="badge">Player Mode</span>
            <span className={styles.teamName} data-identity-role="team-name">{teamName}</span>
          </div>
          <div className={styles.name} data-identity-role="name">{displayName}</div>
          <p className={styles.tagline} data-identity-role="tagline">{subtitle}</p>
          <div className={styles.mission} data-identity-role="mission">
            <span className={styles.dot} aria-hidden="true" />
            <span className={styles.missionLabel}>Today</span>
            <strong>{mission}</strong>
          </div>
        </div>
        <div className={styles.brandPanel} data-identity-role="brand-panel" aria-hidden="true">
          <img className={styles.brandMark} data-identity-role="brand-mark" src={logoSrc} alt="" />
        </div>
      </div>
    </section>
  </>;
}
