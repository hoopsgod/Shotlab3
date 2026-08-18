import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const cssPath = path.join(root, "src/components/SecondaryPageSystem.css");
const metricCssPath = path.join(root, "src/components/MetricStrip.module.css");

const mobileAuthority = `@media (max-width: 760px) {
  /* Title composition is intentionally absent here. TeamIdentityTitleStage owns it. */
  .secondaryPageShell {
    --layout-gutter: var(--shell-pad, clamp(14px, 4vw, 20px));
    gap: 14px;
    padding: 0 var(--layout-gutter) 26px;
  }

  .secondaryPageAction {
    min-height: 44px;
    padding: 0 13px;
    border-radius: 12px;
    font-size: 12px;
  }

  /* Score strips are allowed to reach the viewport rhythm instead of becoming more cards. */
  .secondaryPageToolbar [data-visual-role="metric-strip"] {
    margin-inline: calc(var(--layout-gutter, 16px) * -1) !important;
    border-inline: 0 !important;
    border-radius: 0 !important;
  }

  /* Performance band: one edge-to-edge decisive moment, not a floating dashboard card. */
  .secondaryPageDecision {
    position: relative;
    isolation: isolate;
    margin-inline: calc(var(--layout-gutter, 16px) * -1);
    padding: 22px var(--layout-gutter, 16px) 20px;
    overflow: hidden;
    border: 0;
    border-radius: 0;
    background: linear-gradient(128deg, #071a22 0%, #0a222b 58%, #102e35 100%);
    box-shadow: none;
  }

  .secondaryPageDecision::after {
    content: "";
    position: absolute;
    z-index: -1;
    width: 210px;
    height: 210px;
    right: -88px;
    top: -96px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(200,255,26,.10), rgba(200,255,26,0) 68%);
    pointer-events: none;
  }

  .secondaryPageDecision__icon {
    position: absolute;
    right: 15px;
    top: 17px;
    display: grid;
    place-items: center;
    width: 42px;
    height: 42px;
    border: 1px solid rgba(200,255,26,.16);
    border-radius: 13px;
    background: rgba(200,255,26,.055);
    color: #c8ff1a;
  }

  .secondaryPageDecision__copy { max-width: 31ch; }
  .secondaryPageDecision__eyebrow {
    margin-bottom: 8px;
    color: #c8ff1a;
    font-size: 11px;
    letter-spacing: .08em;
  }
  .secondaryPageDecision h2 {
    max-width: 13ch;
    color: #f6faf8;
    font-size: clamp(26px, 7.3vw, 31px);
    line-height: .98;
    letter-spacing: -.045em;
  }
  .secondaryPageDecision p {
    max-width: 30ch;
    margin-top: 8px;
    color: #b8c5c2;
    font-size: 13px;
    line-height: 1.45;
  }
  .secondaryPageDecision button {
    min-height: 44px;
    margin-top: 14px;
    border-color: #c8ff1a;
    border-radius: 12px;
    background: #c8ff1a;
    color: #102019;
    font-size: 12px;
  }
  .secondaryPageDecision__visual { display: none; }

  /* Supporting evidence reads as a ledger beneath the performance band. */
  .secondaryPageEvidence {
    gap: 0;
    padding: 0;
    border-top: 1px solid rgba(17, 24, 21, .10);
    background: transparent;
  }
  .secondaryPageEvidence > * { padding: 14px 0 !important; }
  .secondaryPageEvidence > * + * { border-top: 1px solid rgba(17, 24, 21, .08) !important; }

  .coachPlayerDetailWorkspace { gap: 14px; }
  .coachPlayerProfileHero {
    margin-inline: calc(var(--layout-gutter, 16px) * -1);
    border-radius: 0;
    box-shadow: none;
  }
  .coachPlayerProfileHero h2 { font-size: 29px; }
  .coachPlayerProfileMetrics { grid-template-columns: repeat(2, minmax(0,1fr)); }

  /* Premium mobile metrics keep a stable row while feedback remains tonal. */
  @media (hover: none) {
    .metric:hover,
    .metric:focus-visible { transform: none; }
  }
}
`;

const narrowAuthority = `@media (max-width: 420px) {
  .secondaryPageShell { gap: 12px; }
  .secondaryPageAction { width: 100%; }
  .secondaryPageDecision { padding-top: 20px; }
  .secondaryPageDecision h2 { max-width: 12ch; }
}
`;

const replaceAuthorityBlock = (source) => {
  const start = source.indexOf("@media (max-width: 760px) {");
  const narrow = source.indexOf("@media (max-width: 420px) {", start);
  const motion = source.indexOf("@media (prefers-reduced-motion: reduce)", narrow);
  if (start < 0 || narrow < 0 || motion < 0) throw new Error("SecondaryPageSystem mobile authority anchors not found");
  return `${source.slice(0, start)}${mobileAuthority}\n${narrowAuthority}\n${source.slice(motion)}`;
};

const cssSource = readFileSync(cssPath, "utf8");
const nextCss = replaceAuthorityBlock(cssSource);
if (nextCss !== cssSource) writeFileSync(cssPath, nextCss);

const metricSource = readFileSync(metricCssPath, "utf8");
const metricMarker = "/* Premium mobile metrics keep a stable row while feedback remains tonal. */";
if (!metricSource.includes(metricMarker)) {
  writeFileSync(metricCssPath, `${metricSource.trim()}\n\n${metricMarker}\n@media (max-width: 760px), (hover: none) {\n  .metric:hover,\n  .metric:focus-visible { transform: none; }\n}\n`);
}

console.log("Applied secondary decision/evidence reconciliation without mutating title composition or page-purpose copy.");
