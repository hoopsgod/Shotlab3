import { useTeamBranding } from "../context/TeamBrandingContext";
import styles from "./DashboardIdentityHeader.module.css";

const MOBILE_PRODUCT_RESET_CSS = `
@media(max-width:700px){
  html body .performance-shell--player.is-mobile [data-mobile-visual-system="phase-2"][data-testid="player-dashboard-identity-header"]{position:relative!important;z-index:2!important;margin:0!important;overflow:hidden!important;border:0!important;border-radius:0!important;background:radial-gradient(circle at 92% 0,rgba(200,255,26,.16),transparent 32%),linear-gradient(145deg,#0b2a38,#06151c 78%)!important;box-shadow:none!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important}
  html body .performance-shell--player.is-mobile [data-mobile-visual-system="phase-2"] [data-identity-role="inner"]{grid-template-columns:54px minmax(0,1fr)!important;gap:13px!important;align-items:center!important;min-height:126px!important;padding:max(18px,env(safe-area-inset-top)) 18px 26px!important}
  html body .performance-shell--player.is-mobile [data-mobile-visual-system="phase-2"] [data-identity-role="identity"]{grid-column:2;grid-row:1;align-self:center}
  html body .performance-shell--player.is-mobile [data-mobile-visual-system="phase-2"] [data-identity-role="brand-panel"]{grid-column:1;grid-row:1;width:54px!important;min-height:54px!important;place-items:center!important}
  html body .performance-shell--player.is-mobile [data-mobile-visual-system="phase-2"] [data-identity-role="brand-mark"]{width:52px!important;height:52px!important;filter:drop-shadow(0 12px 20px rgba(0,0,0,.28))!important}
  html body .performance-shell--player.is-mobile [data-mobile-visual-system="phase-2"] [data-identity-role="mode-row"]{gap:7px!important;flex-wrap:nowrap!important}
  html body .performance-shell--player.is-mobile [data-mobile-visual-system="phase-2"] [data-identity-role="badge"]{min-height:24px!important;padding:0 9px!important;border:1px solid rgba(200,255,26,.24)!important;border-radius:999px!important;background:rgba(200,255,26,.10)!important;color:#d7ff59!important;font-size:11px!important;letter-spacing:.075em!important;white-space:nowrap!important}
  html body .performance-shell--player.is-mobile [data-mobile-visual-system="phase-2"] [data-identity-role="team-name"]{max-width:34vw!important;color:#91a2aa!important;font-size:11px!important}
  html body .performance-shell--player.is-mobile [data-mobile-visual-system="phase-2"] [data-identity-role="name"]{margin-top:7px!important;overflow:hidden!important;color:#f7fafb!important;font-size:28px!important;font-weight:840!important;line-height:.92!important;letter-spacing:-.055em!important;text-overflow:ellipsis!important;white-space:nowrap!important}
  html body .performance-shell--player.is-mobile [data-mobile-visual-system="phase-2"] [data-identity-role="tagline"],html body .performance-shell--player.is-mobile [data-mobile-visual-system="phase-2"] [data-identity-role="mission"]{display:none!important}
  html body .performance-shell--player.is-mobile .player-scroll-container{margin-top:-18px!important;padding:0 0 var(--player-scroll-bottom-padding)!important;z-index:3!important}
  html body .performance-shell--player.is-mobile .player-home-compact-dashboard{gap:14px!important}
  html body .performance-shell--player.is-mobile .player-home-compact-dashboard>details{margin-inline:16px!important}
}
@media(max-width:700px) and (prefers-reduced-transparency:reduce){
  html body .performance-shell--player.is-mobile [data-mobile-visual-system="phase-2"][data-testid="player-dashboard-identity-header"]{-webkit-backdrop-filter:none!important;backdrop-filter:none!important}
}`;

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
    <style>{MOBILE_PRODUCT_RESET_CSS}</style>
    <section className={`${styles.header} ${styles.player}`} data-dashboard-header="player-premium" data-testid="player-dashboard-identity-header" data-layout-role="editorial-header" data-mobile-product-reset="phase-1" data-mobile-visual-system="phase-2" data-phase2-composition="integrated-performance-canvas">
      <div className={styles.inner} data-identity-role="inner">
        <div className={styles.identity} data-identity-role="identity">
          <div className={styles.modeRow} data-identity-role="mode-row">
            <span className={styles.badge} data-identity-role="badge">Player Mode</span>
            <span className={styles.teamName} data-identity-role="team-name">{teamName}</span>
          </div>
          <h1 className={styles.name} data-identity-role="name">{displayName}</h1>
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
