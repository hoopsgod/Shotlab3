import { useTeamBranding } from "../context/TeamBrandingContext";
import styles from "./DashboardIdentityHeader.module.css";

const MOBILE_PRODUCT_RESET_CSS = `
@media(max-width:700px){
  html body .performance-shell--player.is-mobile [data-mobile-visual-system="phase-2"][data-testid="player-dashboard-identity-header"]{margin:10px 12px 8px!important;overflow:hidden!important;border:0!important;border-radius:24px 24px 24px 10px!important;background:radial-gradient(circle at 10% 20%,rgba(200,255,26,.10),transparent 32%),rgba(255,255,255,.69)!important;box-shadow:0 0 0 1px rgba(17,26,33,.08) inset,0 16px 40px rgba(17,26,33,.08),inset 0 1px rgba(255,255,255,.86)!important;-webkit-backdrop-filter:blur(22px) saturate(135%)!important;backdrop-filter:blur(22px) saturate(135%)!important}
  html body .performance-shell--player.is-mobile [data-mobile-visual-system="phase-2"] [data-identity-role="inner"]{grid-template-columns:58px minmax(0,1fr)!important;gap:13px!important;align-items:center!important;min-height:84px!important;padding:max(10px,env(safe-area-inset-top)) 14px 10px!important}
  html body .performance-shell--player.is-mobile [data-mobile-visual-system="phase-2"] [data-identity-role="identity"]{grid-column:2;grid-row:1;align-self:center}
  html body .performance-shell--player.is-mobile [data-mobile-visual-system="phase-2"] [data-identity-role="brand-panel"]{grid-column:1;grid-row:1;width:58px!important;min-height:58px!important;place-items:center!important}
  html body .performance-shell--player.is-mobile [data-mobile-visual-system="phase-2"] [data-identity-role="brand-mark"]{width:56px!important;height:56px!important;filter:drop-shadow(0 10px 18px rgba(17,26,33,.16))!important}
  html body .performance-shell--player.is-mobile [data-mobile-visual-system="phase-2"] [data-identity-role="mode-row"]{gap:7px!important;flex-wrap:nowrap!important}
  html body .performance-shell--player.is-mobile [data-mobile-visual-system="phase-2"] [data-identity-role="badge"]{min-height:22px!important;padding:0 8px!important;border:1px solid rgba(126,158,30,.22)!important;border-radius:999px!important;background:rgba(200,255,26,.10)!important;color:#536900!important;font-size:9px!important;letter-spacing:.075em!important;white-space:nowrap!important}
  html body .performance-shell--player.is-mobile [data-mobile-visual-system="phase-2"] [data-identity-role="team-name"]{max-width:34vw!important;color:#748089!important;font-size:10px!important}
  html body .performance-shell--player.is-mobile [data-mobile-visual-system="phase-2"] [data-identity-role="name"]{margin-top:6px!important;overflow:hidden!important;color:#111a21!important;font-size:25px!important;font-weight:820!important;line-height:.96!important;letter-spacing:-.05em!important;text-overflow:ellipsis!important;white-space:nowrap!important}
  html body .performance-shell--player.is-mobile [data-mobile-visual-system="phase-2"] [data-identity-role="tagline"],html body .performance-shell--player.is-mobile [data-mobile-visual-system="phase-2"] [data-identity-role="mission"]{display:none!important}
}
@media(max-width:700px) and (prefers-reduced-transparency:reduce){
  html body .performance-shell--player.is-mobile [data-mobile-visual-system="phase-2"][data-testid="player-dashboard-identity-header"]{background:#fff!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important}
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
    <section className={`${styles.header} ${styles.player}`} data-dashboard-header="player-premium" data-testid="player-dashboard-identity-header" data-layout-role="editorial-header" data-mobile-product-reset="phase-1" data-mobile-visual-system="phase-2">
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
