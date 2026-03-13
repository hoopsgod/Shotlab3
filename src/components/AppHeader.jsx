const FD = "'Bebas Neue','Impact','Arial Black',sans-serif";
const FB = "'Barlow Condensed','Arial Narrow','Helvetica Neue',sans-serif";

export default function AppHeader({
  variant = "standard",
  eyebrow,
  title,
  subtitle,
  icon,
  rightSlot,
  utilityAction,
  className = "",
  style,
}) {
  const action = rightSlot || utilityAction;
  const isBranded = variant === "branded";
  const isUtility = variant === "utility";

  return (
    <header
      className={`appHeader appHeader--${variant} ${className}`.trim()}
      style={style}
    >
      <div className="appHeader__row">
        {icon ? <div className="appHeader__icon">{icon}</div> : null}
        <div className="appHeader__text">
          {eyebrow ? <div className="appHeader__eyebrow">{eyebrow}</div> : null}
          <h1>{title}</h1>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        {action ? <div className="appHeader__right">{action}</div> : null}
      </div>
      {!isUtility ? <div className="appHeader__accent" /> : null}

      <style>{`
        .appHeader{margin:0 0 14px;padding:14px 14px 10px;border-radius:16px;border:1px solid var(--stroke-1);background:var(--surface-2);box-shadow:var(--shadow-1);}
        .appHeader__row{display:flex;align-items:flex-start;gap:12px;min-width:0;}
        .appHeader__icon{width:44px;height:44px;border-radius:12px;border:1px solid var(--stroke-1);background:var(--surface-1);display:flex;align-items:center;justify-content:center;color:var(--text-2);flex-shrink:0;}
        .appHeader__text{flex:1;min-width:0;}
        .appHeader__eyebrow{font-family:${FB};font-size:10px;color:var(--text-2);font-weight:700;letter-spacing:var(--tracking-tight);text-transform:uppercase;margin-bottom:2px;}
        .appHeader__text h1{font-family:${FD};font-size:26px;line-height:1.02;letter-spacing:var(--tracking-default);color:var(--text-1);word-break:break-word;}
        .appHeader__text p{font-family:${FB};font-size:11px;color:var(--text-2);letter-spacing:var(--tracking-tight);text-transform:uppercase;margin-top:4px;}
        .appHeader__right{margin-left:auto;display:flex;align-items:center;gap:8px;flex-shrink:0;}
        .appHeader__accent{height:3px;width:45%;margin-top:10px;border-radius:999px;background:var(--pageAccent,var(--accent));box-shadow:0 0 12px color-mix(in srgb,var(--pageAccent,var(--accent)) 55%, transparent);}
        .appHeader--standard{background:linear-gradient(135deg,var(--pageAccentBg,rgba(200,255,26,0.08)),var(--surface-2) 55%);border-color:color-mix(in srgb,var(--pageAccent,var(--accent)) 26%, transparent);}
        .appHeader--standard .appHeader__icon{border-color:color-mix(in srgb,var(--pageAccent,var(--accent)) 45%, transparent);color:var(--pageAccent,var(--accent));background:color-mix(in srgb,var(--pageAccent,var(--accent)) 14%, #111);}
        .appHeader--branded{background:linear-gradient(140deg,rgba(255,255,255,0.03),var(--surface-3));border-color:var(--stroke-2);box-shadow:var(--shadow-2);}
        .appHeader--branded .appHeader__accent{background:var(--accent);box-shadow:0 0 14px var(--accent-soft);}
        .appHeader--utility{padding-bottom:14px;background:var(--surface-1);border-color:var(--stroke-2);}
        .appHeader--utility .appHeader__text h1{font-size:22px;}
        .appHeader--utility .appHeader__icon{width:38px;height:38px;border-radius:10px;}
        @media(max-width:767px){.appHeader{padding:12px 12px 9px}.appHeader__text h1{font-size:24px}}
      `}</style>
    </header>
  );
}
