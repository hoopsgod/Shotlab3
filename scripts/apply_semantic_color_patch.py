from pathlib import Path

app_path = Path("src/App.jsx")
nav_css_path = Path("src/components/MobileNavigation.module.css")
app = app_path.read_text()
nav_css = nav_css_path.read_text()


def replace_once(text: str, old: str, new: str, label: str) -> str:
    if new in text:
        print(f"{label}: already applied")
        return text
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected one match, found {count}")
    print(f"{label}: applied")
    return text.replace(old, new, 1)


app = replace_once(
    app,
    'import MobileNavigation from "./components/MobileNavigation.jsx";\n',
    'import MobileNavigation from "./components/MobileNavigation.jsx";\nimport SemanticStatus from "./components/SemanticStatus.jsx";\n',
    "semantic status import",
)

app = replace_once(
    app,
    "const VOLT = TOKENS.PRIMARY;\nconst ORANGE = TOKENS.PRIMARY;\nconst CYAN = TOKENS.SECONDARY;",
    "const VOLT = TOKENS.PRIMARY;\nconst SUCCESS = TOKENS.SUCCESS;\nconst INFO = TOKENS.INFO;\nconst WARNING = TOKENS.WARNING;\nconst DANGER = TOKENS.DANGER;\nconst NEUTRAL = TOKENS.NEUTRAL;\nconst ORANGE = WARNING;\nconst CYAN = INFO;",
    "semantic constants",
)

app = replace_once(
    app,
    '''const PAGE_ACCENTS={
feed:{accent:"var(--accent)",glow:"var(--accent-soft)",bg:"var(--team-brand-accent-bg, rgba(200,255,26,0.08))"},
drills:{accent:"var(--accent)",glow:"var(--accent-soft)",bg:"var(--team-brand-accent-bg, rgba(200,255,26,0.08))"},
events:{accent:"var(--accent)",glow:"var(--accent-soft)",bg:"var(--team-brand-accent-bg, rgba(200,255,26,0.08))"},
sc:{accent:"var(--accent)",glow:"var(--accent-soft)",bg:"var(--team-brand-accent-bg, rgba(200,255,26,0.08))"},
players:{accent:"var(--accent)",glow:"var(--accent-soft)",bg:"var(--team-brand-accent-bg, rgba(200,255,26,0.08))"},
};''',
    '''const PAGE_ACCENTS={
feed:{accent:"var(--accent)",glow:"var(--accent-soft)",bg:"var(--team-brand-accent-bg, rgba(200,255,26,0.08))"},
drills:{accent:"var(--team-brand-primary, var(--accent))",glow:"var(--team-brand-primary-soft, var(--accent-soft))",bg:"var(--team-brand-accent-bg, rgba(200,255,26,0.08))"},
events:{accent:"var(--semantic-info)",glow:"var(--semantic-info-border)",bg:"var(--semantic-info-surface)"},
sc:{accent:"var(--semantic-neutral)",glow:"var(--semantic-neutral-border)",bg:"var(--semantic-neutral-surface)"},
players:{accent:"var(--team-brand-secondary, var(--accent))",glow:"color-mix(in srgb, var(--team-brand-secondary, var(--accent)) 34%, transparent)",bg:"color-mix(in srgb, var(--team-brand-secondary, var(--accent)) 10%, transparent)"},
};''',
    "page accent roles",
)

app = replace_once(
    app,
    ".pageHeaderPillBrand{border-color:rgba(200,255,0,.5);background:color-mix(in srgb,#C8FF00 18%, #1A1A1A);color:#C8FF00;}\n.pageHeaderPillBrand:hover{background:color-mix(in srgb,#C8FF00 26%, #1A1A1A);border-color:rgba(200,255,0,.68);}\n.pageHeaderPillBrand:focus-visible{outline-color:#C8FF00;}",
    ".pageHeaderPillBrand{border-color:color-mix(in srgb,var(--team-brand-primary) 50%, transparent);background:color-mix(in srgb,var(--team-brand-primary) 18%, #1A1A1A);color:var(--team-brand-accent-text);}\n.pageHeaderPillBrand:hover{background:color-mix(in srgb,var(--team-brand-primary) 26%, #1A1A1A);border-color:color-mix(in srgb,var(--team-brand-primary) 68%, transparent);}\n.pageHeaderPillBrand:focus-visible{outline-color:var(--team-brand-nav-active);}",
    "brand pill scope",
)

app = replace_once(
    app,
    ".drillsMetricTile{border-left:2px solid rgba(56,232,255,.65);}\n.eventsDatePill{display:inline-flex;align-items:center;justify-content:center;min-width:56px;padding:6px 8px;border-radius:999px;background:rgba(255,196,0,.16);border:1px solid rgba(255,196,0,.45);color:#FFC400;font-size:calc(10px * var(--coach-text-scale-medium));font-family:${FB};font-weight:700;letter-spacing:.08em;}\n.scSection{border-top:1px solid rgba(91,124,255,.35);padding-top:10px;margin-top:10px;}\n.playersAvatarRing{outline:2px solid rgba(184,108,255,.65);outline-offset:1px;border-radius:50%;}",
    ".drillsMetricTile{border-left:2px solid color-mix(in srgb,var(--pageAccent) 65%, transparent);}\n.eventsDatePill{display:inline-flex;align-items:center;justify-content:center;min-width:56px;padding:6px 8px;border-radius:999px;background:var(--semantic-info-surface);border:1px solid var(--semantic-info-border);color:var(--semantic-info);font-size:calc(10px * var(--coach-text-scale-medium));font-family:${FB};font-weight:700;letter-spacing:.08em;}\n.scSection{border-top:1px solid var(--semantic-neutral-border);padding-top:10px;margin-top:10px;}\n.playersAvatarRing{outline:2px solid color-mix(in srgb,var(--team-brand-secondary) 65%, transparent);outline-offset:1px;border-radius:50%;}",
    "section color roles",
)

app = replace_once(
    app,
    "  --stroke-2:rgba(255,255,255,0.12);\n\n  --shadow-0:none;",
    "  --stroke-2:rgba(255,255,255,0.12);\n\n  --semantic-success:#4ADE80;\n  --semantic-success-surface:rgba(74,222,128,0.10);\n  --semantic-success-border:rgba(74,222,128,0.34);\n  --semantic-info:#38BDF8;\n  --semantic-info-surface:rgba(56,189,248,0.10);\n  --semantic-info-border:rgba(56,189,248,0.34);\n  --semantic-warning:#F59E0B;\n  --semantic-warning-surface:rgba(245,158,11,0.10);\n  --semantic-warning-border:rgba(245,158,11,0.34);\n  --semantic-danger:#F87171;\n  --semantic-danger-surface:rgba(248,113,113,0.10);\n  --semantic-danger-border:rgba(248,113,113,0.34);\n  --semantic-neutral:#94A3B8;\n  --semantic-neutral-surface:rgba(148,163,184,0.09);\n  --semantic-neutral-border:rgba(148,163,184,0.28);\n\n  --shadow-0:none;",
    "semantic css fallbacks",
)

app = replace_once(
    app,
    '.team-brand .chip,.team-brand .badge,[class*="chip"],[class*="badge"]{background:var(--team-brand-badge-bg)!important;border-color:var(--team-brand-badge-border)!important;color:var(--team-brand-badge-text)!important;}',
    '.team-brand .chip:not([data-tone]),.team-brand .badge:not([data-tone]),.team-brand [class*="chip"]:not([data-tone]),.team-brand [class*="badge"]:not([data-tone]){background:var(--team-brand-badge-bg)!important;border-color:var(--team-brand-badge-border)!important;color:var(--team-brand-badge-text)!important;}',
    "brand badge selector boundary",
)

app = replace_once(
    app,
    '.sidebar-nav .nav-item.is-active{background:rgba(198,255,0,0.10);border-color:rgba(198,255,0,0.22);color:#C6FF00;}',
    '.sidebar-nav .nav-item.is-active{background:color-mix(in srgb,var(--team-brand-nav-active) 10%, transparent);border-color:color-mix(in srgb,var(--team-brand-nav-active) 22%, transparent);color:var(--team-brand-nav-active);}',
    "desktop nav branding",
)

app = replace_once(
    app,
    'if(days===null||days>=5)return {pill:"INACTIVE",color:TOKENS.DANGER,rank:0};\n    if(days<=2)return {pill:"ACTIVE",color:VOLT,rank:2};\n    return {pill:"AT RISK",color:TOKENS.WARNING,rank:1};',
    'if(days===null||days>=5)return {pill:"INACTIVE",color:DANGER,tone:"danger",rank:0};\n    if(days<=2)return {pill:"ACTIVE",color:SUCCESS,tone:"success",rank:2};\n    return {pill:"AT RISK",color:WARNING,tone:"warning",rank:1};',
    "roster semantic states",
)

app = replace_once(
    app,
    '<circle cx="14" cy="14" r="12" stroke={VOLT} strokeWidth="3" fill="none" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={ringOffset} transform="rotate(-90 14 14)"/>',
    '<circle cx="14" cy="14" r="12" stroke={SUCCESS} strokeWidth="3" fill="none" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={ringOffset} transform="rotate(-90 14 14)"/>',
    "completion ring success",
)

app = replace_once(
    app,
    '<span style={{fontFamily:FB,fontSize:9,fontWeight:700,letterSpacing:1,padding:"3px 7px",borderRadius:999,color:c,background:c+"15",whiteSpace:"nowrap"}}>{p.statusMeta.pill}</span>',
    '<SemanticStatus tone={p.statusMeta.tone} compact testId="semantic-roster-status">{p.statusMeta.pill}</SemanticStatus>',
    "roster status primitive",
)

app = replace_once(
    app,
    'style={{display:"flex",background:CARD_BG,borderRadius:14,marginBottom:10,border:`1px solid ${p.statusMeta.pill==="INACTIVE"?"#FF454533":BORDER_CLR}`',
    'style={{display:"flex",background:CARD_BG,borderRadius:14,marginBottom:10,border:`1px solid ${p.statusMeta.pill==="INACTIVE"?"var(--semantic-danger-border)":BORDER_CLR}`',
    "inactive roster border",
)

app = replace_once(
    app,
    'style={{minHeight:40,padding:"0 12px",borderRadius:8,border:`1px solid ${isNudged?VOLT+"44":"#FF454544"}`,background:isNudged?VOLT+"12":"#FF454512",cursor:"pointer",fontFamily:FB,fontSize:10,fontWeight:700,letterSpacing:1,color:isNudged?VOLT:"#FF4545",whiteSpace:"nowrap",width:"100%"}}',
    'style={{minHeight:40,padding:"0 12px",borderRadius:8,border:`1px solid ${isNudged?INFO+"55":DANGER+"55"}`,background:isNudged?"var(--semantic-info-surface)":"var(--semantic-danger-surface)",cursor:"pointer",fontFamily:FB,fontSize:10,fontWeight:700,letterSpacing:1,color:isNudged?INFO:DANGER,whiteSpace:"nowrap",width:"100%"}}',
    "nudge status colors",
)

app = replace_once(
    app,
    'const resultColor=isPending?MUTED:won?VOLT:tied?"#C8FF00":"#FF4545";',
    'const resultColor=isPending?WARNING:won?SUCCESS:tied?INFO:DANGER;',
    "duel result colors",
)

app = replace_once(
    app,
    'const pcol=pct>=80?VOLT:pct>=50?ORANGE:"#FF4545";',
    'const pcol=pct>=80?SUCCESS:pct>=50?WARNING:DANGER;',
    "share score colors",
)

app = replace_once(
    app,
    'const c=pct>=90?VOLT:pct>=75?VOLT:pct>=50?ORANGE:"#FF4545";',
    'const c=pct>=90?SUCCESS:pct>=75?SUCCESS:pct>=50?WARNING:DANGER;',
    "score quality colors",
)

app = replace_once(
    app,
    'color:pct>=80?"#C8FF00":pct>=50?"#FFA500":"#FF4545"',
    'color:pct>=80?SUCCESS:pct>=50?WARNING:DANGER',
    "history accuracy colors",
)

app = replace_once(
    app,
    'color:missing>0?"#FFB86B":VOLT',
    'color:missing>0?WARNING:SUCCESS',
    "missing response colors",
)

nav_css = replace_once(
    nav_css,
    '  background: var(--accent, #c8ff1a);\n  box-shadow: 0 0 0 2px rgba(15, 18, 24, 0.96);',
    '  background: var(--semantic-warning, #f59e0b);\n  box-shadow: 0 0 0 2px rgba(15, 18, 24, 0.96);',
    "navigation alert color",
)

app_path.write_text(app)
nav_css_path.write_text(nav_css)
print("semantic color patch complete")
