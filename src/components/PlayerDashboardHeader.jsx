import { useTeamBranding } from "../context/TeamBrandingContext";
import styles from "./DashboardIdentityHeader.module.css";

const MOBILE_PRODUCT_RESET_CSS = `
@media(max-width:700px){
  html body .performance-shell--player.is-mobile [data-mobile-visual-system="phase-2"][data-testid="player-dashboard-identity-header"]{position:relative!important;margin:0!important;overflow:hidden!important;border:0!important;border-radius:0 0 34px 12px!important;background:radial-gradient(circle at 92% 8%,rgba(200,255,26,.18),transparent 32%),radial-gradient(circle at 4% 100%,rgba(64,116,137,.26),transparent 43%),linear-gradient(145deg,#0b2a38,#06151c 78%)!important;box-shadow:0 28px 64px rgba(7,24,32,.22),inset 0 1px rgba(255,255,255,.08)!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important}
  html body .performance-shell--player.is-mobile [data-mobile-visual-system="phase-2"][data-testid="player-dashboard-identity-header"]:after{content:"PLAYER  /  01";position:absolute;right:16px;bottom:22px;color:rgba(255,255,255,.08);font:850 42px/.8 var(--font-display);letter-spacing:-.07em;pointer-events:none}
  html body .performance-shell--player.is-mobile [data-mobile-visual-system="phase-2"] [data-identity-role="inner"]{grid-template-columns:minmax(0,1fr) 82px!important;gap:14px!important;align-items:center!important;min-height:182px!important;padding:max(24px,env(safe-area-inset-top)) 20px 56px!important}
  html body .performance-shell--player.is-mobile [data-mobile-visual-system="phase-2"] [data-identity-role="identity"]{grid-column:1;grid-row:1;align-self:center}
  html body .performance-shell--player.is-mobile [data-mobile-visual-system="phase-2"] [data-identity-role="brand-panel"]{grid-column:2;grid-row:1;width:82px!important;min-height:82px!important;place-items:center!important}
  html body .performance-shell--player.is-mobile [data-mobile-visual-system="phase-2"] [data-identity-role="brand-mark"]{width:78px!important;height:78px!important;filter:drop-shadow(0 16px 24px rgba(0,0,0,.30))!important}
  html body .performance-shell--player.is-mobile [data-mobile-visual-system="phase-2"] [data-identity-role="mode-row"]{gap:7px!important;flex-wrap:nowrap!important}
  html body .performance-shell--player.is-mobile [data-mobile-visual-system="phase-2"] [data-identity-role="badge"]{min-height:24px!important;padding:0 9px!important;border:1px solid rgba(200,255,26,.24)!important;border-radius:999px!important;background:rgba(200,255,26,.10)!important;color:#d7ff59!important;font-size:9px!important;letter-spacing:.085em!important;white-space:nowrap!important}
  html body .performance-shell--player.is-mobile [data-mobile-visual-system="phase-2"] [data-identity-role="team-name"]{max-width:34vw!important;color:#91a2aa!important;font-size:10px!important}
  html body .performance-shell--player.is-mobile [data-mobile-visual-system="phase-2"] [data-identity-role="name"]{margin-top:10px!important;overflow:hidden!important;color:#f7fafb!important;font-size:34px!important;font-weight:850!important;line-height:.9!important;letter-spacing:-.06em!important;text-overflow:ellipsis!important;white-space:nowrap!important}
  html body .performance-shell--player.is-mobile [data-mobile-visual-system="phase-2"] [data-identity-role="tagline"],html body .performance-shell--player.is-mobile [data-mobile-visual-system="phase-2"] [data-identity-role="mission"]{display:none!important}
  html body .performance-shell--player.is-mobile .player-scroll-container{margin-top:-38px!important;padding-top:8px!important;z-index:3!important}
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
    <section className={`${styles.header} ${styles.player}`} data-dashboard-header="player-premium" data-testid="player-dashboard-identity-header" data-layout-role="editorial-header" data-mobile-product-reset="phase-1" data-mobile-visual-system="phase-2" data-phase2-composition="performance-passport">
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
